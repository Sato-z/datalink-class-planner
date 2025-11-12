import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, User as UserIcon, LogOut, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TimetableEntry } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  // Remove unused announcements state since we're not displaying them in this version
  // const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    loadData();

    const timetableSubscription = supabase
      .channel('timetable_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable' }, () => {
        loadData();
      })
      .subscribe();

    const announcementSubscription = supabase
      .channel('announcement_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      timetableSubscription.unsubscribe();
      announcementSubscription.unsubscribe();
    };
  }, [user?.user_metadata?.level]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load timetable for student's level
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetable')
        .select('*, course(*, lecturer(*))')
        .eq('level', user.user_metadata?.level || '');

      if (timetableError) throw timetableError;
      setTimetable(timetableData || []);

      // Announcements loading removed for now
      // Can be reimplemented when needed
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimetableForDay = (day: string) => {
    return timetable
      .filter((entry) => entry.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-gray-600">View your class schedule and announcements</p>
        </header>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <span>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-gray-600">View your class schedule and announcements</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Weekly Timetable</h2>
            </div>

            {timetable.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No classes scheduled for your level yet.
              </div>
            ) : (
              <div className="space-y-6">
                {daysOfWeek.map((day) => {
                  const dayClasses = getTimetableForDay(day);
                  if (dayClasses.length === 0) return null;

                  return (
                    <div key={day}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{day}</h3>
                      <div className="space-y-3">
                        {dayClasses.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition"
                          >
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">
                                  {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span>{entry.room}</span>
                              </div>
                              {entry.course?.lecturer && (
                                <div className="flex items-center gap-2 text-sm">
                                  <UserIcon className="w-4 h-4 text-blue-600" />
                                  <span>{entry.course.lecturer.full_name || 'Lecturer'}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <p className="font-semibold text-gray-900">
                                {entry.course?.course_title}
                              </p>
                              <p className="text-sm text-gray-600">{entry.course?.course_code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Announcements Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="font-medium">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
              </div>
              <p className="text-sm text-gray-500">No new announcements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
