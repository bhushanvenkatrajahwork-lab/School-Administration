'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, GraduationCap, Receipt, BookOpen, Shirt, Lock, User, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const { login, token, user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <div className="relative min-h-screen flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#090D1A] overflow-hidden">
      
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />
      
      {/* Radial Grid Overlay */}
      <div className="absolute inset-0 radial-grid-bg-dark opacity-35 pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8 z-10">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-indigo-600/30 shadow-glow-indigo mb-2 transition-transform duration-500 hover:scale-105">
            <GraduationCap className="h-9 w-9 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            EduClearance
          </h2>
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">
            Enterprise School Clearance Flow
          </p>
        </div>

        {/* Auth Glassmorphism Card */}
        <div className="glass-panel-dark rounded-3xl shadow-2xl shadow-black/50 border border-white/5 overflow-hidden transition-all duration-300">
          <div className="p-8 sm:p-10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl bg-rose-500/10 p-3.5 border border-rose-500/20 flex items-start space-x-2 text-rose-300 text-xs animate-shake">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative rounded-xl shadow-inner">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs transition-all"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-inner">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#090D1A] transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      <span>Authenticate Access</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo preset credentials */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
                Staff Quick-Access Presets
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'admin', label: 'Super Admin', icon: ShieldCheck, color: 'text-emerald-500', bg: 'hover:bg-emerald-500/5 hover:border-emerald-500/30' },
                  { id: 'tuition', label: 'Tuition Dept', icon: Receipt, color: 'text-indigo-400', bg: 'hover:bg-indigo-500/5 hover:border-indigo-500/30' },
                  { id: 'books', label: 'Book Dept', icon: BookOpen, color: 'text-amber-500', bg: 'hover:bg-amber-500/5 hover:border-amber-500/30' },
                  { id: 'uniforms', label: 'Uniform Dept', icon: Shirt, color: 'text-rose-500', bg: 'hover:bg-rose-500/5 hover:border-rose-500/30' }
                ].map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickLogin(p.id)}
                      className={`flex items-center space-x-2.5 p-2.5 border border-white/5 bg-white/[0.02] rounded-xl text-left text-[11px] transition-all duration-200 cursor-pointer ${p.bg} group`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${p.color}`} />
                      <div className="truncate">
                        <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">{p.label}</p>
                        <p className="text-[9px] text-slate-500">Preset ID: {p.id}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-500 text-center mt-4 tracking-wide font-medium">
                Password is <span className="font-mono text-indigo-400">password123</span> for all accounts.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
