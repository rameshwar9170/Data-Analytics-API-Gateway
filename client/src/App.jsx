import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import CandidateLayout from './components/layout/CandidateLayout';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import DatasetGenerator from './pages/admin/DatasetGenerator';
import DatasetManager from './pages/admin/DatasetManager';
import DatabaseExplorer from './pages/admin/DatabaseExplorer';
import DatasetPreview from './pages/admin/DatasetPreview';
import AssignmentGenerator from './pages/admin/AssignmentGenerator';
import AssessmentManager from './pages/admin/AssessmentManager';
import CandidateManagement from './pages/admin/CandidateManagement';
import CandidateDetails from './pages/admin/CandidateDetails';
import LiveMonitor from './pages/admin/LiveMonitor';
import EvaluationReports from './pages/admin/EvaluationReports';
import Settings from './pages/admin/Settings';

// Candidate Pages
import CandidateWorkspace from './pages/candidate/CandidateWorkspace';

// Route Guards
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/candidate'} replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/candidate'} replace />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1B1D21',
                color: '#fff',
                fontSize: '12px',
                borderRadius: '8px',
              },
            }}
          />

          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="generator" element={<DatasetGenerator />} />
              <Route path="datasets" element={<DatasetManager />} />
              <Route path="explorer" element={<DatabaseExplorer />} />
              <Route path="preview/:id" element={<DatasetPreview />} />
              <Route path="assignments" element={<AssignmentGenerator />} />
              <Route path="assessments" element={<AssessmentManager />} />
              <Route path="candidates" element={<CandidateManagement />} />
              <Route path="candidates/:id" element={<CandidateDetails />} />
              <Route path="monitor" element={<LiveMonitor />} />
              <Route path="evaluations" element={<EvaluationReports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Candidate Routes */}
            <Route
              path="/candidate"
              element={
                <ProtectedRoute requiredRole="candidate">
                  <CandidateLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CandidateWorkspace />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
