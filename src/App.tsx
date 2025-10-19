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
import AcceptInvitePage from './pages/AcceptInvitePage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import './styles/responsive.css';
import './App.css';

const ProtectedPageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navigation />
    <div style={{ paddingBottom: '80px' }} className="show-mobile-only">
      {children}
    </div>
    <div className="hidden-mobile">
      {children}
    </div>
  </>
);

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<SchoolRegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route
          path="/car-lookup"
          element={
            <ProtectedRoute requiredPermissions={['CAR_LOOKUP']}>
              <ProtectedPageLayout>
                <CarLookupPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredPermissions={['MANAGEMENT']}>
              <ProtectedPageLayout>
                <DashboardPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute requiredPermissions={['CHECKIN']}>
              <ProtectedPageLayout>
                <CheckInPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/overrides"
          element={
            <ProtectedRoute requiredPermissions={['OVERRIDES']}>
              <ProtectedPageLayout>
                <OverridesPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute requiredPermissions={['SETUP']}>
              <ProtectedPageLayout>
                <TeacherSetupPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredPermissions={['ADMIN']}>
              <ProtectedPageLayout>
                <AdminPage />
              </ProtectedPageLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <PWAInstallPrompt />
    </Router>
  </AuthProvider>
);

export default App;
