import { Navigate } from 'react-router-dom';
// ProtectedRoute component for route protection
import React from 'react';
import { useAuth } from '../hooks/useAuth';
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
import { useState, useEffect, type ReactNode } from 'react';
import { AuthAPI } from '../services/authApi';
import { GuestModeService } from '../services/guestModeService';
import { GuestFarmStorage } from '../utils/guestFarmStorage';
import { AuthContext } from './AuthContextDefinition';
import type { User, MigrationResult } from '@/types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    isLoading: boolean;
    result: MigrationResult | null;
  }>({
    isLoading: false,
    result: null,
  });

  useEffect(() => {
    // Check for stored user session and verify token
    const initAuth = async () => {
      console.log('🔍 Initializing authentication...');
      
      try {
        const isAuth = AuthAPI.isAuthenticated();
        console.log('🔑 Is authenticated:', isAuth);
        
        if (isAuth) {
          const currentUser = AuthAPI.getCurrentUser();
          console.log('👤 Current user from storage:', currentUser);
          
          if (currentUser) {
            setUser(currentUser);
            setIsGuestMode(false);
            console.log('✅ User set in context:', currentUser);
            
            // Optionally verify token with backend
            try {
              await AuthAPI.verifyToken();
              console.log('✅ Token verified successfully');
            } catch (error) {
              console.error('❌ Token verification failed:', error);
              // Clear invalid session
              AuthAPI.logout();
              setUser(null);
              setIsGuestMode(false);
            }
          } else {
            console.log('❌ No current user found in storage');
          }
        } else {
          // Check for guest mode
          const isGuest = GuestModeService.isGuestMode();
          console.log('🔍 Checking guest mode:', isGuest);
          
          if (isGuest) {
            const guestUser = GuestModeService.getGuestUser();
            if (guestUser) {
              setUser(guestUser);
              setIsGuestMode(true);
              console.log('👻 Guest user set in context:', guestUser);
            }
          } else {
            // Auto-enable guest mode for new visitors
            if (GuestModeService.shouldAutoEnableGuest()) {
              console.log('🎯 Auto-enabling guest mode for new visitor');
              const guestUser = GuestModeService.enableGuestMode();
              setUser(guestUser);
              setIsGuestMode(true);
              console.log('👻 Auto guest user created:', guestUser);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
        console.log('🏁 Auth initialization complete');
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Check if we need to migrate guest farms
      const hasGuestFarms = GuestModeService.hasGuestFarmsToMigrate();
      const guestFarmCount = GuestModeService.getGuestFarmsCount();
      console.log('🔍 Pre-login guest farm check:', { hasGuestFarms, guestFarmCount });
      
      const response = await AuthAPI.login({ email, password });
      console.log('📥 Login response:', response);
      
      if (response.code === 1 && response.result?.user) {
        setUser(response.result.user);
        setIsGuestMode(false);
        console.log('✅ Login successful, user set:', response.result.user);
        
        // Migrate guest farms if any exist (only if not already migrating)
        if (hasGuestFarms && !migrationStatus.isLoading) {
          console.log('🔄 Starting guest farm migration after login...');
          setMigrationStatus({ isLoading: true, result: null });
          
          try {
            const migrationResult = await GuestModeService.migrateGuestFarmsToUser();
            setMigrationStatus({ isLoading: false, result: migrationResult });
            
            if (migrationResult.success) {
              console.log(`✅ Successfully migrated ${migrationResult.migratedCount} guest farms`);
            } else {
              console.error('❌ Farm migration completed with errors:', migrationResult.errors);
            }
          } catch (migrationError) {
            console.error('❌ Farm migration failed:', migrationError);
            setMigrationStatus({ 
              isLoading: false, 
              result: { success: false, migratedCount: 0, errors: ['Migration failed'] } 
            });
          }
        } else if (hasGuestFarms && migrationStatus.isLoading) {
          console.log('⚠️ Migration already in progress, skipping duplicate trigger');
        }
        
        // Small delay to ensure user context is properly set before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.message);
        return { success: false, error: response.message || 'Invalid email or password' };
      }
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (email: string, password: string, name: string, phone: string, address: string) => {
    try {
      console.log('📝 Attempting registration for:', email);
      
      // Check if we need to migrate guest farms
      const hasGuestFarms = GuestModeService.hasGuestFarmsToMigrate();
      const guestFarmCount = GuestModeService.getGuestFarmsCount();
      console.log('🔍 Pre-registration guest farm check:', { hasGuestFarms, guestFarmCount });
      
      const response = await AuthAPI.register({
        fullName: name,
        email,
        password,
        phone,
        address
      });
      console.log('📥 Registration response:', response);

      if (response.code === 1 && response.result?.user) {
        setUser(response.result.user);
        setIsGuestMode(false);
        console.log('✅ Registration successful, user set:', response.result.user);
        
        // Migrate guest farms if any exist (only if not already migrating)
        if (hasGuestFarms && !migrationStatus.isLoading) {
          console.log('🔄 Starting guest farm migration after registration...');
          setMigrationStatus({ isLoading: true, result: null });
          
          try {
            const migrationResult = await GuestModeService.migrateGuestFarmsToUser();
            setMigrationStatus({ isLoading: false, result: migrationResult });
            
            if (migrationResult.success) {
              console.log(`✅ Successfully migrated ${migrationResult.migratedCount} guest farms`);
            } else {
              console.error('❌ Farm migration completed with errors:', migrationResult.errors);
            }
          } catch (migrationError) {
            console.error('❌ Farm migration failed:', migrationError);
            setMigrationStatus({ 
              isLoading: false, 
              result: { success: false, migratedCount: 0, errors: ['Migration failed'] } 
            });
          }
        } else if (hasGuestFarms && migrationStatus.isLoading) {
          console.log('⚠️ Migration already in progress, skipping duplicate trigger');
        }
        
        return { success: true };
      } else {
        console.log('❌ Registration failed:', response.message);
        return { success: false, error: response.message || 'Registration failed' };
      }
    } catch (error: unknown) {
      console.error('❌ Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      if (isGuestMode) {
        // For guest mode, clear guest farm data and guest session
        GuestFarmStorage.clearAllFarms();
        GuestModeService.disableGuestMode();
        const newGuestUser = GuestModeService.enableGuestMode();
        setUser(newGuestUser);
        setIsGuestMode(true);
        console.log('👻 Guest logout: created new guest session and cleared guest farms');
        // Reset migration status
        setMigrationStatus({ isLoading: false, result: null });
        // Redirect to dashboard to show the clean guest interface
        window.location.href = '/dashboard';
      } else {
        // For authenticated users, perform full logout
        await AuthAPI.logout();
        console.log('✅ Logout successful');
        
        setUser(null);
        setIsGuestMode(false);
        setMigrationStatus({ isLoading: false, result: null });
        console.log('👤 User cleared from context');
        
        // Auto-enable guest mode for the logged out user
        const guestUser = GuestModeService.enableGuestMode();
        setUser(guestUser);
        setIsGuestMode(true);
        console.log('👻 Auto-enabled guest mode after logout');
        
        // Redirect to dashboard to show guest mode
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback: clear everything and enable guest mode
      setUser(null);
      setIsGuestMode(false);
      setMigrationStatus({ isLoading: false, result: null });
      
      const guestUser = GuestModeService.enableGuestMode();
      setUser(guestUser);
      setIsGuestMode(true);
      
      window.location.href = '/dashboard';
    }
  };

  // Debug current auth state
  console.log('🔍 Current auth state:', {
    user: user,
    isAuthenticated: !!user,
    isLoading: isLoading,
    isGuestMode: isGuestMode,
    migrationStatus: migrationStatus
  });

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isGuestMode,
    login,
    register,
    logout,
    migrationStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

