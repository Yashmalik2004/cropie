
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { useFarmStore } from '../stores/farmStore';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './DashboardPage';

export default function Dashboard() {
  const { user, isGuestMode, isAuthenticated } = useAuth();
  const { setGuestMode, clearUserData } = useFarmStore();

  useEffect(() => {
    console.log('🏠 Dashboard: Auth state -', { isAuthenticated, isGuestMode, userId: user?.id });
    
    // Sync farm store guest mode with auth context
    setGuestMode(!!isGuestMode);
    
    // Clear user-specific data when switching to guest mode
    if (isGuestMode) {
      clearUserData();
    }
  }, [isGuestMode, setGuestMode, clearUserData, isAuthenticated, user?.id]);

  // Route to appropriate dashboard based on user role
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  return <UserDashboard />;
}