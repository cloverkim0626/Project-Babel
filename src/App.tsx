import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RiteOfSelection from './pages/RiteOfSelection';
import { RoleGuard } from './components/auth/RoleGuard';
import { AuthProvider } from './context/AuthContext';

const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const WorldMapView = React.lazy(() => import('./pages/WorldMap'));
const QuestProgressView = React.lazy(() => import('./pages/QuestProgressView'));
const MissionPlay = React.lazy(() => import('./pages/MissionPlay'));
const MissionSelect = React.lazy(() => import('./pages/MissionSelect'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));
const CreateProjectPage = React.lazy(() => import('./pages/CreateProjectPage'));

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-babel-gold flex items-center justify-center">Loading Babel OS...</div>}>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/select-class" element={<RiteOfSelection />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={
              <RoleGuard allowedRoles={['student']}>
                <Dashboard />
              </RoleGuard>
            } />
            <Route path="/world-map" element={
              <RoleGuard allowedRoles={['student']}>
                <WorldMapView />
              </RoleGuard>
            } />
            <Route path="/missions/:continentId" element={
              <RoleGuard allowedRoles={['student']}>
                <MissionSelect />
              </RoleGuard>
            } />
            <Route path="/quest-progress/:id" element={
              <RoleGuard allowedRoles={['student']}>
                <QuestProgressView />
              </RoleGuard>
            } />
            <Route path="/mission/:id/play" element={
              <RoleGuard allowedRoles={['student']}>
                <MissionPlay />
              </RoleGuard>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <RoleGuard allowedRoles={['master', 'admin']}>
                <TeacherDashboard />
              </RoleGuard>
            } />
            <Route path="/admin/create-project" element={
              <RoleGuard allowedRoles={['master', 'admin']}>
                <CreateProjectPage />
              </RoleGuard>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Suspense>
  );
}

export default App;
