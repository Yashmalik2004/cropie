import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sprout, Shield, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'robot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success({
        message: 'Login successful!',
        robotVariant: '/wheat-base.png',
        autoClose: 3000,
      });
      // Wait a moment to ensure auth state is fully updated
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <div className='min-h-screen gradient-mesh flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-lg w-full'>
        {/* Enhanced Header */}
        <div className='text-center mb-8 animate-in'>
          <div className='mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow mb-6'>
            <Sprout className='h-8 w-8 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-neutral-900 mb-2'>
            Welcome Back
          </h1>
          <p className='text-neutral-600'>Sign in to your CropLab account</p>
        </div>

        {/* Enhanced Form Card */}
        <div className='card-elevated p-8 animate-in stagger-1'>
          <form className='space-y-4' onSubmit={handleSubmit}>
            {/* Error display removed - now using toast notifications */}

            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-neutral-700 mb-1'
                >
                  Email address
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='input-field'
                  placeholder='Enter your email'
                />
              </div>

              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-neutral-700 mb-1'
                >
                  Password
                </label>
                <div className='relative'>
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='current-password'
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='input-field pr-10'
                    placeholder='Enter your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-neutral-50 rounded-r-xl transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-neutral-400 hover:text-neutral-600' />
                    ) : (
                      <Eye className='h-4 w-4 text-neutral-400 hover:text-neutral-600' />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className='pt-2'>
              <button
                type='submit'
                disabled={isLoading}
                className='btn-primary w-full group'
              >
                {isLoading ? (
                  <div className='flex items-center justify-center'>
                    <div className='relative'>
                      <div className='animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-white mr-3'></div>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <Activity className='h-2 w-2 text-white animate-pulse' />
                      </div>
                    </div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <Shield className='h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200' />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Enhanced Footer */}
        <div className='text-center mt-6 animate-in stagger-2'>
          <p className='text-sm text-neutral-600'>
            Don't have an account?{' '}
            <Link
              to='/register'
              className='font-medium text-primary-600 hover:text-primary-700 transition-colors'
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
