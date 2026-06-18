'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import AdminDashboard from '../../components/AdminDashboard';
import TuitionDashboard from '../../components/TuitionDashboard';
import BookDashboard from '../../components/BookDashboard';
import UniformDashboard from '../../components/UniformDashboard';
import TransportationDashboard from '../../components/TransportationDashboard';
import LunchDashboard from '../../components/LunchDashboard';
import StudentHistory from '../../components/StudentHistory';
import StudentHistoryRegistry from '../../components/StudentHistoryRegistry';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('');
  const [viewStudentHistoryId, setViewStudentHistoryId] = useState(null);

  // Guard routing
  useEffect(() => {
    if (!loading && (!token || !user)) {
      router.push('/');
    }
  }, [loading, token, user, router]);

  // Set default tabs based on role when user session loads
  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        setActiveTab('overview');
      } else if (user.role === 'TUITION_DEPT') {
        setActiveTab('tuition-overview');
      } else if (user.role === 'BOOK_DEPT') {
        setActiveTab('book-overview');
      } else if (user.role === 'UNIFORM_DEPT') {
        setActiveTab('uniform-overview');
      }
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm text-slate-400 font-medium">Verifying secure session...</p>
      </div>
    );
  }

  // Render content depending on active role & tab, or show student history timeline if active
  const renderDashboardContent = () => {
    if (viewStudentHistoryId) {
      return (
        <StudentHistory 
          studentId={viewStudentHistoryId} 
          onBack={() => setViewStudentHistoryId(null)} 
        />
      );
    }

    if (activeTab === 'history') {
      return (
        <StudentHistoryRegistry 
          onOpenStudentHistory={(id) => setViewStudentHistoryId(id)} 
        />
      );
    }

    const role = user.role;
    if (role === 'SUPER_ADMIN') {
      if (activeTab === 'transport-overview') {
        return <TransportationDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      }
      if (activeTab === 'lunch-overview') {
        return <LunchDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      }
      return (
        <AdminDashboard 
          activeTab={activeTab} 
          onOpenStudentHistory={(id) => setViewStudentHistoryId(id)} 
        />
      );
    } else if (role === 'TUITION_DEPT') {
      return <TuitionDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
    } else if (role === 'BOOK_DEPT') {
      return <BookDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
    } else if (role === 'UNIFORM_DEPT') {
      if (activeTab === 'transport-overview') {
        return <TransportationDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      }
      if (activeTab === 'lunch-overview') {
        return <LunchDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      }
      return <UniformDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
    }

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
        <p className="text-xs text-slate-500 font-semibold">Unknown staff access tier or role error</p>
      </div>
    );
  };

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setViewStudentHistoryId(null); // Clear student history overlays if navigating tabs
        setActiveTab(tab);
      }}
      onOpenStudentHistory={(id) => setViewStudentHistoryId(id)}
    >
      {renderDashboardContent()}
    </AppShell>
  );
}
