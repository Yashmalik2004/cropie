import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, BarChart3, Map, Bell, ArrowRight, Check, Zap, Shield, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 animate-in">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2.5 rounded-xl shadow-glow">
                <Sprout className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">CropLab</span>
            </div>
            <div className="flex items-center space-x-3 animate-in stagger-1">
              <button
                onClick={handleSignIn}
                className="btn-ghost"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="btn-primary group"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="animate-in">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-8">
              <Zap className="h-4 w-4 mr-2" />
              Powered by AI & Satellite Imagery
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 mb-6 animate-in stagger-1 text-balance">
            Smart Agriculture
            <span className="text-gradient block">Management Platform</span>
          </h1>
          
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8 animate-in stagger-2 text-balance">
            Monitor your farms, track crop health, and optimize yields with our comprehensive agriculture platform powered by cutting-edge technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in stagger-3">
            <button
              onClick={handleGetStarted}
              className="btn-primary btn-lg group shadow-glow"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleSignIn}
              className="btn-secondary btn-lg"
            >
              Sign In
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 animate-in stagger-4">
            <p className="text-sm text-neutral-500 mb-8">Trusted by 10,000+ farmers worldwide</p>
            <div className="flex items-center justify-center space-x-8 opacity-60">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium">Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium">Growth-Focused</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium">Award-Winning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="mt-32">
          <div className="text-center mb-16 animate-in">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Everything you need to manage your farm
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Comprehensive tools designed for modern agriculture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card-elevated group  transition-all duration-300 p-8 animate-in">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white mx-auto mb-6 group-hover:shadow-glow transition-all">
                <Map className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 text-center">Interactive Mapping</h3>
              <p className="text-neutral-600 text-center mb-4">
                Draw and manage farm boundaries with precision using satellite imagery and GPS technology.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-primary-600 mr-2 flex-shrink-0" />
                  Satellite imagery integration
                </li>
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-primary-600 mr-2 flex-shrink-0" />
                  GPS boundary tracking
                </li>
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-primary-600 mr-2 flex-shrink-0" />
                  Area calculations
                </li>
              </ul>
            </div>

            <div className="card-elevated group  transition-all duration-300 p-8 animate-in stagger-1">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 text-white mx-auto mb-6 group-hover:shadow-glow-accent transition-all">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 text-center">Health Analytics</h3>
              <p className="text-neutral-600 text-center mb-4">
                Monitor crop health with advanced analytics and AI-powered insights.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-accent-600 mr-2 flex-shrink-0" />
                  NDVI health analysis
                </li>
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-accent-600 mr-2 flex-shrink-0" />
                  Disease detection
                </li>
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-accent-600 mr-2 flex-shrink-0" />
                  Yield predictions
                </li>
              </ul>
            </div>

            <div className="card-elevated group  transition-all duration-300 p-8 animate-in stagger-2">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-700 text-white mx-auto mb-6 group-hover:shadow-glow transition-all">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 text-center">Smart Notifications</h3>
              <p className="text-neutral-600 text-center mb-4">
                Stay ahead with intelligent alerts and recommendations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-secondary-700 mr-2 flex-shrink-0" />
                  Weather alerts
                </li>
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-secondary-700 mr-2 flex-shrink-0" />
                  Irrigation reminders
                </li>
                <li className="flex items-center text-sm text-neutral-600">
                  <Check className="h-4 w-4 text-secondary-700 mr-2 flex-shrink-0" />
                  Pest warnings
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 animate-in">
          <div className="card-elevated p-12 text-center">
            <h3 className="text-2xl font-bold text-neutral-900 mb-8">
              Trusted by farmers worldwide
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">10K+</div>
                <div className="text-sm text-neutral-600">Active Farms</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">250K</div>
                <div className="text-sm text-neutral-600">Hectares Managed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">98%</div>
                <div className="text-sm text-neutral-600">Satisfaction Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">45%</div>
                <div className="text-sm text-neutral-600">Avg Yield Increase</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}