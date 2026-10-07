import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFarms } from '../hooks/useFarms';
import { useFarmStore } from '../stores/farmStore';
import { useUserStore } from '../stores/userStore';
import { LogOut, Users, MapPin, Sprout, BarChart3, Settings, Plus, Mail, Phone, Home, Crown, Activity } from 'lucide-react';
import { formatHectares } from '@/utils';
import {AddFarmCard, Card} from '@/components/card';

export default function AdminDashboard() {
    const [allFarmsPage, setAllFarmsPage] = useState(1);
    const [usersPage, setUsersPage] = useState(1);
    const allFarmsSectionRef = useRef<HTMLDivElement>(null);
    const usersSectionRef = useRef<HTMLDivElement>(null);
    const allFarmsLimit = 10;
    const usersLimit = 10;
    const { user, logout, isAuthenticated } = useAuth();
    const { farms, loading: farmsLoading, error: farmsError, fetchFarms, clearError: clearFarmsError } = useFarms();
    const { allFarms, fetchAllFarms, clearError: clearAllFarmsError } = useFarmStore();

    const { users, userStats, loading: usersLoading, error: usersError, fetchUsers, fetchUserStats, clearError: clearUsersError } = useUserStore();

    // Memoize all callback functions to avoid unnecessary re-renders
    const memoFetchFarms = useCallback(() => fetchFarms(), [fetchFarms]);
    const memoFetchAllFarms = useCallback(() => fetchAllFarms(allFarmsPage, allFarmsLimit), [fetchAllFarms, allFarmsPage, allFarmsLimit]);
    const memoFetchUsers = useCallback(() => fetchUsers(usersPage, usersLimit), [fetchUsers, usersPage, usersLimit]);
    const memoFetchUserStats = useCallback(() => fetchUserStats(), [fetchUserStats]);
    const memoClearFarmsError = useCallback(() => clearFarmsError(), [clearFarmsError]);
    const memoClearAllFarmsError = useCallback(() => clearAllFarmsError(), [clearAllFarmsError]);
    const memoClearUsersError = useCallback(() => clearUsersError(), [clearUsersError]);
    const totalFarms = allFarms.length;
    const totalArea: number = allFarms.reduce((sum, farm) => {
        const area = farm.area || 0;
        return sum + area;
    }, 0);
    const activeCrops = new Set(allFarms.map(farm => farm.crop)).size;
    const myFarms = farms;
    useEffect(() => {
        if (user && user.id && isAuthenticated) {
            memoFetchFarms();
            memoFetchAllFarms();
            memoFetchUserStats();
            memoFetchUsers();
        }
    }, [user, isAuthenticated, memoFetchFarms, memoFetchAllFarms, memoFetchUserStats, memoFetchUsers]);

    // Separate effect for pagination changes to avoid infinite loops
    useEffect(() => {
        if (user && user.id && isAuthenticated) {
            memoFetchAllFarms();
        }
    }, [user, isAuthenticated, memoFetchAllFarms]);

    useEffect(() => {
        if (user && user.id && isAuthenticated) {
            memoFetchUsers();
        }
    }, [user, isAuthenticated, memoFetchUsers]);

    // Scroll All System Farms section into view when page changes
    const lastPageRef = useRef(allFarmsPage);
    useEffect(() => {
        if (allFarmsSectionRef.current) {
            if (allFarmsPage > lastPageRef.current) {
                // Next button: scroll to top
                allFarmsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (allFarmsPage < lastPageRef.current) {
                // Previous button: scroll to bottom
                allFarmsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            lastPageRef.current = allFarmsPage;
        }
    }, [allFarmsPage]);

    // Clear any errors when component unmounts
    useEffect(() => {
        return () => {
            memoClearFarmsError();
            memoClearAllFarmsError();
            memoClearUsersError();
        };
    }, [memoClearFarmsError, memoClearAllFarmsError, memoClearUsersError]);

    const handleLogout = () => {
        logout();
    };

    if (farmsLoading && usersLoading) {
        return (
            <div className="min-h-screen gradient-mesh flex items-center justify-center">
                <div className="card p-8 flex flex-col items-center space-y-6">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-primary-600 animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-medium text-neutral-900 mb-2">Loading Admin Dashboard</p>
                        <p className="text-sm text-neutral-600">Gathering system insights...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-mesh">
            {/* Enhanced Header */}
            <header className="glass border-b border-white/10 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4 animate-in">
                            <div className="bg-gradient-to-br from-accent-500 to-accent-700 p-2.5 rounded-xl shadow-glow-accent">
                                <Crown className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
                                    <div className="badge-accent">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Admin
                                    </div>
                                </div>
                                <p className="text-sm text-neutral-600">System Overview - Welcome, {user?.fullName}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 animate-in stagger-1">
                            <button className="btn-secondary">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn-ghost"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0 space-y-8">
                    {/* Error State */}
                    {(farmsError || usersError) && (
                        <div className="card-elevated bg-red-50 border-l-4 border-l-red-500 p-6 animate-in">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <Activity className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-800 mb-2">
                                        Error loading admin data
                                    </h3>
                                    <p className="text-sm text-red-700 mb-4">
                                        {farmsError || usersError}
                                    </p>
                                    <div className="flex space-x-3">
                                        {farmsError && (
                                            <button
                                                onClick={() => fetchFarms()}
                                                className="btn-sm bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
                                            >
                                                Retry Farms
                                            </button>
                                        )}
                                        {usersError && (
                                            <button
                                                onClick={() => {
                                                    fetchUserStats();
                                                    fetchUsers();
                                                }}
                                                className="btn-sm bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
                                            >
                                                Retry Users
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Enhanced System Stats Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="card-elevated group  transition-all duration-300 p-6 animate-in">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-600 mb-1">Total Users</p>
                                    <p className="text-3xl font-bold text-neutral-900">
                                        {userStats ? userStats.totalUsers.toLocaleString() : '...'}
                                    </p>
                                   
                                </div>
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:shadow-glow transition-all">
                                        <Users className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-elevated group  transition-all duration-300 p-6 animate-in stagger-1">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-600 mb-1">Admin Farms</p>
                                    <p className="text-3xl font-bold text-neutral-900">{totalFarms.toLocaleString()}</p>
                                    
                                </div>
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center group-hover:shadow-glow transition-all">
                                        <MapPin className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-elevated group  transition-all duration-300 p-6 animate-in stagger-2">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-600 mb-1">Total Area</p>
                                    <p className="text-3xl font-bold text-neutral-900">{formatHectares(totalArea)}<span className="text-lg text-neutral-600 ml-1">ha</span></p>
                                    
                                </div>
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center group-hover:shadow-glow-accent transition-all">
                                        <BarChart3 className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-elevated group  transition-all duration-300 p-6 animate-in stagger-3">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-600 mb-1">Crop Types</p>
                                    <p className="text-3xl font-bold text-neutral-900">{activeCrops}</p>
                                    
                                </div>
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-700 flex items-center justify-center group-hover:shadow-glow transition-all">
                                        <Sprout className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Enhanced Admin's Own Farms */}
                    <div className="animate-in stagger-1">
                        <div className="card-elevated">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                                            My Farms
                                        </h3>
                                        <p className="text-sm text-neutral-600">
                                            {myFarms.length} {myFarms.length === 1 ? 'farm' : 'farms'} under your management
                                        </p>
                                    </div>
                                    <Link
                                        to="/create-farm"
                                        className="btn-primary group"
                                    >
                                        <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                                        Create Farm
                                    </Link>
                                </div>
                                {myFarms.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myFarms.map((farm, index) => (
                                            <Card farm={farm} index={index} />
                                        ))}
                                        <AddFarmCard/>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl border border-dashed border-neutral-200">
                                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-neutral-200 mb-4">
                                            <MapPin className="h-8 w-8 text-neutral-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-neutral-900 mb-2">No personal farms yet</h3>
                                        <p className="text-sm text-neutral-600 mb-6 max-w-sm mx-auto">
                                            Start your agricultural journey by creating your first farm.
                                        </p>
                                        <Link
                                            to="/create-farm"
                                            className="btn-primary group"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Farm
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Users Management */}
                    <div className="mt-8" ref={usersSectionRef}>
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        User Management
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">
                                            {userStats && (
                                                <>
                                                    <span className="font-medium text-blue-600">{userStats.totalFarmers}</span> Farmers,
                                                    <span className="font-medium text-green-600">{userStats.totalAdmins}</span> Admins
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {usersLoading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                                    </div>
                                ) : users.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Name
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Email
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Role
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Contact
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {users.map((user) => (
                                                        <tr key={user._id}>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                        <span className="text-gray-500 font-medium">{user.fullName.charAt(0)}</span>
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                                                        <div className="text-sm text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                                    <span className="text-sm text-gray-900">{user.email}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                <div className="flex flex-col space-y-1">
                                                                    <div className="flex items-center">
                                                                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                                        <span>{user.phone}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <Home className="h-4 w-4 text-gray-400 mr-2" />
                                                                        <span className="truncate max-w-xs">{user.address}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        <div className="flex justify-center mt-4">
                                            <button
                                                className="px-4 py-2 mr-2 bg-gray-200 rounded disabled:opacity-50"
                                                disabled={usersPage === 1}
                                                onClick={() => setUsersPage(usersPage - 1)}
                                            >
                                                Previous
                                            </button>
                                            <span className="px-4 py-2">Page {usersPage}</span>
                                            <button
                                                className="px-4 py-2 ml-2 bg-gray-200 rounded disabled:opacity-50"
                                                disabled={users.length < usersLimit}
                                                onClick={() => setUsersPage(usersPage + 1)}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            There are no users in the system yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>



                    {/* All System Farms */}
                    <div className="mt-8" ref={allFarmsSectionRef}>
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        All System Farms ({allFarms.length} total)
                                    </h3>
                                </div>
                                {allFarms.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {allFarms.map((farm) => (
                                                <Card farm={farm} index={parseInt(farm.id)} />
                                            ))}
                                        </div>
                                        {/* Pagination Controls */}
                                        <div className="flex justify-center mt-4">
                                            <button
                                                className="px-4 py-2 mr-2 bg-gray-200 rounded disabled:opacity-50"
                                                disabled={allFarmsPage === 1}
                                                onClick={() => setAllFarmsPage(allFarmsPage - 1)}
                                            >
                                                Previous
                                            </button>
                                            <span className="px-4 py-2">Page {allFarmsPage}</span>
                                            <button
                                                className="px-4 py-2 ml-2 bg-gray-200 rounded disabled:opacity-50"
                                                disabled={allFarms.length < allFarmsLimit}
                                                onClick={() => setAllFarmsPage(allFarmsPage + 1)}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No farms in system yet</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No users have created farms yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}