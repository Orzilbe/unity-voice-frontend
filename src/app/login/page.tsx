// apps/web/src/app/login/page.tsx

'use client';

import { useState, ChangeEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

import Header from '../components/Header';
import InputField from '../components/InputField';
import FormContainer from '../components/FormContainer';

function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  // קריאת פרמטר ה-redirect מה-URL
  const redirectParam = searchParams.get('redirect');
  const redirectTo = redirectParam ? decodeURIComponent(redirectParam) : '/topics';

  console.log('Login page - redirect parameter:', redirectParam);
  console.log('Login page - decoded redirect to:', redirectTo);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User already authenticated, redirecting to:', redirectTo);
      // נסה גם router.push וגם window.location
      router.push(redirectTo);
      setTimeout(() => {
        console.log('Forcing redirect with window.location to:', redirectTo);
        window.location.href = redirectTo;
      }, 500);
    }
  }, [isAuthenticated, router, redirectTo]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting login...');
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        console.log('Login successful, redirecting to:', redirectTo);
        // נסה גם router.push וגם window.location
        router.push(redirectTo);
        setTimeout(() => {
          console.log('Forcing redirect after login to:', redirectTo);
          window.location.href = redirectTo;
        }, 500);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 font-sans">
        <div className="text-teal-600 text-xl animate-pulse">טוען...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 font-sans">
      <div className="absolute top-0 left-0 w-full h-32 bg-teal-500 rounded-b-[40%]" />
      <div className="relative z-10 w-full max-w-6xl px-6 py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* Left side content (desktop) */}
        <div className="hidden lg:block lg:w-1/2 lg:pr-12">
          <Header title="Welcome Back" />
          <div className="mt-6 text-gray-600">
            <h2 className="text-2xl font-bold text-teal-700 mb-4">Continue Your English Journey</h2>
            <p className="mb-3">Log in to access your personalized advocacy English learning materials.</p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <svg className="h-6 w-6 text-teal-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Access your custom learning path
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-teal-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Track your progress and achievements
              </li>
              <li className="flex items-center">
                <svg className="h-6 w-6 text-teal-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Connect with mentors and fellow learners
              </li>
            </ul>
          </div>
        </div>

        {/* Right side form */}
        <div className="w-full lg:w-1/2">
          <div className="block lg:hidden text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <div className="mt-2 w-16 h-1 bg-teal-500 mx-auto rounded-full" />
          </div>
          <FormContainer>
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                showToggle
                onToggle={() => setShowPassword(v => !v)}
              />

              {/* Remember me & forgot link */}
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">Remember me</span>
                </label>
                <a href="/signup" className="text-sm font-medium text-teal-600 hover:text-teal-500">
                  Sign up
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-teal-600 text-white font-medium rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200 transform hover:scale-105"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </FormContainer>
        </div>
      </div>
    </div>
  );
}

// הקומפוננטה הראשית עם Suspense
export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 font-sans">
        <div className="text-teal-600 text-xl animate-pulse">טוען...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}