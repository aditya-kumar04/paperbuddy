import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

// Import screens
import Login from './screens/Login';
import AcceptInvite from './screens/AcceptInvite';
import SuperAdminDashboard from './screens/SuperAdminDashboard';
import SchoolAdminDashboard from './screens/SchoolAdminDashboard';
import AccountantDashboard from './screens/AccountantDashboard';
import StudentDashboard from './screens/StudentDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to default dashboard for their role
    if (user?.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />;
    if (user?.role === 'SCHOOL_ADMIN') return <Navigate to="/school-admin" replace />;
    if (user?.role === 'ACCOUNTANT') return <Navigate to="/accountant" replace />;
    if (user?.role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />;
  if (user?.role === 'SCHOOL_ADMIN') return <Navigate to="/school-admin" replace />;
  if (user?.role === 'ACCOUNTANT') return <Navigate to="/accountant" replace />;
  if (user?.role === 'STUDENT') return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

          {/* Protected Dashboards */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/school-admin"
            element={
              <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
                <SchoolAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant"
            element={
              <ProtectedRoute allowedRoles={['ACCOUNTANT']}>
                <AccountantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Wildcard / Fallback redirects */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
