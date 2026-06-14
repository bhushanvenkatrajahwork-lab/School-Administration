'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  School, 
  LogOut, 
  Search, 
  Bell, 
  ChevronDown, 
  Menu, 
  X, 
  History, 
  FileSpreadsheet, 
  ShieldAlert, 
  UserCheck,
  Receipt,
  BookOpen,
  Shirt,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function AppShell({ children, activeTab, setActiveTab, onOpenStudentHistory }) {
  const { user, logout, notifications, markNotificationRead, fetchNotifications } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hotkey focus for Search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Instant Autocomplete search
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await api.get(`/students/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      }
    };

    const delayDebounceFn = setTimeout(handleSearch, 150);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const selectSearchResult = (studentId) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchFocused(false);
    onOpenStudentHistory(studentId);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.readBy || !n.readBy.includes(user?.id)).length;
  };

  const getMenuItems = () => {
    const role = user?.role;
    if (role === 'SUPER_ADMIN') {
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Student Directory', icon: Users },
        { id: 'configs', label: 'School & Catalog', icon: School },
        { id: 'history', label: 'Student Histories', icon: History },
        { id: 'reports', label: 'Analytics Reports', icon: FileSpreadsheet },
        { id: 'users', label: 'Staff Directory', icon: UserCheck },
        { id: 'audit', label: 'Security Audit Logs', icon: ShieldAlert },
      ];
    } else if (role === 'TUITION_DEPT') {
      return [
        { id: 'tuition-overview', label: 'Fee Dashboard', icon: LayoutDashboard },
        { id: 'tuition-collect', label: 'Tuition Payment', icon: Receipt },
      ];
    } else if (role === 'BOOK_DEPT') {
      return [
        { id: 'book-overview', label: 'Library Dashboard', icon: LayoutDashboard },
        { id: 'book-queue', label: 'Clearance Queue', icon: BookOpen },
      ];
    } else if (role === 'UNIFORM_DEPT') {
      return [
        { id: 'uniform-overview', label: 'Uniform Dashboard', icon: LayoutDashboard },
        { id: 'uniform-queue', label: 'Clearance Queue', icon: Shirt },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  const handleMenuClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'Super Administrator';
      case 'TUITION_DEPT': return 'Tuition Fee Dept';
      case 'BOOK_DEPT': return 'Book Department';
      case 'UNIFORM_DEPT': return 'Uniform Department';
      default: return 'Authorized Staff';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'TUITION_DEPT': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'BOOK_DEPT': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'UNIFORM_DEPT': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* ========================================== */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================== */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#070B14] text-white border-r border-slate-800/40 z-30">
        <div className="flex items-center space-x-3 px-6 py-5 border-b border-slate-800/40 bg-[#04060C]">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl shadow-glow-indigo">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">EduClearance</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Enterprise Portal</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto px-3.5 py-6 sidebar-scroll">
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full group flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold relative transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-white/[0.04] text-white shadow-sm border-l-2 border-indigo-500 pl-3.5' 
                      : 'text-slate-400 hover:bg-white/[0.02] hover:text-slate-100 pl-4 border-l-2 border-transparent'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-800/40">
            <div className="flex items-center space-x-3 px-3 py-2 bg-white/[0.01] rounded-2xl mb-4 border border-slate-800/25">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0 shadow-inner">
                {user?.name?.slice(0, 2)}
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-200">{user?.name}</p>
                <span className={`inline-block text-[8px] font-bold border px-1.5 py-0.5 rounded-full mt-0.5 tracking-wide uppercase ${getRoleBadgeColor(user?.role)}`}>
                  {getRoleDisplayName(user?.role).split(' ')[0]}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5 text-rose-500" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MOBILE DRAWER SIDEBAR */}
      {/* ========================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 flex z-50 md:hidden bg-slate-950/65 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#070B14] text-white border-r border-slate-800/50">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 px-6 py-5 border-b border-slate-800/40 bg-[#04060C]">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wider uppercase">EduClearance</h1>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Enterprise Portal</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-y-auto px-4 py-6">
              <nav className="space-y-1">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive 
                          ? 'bg-white/[0.04] text-white border-l-2 border-indigo-500' 
                          : 'text-slate-400 hover:bg-white/[0.02] hover:text-white'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-800/45">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/5 transition-colors"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN CONTAINER */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* ========================================== */}
        {/* TOP NAVBAR */}
        {/* ========================================== */}
        <header className="sticky top-0 z-20 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 sm:px-6 md:px-8 items-center justify-between">
          <div className="flex items-center flex-1">
            <button
              type="button"
              className="px-2 text-slate-500 focus:outline-none md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Student Search with Keyboard Shortcut tag */}
            <div className="relative flex-1 max-w-md ml-2 md:ml-0" ref={searchRef}>
              <div className="relative rounded-xl shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Global Autocomplete Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="block w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-xs transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <kbd className="hidden sm:inline-flex items-center border border-slate-200 rounded px-1.5 text-[8px] font-bold text-slate-400 bg-white">
                    Ctrl K
                  </kbd>
                </div>
              </div>

              {searchFocused && (searchQuery.trim().length >= 2 || searchResults.length > 0) && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-40 max-h-72 overflow-y-auto animate-slide-up">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-slate-400 text-xs text-center font-medium">No students found matching query</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {searchResults.map(s => (
                        <button
                          key={s._id}
                          onClick={() => selectSearchResult(s._id)}
                          className="w-full px-4.5 py-3 text-left hover:bg-slate-50/70 flex items-center justify-between text-xs transition-colors cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{s.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              ID: {s.studentId} | Roll: {s.rollNumber} | Class: {s.class}-{s.section}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border ${
                            s.clearanceStatus === 'COMPLETED'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : s.clearanceStatus.includes('PENDING')
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          }`}>
                            {s.clearanceStatus.replace('_', ' ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ml-4 flex items-center space-x-3 sm:space-x-4">
            
            <div className="hidden lg:flex items-center space-x-2 text-[11px] font-semibold text-slate-500 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200/30">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Year: 2026-2027</span>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer border border-slate-200/20"
              >
                <Bell className="h-4.5 w-4.5" />
                {getUnreadNotifications() > 0 && (
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2.5 w-80 rounded-2xl shadow-2xl bg-white border border-slate-200/50 overflow-hidden z-40 animate-slide-up">
                  <div className="px-4.5 py-3 bg-slate-50/70 border-b border-slate-150 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Department Alerts</span>
                    <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {getUnreadNotifications()} New
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-450 text-xs flex flex-col items-center">
                        <AlertCircle className="h-7 w-7 mb-2 text-slate-300" />
                        No alerts at this time
                      </div>
                    ) : (
                      notifications.map(n => {
                        const isRead = n.readBy && n.readBy.includes(user?.id);
                        return (
                          <div 
                            key={n._id} 
                            onClick={() => !isRead && markNotificationRead(n._id)}
                            className={`p-3.5 text-xs cursor-pointer transition-colors ${
                              isRead ? 'bg-white text-slate-400' : 'bg-indigo-50/10 text-slate-900 font-semibold'
                            }`}
                          >
                            <p className="font-bold text-slate-800">{n.title}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5 font-medium leading-relaxed">{n.message}</p>
                            <p className="text-[8px] text-slate-400 mt-1 font-bold">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2.5 p-1 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-200/50"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-white uppercase text-xs shadow-inner">
                  {user?.name?.slice(0, 2)}
                </div>
                <span className="hidden sm:block text-xs font-bold text-slate-700 leading-tight">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2.5 w-48 rounded-2xl shadow-2xl bg-white border border-slate-200/50 z-40 divide-y divide-slate-100 animate-slide-up">
                  <div className="px-4.5 py-3">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 font-semibold">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 transition-colors font-bold cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Sign Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ========================================== */}
        {/* VIEW AREA */}
        {/* ========================================== */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 radial-grid-bg">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
