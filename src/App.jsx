import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import Members from './pages/Members';
import Trainers from './pages/Trainers';
import Payments from './pages/Payments';
import Announcements from './pages/Announcements';
import MemberProfile from './pages/MemberProfile';
import TrainerProfile from './pages/TrainerProfile';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Plans from './pages/Plans';
import Enquiries from './pages/Enquiries';
import Expenses from './pages/Expenses';

// Layout wrapper for all authenticated dashboard pages
function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* Side Navigation panel */}
      <Sidebar />

      {/* Main Content shell */}
      <div className="ml-64 flex-grow flex flex-col min-h-screen">
        {/* Top Header bar */}
        <Header />

        {/* Content Canvas */}
        <main className="flex-grow p-gutter md:p-lg">
          <div className="max-w-[1200px] mx-auto">
            {/* Child routes get injected here */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Route Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Root redirect to Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Sub-views */}
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:id" element={<MemberProfile />} />
          <Route path="trainers" element={<Trainers />} />
          <Route path="trainers/:id" element={<TrainerProfile />} />
          <Route path="payments" element={<Payments />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="plans" element={<Plans />} />
          <Route path="settings" element={<Settings />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="expenses" element={<Expenses />} />
        </Route>

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
