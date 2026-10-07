import { Link } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFarms } from '../hooks/useFarms';
import {
  LogOut,
  Plus,
  MapPin,
  Sprout,
  User,
  Crown,
  TrendingUp,
  Activity,
  BarChart3,
} from 'lucide-react';
import { AddFarmCard, Card } from '@/components/card';
import { formatHectares } from '@/utils';
import type { Farm } from '@/types/farm';
import { toast } from 'robot-toast';

export default function UserDashboard() {
  const { user, logout, isGuestMode, migrationStatus } = useAuth();
  const { farms, loading, error, fetchFarms, clearError } = useFarms();
  const memoFetchFarms = useCallback(() => fetchFarms(), [fetchFarms]);
  const memoClearError = useCallback(() => clearError(), [clearError]);

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast.error({
        message: error,
        robotVariant: '/wheat-error.png',
        autoClose: 3000,
      });
    }
  }, [error]);

  // Simple effect: fetch farms when component mounts and user is available
  useEffect(() => {
    console.log('user', user);
    if (user?.id) {
      memoFetchFarms();
    }
  }, [user, memoFetchFarms]);

  // Clear any errors when component unmounts
  useEffect(() => {
    return () => {
      memoClearError();
    };
  }, [memoClearError]);

  // All farms belong to the current user (backend filters by user)
  const userFarms = farms;

  const handleLogout = () => {
    logout();
  };

  const totalArea = userFarms.reduce((sum: number, farm: Farm) => {
    const area = farm.area || 0;
    return sum + area;
  }, 0);
  const activeCrops = new Set(userFarms.map((farm: Farm) => farm.crop)).size;

  return (
    <div className='min-h-screen gradient-mesh'>
      {/* Enhanced Header */}
      <header className='glass border-b border-white/10 sticky top-0 z-40'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            <div className='flex items-center space-x-4 animate-in'>
              <div className='bg-gradient-to-br from-primary-500 to-primary-700 p-2.5 rounded-xl shadow-glow'>
                <Sprout className='h-6 w-6 text-white' />
              </div>
              <div>
                <div className='flex items-center space-x-2'>
                  <h1 className='text-2xl font-bold text-neutral-900'>
                    Dashboard
                  </h1>
                  {isGuestMode && (
                    <div className='badge-info'>
                      <User className='h-3 w-3 mr-1' />
                      Guest Mode
                    </div>
                  )}
                  {!isGuestMode && user?.role === 'admin' && (
                    <div className='badge-warning'>
                      <Crown className='h-3 w-3 mr-1' />
                      Admin
                    </div>
                  )}
                </div>
                <p className='text-sm text-neutral-600'>
                  Welcome back, {user?.fullName}
                  {isGuestMode && (
                    <span className='ml-2 text-blue-600 font-medium'>
                      - Your data is saved locally
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3 animate-in stagger-1'>
              {isGuestMode && (
                <div className='flex space-x-2'>
                  <Link to='/login' className='btn-secondary'>
                    Sign In
                  </Link>
                  <Link to='/register' className='btn-primary'>
                    Sign Up
                  </Link>
                </div>
              )}
              <button onClick={handleLogout} className='btn-ghost'>
                <LogOut className='h-4 w-4 mr-2' />
                {isGuestMode ? 'Clear Data' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Migration Status */}
          {migrationStatus.isLoading && (
            <div className='bg-blue-50 border border-blue-200 rounded-md p-4 mb-6'>
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3'></div>
                <div>
                  <h3 className='text-sm font-medium text-blue-800'>
                    Migrating your farms...
                  </h3>
                  <p className='text-sm text-blue-700 mt-1'>
                    We're transferring your guest farms to your new account.
                    This may take a moment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {migrationStatus.result && (
            <div
              className={`border rounded-md p-4 mb-6 ${
                migrationStatus.result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className='flex'>
                <div className='ml-3'>
                  <h3
                    className={`text-sm font-medium ${
                      migrationStatus.result.success
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}
                  >
                    {migrationStatus.result.success
                      ? 'Migration Completed!'
                      : 'Migration Issues'}
                  </h3>
                  <div
                    className={`mt-2 text-sm ${
                      migrationStatus.result.success
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {migrationStatus.result.success ? (
                      <p>
                        Successfully migrated{' '}
                        {migrationStatus.result.migratedCount} farm
                        {migrationStatus.result.migratedCount !== 1
                          ? 's'
                          : ''}{' '}
                        to your account.
                      </p>
                    ) : (
                      <div>
                        <p>Some farms could not be migrated:</p>
                        <ul className='list-disc list-inside mt-1'>
                          {migrationStatus.result.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guest Mode Welcome Banner */}
          {isGuestMode && userFarms.length === 0 && (
            <div className='bg-gradient-to-r from-blue-500 to-green-500 rounded-lg shadow-lg mb-6'>
              <div className='px-6 py-8 text-white'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-2xl font-bold mb-2'>
                      Welcome to CropLab!
                    </h2>
                    <p className='text-blue-100 mb-4 max-w-2xl'>
                      You're in Guest Mode - try out all features without
                      signing up! Your data is saved locally in your browser.
                      When ready, sign up to sync your farms to the cloud and
                      unlock notifications.
                    </p>
                    <div className='flex space-x-4'>
                      <Link
                        to='/create-farm'
                        className='inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors'
                      >
                        <Plus className='h-4 w-4 mr-2 ' />
                        Create Your First Farm
                      </Link>
                      <Link
                        to='/register'
                        className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors border border-blue-400'
                      >
                        Sign Up to Save Forever
                      </Link>
                    </div>
                  </div>
                  <div className='hidden lg:block'>
                    <Sprout className='h-20 w-20 text-green-200 opacity-80' />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State removed - now using toast notifications */}

          {/* Enhanced Loading State */}
          {loading && (
            <div className='card-elevated p-8 mb-6 animate-in'>
              <div className='flex flex-col items-center space-y-6'>
                <div className='relative'>
                  <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600'></div>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <Activity className='h-5 w-5 text-primary-600 animate-pulse' />
                  </div>
                </div>
                <div className='text-center'>
                  <p className='text-lg font-medium text-neutral-900 mb-2'>
                    Loading Your Dashboard
                  </p>
                  <p className='text-sm text-neutral-600'>
                    Gathering your farm data...
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Welcome Card - Only show when no farms, not loading, not guest mode, and not just migrated */}
          {!loading &&
            userFarms.length === 0 &&
            !isGuestMode &&
            !migrationStatus.result && (
              <div className='bg-white overflow-hidden shadow rounded-lg mb-6'>
                <div className='px-4 py-5 sm:p-6'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>
                    Welcome to CropLab
                  </h3>
                  <div className='mt-2 max-w-xl text-sm text-gray-500'>
                    <p>
                      Get started by creating your first farm or explore the
                      features available to you.
                    </p>
                  </div>
                  <div className='mt-5'>
                    <Link
                      to='/create-farm'
                      className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Create Your First Farm
                    </Link>
                  </div>
                </div>
              </div>
            )}

          {/* Enhanced Stats Grid */}
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8'>
            <div className='card-elevated group  transition-all duration-300 p-6 animate-in'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-neutral-600 mb-1'>
                    Total Farms
                  </p>
                  <p className='text-3xl font-bold text-neutral-900'>
                    {userFarms.length}
                  </p>
                  <div className='flex items-center mt-2'>
                    <TrendingUp className='h-3 w-3 text-primary-600 mr-1' />
                    <span className='text-xs text-primary-600 font-medium'>
                      Your portfolio
                    </span>
                  </div>
                </div>
                <div className='flex-shrink-0'>
                  <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center group-hover:shadow-glow transition-all'>
                    <MapPin className='h-6 w-6 text-white' />
                  </div>
                </div>
              </div>
            </div>

            <div className='card-elevated group  transition-all duration-300 p-6 animate-in stagger-1'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-neutral-600 mb-1'>
                    Total Area
                  </p>
                  <p className='text-3xl font-bold text-neutral-900'>
                    {formatHectares(totalArea)}
                    <span className='text-lg text-neutral-600 ml-1'>ha</span>
                  </p>
                  <div className='flex items-center mt-2'>
                    <Activity className='h-3 w-3 text-secondary-600 mr-1' />
                    <span className='text-xs text-secondary-600 font-medium'>
                      Hectares managed
                    </span>
                  </div>
                </div>
                <div className='flex-shrink-0'>
                  <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-700 flex items-center justify-center group-hover:shadow-glow transition-all'>
                    <BarChart3 className='h-6 w-6 text-white' />
                  </div>
                </div>
              </div>
            </div>

            <div className='card-elevated group  transition-all duration-300 p-6 animate-in stagger-2'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-neutral-600 mb-1'>
                    Crop Varieties
                  </p>
                  <p className='text-3xl font-bold text-neutral-900'>
                    {activeCrops}
                  </p>
                  <div className='flex items-center mt-2'>
                    <Sprout className='h-3 w-3 text-accent-600 mr-1' />
                    <span className='text-xs text-accent-600 font-medium'>
                      Active crops
                    </span>
                  </div>
                </div>
                <div className='flex-shrink-0'>
                  <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center group-hover:shadow-glow-accent transition-all'>
                    <Sprout className='h-6 w-6 text-white' />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Farms List */}
          {!loading && userFarms.length > 0 ? (
            <div className='animate-in stagger-1'>
              <div className='card-elevated'>
                <div className='p-6'>
                  <div className='flex justify-between items-center mb-6'>
                    <div>
                      <h3 className='text-xl font-semibold text-neutral-900 mb-1'>
                        Your Farms
                      </h3>
                      <p className='text-sm text-neutral-600'>
                        {userFarms.length}{' '}
                        {userFarms.length === 1 ? 'farm' : 'farms'} in your
                        portfolio
                      </p>
                    </div>
                    <Link to='/create-farm' className='btn-primary group'>
                      <Plus className='h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200' />
                      Add Farm
                    </Link>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {userFarms.map((farm: Farm, index: number) => (
                      <Card farm={farm} index={index} />
                    ))}
                    <AddFarmCard />
                  </div>
                </div>
              </div>
            </div>
          ) : !loading ? (
            <div className='card-elevated animate-in'>
              <div className='text-center py-16'>
                <div className='inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-neutral-200 mb-6'>
                  <MapPin className='h-8 w-8 text-neutral-400' />
                </div>
                <h3 className='text-xl font-semibold text-neutral-900 mb-2'>
                  No farms yet
                </h3>
                <p className='text-neutral-600 mb-8 max-w-sm mx-auto'>
                  Start your agricultural journey by creating your first farm.
                </p>
                <Link to='/create-farm' className='btn-primary group'>
                  <Plus className='h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200' />
                  Create Your First Farm
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
