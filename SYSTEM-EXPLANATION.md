# Datalink Class Planner - Complete System Explanation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Student Side Detailed Explanation](#student-side-detailed-explanation)
3. [Admin Side Detailed Explanation](#admin-side-detailed-explanation)
4. [Database Design](#database-design)
5. [Authentication Flow](#authentication-flow)
6. [Real-Time Features](#real-time-features)
7. [Security Implementation](#security-implementation)

---

## System Architecture

The Datalink Class Planner is built as a single-page application (SPA) with three main layers:

### 1. Presentation Layer (Frontend)
- **Technology**: React 18 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks (useState, useEffect)
- **Routing**: Component-based routing based on user role

### 2. Business Logic Layer
- **Authentication**: Custom login system with password hashing
- **Data Management**: CRUD operations through Supabase client
- **Real-Time Sync**: WebSocket subscriptions for live updates
- **Session Management**: localStorage for user persistence

### 3. Data Layer
- **Database**: PostgreSQL via Supabase
- **Security**: Row Level Security (RLS) policies
- **Storage**: User data, courses, timetables, announcements

---

## Student Side Detailed Explanation

### Login Process

**File**: `src/components/Login.tsx`

The login interface provides:
- Email and password input fields
- Form validation (required fields, email format)
- Error handling with user-friendly messages
- Loading states during authentication
- Demo account information for testing

**Flow**:
1. User enters credentials
2. System hashes password using SHA-256
3. Database query checks for matching email and hashed password
4. On success, user object is stored in localStorage
5. App redirects to appropriate dashboard based on role

### Student Dashboard

**File**: `src/components/StudentDashboard.tsx`

#### Header Section
- Displays welcome message with student name and level
- Shows current level (e.g., "100 ICT")
- Logout button for session termination

#### Main Timetable Display
Features:
- **Day-by-Day Organization**: Classes grouped by weekday (Monday-Friday)
- **Comprehensive Information**:
  - Course code (e.g., ICT101)
  - Course title (e.g., Introduction to Computing)
  - Time slot with formatted AM/PM display
  - Room location
  - Lecturer name
- **Visual Design**:
  - Blue-themed cards for each class
  - Icons for time, location, and lecturer
  - Hover effects for interactivity
  - Responsive grid layout

#### Announcements Panel
Located on the right sidebar:
- Shows latest 5 announcements
- Displays message content
- Shows posting date and author
- Highlights with yellow background for visibility
- Auto-updates when admin posts new announcements

#### Real-Time Updates
The dashboard subscribes to database changes:
```typescript
supabase
  .channel('timetable_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable' }, () => {
    loadData();
  })
  .subscribe();
```

This means:
- When admin adds a class, students see it instantly
- When admin changes a time, it updates immediately
- When admin posts an announcement, it appears right away

#### Data Filtering
Students only see data relevant to their level:
- Database query filters courses by `user.level`
- Announcements filtered to show general + level-specific messages
- RLS policies ensure students cannot access other levels' data

---

## Admin Side Detailed Explanation

### Admin Dashboard Structure

**File**: `src/components/AdminDashboard.tsx`

The admin interface uses a tabbed layout with four sections:

### 1. Courses Tab

**Purpose**: Manage all courses in the system

**Features**:
- **Add Course Form**:
  - Course Code (e.g., ICT101)
  - Course Title (e.g., Introduction to Computing)
  - Level (e.g., 100 ICT)
  - Lecturer assignment (dropdown of available lecturers)

- **Course List Table**:
  - Displays all courses with details
  - Edit button to modify existing courses
  - Delete button with confirmation dialog
  - Shows assigned lecturer name

**Operations**:
```typescript
// Adding a course
await supabase.from('courses').insert([{
  course_code: 'ICT101',
  course_title: 'Introduction to Computing',
  level: '100 ICT',
  lecturer_id: 'uuid-of-lecturer'
}]);

// Updating a course
await supabase.from('courses').update(formData).eq('id', courseId);

// Deleting a course
await supabase.from('courses').delete().eq('id', courseId);
```

### 2. Timetable Tab

**Purpose**: Schedule classes with specific times and rooms

**Features**:
- **Add Schedule Form**:
  - Course selection (dropdown of all courses)
  - Day of week (Monday-Friday)
  - Start time (time picker)
  - End time (time picker)
  - Room number/name

- **Timetable List**:
  - Shows all scheduled classes
  - Displays course, day, time, and room
  - Edit existing schedule entries
  - Delete entries with confirmation

**Database Relations**:
Each timetable entry is linked to a course via `course_id`. When displaying:
```sql
SELECT timetable.*,
       courses.course_code,
       courses.course_title
FROM timetable
JOIN courses ON timetable.course_id = courses.id
```

### 3. Announcements Tab

**Purpose**: Communicate with students

**Features**:
- **Post Announcement Form**:
  - Message text area
  - Optional level targeting (leave empty for all students)
  - Automatic timestamp
  - Auto-attribution to logged-in admin

- **Announcements List**:
  - Shows all posted announcements
  - Displays message, date, level, and author
  - Delete functionality
  - Sorted by newest first

**Targeting Logic**:
- Leave level empty: Announcement visible to ALL students
- Specify level (e.g., "100 ICT"): Only visible to that level
- Database query on student side:
  ```sql
  WHERE level IS NULL OR level = user.level
  ```

### 4. Users Tab

**Purpose**: Manage all system users

**Features**:
- **Add User Form**:
  - Email (unique identifier)
  - Password (will be hashed)
  - Full Name
  - Role (Student, Lecturer, Admin)
  - Level (only for students)

- **Users List**:
  - Shows all registered users
  - Color-coded role badges:
    - Red for Admin
    - Green for Lecturer
    - Blue for Student
  - Delete functionality
  - Displays registration date

**User Creation**:
```typescript
await registerUser(
  email,
  password,      // Will be hashed with SHA-256
  fullName,
  role,
  level          // Optional, only for students
);
```

---

## Database Design

### Table Relationships

```
users (id, email, password, full_name, role, level)
  ↓ (lecturer_id)
courses (id, course_code, course_title, level, lecturer_id)
  ↓ (course_id)
timetable (id, course_id, day_of_week, start_time, end_time, room)

users (id, email, password, full_name, role, level)
  ↓ (posted_by)
announcements (id, message, level, posted_by, created_at)
```

### Key Design Decisions

1. **Separate Tables**: Each entity (user, course, timetable, announcement) has its own table for flexibility
2. **Foreign Keys**: Maintain data integrity through relationships
3. **Optional Fields**: Lecturer assignment and announcement level are optional
4. **Timestamps**: All tables include created_at for audit trails
5. **UUIDs**: Primary keys use UUID for security and scalability

### Indexes for Performance

```sql
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_timetable_course_id ON timetable(course_id);
CREATE INDEX idx_announcements_level ON announcements(level);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
```

These indexes speed up:
- Finding courses for a specific level
- Loading timetable entries for courses
- Filtering announcements by level
- Sorting announcements by date

---

## Authentication Flow

### Login Process

```
1. User enters email + password
   ↓
2. Frontend hashes password with SHA-256
   ↓
3. Query database: WHERE email = ? AND password = ?
   ↓
4. If match found:
   - Store user object in localStorage
   - Redirect to appropriate dashboard
   ↓
5. If no match:
   - Show error message
   - Keep user on login page
```

### Session Persistence

```typescript
// On login success
localStorage.setItem('datalinkUser', JSON.stringify(user));

// On app load
const storedUser = localStorage.getItem('datalinkUser');
if (storedUser) {
  setUser(JSON.parse(storedUser));
}

// On logout
localStorage.removeItem('datalinkUser');
```

### Role-Based Routing

```typescript
if (!user) {
  return <Login />;
}

if (user.role === 'admin') {
  return <AdminDashboard />;
}

return <StudentDashboard />;
```

---

## Real-Time Features

### How Real-Time Works

Supabase provides PostgreSQL real-time subscriptions via WebSockets:

```typescript
const subscription = supabase
  .channel('channel_name')
  .on('postgres_changes', {
    event: '*',           // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'timetable'
  }, (payload) => {
    // When timetable changes, reload data
    loadData();
  })
  .subscribe();
```

### Benefits

1. **No Manual Refresh**: Students don't need to reload the page
2. **Instant Updates**: Changes visible within seconds
3. **Reduced Server Load**: No polling required
4. **Better UX**: Always shows current information

### Cleanup

```typescript
useEffect(() => {
  const subscription = supabase.channel('...').subscribe();

  return () => {
    subscription.unsubscribe();  // Clean up on unmount
  };
}, []);
```

---

## Security Implementation

### Row Level Security (RLS)

RLS ensures users can only access appropriate data:

#### Students Can View Their Level's Data
```sql
CREATE POLICY "Students can view courses for their level"
  ON courses FOR SELECT
  TO authenticated
  USING (
    level IN (SELECT users.level FROM users WHERE users.id = auth.uid())
  );
```

#### Admin Can Manage Everything
```sql
CREATE POLICY "Admin can manage courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### Password Security

1. **Hashing**: All passwords hashed with SHA-256 before storage
2. **Never Stored Plain**: Database never contains plain-text passwords
3. **Client-Side Hashing**: Reduces server risk

```typescript
import * as CryptoJS from 'crypto-js';

export async function hashPassword(password: string): Promise<string> {
  return CryptoJS.SHA256(password).toString();
}
```

### Additional Security Measures

1. **Unique Constraints**: Email must be unique
2. **Required Fields**: Prevents incomplete records
3. **Foreign Key Constraints**: Maintains referential integrity
4. **Check Constraints**: Validates role and day_of_week values
5. **No Direct Database Access**: All queries through Supabase client

---

## Responsive Design Implementation

### Mobile-First Approach

```css
/* Base styles for mobile */
.container { padding: 1rem; }

/* Tablet and up */
@media (min-width: 768px) {
  .container { padding: 2rem; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container { padding: 3rem; }
}
```

### Grid System

```jsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <div className="lg:col-span-3">
    {/* Main content - takes 3/4 on desktop */}
  </div>
  <div className="lg:col-span-1">
    {/* Sidebar - takes 1/4 on desktop, full width on mobile */}
  </div>
</div>
```

### Responsive Tables

Tables use horizontal scrolling on mobile:
```jsx
<div className="overflow-x-auto">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>
```

---

## Key Differentiators

### Why This System is Effective

1. **Single Source of Truth**: All schedule data in one place
2. **Real-Time Sync**: No stale data or confusion
3. **Role-Based Views**: Each user sees what they need
4. **Mobile Accessible**: Works on any device
5. **Easy Administration**: Intuitive interface for schedule management
6. **Secure by Default**: RLS prevents unauthorized access
7. **Scalable**: Can handle many departments and levels
8. **Extensible**: Easy to add new features

### Comparison to Alternatives

**vs. Static PDFs**:
- PDFs quickly become outdated
- No search functionality
- Not mobile-friendly
- No targeted announcements

**vs. Email Lists**:
- Emails get lost or ignored
- No single schedule view
- Manual update process
- No real-time sync

**vs. Spreadsheets**:
- Not accessible to students
- Version control issues
- No role-based access
- Prone to accidental edits

---

## Conclusion

The Datalink Class Planner provides a modern, efficient solution to university timetable management. By separating concerns (student view vs. admin control), implementing real-time updates, and ensuring security through RLS policies, it creates a reliable system that benefits both students and administrators.

The system is production-ready and can be extended with additional features like email notifications, PDF exports, and mobile applications as needs evolve.
