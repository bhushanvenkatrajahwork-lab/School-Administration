'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  GraduationCap, 
  Receipt, 
  BookOpen, 
  Shirt, 
  Lock, 
  User, 
  AlertCircle, 
  Loader2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const { login, token, user } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [typingActive, setTypingActive] = useState(false);
  const [activePreset, setActivePreset] = useState('');

  // Refs to clear active typing intervals if user interrupts or clicks another
  const typingTimerRef = useRef(null);
  const passwordTimerRef = useRef(null);

  useEffect(() => {
    if (token && user) {
      router.push('/dashboard');
    }
  }, [token, user, router]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (passwordTimerRef.current) clearInterval(passwordTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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

  const handleQuickLogin = (roleId) => {
    // Clear any active typing animation
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (passwordTimerRef.current) clearInterval(passwordTimerRef.current);

    setTypingActive(true);
    setActivePreset(roleId);
    setUsername('');
    setPassword('');
    setError('');

    const targetUser = roleId;
    const targetPass = 'password123';

    let userIdx = 0;
    let currentUser = '';

    // Animate Username Typing
    typingTimerRef.current = setInterval(() => {
      if (userIdx < targetUser.length) {
        currentUser += targetUser[userIdx];
        setUsername(currentUser);
        userIdx++;
      } else {
        clearInterval(typingTimerRef.current);

        // Animate Password Typing
        let passIdx = 0;
        let currentPass = '';
        passwordTimerRef.current = setInterval(() => {
          if (passIdx < targetPass.length) {
            currentPass += targetPass[passIdx];
            setPassword(currentPass);
            passIdx++;
          } else {
            clearInterval(passwordTimerRef.current);
            setTypingActive(false);

            // Auto-submit with a small delay so user notices completion
            setTimeout(() => {
              handleSubmit();
            }, 400);
          }
        }, 50);
      }
    }, 60);
  };

  return (
    <div className="min-h-screen bg-[#070B16] text-slate-100 flex flex-col lg:flex-row relative font-sans overflow-hidden">
      
      {/* Background radial effects */}
      <div className="absolute top-[-25%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 radial-grid-bg-dark opacity-[0.25] pointer-events-none" />

      {/* ========================================================
          LEFT COLUMN: Premium Branding, Workflow & Stats Panel
          ======================================================== */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-indigo-950/20 to-slate-950/40 border-r border-white/5 flex-col justify-between p-12 relative z-10 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            EduClearance
          </span>
          <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
            Enterprise v2.4
          </span>
        </div>

        {/* Center Contents: Headline & Interactive Visual Pipeline */}
        <div className="my-auto py-12 space-y-12">
          
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Automating school clearance. <br />
              <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Effortlessly.
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              An enterprise-grade administrative terminal coordinating tuition clearance, library book returns, and uniform inventory disbursements.
            </p>
          </div>

          {/* Interactive clearance workflow visualization */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest flex items-center">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 animate-pulse text-indigo-400" />
              Automated Flow Pipeline
            </p>
            
            <div className="space-y-3 max-w-sm">
              {[
                { title: 'Tuition Department', desc: 'Tuition Fee Verification & Ledger Balance', icon: Receipt, active: true },
                { title: 'Book Department', desc: 'Issued Book Inventory & Checklist Verification', icon: BookOpen, active: true },
                { title: 'Uniform Department', desc: 'Uniform Size Disbursement & Inventory Log', icon: Shirt, active: true },
                { title: 'Completed Clearance', desc: 'Auto-Compiled No-Dues Receipt Generation', icon: CheckCircle2, active: false }
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex items-start space-x-3 group">
                    <div className="flex flex-col items-center">
                      <div className={`p-1.5 rounded-lg border ${
                        idx === 3 
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                          : 'border-white/10 bg-white/5 text-indigo-300'
                      } shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < 3 && (
                        <div className="w-[1px] h-8 bg-gradient-to-b from-white/10 to-transparent mt-1" />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{step.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating statistics dashboard card */}
          <div className="glass-panel-dark rounded-2xl p-4 border border-white/5 bg-slate-950/40 shadow-xl max-w-xs flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/25 shrink-0">
              <Clock className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Avg Process Duration</p>
              <h4 className="text-xl font-extrabold text-white mt-0.5">4.8 Minutes</h4>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center mt-0.5">
                <TrendingUp className="h-3 w-3 mr-1" />
                -14% from last term
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Security / Footer */}
        <div className="space-y-4">
          <div className="flex items-center space-x-6 text-slate-500 text-[11px] font-medium">
            <span className="flex items-center">
              <ShieldCheck className="h-4 w-4 text-cyan-500/60 mr-1.5" /> 
              AES-256 Secured
            </span>
            <span>•</span>
            <span>SSL TLS 1.3 Encryption</span>
          </div>
          <p className="text-[10px] text-slate-600">
            © 2026 EduClearance Systems Inc. All rights reserved.
          </p>
        </div>

      </div>

      {/* ========================================================
          RIGHT COLUMN: Dynamic Auth Form & Workspace Selector
          ======================================================== */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-24 relative z-10">
        
        {/* Mobile branding header (visible only on mobile/tablet) */}
        <div className="lg:hidden flex flex-col items-center text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center p-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 mb-1">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            EduClearance
          </h2>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
            Enterprise Workspace
          </p>
        </div>

        {/* Login Card Panel */}
        <div className="w-full max-w-[420px] space-y-6">
          
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Sign in to workspace
            </h2>
            <p className="text-xs text-slate-400">
              Enter your administrative credentials to authorize terminal access.
            </p>
          </div>

          <div className="glass-panel-dark rounded-3xl shadow-2xl shadow-black/80 border border-white/5 overflow-hidden transition-all duration-300">
            <div className="p-7 sm:p-9 space-y-6">
              
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-xl bg-rose-500/10 p-3 border border-rose-500/25 flex items-start space-x-2 text-rose-300 text-xs animate-shake">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Username
                  </label>
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      readOnly={typingActive}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 hover:border-white/15 focus:border-indigo-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs transition-all ${
                        typingActive ? 'cursor-not-allowed opacity-80' : ''
                      }`}
                      placeholder="e.g. admin"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      readOnly={typingActive}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 hover:border-white/15 focus:border-indigo-500 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs transition-all ${
                        typingActive ? 'cursor-not-allowed opacity-80' : ''
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      disabled={typingActive}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  id="submit-btn"
                  type="submit"
                  disabled={submitting || typingActive}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-indigo-950 disabled:to-indigo-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#070B16] transition-all duration-200 shadow-lg shadow-indigo-600/10 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed"
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
              </form>

              {/* Quick Preset Credentials */}
              <div className="pt-5 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Quick-Access presets
                  </span>
                  {typingActive && (
                    <span className="text-[9px] text-indigo-400 font-medium animate-pulse flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Autofilling...
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'admin', label: 'Super Admin', icon: ShieldCheck, color: 'text-emerald-400', bg: 'hover:bg-emerald-500/5 hover:border-emerald-500/20 active:border-emerald-500/50' },
                    { id: 'tuition', label: 'Tuition Dept', icon: Receipt, color: 'text-indigo-400', bg: 'hover:bg-indigo-500/5 hover:border-indigo-500/20 active:border-indigo-500/50' },
                    { id: 'books', label: 'Book Dept', icon: BookOpen, color: 'text-amber-500', bg: 'hover:bg-amber-500/5 hover:border-amber-500/20 active:border-amber-500/50' },
                    { id: 'uniforms', label: 'Uniform Dept', icon: Shirt, color: 'text-rose-500', bg: 'hover:bg-rose-500/5 hover:border-rose-500/20 active:border-rose-500/50' }
                  ].map(p => {
                    const Icon = p.icon;
                    const isActive = activePreset === p.id && typingActive;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={submitting || typingActive}
                        onClick={() => handleQuickLogin(p.id)}
                        className={`flex items-center space-x-2 p-2.5 border rounded-xl text-left transition-all duration-200 ${
                          isActive 
                            ? 'border-indigo-500 bg-indigo-500/10 scale-[0.98]' 
                            : 'border-white/5 bg-white/[0.01] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed'
                        } ${p.bg} group`}
                      >
                        <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-500/20' : 'bg-white/5'} shrink-0`}>
                          <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${p.color}`} />
                        </div>
                        <div className="truncate min-w-0">
                          <p className="text-[10px] font-semibold text-slate-200 group-hover:text-white transition-colors">{p.label}</p>
                          <p className="text-[8px] text-slate-500 font-mono mt-0.5">ID: {p.id}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
