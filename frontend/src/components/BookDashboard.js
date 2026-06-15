'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, CheckCircle, Clock, Check, X, AlertCircle, Loader2, User, Mail, Shield, ArrowRight, Search } from 'lucide-react';

export default function BookDashboard({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const isSubmittingRef = useRef(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Interactive metrics modal states
  const [selectedMetric, setSelectedMetric] = useState(null); // 'pending' | 'approved' | 'completed'
  const [metricDetailData, setMetricDetailData] = useState([]);
  const [metricDetailLoading, setMetricDetailLoading] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState('');

  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Reject dialog state
  const [rejectId, setRejectId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Distribution form modal state
  const [activeRequest, setActiveRequest] = useState(null);
  const [classBooks, setClassBooks] = useState([]);
  const [bookFeeAmount, setBookFeeAmount] = useState(0);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchQueue();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/fees/books/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchQueue = async () => {
    setQueueLoading(true);
    try {
      const data = await api.get('/fees/books/queue');
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleMetricCardClick = async (type) => {
    setSelectedMetric(type);
    setMetricDetailLoading(true);
    setMetricDetailData([]);
    setMetricSearchQuery('');
    try {
      let data = [];
      if (type === 'pending') {
        data = await api.get('/fees/books/queue');
      } else if (type === 'approved') {
        const res = await api.get('/fees/books/requests');
        data = res.filter(r => r.status === 'APPROVED');
      } else if (type === 'completed') {
        const res = await api.get('/reports/books');
        data = res.filter(r => r.status === 'Paid' || ['BOOKS_CLEARED', 'UNIFORM_PENDING', 'UNIFORM_CLEARED', 'COMPLETED'].includes(r.student?.clearanceStatus));
      }
      setMetricDetailData(data);
    } catch (err) {
      console.error('Error fetching book metrics:', err);
    } finally {
      setSelectedMetric(type);
      setMetricDetailLoading(false);
    }
  };

  const getFilteredMetricData = () => {
    if (!metricSearchQuery.trim()) return metricDetailData;
    const q = metricSearchQuery.toLowerCase();
    return metricDetailData.filter(item => {
      const student = item.student || item;
      return (
        student.name?.toLowerCase().includes(q) ||
        student.studentId?.toLowerCase().includes(q) ||
        student.class?.toLowerCase().includes(q) ||
        (item.receiptNumber && item.receiptNumber.toLowerCase().includes(q))
      );
    });
  };

  // Reject action
  const handleRejectClick = (requestId) => {
    setRejectId(requestId);
    setRejectRemarks('');
  };

  const submitReject = async () => {
    if (!rejectId) return;
    setRejectSubmitting(true);
    try {
      await api.post('/fees/books/action', {
        requestId: rejectId,
        action: 'REJECT',
        remarks: rejectRemarks
      });
      setRejectId(null);
      fetchStats();
      fetchQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Accept action: opens distribution form
  const handleAcceptClick = async (request) => {
    setActiveRequest(request);
    setFormError('');
    setSelectedBooks([]);
    setAmountPaid('');
    
    // Fetch books configuration for student's schoolType and class
    try {
      const config = await api.get(`/fees/books/config/${request.student.schoolType}/${request.student.class}`);
      setClassBooks(config.books || []);
      setBookFeeAmount(config.feeAmount || 3500);
      
      // Auto select all books as default configuration
      setSelectedBooks(config.books || []);
    } catch (err) {
      console.error(err);
      setFormError('Failed to load class books configurations');
    }
  };

  // Toggle book checklist checkbox
  const handleBookToggle = (book) => {
    if (selectedBooks.includes(book)) {
      setSelectedBooks(prev => prev.filter(b => b !== book));
    } else {
      setSelectedBooks(prev => [...prev, book]);
    }
  };

  // Handle form submission
  const handleDistributionSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (Number(amountPaid) !== bookFeeAmount) {
      setFormError(`Book fee must be paid in full (₹${bookFeeAmount.toLocaleString()}). Partial payment is not allowed.`);
      return;
    }

    isSubmittingRef.current = true;
    setFormSubmitting(true);
    setFormError('');

    try {
      await api.post('/fees/books/distribute', {
        studentId: activeRequest.student._id,
        requestId: activeRequest._id,
        booksIssued: selectedBooks,
        feeAmount: bookFeeAmount,
        amountPaid: Number(amountPaid),
        paymentMethod
      });

      setSuccessMsg('Book clearance completed successfully!');
      setTimeout(() => {
        setActiveRequest(null);
        setSuccessMsg('');
        fetchStats();
        fetchQueue();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Book distribution submission failed');
    } finally {
      isSubmittingRef.current = false;
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {activeTab === 'book-overview' ? (
        <>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
              Librarian Workspace
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Welcome back, {user?.name || 'Librarian'}!</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Monitor course textbook inventory clearances, accept student payment routings, and sign off book clearance queues.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('book-queue')}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-2xl text-xs transition-all shadow-lg hover:shadow-amber-500/10 cursor-pointer hover:scale-[1.01]"
          >
            <span>Process Clearance Queue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Neat Login Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4.5 uppercase tracking-wider">
                Staff Account Profile
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Display Name</span>
                    <span className="text-xs font-extrabold text-slate-800">{user?.name}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="h-10 w-10 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Login ID / Username</span>
                    <span className="text-xs font-semibold text-slate-700">{user?.username}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                    <span className="text-xs font-medium text-slate-600 truncate max-w-[180px] block">{user?.email}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="h-10 w-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Department Clearance Role</span>
                    <span className="text-xs font-extrabold text-slate-800">Book Department</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600">Secure session verified</span>
              </div>
              <span>Year: 2026-2027</span>
            </div>
          </div>

          {/* Right: Metrics & Pending queue preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pending Queue', val: stats?.pendingRequests ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/80 border-amber-100/50', type: 'pending' },
                { label: 'Approved Actions', val: stats?.approvedRequests ?? 0, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50/80 border-indigo-100/50', type: 'approved' },
                { label: 'Cleared Books', val: stats?.completedDistributions ?? 0, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50/80 border-emerald-100/50', type: 'completed' }
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div 
                    key={i} 
                    onClick={() => handleMetricCardClick(c.type)}
                    className="bg-white p-4.5 rounded-3xl border border-slate-200/60 shadow-premium hover-lift flex items-center space-x-3 cursor-pointer hover:border-indigo-400/85 hover:shadow-lg transition-all"
                  >
                    <div className={`p-2.5 rounded-xl border shrink-0 ${c.bg} ${c.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{c.label}</p>
                      <p className="text-lg font-extrabold text-slate-800 mt-1.5 leading-none">{c.val}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Queue Preview Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Queue snapshot</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Students waiting for textbook collection clearances</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50">
                  {queue.length} Pending
                </span>
              </div>

              {queueLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                </div>
              ) : queue.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No book clearance requests in queue.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Good job! Everything is caught up.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {queue.slice(0, 3).map(req => (
                    <div key={req._id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl text-xs transition-colors">
                      <div>
                        <p className="font-bold text-slate-800">{req.student?.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          ID: {req.student?.studentId} | Class: {req.student?.class}-{req.student?.section} | Board: {req.student?.schoolType}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('book-queue');
                          handleAcceptClick(req);
                        }}
                        className="inline-flex items-center space-x-1 font-bold text-white bg-amber-500 hover:bg-amber-600 px-3.5 py-2 rounded-xl transition-colors cursor-pointer text-[10px]"
                      >
                        <Check className="h-3 w-3" />
                        <span>Accept Request</span>
                      </button>
                    </div>
                  ))}
                  {queue.length > 3 && (
                    <button
                      onClick={() => setActiveTab('book-queue')}
                      className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-bold pt-2 cursor-pointer block"
                    >
                      View all {queue.length} requests in queue →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Book Distribution &amp; Clearance</h2>
          <p className="text-xs text-slate-500">Librarian dashboard &amp; school textbook inventory issue clearance queue</p>
        </div>
        <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
          <BookOpen className="h-6 w-6" />
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. METRICS CARDS */}
      {/* ========================================== */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Pending Approvals', val: stats.pendingRequests, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/80 border-amber-100/50', type: 'pending' },
              { label: 'Approved Requests', val: stats.approvedRequests, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50/80 border-indigo-100/50', type: 'approved' },
              { label: 'Completed Distributions', val: stats.completedDistributions, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50/80 border-emerald-100/50', type: 'completed' }
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div 
                  key={i} 
                  onClick={() => handleMetricCardClick(c.type)}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3 cursor-pointer hover:border-indigo-400/85 hover:shadow-lg transition-all hover-lift"
                >
                  <div className={`p-3 rounded-xl border shrink-0 ${c.bg} ${c.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">{c.label}</p>
                    <p className="text-xl font-bold text-slate-800 mt-1.5 leading-none">{c.val}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ========================================== */}
      {/* 2. REQUEST QUEUE TABLE */}
      {/* ========================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Clearance Request Queue</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Students who cleared Tuition fees and are waiting for Book collection</p>
        </div>

        {queueLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-amber-600"></div>
          </div>
        ) : queue.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            No book distribution requests in queue. Everything caught up!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Class-Sec</th>
                  <th className="py-3 px-4">School Type</th>
                  <th className="py-3 px-4">Routed Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {queue.map(req => (
                  <tr key={req._id} className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-semibold text-slate-900">{req.student?.studentId}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{req.student?.name}</td>
                    <td className="py-3 px-4">{req.student?.admissionNumber}</td>
                    <td className="py-3 px-4 font-semibold">{req.student?.class} - {req.student?.section}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        req.student?.schoolType === 'CBSE' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {req.student?.schoolType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleAcceptClick(req)}
                        className="inline-flex items-center space-x-1 font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRejectClick(req._id)}
                        className="inline-flex items-center space-x-1 font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-rose-200/50"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 3. BOOK DISTRIBUTION MODAL */}
      {/* ========================================== */}
      {activeRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-[#0B192C] text-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold">Book Distribution Checklist</h4>
                <p className="text-[10px] text-slate-300">Student: {activeRequest.student.name} ({activeRequest.student.studentId})</p>
              </div>
              <button onClick={() => setActiveRequest(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDistributionSubmit} className="p-6 space-y-4">
              
              {/* Info grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400">Class &amp; Section</span>
                  <span className="font-semibold text-slate-800">{activeRequest.student.class} - {activeRequest.student.section}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Roll Number</span>
                  <span className="font-semibold text-slate-800">{activeRequest.student.rollNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">School Board</span>
                  <span className="font-semibold text-slate-800">{activeRequest.student.schoolType}</span>
                </div>
              </div>

              {/* Books checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Select Textbooks Issued
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-4 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                  {classBooks.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-2 text-center py-2">No book structures configured for this class.</p>
                  ) : (
                    classBooks.map((book, idx) => {
                      const isChecked = selectedBooks.includes(book);
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => handleBookToggle(book)}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg text-xs font-medium text-left border cursor-pointer transition-colors ${
                            isChecked 
                              ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="truncate">{book}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Book Fee and payment Details */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Standard Book Fee:</span>
                    <span className="font-semibold text-slate-800">₹{bookFeeAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Amount Paid (₹):</span>
                    <input
                      type="number"
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Amount collected"
                      className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-amber-600 font-bold"
                    />
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold border-t border-dashed border-slate-200 pt-2">
                    <span>Balance Outstanding:</span>
                    <span>₹{Math.max(0, bookFeeAmount - (Number(amountPaid) || 0)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-3.5 border border-slate-200/60 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">PAYMENT METHOD</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-600 cursor-pointer"
                    >
                      <option value="Cash">Cash Handover</option>
                      <option value="UPI">UPI (GPay/Paytm)</option>
                      <option value="Card">Card Terminal Swipe</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action and errors */}
              <div className="border-t border-slate-100 pt-4 flex flex-col space-y-3">
                {formError && (
                  <p className="text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-200">{formError}</p>
                )}

                {successMsg && (
                  <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-center">{successMsg}</p>
                )}

                {successMsg ? (
                  <button
                    type="button"
                    disabled={true}
                    className="w-full flex justify-center py-2.5 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-400 bg-slate-100 cursor-not-allowed"
                  >
                    Book Clearance Completed (Fully Paid)
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={formSubmitting || classBooks.length === 0}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {formSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      'Record Distribution & Clear Books'
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. REJECT DIALOG */}
      {/* ========================================== */}
      {rejectId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center">
              <span className="text-sm font-bold">Reject Clearance Request</span>
              <button onClick={() => setRejectId(null)} className="text-slate-200 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <span>Rejecting will return the student status to Tuition Pending. Explain details below.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Remarks / Reason</label>
                <textarea
                  required
                  placeholder="e.g. Bounced check payment, admin error, incorrect billing, etc."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  rows={3}
                  className="block w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 text-slate-800"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={submitReject}
                  disabled={rejectSubmitting || !rejectRemarks.trim()}
                  className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {rejectSubmitting ? 'Submitting...' : 'Reject Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METRICS DETAILS MODAL */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden animate-slide-up my-8">
            {/* Header */}
            <div className="px-6 py-4.5 bg-[#0B192C] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                  Library Desk Analytics
                </span>
                <h4 className="text-base font-black mt-1">
                  {selectedMetric === 'pending' && 'Pending Library Clearance Queue'}
                  {selectedMetric === 'approved' && 'Approved Book Distributions'}
                  {selectedMetric === 'completed' && 'Completed Book Clearances'}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedMetric(null)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Search Bar */}
              <div className="relative rounded-xl max-w-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Filter records below..."
                  value={metricSearchQuery}
                  onChange={(e) => setMetricSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-850 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-amber-550/10 focus:border-amber-600 text-xs transition-all"
                />
              </div>

              {/* Data Content */}
              {metricDetailLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                </div>
              ) : getFilteredMetricData().length === 0 ? (
                <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center p-4">
                  <AlertCircle className="h-10 w-10 text-slate-300 mb-2.5" />
                  <p className="text-xs text-slate-400 font-semibold">No records found matching filters.</p>
                </div>
              ) : (
                <div className="max-h-[50vh] overflow-y-auto border border-slate-200/60 rounded-2xl shadow-inner scrollbar-thin">
                  <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10 border-b border-slate-200/80">
                        <th className="py-3 px-4 bg-slate-50">Student ID</th>
                        <th className="py-3 px-4 bg-slate-50">Student Name</th>
                        <th className="py-3 px-4 bg-slate-50">Class-Sec</th>
                        <th className="py-3 px-4 bg-slate-50">Admission No</th>
                        {selectedMetric === 'completed' ? (
                          <>
                            <th className="py-3 px-4 bg-slate-50">Receipt Number</th>
                            <th className="py-3 px-4 bg-slate-50">Fee Paid</th>
                            <th className="py-3 px-4 bg-slate-50">Issued Items</th>
                            <th className="py-3 px-4 bg-slate-50">Status</th>
                          </>
                        ) : selectedMetric === 'approved' ? (
                          <>
                            <th className="py-3 px-4 bg-slate-50">Request Status</th>
                            <th className="py-3 px-4 bg-slate-50">Remarks</th>
                            <th className="py-3 px-4 bg-slate-50">Approved Date</th>
                          </>
                        ) : (
                          <>
                            <th className="py-3 px-4 bg-slate-50">Tuition Status</th>
                            <th className="py-3 px-4 bg-slate-50">Request Status</th>
                            <th className="py-3 px-4 bg-slate-50">Date Enqueued</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {getFilteredMetricData().map((item, index) => {
                        const student = item.student || item;
                        return (
                          <tr key={item._id || index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-slate-550">{student?.studentId}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-850">{student?.name}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{student?.class} - {student?.section}</td>
                            <td className="py-3.5 px-4 font-mono">{student?.admissionNumber}</td>
                            {selectedMetric === 'completed' ? (
                              <>
                                <td className="py-3.5 px-4 font-bold text-slate-900">{item.receiptNumber || 'N/A'}</td>
                                <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{item.amountPaid?.toLocaleString()}</td>
                                <td className="py-3.5 px-4 text-slate-500 font-medium">
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {(item.booksIssued || []).map((b, bIdx) => (
                                      <span key={bIdx} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-mono truncate">{b}</span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-250">
                                    Cleared
                                  </span>
                                </td>
                              </>
                            ) : selectedMetric === 'approved' ? (
                              <>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-250">
                                    {item.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 italic truncate max-w-[150px]">{item.remarks || 'None'}</td>
                                <td className="py-3.5 px-4 text-slate-400">{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-250">
                                    Paid
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-850 border border-amber-200">
                                    {item.status || 'PENDING'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedMetric(null)}
                  className="py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
