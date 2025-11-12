import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  BookOpen,
  Calendar,
  Bell,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Course, TimetableEntry, Announcement } from '../lib/supabase';

// Moved the registerUser function inside the UsersTab component

// No need for props since we're using useAuth

type Tab = 'courses' | 'timetable' | 'announcements' | 'users';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  
  if (!user) {
    return null; // Or redirect to login
  }
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, timetableRes, announcementsRes, usersRes, lecturersRes] =
        await Promise.all([
          supabase.from('courses').select('*, lecturer:users!courses_lecturer_id_fkey (full_name)'),
          supabase.from('timetable').select(`
            *,
            course:courses (course_code, course_title)
          `),
          supabase
            .from('announcements')
            .select('*, author:users!announcements_posted_by_fkey (full_name)')
            .order('created_at', { ascending: false }),
          supabase.from('users').select('*').order('created_at', { ascending: false }),
          supabase.from('users').select('*').eq('role', 'lecturer'),
        ]);

      if (coursesRes.data) setCourses(coursesRes.data as Course[]);
      if (timetableRes.data) setTimetable(timetableRes.data as TimetableEntry[]);
      if (announcementsRes.data) setAnnouncements(announcementsRes.data as Announcement[]);
      if (usersRes.data) setUsers(usersRes.data);
      if (lecturersRes.data) setLecturers(lecturersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition ${
                  activeTab === 'courses'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Courses
              </button>
              <button
                onClick={() => setActiveTab('timetable')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition ${
                  activeTab === 'timetable'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Timetable
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition ${
                  activeTab === 'announcements'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="w-5 h-5" />
                Announcements
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5" />
                Users
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'courses' && (
              <CoursesTab courses={courses} lecturers={lecturers} onUpdate={loadData} />
            )}
            {activeTab === 'timetable' && (
              <TimetableTab timetable={timetable} courses={courses} onUpdate={loadData} />
            )}
            {activeTab === 'announcements' && (
              <AnnouncementsTab
                announcements={announcements}
                userId={user.id}
                onUpdate={loadData}
              />
            )}
            {activeTab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursesTab({
  courses,
  lecturers,
  onUpdate,
}: {
  courses: Course[];
  lecturers: User[];
  onUpdate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    course_code: '',
    course_title: '',
    level: '',
    lecturer_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from('courses').update(formData).eq('id', editingId);
      } else {
        await supabase.from('courses').insert([formData]);
      }
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setFormData({
      course_code: course.course_code,
      course_title: course.course_title,
      level: course.level,
      lecturer_id: course.lecturer_id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        await supabase.from('courses').delete().eq('id', id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ course_code: '', course_title: '', level: '', lecturer_id: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manage Courses</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code
              </label>
              <input
                type="text"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ICT101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title
              </label>
              <input
                type="text"
                value={formData.course_title}
                onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Introduction to Computing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <input
                type="text"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 100 ICT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lecturer</label>
              <select
                value={formData.lecturer_id}
                onChange={(e) => setFormData({ ...formData, lecturer_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Lecturer</option>
                {lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Code</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Level</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Lecturer</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {course.course_code}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{course.course_title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{course.level}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {course.lecturer?.full_name || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button
                    onClick={() => handleEdit(course)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimetableTab({
  timetable,
  courses,
  onUpdate,
}: {
  timetable: TimetableEntry[];
  courses: Course[];
  onUpdate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    course_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    room: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from('timetable').update(formData).eq('id', editingId);
      } else {
        await supabase.from('timetable').insert([formData]);
      }
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving timetable:', error);
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingId(entry.id);
    setFormData({
      course_id: entry.course_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      room: entry.room,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this timetable entry?')) {
      try {
        await supabase.from('timetable').delete().eq('id', id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting timetable:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ course_id: '', day_of_week: '', start_time: '', end_time: '', room: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manage Timetable</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Schedule
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.course_title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Room 101"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Course</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Day</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Room</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {timetable.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {entry.course?.course_code} - {entry.course?.course_title}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{entry.day_of_week}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {entry.start_time} - {entry.end_time}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{entry.room}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnnouncementsTab({
  announcements,
  userId,
  onUpdate,
}: {
  announcements: Announcement[];
  userId: string;
  onUpdate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    level: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('announcements').insert([
        {
          message: formData.message,
          level: formData.level || null,
          posted_by: userId,
        },
      ]);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error posting announcement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      try {
        await supabase.from('announcements').delete().eq('id', id);
        onUpdate();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({ message: '', level: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manage Announcements</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Post Announcement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter announcement message..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Level (optional)
              </label>
              <input
                type="text"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 100 ICT (leave empty for all students)"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              Post
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-gray-900">{announcement.message}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>{new Date(announcement.created_at).toLocaleString()}</span>
                  {announcement.level && <span>Level: {announcement.level}</span>}
                  {announcement.author && <span>By: {announcement.author.full_name}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(announcement.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab({ users = [], onUpdate }: { users?: User[]; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as 'student' | 'admin' | 'lecturer',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the user with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role
          }
        }
      });
      
      if (authError) throw authError;
      
      // Update the user's role in the database
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: formData.full_name,
            role: formData.role,
            updated_at: new Date().toISOString()
          });
          
        if (updateError) throw updateError;
      }
      
      // Reset form and update user list
      setFormData({ email: '', password: '', full_name: '', role: 'student' });
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding user:', error);
      setError(error instanceof Error ? error.message : 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  // User registration is now handled directly in handleAddUser

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) throw error;
        
        // Remove from profiles table if it exists
        await supabase.from('profiles').delete().eq('id', id);
        
        onUpdate();
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({ email: '', password: '', full_name: '', role: 'student' });
    setError(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manage Users</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddUser} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'student' | 'admin' | 'lecturer' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Level</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : user.role === 'lecturer'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.role || 'student'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {user.user_metadata?.level || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
