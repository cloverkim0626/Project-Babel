import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RiteOfSelection from './pages/RiteOfSelection';
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const WorldMapView = React.lazy(() => import('./pages/WorldMap'));
const QuestProgressView = React.lazy(() => import('./pages/QuestProgressView'));
const MissionPlay = React.lazy(() => import('./pages/MissionPlay'));
const MissionSelect = React.lazy(() => import('./pages/MissionSelect'));
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'));

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-babel-gold flex items-center justify-center">Loading Babel OS...</div>}>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/select-class" element={<RiteOfSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/world-map" element={<WorldMapView />} />
          <Route path="/missions/:continentId" element={<MissionSelect />} />
          <Route path="/quest-progress/:id" element={<QuestProgressView />} />
          <Route path="/mission/:id/play" element={<MissionPlay />} />
          <Route path="/admin" element={<TeacherDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Suspense>
  );
}

export default App;
