import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import SchoolRegistrationPage from './pages/SchoolRegistrationPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CarLookupPage from './pages/CarLookupPage';
import CheckInPage from './pages/CheckInPage';
import OverridesPage from './pages/OverridesPage';
import AdminPage from './pages/AdminPage';
import TeacherSetupPage from './pages/TeacherSetupPage';
import './App.css';

const ProtectedPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navigation />
    {children}
  </>
);

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<SchoolRegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/car-lookup"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'staff']}>
              <ProtectedPageLayout>
                <CarLookupPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'staff']}>
              <ProtectedPageLayout>
                <DashboardPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'front_office', 'teacher', 'staff']}>
              <ProtectedPageLayout>
                <CheckInPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/overrides"
          element={
            <ProtectedRoute allowedRoles={['admin', 'front_office']}>
              <ProtectedPageLayout>
                <OverridesPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'staff']}>
              <ProtectedPageLayout>
                <TeacherSetupPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProtectedPageLayout>
                <AdminPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
