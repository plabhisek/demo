import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './components/dashboard/AdminDashboard';
import UserDashboard from './components/dashboard/UserDashboard';
import MeetingForm from './components/meetings/MeetingForm';
import MeetingCalendarView from './components/meetings/MeetingCalendarView';
import MeetingList from './components/meetings/MeetingList';
import MeetingDetail from './components/meetings/MeetingDetail';
import MoMForm from './components/meetings/MoMForm';
import StakeholderForm from './components/stakeholders/StakeholderForm';
import StakeholderList from './components/stakeholders/StakeholderList';
import MeetingCheckIn from './components/meetings/MeetingCheckIn';
import MissedMeetingForm from './components/meetings/MissedMeetingForm';
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<UserDashboard />} />

        {/* Meetings */}
        <Route path="/meetings" element={<MeetingList />} />
        <Route path="/meetings/view/calendar" element={<MeetingCalendarView />} />
        <Route path="/meetings/new" element={<MeetingForm />} />
        <Route path="/meetings/:id" element={<MeetingDetail />} />
        <Route path="/meetings/:id/edit" element={<MeetingForm />} />
        <Route path="/meetings/:id/mom" element={<MoMForm />} />
        <Route path="/meetings/:id/checkin" element={<MeetingCheckIn />} />
        <Route path="/meetings/:id/missed" element={<MissedMeetingForm />} />
        <Route path="/meetings/:id/mom/:momId/edit" element={<MoMForm />} />

        {/* Stakeholders */}
        <Route path="/stakeholders" element={<StakeholderList />} />
        <Route path="/stakeholders/new" element={<StakeholderForm />} />
        <Route path="/stakeholders/:id/edit" element={<StakeholderForm />} />
      </Route>

      {/* Default route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;