'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  School, 
  Settings, 
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

  // Poll for notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdowns
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

  // Instant Search function
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

    const delayDebounceFn = setTimeout(handleSearch, 200);
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

  // Define sidebar menu options based on role
  const getMenuItems = () => {
    const role = user?.role;
    if (role === 'SUPER_ADMIN') {
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Students Directory', icon: Users },
        { id: 'classes', label: 'Classes & Structures', icon: School },
        { id: 'history', label: 'Student Clearance History', icon: History },
        { id: 'reports', label: 'Analytics & Reports', icon: FileSpreadsheet },
        { id: 'users', label: 'Users & Staff', icon: UserCheck },
        { id: 'audit', label: 'System Audit Logs', icon: ShieldAlert },
      ];
    } else if (role === 'TUITION_DEPT') {
      return [
        { id: 'tuition-overview', label: 'Tuition Dashboard', icon: LayoutDashboard },
        { id: 'tuition-collect', label: 'Tuition Fee Payment', icon: Receipt },
      ];
    } else if (role === 'BOOK_DEPT') {
      return [
        { id: 'book-overview', label: 'Book Dashboard', icon: LayoutDashboard },
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
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'TUITION_DEPT': return 'Tuition Fee Dept';
      case 'BOOK_DEPT': return 'Book Department';
      case 'UNIFORM_DEPT': return 'Uniform Department';
      default: return 'Staff';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'TUITION_DEPT': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'BOOK_DEPT': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'UNIFORM_DEPT': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ========================================== */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================== */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#0B192C] text-white border-r border-[#1E3E62] z-30">
        <div className="flex items-center space-x-3 px-6 py-5 border-b border-[#1E3E62] bg-[#07101C]">
          <div className="p-1.5 bg-indigo-600 rounded-lg shrink-0">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-wider">EduClearance</h1>
            <p className="text-[10px] text-slate-400 font-medium">Clearance SaaS v1.0</p>
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' 
                      : 'text-slate-300 hover:bg-[#1E3E62]/40 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#1E3E62]">
            <div className="flex items-center space-x-3 px-3 py-2 bg-[#1E3E62]/20 rounded-xl mb-4 border border-[#1E3E62]/30">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white uppercase shadow-sm">
                {user?.name?.slice(0, 2)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <span className={`inline-block text-[9px] font-semibold border px-1.5 py-0.5 rounded-full mt-0.5 ${getRoleBadgeColor(user?.role)}`}>
                  {getRoleDisplayName(user?.role)}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MOBILE DRAWER SIDEBAR */}
      {/* ========================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 flex z-50 md:hidden bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0B192C] text-white border-r border-[#1E3E62] animate-slide-in">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 px-6 py-5 border-b border-[#1E3E62] bg-[#07101C]">
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">EduClearance</h1>
                <p className="text-[10px] text-slate-400">Clearance SaaS v1.0</p>
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
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-slate-300 hover:bg-[#1E3E62]/40 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-[#1E3E62]">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN LAYOUT WRAPPER */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* ========================================== */}
        {/* TOP NAVIGATION BAR */}
        {/* ========================================== */}
        <header className="sticky top-0 z-20 flex-shrink-0 flex h-16 bg-white border-b border-slate-200/80 shadow-sm shadow-slate-100 px-4 sm:px-6 md:px-8 items-center justify-between">
          <div className="flex items-center flex-1">
            <button
              type="button"
              className="px-2 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Global Student Search Autocomplete */}
            <div className="relative flex-1 max-w-lg ml-2 md:ml-0" ref={searchRef}>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search students globally (Name, Roll, Admission No, Mobile)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="block w-full pl-9 pr-3 py-1.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs transition-all"
                />
              </div>

              {searchFocused && (searchQuery.trim().length >= 2 || searchResults.length > 0) && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-40 max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-slate-500 text-xs text-center">No students found matching query</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {searchResults.map(s => (
                        <button
                          key={s._id}
                          onClick={() => selectSearchResult(s._id)}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{s.name}</p>
                            <p className="text-[10px] text-slate-500">
                              ID: {s.studentId} | Roll: {s.rollNumber} | Class: {s.class}-{s.section}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase border ${
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

          {/* Right Header Icons */}
          <div className="ml-4 flex items-center space-x-3 sm:space-x-4">
            
            {/* System Academic Date Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-500 px-3 py-1 bg-slate-100 rounded-full border border-slate-200/50">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Academic Year: 2026-2027</span>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
                {getUnreadNotifications() > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-indigo-600 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-40 border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Department Alerts</span>
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {getUnreadNotifications()} New
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs flex flex-col items-center">
                        <AlertCircle className="h-8 w-8 mb-2 text-slate-300" />
                        No alerts at this time
                      </div>
                    ) : (
                      notifications.map(n => {
                        const isRead = n.readBy && n.readBy.includes(user?.id);
                        return (
                          <div 
                            key={n._id} 
                            onClick={() => !isRead && markNotificationRead(n._id)}
                            className={`p-3 text-xs cursor-pointer transition-colors ${
                              isRead ? 'bg-white text-slate-500' : 'bg-indigo-50/20 text-slate-900 font-semibold'
                            }`}
                          >
                            <p className="font-semibold text-slate-800">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                            <p className="text-[9px] text-slate-400 mt-1">
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
                className="flex items-center space-x-2 p-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white uppercase shadow-sm">
                  {user?.name?.slice(0, 2)}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-700 leading-tight">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>

              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-2xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-40 border border-slate-100 divide-y divide-slate-100">
                  <div className="px-4 py-2.5">
                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Log Out</span>
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
