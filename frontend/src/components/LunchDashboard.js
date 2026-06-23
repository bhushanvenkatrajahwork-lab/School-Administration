'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Coffee, Users, CheckCircle, Clock, TrendingUp, ShieldAlert, Loader2, Download, Search, AlertCircle, Check, X, FileDown } from 'lucide-react';

export default function LunchDashboard({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const [dashboardTab, setDashboardTab] = useState('overview'); // 'overview' | 'queue'
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [studentList, setStudentList] = useState([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  // Clearance Queue States
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Stats Details Modal
  const [selectedMetric, setSelectedMetric] = useState(null); // 'total' | 'paid' | 'pending' | 'collected' | 'outstanding'
  const [metricDetailData, setMetricDetailData] = useState([]);
  const [metricDetailLoading, setMetricDetailLoading] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState('');

  // Reject dialog state
  const [rejectId, setRejectId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Collect form state
  const [activeRequest, setActiveRequest] = useState(null);
  const [allLunchPeriodsList, setAllLunchPeriodsList] = useState([]);
  const [tempLunchEnrollment, setTempLunchEnrollment] = useState('Not Taking School Lunch');
  const [tempLunchPeriod, setTempLunchPeriod] = useState('Monthly');
  const [lunchFeeAmount, setLunchFeeAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [lunchReceipt, setLunchReceipt] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchStudents();
    fetchQueue();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.get('/fees/lunch/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching lunch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentLoading(true);
    try {
      const data = await api.get('/reports/lunch');
      setStudentList(data);
    } catch (err) {
      console.error('Error fetching lunch students:', err);
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchQueue = async () => {
    setQueueLoading(true);
    try {
      const data = await api.get('/fees/lunch/queue');
      setQueue(data);
    } catch (err) {
      console.error('Error fetching lunch queue:', err);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.download('/reports/export/csv?type=lunch', 'lunch_fee_report.csv');
    } catch (err) {
      alert('CSV Export failed: ' + err.message);
    }
  };

  const updateLunchFee = (enrollment, period, periods = allLunchPeriodsList) => {
    if (enrollment === 'Lunch at School') {
      const match = periods.find(p => p.period?.toLowerCase() === period?.toLowerCase());
      const fee = match ? match.feeAmount : (
        period === 'Annual' ? 25000 : 
        period === 'Quarterly' ? 7000 : 2500
      );
      setLunchFeeAmount(fee);
      setAmountPaid(fee.toString());
    } else {
      setLunchFeeAmount(0);
      setAmountPaid('0');
    }
  };

  const handleLunchEnrollmentChange = (enrollment) => {
    setTempLunchEnrollment(enrollment);
    updateLunchFee(enrollment, tempLunchPeriod);
  };

  const handleLunchPeriodChange = (period) => {
    setTempLunchPeriod(period);
    updateLunchFee(tempLunchEnrollment, period);
  };

  const handleAcceptClick = async (request) => {
    setActiveRequest(request);
    setFormError('');
    setAmountPaid('');
    setLunchReceipt(null);
    setSuccessMsg('');

    const st = request.student;
    setTempLunchEnrollment(st.lunchEnrollment || 'Not Taking School Lunch');
    setTempLunchPeriod(st.lunchPeriod || 'Monthly');

    try {
      const periods = await api.get('/classes/lunch');
      setAllLunchPeriodsList(periods || []);

      const defaultPeriod = st.lunchPeriod || 'Monthly';
      updateLunchFee(st.lunchEnrollment || 'Not Taking School Lunch', defaultPeriod, periods);
    } catch (err) {
      console.error(err);
      setFormError('Failed to load lunch plan configurations');
    }
  };

  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    if (Number(amountPaid) !== lunchFeeAmount) {
      setFormError(`Lunch fee must be paid in full (₹${lunchFeeAmount.toLocaleString()}). Partial payment is not allowed.`);
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await api.post('/fees/lunch/collect', {
        studentId: activeRequest.student._id,
        feeAmount: lunchFeeAmount,
        amountPaid: Number(amountPaid),
        paymentMethod,
        lunchEnrollment: tempLunchEnrollment,
        lunchPeriod: tempLunchPeriod
      });

      if (res.payment) {
        setLunchReceipt(res.payment);
      }
      
      setSuccessMsg('Lunch facility clearance completed successfully!');
      fetchStats();
      fetchQueue();
      fetchStudents();
    } catch (err) {
      setFormError(err.message || 'Lunch fee payment submission failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRejectClick = (requestId) => {
    setRejectId(requestId);
    setRejectRemarks('');
  };

  const submitReject = async () => {
    if (!rejectId) return;
    setRejectSubmitting(true);
    try {
      const item = queue.find(q => q._id === rejectId);
      const studentId = item ? item.student._id : rejectId;

      const res = await api.post('/fees/lunch/action', {
        studentId,
        remarks: rejectRemarks
      });
      setRejectId(null);
      fetchStats();
      fetchQueue();
      fetchStudents();
    } catch (err) {
      console.error('Error rejecting lunch clearance:', err);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleMetricCardClick = async (type) => {
    setSelectedMetric(type);
    setMetricDetailLoading(true);
    setMetricDetailData([]);
    setMetricSearchQuery('');
    try {
      const data = await api.get('/reports/lunch');
      let filtered = [];
      if (type === 'total') {
        filtered = data;
      } else if (type === 'paid') {
        filtered = data.filter(r => r.status === 'Paid');
      } else if (type === 'pending') {
        filtered = data.filter(r => r.status === 'Pending');
      } else if (type === 'collected') {
        const collectionsRes = await api.get('/reports/collections');
        filtered = (collectionsRes.payments || []).filter(p => p.feeType === 'Lunch');
      } else if (type === 'outstanding') {
        filtered = data.filter(r => r.balanceAmount > 0);
      }
      setMetricDetailData(filtered);
    } catch (err) {
      console.error('Error loading metric details:', err);
    } finally {
      setMetricDetailLoading(false);
    }
  };

  const getFilteredMetricData = () => {
    if (!metricSearchQuery.trim()) return metricDetailData;
    const q = metricSearchQuery.toLowerCase();
    return metricDetailData.filter(item => {
      const studentName = item.student?.name || '';
      const studentId = item.student?.studentId || '';
      const period = item.student?.lunchPeriod || '';
      const receiptNumber = item.receiptNumber || '';
      return (
        studentName.toLowerCase().includes(q) ||
        studentId.toLowerCase().includes(q) ||
        period.toLowerCase().includes(q) ||
        receiptNumber.toLowerCase().includes(q)
      );
    });
  };

  const getFilteredStudents = () => {
    return studentList.filter(item => {
      const name = item.student?.name || '';
      const sid = item.student?.studentId || '';
      const period = item.student?.lunchPeriod || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            sid.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPeriod = filterPeriod === '' || period === filterPeriod;
      return matchesSearch && matchesPeriod;
    });
  };

  const handlePrintReceipt = (payment) => {
    if (!payment) return;
    const student = activeRequest?.student || payment.student;
    const printContent = `
      <html>
        <head>
          <title>Fee Receipt - ${payment.receiptNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; padding: 40px; line-height: 1.5; }
            .receipt-box { border: 2px solid #eaeaea; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px dashed #eaeaea; padding-bottom: 20px; margin-bottom: 20px; }
            .school-logo { font-size: 24px; font-weight: bold; color: #1e3a8a; display: flex; align-items: center; }
            .title { text-align: right; }
            .title h1 { margin: 0; font-size: 20px; color: #1e3a8a; text-transform: uppercase; }
            .title p { margin: 5px 0 0 0; font-size: 12px; color: #666; }
            .details { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 13px; }
            .details div p { margin: 3px 0; }
            .details .label { font-weight: bold; color: #555; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .table th { background: #f8fafc; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #eaeaea; }
            .table td { padding: 12px 10px; border-bottom: 1px solid #eaeaea; font-size: 13px; }
            .total-section { display: flex; justify-content: flex-end; font-size: 14px; font-weight: bold; margin-bottom: 30px; }
            .footer { text-align: center; border-top: 1px solid #eaeaea; padding-top: 20px; font-size: 11px; color: #777; }
            .footer p { margin: 3px 0; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="school-logo">EduClearance Academy</div>
              <div class="title">
                <h1>Official Receipt</h1>
                <p>Receipt No: ${payment.receiptNumber}</p>
              </div>
            </div>
            
            <div class="details">
              <div>
                <p><span class="label">Student ID:</span> ${student?.studentId || 'N/A'}</p>
                <p><span class="label">Admission No:</span> ${student?.admissionNumber || 'N/A'}</p>
                <p><span class="label">Name:</span> ${student?.name || 'N/A'}</p>
                <p><span class="label">Class & Section:</span> ${student?.class || 'N/A'} - ${student?.section || 'N/A'}</p>
              </div>
              <div>
                <p><span class="label">Receipt Date:</span> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
                <p><span class="label">Payment Method:</span> ${payment.paymentMethod}</p>
                <p><span class="label">Transaction Ref:</span> ${payment.transactionRef || 'N/A'}</p>
                <p><span class="label">Authorized By:</span> ${payment.staffName}</p>
              </div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${payment.feeType} Fee Payment Clearance</td>
                  <td style="text-align: right;">₹${payment.amount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="total-section">
              <span>Total Received: ₹${payment.amount.toLocaleString('en-IN')}</span>
            </div>
            
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>This is a system-generated official fee receipt of EduClearance Academy.</p>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-3 py-1 rounded-full">
            Catering Workspace
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Lunch Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Meal subscription plans, school dining registries, and collections reports</p>
        </div>
        <div className="flex space-x-2.5 w-full md:w-auto">
          {/* Segmented Picker */}
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200/60 shadow-inner w-full md:w-auto">
            <button
              onClick={() => setDashboardTab('overview')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                dashboardTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setDashboardTab('queue')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center space-x-1 ${
                dashboardTab === 'queue'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>Clearance Queue</span>
              {queue.length > 0 && (
                <span className="h-4 px-1.5 rounded-full text-[9px] bg-indigo-600 text-white font-black flex items-center justify-center shrink-0">
                  {queue.length}
                </span>
              )}
            </button>
          </div>

          {dashboardTab === 'overview' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Export Lunch CSV</span>
            </button>
          )}
        </div>
      </div>

      {dashboardTab === 'overview' ? (
        <>
          {/* Stats row */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-3xl" />
              ))}
            </div>
          ) : (
            stats && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
                {[
                  { label: 'Total Enrolled', val: stats.totalEnrolled, icon: Users, color: 'text-indigo-650', bg: 'bg-indigo-50/80 border-indigo-100/50', type: 'total' },
                  { label: 'Fully Paid', val: stats.paidStudents, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/80 border-emerald-100/50', type: 'paid' },
                  { label: 'Pending Payment', val: stats.pendingStudents, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/80 border-amber-100/50', type: 'pending' },
                  { label: 'Collected amount', val: `₹${stats.collectedAmount.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-teal-650', bg: 'bg-teal-50/80 border-teal-100/50', type: 'collected' },
                  { label: 'Outstanding debts', val: `₹${stats.pendingAmount.toLocaleString('en-IN')}`, icon: ShieldAlert, color: 'text-rose-650', bg: 'bg-rose-50/80 border-rose-100/50', type: 'outstanding' }
                ].map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div 
                      key={i} 
                      onClick={() => handleMetricCardClick(c.type)}
                      className="bg-white p-4.5 rounded-3xl border border-slate-200/60 shadow-premium hover-lift cursor-pointer hover:border-indigo-400/85 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${c.bg} ${c.color}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{c.label}</p>
                          <p className="text-base font-extrabold text-slate-800 mt-1.5 leading-none">{c.val}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Period Breakdown Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-4">
              <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
                Plan Wise Breakdown
              </h3>
              
              {statsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : !stats || stats.periodBreakdown?.length === 0 ? (
                <p className="text-xs text-slate-455 text-center py-6">No period statistics generated.</p>
              ) : (
                <div className="space-y-3 pr-1 scrollbar-thin">
                  {stats.periodBreakdown.map((p, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-850">{p.period} Meal Plan</span>
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-bold">
                          {p.studentCount} Students
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <div>
                          <span className="block text-slate-400">Collected:</span>
                          <span className="font-bold text-emerald-600">₹{p.collected.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400">Balance:</span>
                          <span className="font-bold text-rose-600">₹{p.pending.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Register Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Lunch Subscription Directory</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">List of students registered in school meal plans</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by student name, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-600 text-xs"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer bg-white"
                >
                  <option value="">All Periods</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              {/* Table */}
              {studentLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
              ) : getFilteredStudents().length === 0 ? (
                <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center p-4">
                  <AlertCircle className="h-10 w-10 text-slate-300 mb-2.5" />
                  <p className="text-xs text-slate-400 font-semibold">No students found matching filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-150 rounded-2xl max-h-[400px] overflow-y-auto scrollbar-thin">
                  <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                    <thead>
                      <tr className="bg-slate-50 text-slate-450 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10 border-b border-slate-200">
                        <th className="py-2.5 px-3 bg-slate-50">Student ID</th>
                        <th className="py-2.5 px-3 bg-slate-50">Name</th>
                        <th className="py-2.5 px-3 bg-slate-50">Period</th>
                        <th className="py-2.5 px-3 bg-slate-50">Fee</th>
                        <th className="py-2.5 px-3 bg-slate-50">Paid</th>
                        <th className="py-2.5 px-3 bg-slate-50">Balance</th>
                        <th className="py-2.5 px-3 bg-slate-50">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {getFilteredStudents().map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40">
                          <td className="py-3 px-3 font-semibold text-slate-900">{item.student?.studentId}</td>
                          <td className="py-3 px-3 font-bold text-slate-800">{item.student?.name}</td>
                          <td className="py-3 px-3">{item.student?.lunchPeriod || 'N/A'}</td>
                          <td className="py-3 px-3 font-semibold">₹{item.feeAmount || 0}</td>
                          <td className="py-3 px-3 font-semibold text-emerald-600">₹{item.amountPaid || 0}</td>
                          <td className="py-3 px-3 font-bold text-rose-600">₹{item.balanceAmount || 0}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              item.status === 'Paid'
                                ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                : 'bg-amber-50 border-amber-250 text-amber-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Clearance Queue View */
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Catering Clearance Queue</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Students who require school lunch fee collections and clearance clearance</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-650 border border-slate-250">
              {queue.length} Students Pending
            </span>
          </div>

          {queueLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : queue.length === 0 ? (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center p-4">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-2.5" />
              <p className="text-xs text-slate-700 font-bold">No students pending lunch clearance.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">All student meal subscriptions are currently fully paid and en-route.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
              <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10 border-b border-slate-200">
                    <th className="py-2.5 px-4 bg-slate-50">Student ID</th>
                    <th className="py-2.5 px-4 bg-slate-50">Name</th>
                    <th className="py-2.5 px-4 bg-slate-50">Class-Sec</th>
                    <th className="py-2.5 px-4 bg-slate-50">Board</th>
                    <th className="py-2.5 px-4 bg-slate-50">Configured Plan</th>
                    <th className="py-2.5 px-4 bg-slate-50">Lunch Fee</th>
                    <th className="py-2.5 px-4 bg-slate-50 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {queue.map((req, idx) => (
                    <tr key={req._id || idx} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-semibold text-slate-900">{req.student?.studentId}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{req.student?.name}</td>
                      <td className="py-3 px-4 font-semibold">{req.student?.class} - {req.student?.section}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          req.student?.schoolType === 'CBSE' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {req.student?.schoolType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {req.student?.lunchPeriod || 'N/A'} ({req.student?.lunchEnrollment})
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-800">
                        ₹{req.student?.lunchFee?.feeAmount?.toLocaleString() || 0}
                      </td>
                      <td className="py-3 px-4 text-right flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleAcceptClick(req)}
                          className="inline-flex items-center space-x-1 font-bold text-white bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer text-[10px] hover:scale-[1.01]"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Collect Payment</span>
                        </button>
                        <button
                          onClick={() => handleRejectClick(req._id)}
                          className="inline-flex items-center space-x-1 font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200/50 transition-all cursor-pointer text-[10px]"
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
      )}

      {/* Collect Payment Modal */}
      {activeRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-slide-up my-8">
            <div className="px-6 py-4.5 bg-[#0B192C] text-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <Coffee className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Lunch Facility clearance</span>
                </h4>
                <p className="text-[10px] text-slate-300 mt-0.5">Student: {activeRequest.student.name} ({activeRequest.student.studentId})</p>
              </div>
              <button 
                onClick={() => setActiveRequest(null)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!successMsg ? (
              <form onSubmit={handleCollectSubmit} className="p-6 space-y-4 text-xs">
                
                {/* Lunch configurations form */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200/60 pb-1.5">
                    Lunch Service Configuration
                  </h5>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lunch Enrollment</label>
                    <select
                      value={tempLunchEnrollment}
                      onChange={(e) => handleLunchEnrollmentChange(e.target.value)}
                      className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-medium"
                    >
                      <option value="Not Taking School Lunch">Not Taking School Lunch</option>
                      <option value="Lunch at School">Lunch at School</option>
                    </select>
                  </div>

                  {tempLunchEnrollment === 'Lunch at School' && (
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Billing Period</label>
                      <select
                        value={tempLunchPeriod}
                        onChange={(e) => handleLunchPeriodChange(e.target.value)}
                        className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-medium"
                      >
                        {allLunchPeriodsList.map((p, idx) => (
                          <option key={idx} value={p.period}>
                            {p.period} (₹{p.feeAmount?.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Lunch Fee and payment Details */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium font-bold text-slate-800">Lunch Plan Fee:</span>
                      <span className="font-extrabold text-slate-850">₹{lunchFeeAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-550 font-bold text-slate-800">Amount Paid (₹):</span>
                      <input
                        type="number"
                        required
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="Amount collected"
                        className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-indigo-600 font-bold"
                      />
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold border-t border-dashed border-slate-200 pt-2 text-[10px]">
                      <span>Balance Outstanding:</span>
                      <span>₹{Math.max(0, lunchFeeAmount - (Number(amountPaid) || 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-3.5 border border-slate-200/60 rounded-2xl">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-1">PAYMENT METHOD</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-bold"
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

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-indigo-650 bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer font-bold"
                  >
                    {formSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      'Record Lunch Clearance & Clear Student'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success / Print Screen */
              <div className="p-8 space-y-6 text-center text-xs">
                <div className="h-16 w-16 bg-emerald-50 text-emerald-500 border border-emerald-250 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="h-10 w-10 animate-fade-in" />
                </div>
                
                <div>
                  <h5 className="text-base font-black text-slate-900">{successMsg}</h5>
                  <p className="text-[10px] text-slate-505 mt-1 max-w-sm mx-auto">
                    Student {activeRequest.student.name} lunch Clearance recorded successfully.
                  </p>
                </div>

                {lunchReceipt && (
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl max-w-md mx-auto">
                    <div className="text-left">
                      <span className="font-bold text-slate-850">Lunch Plan Fee Receipt</span>
                      <span className="block text-[9px] text-slate-400 font-mono mt-0.5">No: {lunchReceipt.receiptNumber} | Amount: ₹{lunchReceipt.amount?.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrintReceipt(lunchReceipt)}
                      className="flex items-center space-x-1 font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/50 cursor-pointer"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setActiveRequest(null);
                    setSuccessMsg('');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-all cursor-pointer max-w-xs"
                >
                  Done &amp; Close Clearance Modal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Remarks Dialog */}
      {rejectId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center">
              <span className="text-sm font-bold">Reject Lunch Clearance</span>
              <button onClick={() => setRejectId(null)} className="text-slate-200 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-start space-x-2 text-rose-805 bg-rose-50 border border-rose-200 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-rose-505 shrink-0" />
                <span>Rejecting will return the student status back to Transportation or Uniform clearance queues.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Remarks / Reason</label>
                <textarea
                  required
                  placeholder="e.g. Needs plan changes, billing adjustment, admin request, etc."
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
                  className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer font-bold"
                >
                  {rejectSubmitting ? 'Submitting...' : 'Reject Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Details Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden animate-slide-up my-8">
            <div className="px-6 py-4.5 bg-[#0B192C] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2.5 py-0.5 rounded-full">
                  Lunch Desk Details
                </span>
                <h4 className="text-base font-black mt-1">
                  {selectedMetric === 'total' && 'Total Lunch Plan Subscriptions'}
                  {selectedMetric === 'paid' && 'Lunch Fee Paid Registry'}
                  {selectedMetric === 'pending' && 'Lunch Fee Pending Registry'}
                  {selectedMetric === 'collected' && 'Lunch Fee Collections Ledger'}
                  {selectedMetric === 'outstanding' && 'Lunch Outstanding Balances'}
                </h4>
              </div>
              <button onClick={() => setSelectedMetric(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5">
                <span className="text-sm font-bold">Close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative rounded-xl max-w-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Filter records below..."
                  value={metricSearchQuery}
                  onChange={(e) => setMetricSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-850 placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-xs"
                />
              </div>

              {metricDetailLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
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
                        <th className="py-3 px-4 bg-slate-50">Period Plan</th>
                        {selectedMetric === 'collected' ? (
                          <>
                            <th className="py-3 px-4 bg-slate-50">Receipt Number</th>
                            <th className="py-3 px-4 bg-slate-50">Amount Paid</th>
                            <th className="py-3 px-4 bg-slate-50">Payment Method</th>
                            <th className="py-3 px-4 bg-slate-50">Collected Date</th>
                          </>
                        ) : (
                          <>
                            <th className="py-3 px-4 bg-slate-50">Fee Amount</th>
                            <th className="py-3 px-4 bg-slate-50">Amount Paid</th>
                            <th className="py-3 px-4 bg-slate-50">Outstanding</th>
                            <th className="py-3 px-4 bg-slate-50">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {getFilteredMetricData().map((item, index) => {
                        const student = item.student || item;
                        return (
                          <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-550">{student?.studentId}</td>
                            <td className="py-3 px-4 font-bold text-slate-850">{student?.name}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{student?.class} - {student?.section}</td>
                            <td className="py-3 px-4 font-bold">{student?.lunchPeriod || 'N/A'}</td>
                            {selectedMetric === 'collected' ? (
                              <>
                                <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.receiptNumber}</td>
                                <td className="py-3 px-4 font-extrabold text-slate-900">₹{item.amount?.toLocaleString()}</td>
                                <td className="py-3 px-4 text-slate-500 font-semibold">{item.paymentMethod}</td>
                                <td className="py-3 px-4 text-slate-400">{new Date(item.paymentDate).toLocaleDateString()}</td>
                              </>
                            ) : (
                              <>
                                <td className="py-3 px-4 font-semibold text-slate-900">₹{item.feeAmount?.toLocaleString()}</td>
                                <td className="py-3 px-4 font-bold text-emerald-600">₹{item.amountPaid?.toLocaleString()}</td>
                                <td className="py-3 px-4 font-extrabold text-rose-600 bg-rose-50/10">₹{item.balanceAmount?.toLocaleString()}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                    item.status === 'Paid'
                                      ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                      : 'bg-amber-50 border-amber-250 text-amber-700'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
