import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isGuestMode } = useAuth();

  // Debug logs
  console.log('🛡️ ProtectedRoute check:', {
    isLoading,
    isAuthenticated,
    user,
    isGuestMode,
    requiredRole,
    currentPath: window.location.pathname
  });

  if (isLoading) {
    console.log('⏳ Auth is loading, showing spinner...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if user is authenticated (includes guest mode)
  if (!isAuthenticated) {
    console.log('❌ User not authenticated, showing access denied...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please log in to access this page.</p>
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-left">
              <strong>Debug Info:</strong><br/>
              isLoading: {isLoading.toString()}<br/>
              isAuthenticated: {isAuthenticated.toString()}<br/>
              isGuestMode: {isGuestMode.toString()}<br/>
              user: {user ? 'exists' : 'null'}<br/>
              token exists: {localStorage.getItem('auth_token') ? 'yes' : 'no'}
            </div>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check role requirements (guest users have 'user' role by default)
  if (requiredRole && user?.role !== requiredRole) {
    console.log('❌ User role mismatch:', user?.role, 'required:', requiredRole);
    
    // If required role is admin but user is guest or regular user
    if (requiredRole === 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-4">
                You don't have permission to access this page. Admin access required.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Current role: {user?.role || 'unknown'}
              </p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  console.log('✅ Auth check passed, rendering children');
  return <>{children}</>;
}