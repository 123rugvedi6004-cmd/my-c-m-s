import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyPosts = lazy(() => import('./pages/MyPosts'));
const Explore = lazy(() => import('./pages/Explore'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Editor = lazy(() => import('./pages/Editor'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Login = lazy(() => import('./pages/Login'));
const Notifications = lazy(() => import('./pages/Notifications'));
const SavedPosts = lazy(() => import('./pages/SavedPosts'));

const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {user && <Sidebar />}
        <div className={user ? "lg:pl-64 flex flex-col min-h-screen" : "flex flex-col min-h-screen"}>
          {user && <Navbar />}
          <main className="flex-1 p-4 lg:p-8">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                
                <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/my-posts" element={<PrivateRoute><MyPosts /></PrivateRoute>} />
                <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                <Route path="/saved" element={<PrivateRoute><SavedPosts /></PrivateRoute>} />
                <Route path="/profile/:uid?" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
                <Route path="/editor/:id?" element={<PrivateRoute><Editor /></PrivateRoute>} />
                <Route path="/post/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
