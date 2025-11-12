# Datalink Class Planner

A comprehensive university timetable management system with separate interfaces for students and administrators.

## Overview

The Datalink Class Planner is a web-based application designed to streamline university schedule management. It provides an intuitive platform for students to view their class schedules and receive announcements, while giving administrators complete control over course management, timetable scheduling, and user administration.

## Problem Statement

Universities face significant challenges in managing and communicating class schedules across multiple departments, levels, and programs. The Datalink Class Planner addresses:

- **Scattered Information**: Class schedules often exist in disparate systems or static documents
- **Update Delays**: Changes to schedules don't reach students promptly
- **Administrative Burden**: Manual schedule management is time-consuming and error-prone
- **Communication Gaps**: Important announcements fail to reach the right students
- **Accessibility**: Students need 24/7 access to their schedules from any device

## System Objectives

1. **Centralized Management**: Single platform for all timetable operations
2. **Real-Time Updates**: Instant synchronization when schedules change
3. **Role-Based Access**: Separate interfaces for students and administrators
4. **Targeted Communication**: Announcements can be sent to specific levels or all students
5. **Responsive Design**: Works seamlessly on mobile and desktop devices

## Features

### Student Side

- **Secure Login**: Email and password authentication
- **Personalized Timetable**: View schedule based on enrolled level
- **Detailed Class Information**: Course code, title, lecturer, time, and room
- **Weekly Organization**: Classes organized by day of the week
- **Real-Time Updates**: Automatic refresh when admin makes changes
- **Announcements Panel**: View important notices and updates
- **Responsive Interface**: Mobile-friendly design

### Admin Side

- **Comprehensive Dashboard**: Manage all system components from one interface
- **Course Management**: Create, edit, and delete courses
- **Timetable Scheduling**: Assign classes to days, times, and rooms
- **User Administration**: Create and manage student, lecturer, and admin accounts
- **Announcements**: Post messages to specific levels or all students
- **Real-Time Synchronization**: Changes instantly visible to students

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Authentication**: Custom implementation with SHA-256 hashing

## Database Schema

### Users Table
- Stores all system users (students, lecturers, admins)
- Fields: email, password (hashed), full_name, role, level

### Courses Table
- Contains all course information
- Fields: course_code, course_title, level, lecturer_id

### Timetable Table
- Stores class schedule entries
- Fields: course_id, day_of_week, start_time, end_time, room

### Announcements Table
- Contains notices and updates
- Fields: message, level (optional), posted_by, created_at

## Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Password Hashing**: SHA-256 encryption for all passwords
- **Role-Based Policies**: Students can only view their level's data
- **Admin Restrictions**: Only admins can modify system data

## Demo Accounts

The system comes with pre-configured demo accounts:

| Email | Password | Role | Level |
|-------|----------|------|-------|
| admin@test.com | password | Admin | - |
| student@test.com | password | Student | 100 ICT |
| student2@test.com | password | Student | 200 Business |
| lecturer1@test.com | password | Lecturer | - |
| lecturer2@test.com | password | Lecturer | - |

## Level Format

Levels follow the format: `{Year} {Department}`

Examples:
- `100 ICT` - First year ICT students
- `200 Business` - Second year Business students
- `300 Engineering` - Third year Engineering students

## Usage Guide

### For Students

1. **Login**: Use your university email and password
2. **View Timetable**: See all your classes organized by day
3. **Check Announcements**: Stay updated with important notices
4. **Logout**: Click the logout button when done

### For Administrators

1. **Login**: Use admin credentials
2. **Manage Courses**: Add courses with codes, titles, levels, and lecturers
3. **Schedule Classes**: Assign courses to specific days, times, and rooms
4. **Post Announcements**: Send messages to specific levels or all students
5. **Manage Users**: Create student, lecturer, and admin accounts

## Real-Time Features

The system uses Supabase real-time subscriptions to:
- Automatically update student timetables when admin makes changes
- Instantly display new announcements
- Ensure all users see the latest information without refreshing

## Responsive Design

The application is fully responsive with breakpoints for:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktops (1024px+)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure Supabase is configured (connection details in `.env`)
4. Run the demo data setup (SQL provided in `setup-demo-data.sql`)
5. Start development server:
   ```bash
   npm run dev
   ```

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Email notifications for schedule changes
- PDF export of timetables
- Mobile app (iOS/Android)
- Lecturer dashboard
- Attendance tracking
- Exam schedule integration
- Calendar sync (Google Calendar, Outlook)

## Support

For issues or questions about the Datalink Class Planner, contact your system administrator.

---

**Datalink Class Planner** - Simplifying University Schedule Management
