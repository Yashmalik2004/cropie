import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { CreateFarm } from './pages/CreateFarm';
import FarmDetail from './pages/FarmDetail';
import EditFarm from './pages/EditFarm';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/create-farm',
    element: (
      <ProtectedRoute>
        <CreateFarm />
      </ProtectedRoute>
    ),
  },
  {
    path: '/farm/:id',
    element: (
      <ProtectedRoute>
        <FarmDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/farm/:id/edit',
    element: (
      <ProtectedRoute>
        <EditFarm />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);