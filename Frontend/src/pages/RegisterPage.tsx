import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'robot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    const result = await register(
      formData.email,
      formData.password,
      formData.name,
      formData.phone,
      formData.address
    );

    if (result.success) {
      toast.success({
        message: 'Registration successful! Welcome to CropLab!',
        robotVariant: '/wheat-base.png',
        autoClose: 3000,
      });
      navigate('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }

    setIsLoading(false);
  };

  return (
    <div className='min-h-screen gradient-mesh flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-lg w-full'>
        {/* Enhanced Header */}
        <div className='flex justify-start animate-in gap-4'>
          <div className='size-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-700 shadow-glow mb-6'>
            <UserPlus className='h-8 w-8 text-white' />
          </div>

          <div className='mb-3'>
            <h1 className='text-3xl font-bold text-neutral-900 mb-2'>
              Join CropLab
            </h1>
            <p className='text-neutral-600'>
              Create your account to start farming smarter
            </p>
          </div>
        </div>

        {/* Enhanced Form Card */}
        <div className='card-elevated p-8 animate-in stagger-1'>
          <form className='space-y-4' onSubmit={handleSubmit}>
            {/* Error display removed - now using toast notifications */}

            <div className='grid grid-cols-1 gap-2'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-neutral-700 mb-1'
                >
                  Full Name
                </label>
                <input
                  id='name'
                  name='name'
                  type='text'
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className='input-field'
                  placeholder='Enter your full name'
                />
              </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className='input-field'
                  placeholder='Enter your email'
                />
              </div>

              <div>
                <label
                  htmlFor='phone'
                  className='block text-sm font-medium text-neutral-700 mb-1'
                >
                  Phone Number
                </label>
                <input
                  id='phone'
                  name='phone'
                  type='tel'
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className='input-field'
                  placeholder='Enter your phone number'
                />
              </div>

              <div>
                <label
                  htmlFor='address'
                  className='block text-sm font-medium text-neutral-700 mb-1'
                >
                  Address
                </label>
                <textarea
                  id='address'
                  name='address'
                  required
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className='input-field resize-none'
                  placeholder='Enter your address'
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
                    autoComplete='new-password'
                    required
                    value={formData.password}
                    onChange={handleChange}
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

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-neutral-700 mb-1'
                >
                  Confirm Password
                </label>
                <div className='relative'>
                  <input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className='input-field pr-10'
                    placeholder='Confirm your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-neutral-50 rounded-r-xl transition-colors'
                  >
                    {showConfirmPassword ? (
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
                className='btn-secondary w-full group'
              >
                {isLoading ? (
                  <div className='flex items-center justify-center'>
                    <div className='relative'>
                      <div className='animate-spin rounded-full h-4 w-4 border-2 border-secondary-200 border-t-white mr-3'></div>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <Activity className='h-2 w-2 text-white animate-pulse' />
                      </div>
                    </div>
                    Creating account...
                  </div>
                ) : (
                  <>
                    <UserPlus className='h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200' />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Enhanced Footer */}
        <div className='text-center mt-6 animate-in stagger-2'>
          <p className='text-sm text-neutral-600'>
            Already have an account?{' '}
            <Link
              to='/login'
              className='font-medium text-secondary-600 hover:text-secondary-700 transition-colors'
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
