'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, GraduationCap, Receipt, BookOpen, Shirt, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, token, user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (token && user) {
      router.push('/dashboard');
    }
  }, [token, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (roleUser) => {
    setUsername(roleUser);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0B192C] via-[#1E3E62] to-[#000000] min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4 animate-bounce">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          EduClearance
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          School Administration &amp; Sequential Fee Clearance System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start space-x-2 text-red-800 text-sm">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Quick-Demo Switcher Panel */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-4">
              Quick-Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left text-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-slate-800">Super Admin</p>
                  <p className="text-[10px] text-slate-500">admin</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('tuition')}
                className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left text-xs transition-colors cursor-pointer"
              >
                <Receipt className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-slate-800">Tuition Dept</p>
                  <p className="text-[10px] text-slate-500">tuition</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('books')}
                className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left text-xs transition-colors cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-slate-800">Book Dept</p>
                  <p className="text-[10px] text-slate-500">books</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('uniforms')}
                className="flex items-center space-x-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left text-xs transition-colors cursor-pointer"
              >
                <Shirt className="h-4 w-4 text-rose-600 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-slate-800">Uniform Dept</p>
                  <p className="text-[10px] text-slate-500">uniforms</p>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3">
              Password is <span className="font-mono font-medium">password123</span> for all accounts.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
