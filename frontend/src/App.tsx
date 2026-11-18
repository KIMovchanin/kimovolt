import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AppProvider } from './state/AppStore';

// Lazy load heavy interactive studio/map/reference routes for snappy initial load
const LearnMapPage = lazy(() => import('./pages/LearnMapPage').then((m) => ({ default: m.LearnMapPage })));
const LessonPage = lazy(() => import('./pages/LessonPage').then((m) => ({ default: m.LessonPage })));
const SandboxPage = lazy(() => import('./pages/SandboxPage').then((m) => ({ default: m.SandboxPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ReferencePage = lazy(() => import('./pages/ReferencePage').then((m) => ({ default: m.ReferencePage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

const RouteFallback: React.FC = () => (
  <div className="kv-panel kv-mono" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
    LOADING LAB MODULE…
  </div>
);

export const App: React.FC = () => (
  <AppProvider>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/learn" element={<LearnMapPage />} />
            <Route path="/learn/:lessonId" element={<LessonPage />} />
            <Route path="/lab" element={<SandboxPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/reference" element={<ReferencePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </AppProvider>
);

export default App;
