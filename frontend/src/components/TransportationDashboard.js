'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Bus, Users, CheckCircle, Clock, TrendingUp, ShieldAlert, Loader2, Download, Search, AlertCircle, Check, X, FileDown } from 'lucide-react';

export default function TransportationDashboard({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const [dashboardTab, setDashboardTab] = useState('overview'); // 'overview' | 'queue'
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [studentList, setStudentList] = useState([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('');

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
  const [allRoutesList, setAllRoutesList] = useState([]);
  const [tempTransportEnrollment, setTempTransportEnrollment] = useState('No');
  const [tempTransportType, setTempTransportType] = useState('Parent Transport');
  const [tempBusRoute, setTempBusRoute] = useState('');
  const [tempBusNumber, setTempBusNumber] = useState('');
  const [tempPickupLocation, setTempPickupLocation] = useState('');
  const [tempDropLocation, setTempDropLocation] = useState('');
  const [tempBoardingPoint, setTempBoardingPoint] = useState('');
  const [transportFeeAmount, setTransportFeeAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [transportReceipt, setTransportReceipt] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchStudents();
    fetchQueue();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.get('/fees/transportation/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching transport stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentLoading(true);
    try {
      const data = await api.get('/reports/transportation');
      setStudentList(data);
    } catch (err) {
      console.error('Error fetching transport students:', err);
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchQueue = async () => {
    setQueueLoading(true);
    try {
      const data = await api.get('/fees/transportation/queue');
      setQueue(data);
    } catch (err) {
      console.error('Error fetching transport queue:', err);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.download('/reports/export/csv?type=transportation', 'transportation_fee_report.csv');
    } catch (err) {
      alert('CSV Export failed: ' + err.message);
    }
  };

  const updateTransportFee = (enrollment, type, route, routes = allRoutesList) => {
    if (enrollment === 'Yes' && type === 'School Bus') {
      const match = routes.find(r => r.route?.toLowerCase() === route?.toLowerCase());
      const fee = match ? match.feeAmount : (routes[0]?.feeAmount || 3000);
      setTransportFeeAmount(fee);
      setAmountPaid(fee.toString());
      if (match) {
        setTempBusNumber(match.busNumber || '');
      }
    } else {
      setTransportFeeAmount(0);
      setAmountPaid('0');
      setTempBusNumber('');
    }
  };

  const handleTransportEnrollmentChange = (enrollment) => {
    setTempTransportEnrollment(enrollment);
    updateTransportFee(enrollment, tempTransportType, tempBusRoute);
  };

  const handleTransportTypeChange = (type) => {
    setTempTransportType(type);
    updateTransportFee(tempTransportEnrollment, type, tempBusRoute);
  };

  const handleBusRouteChange = (route) => {
    setTempBusRoute(route);
    updateTransportFee(tempTransportEnrollment, tempTransportType, route);
  };

  const handleAcceptClick = async (request) => {
    setActiveRequest(request);
    setFormError('');
    setAmountPaid('');
    setTransportReceipt(null);
    setSuccessMsg('');

    const st = request.student;
    setTempTransportEnrollment(st.transportEnrollment || 'No');
    setTempTransportType(st.transportType || 'Parent Transport');
    setTempBusRoute(st.busRoute || '');
    setTempBusNumber(st.busNumber || '');
    setTempPickupLocation(st.pickupLocation || '');
    setTempDropLocation(st.dropLocation || '');
    setTempBoardingPoint(st.boardingPoint || '');

    try {
      const routes = await api.get('/classes/transportation');
      setAllRoutesList(routes || []);

      const defaultRoute = st.busRoute || (routes[0]?.route || '');
      if (!st.busRoute && routes[0]?.route) {
        setTempBusRoute(routes[0].route);
      }

      updateTransportFee(st.transportEnrollment || 'No', st.transportType || 'Parent Transport', defaultRoute, routes);
    } catch (err) {
      console.error(err);
      setFormError('Failed to load route configurations');
    }
  };

  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    if (Number(amountPaid) !== transportFeeAmount) {
      setFormError(`Transportation fee must be paid in full (₹${transportFeeAmount.toLocaleString()}). Partial payment is not allowed.`);
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await api.post('/fees/transportation/collect', {
        studentId: activeRequest.student._id,
        feeAmount: transportFeeAmount,
        amountPaid: Number(amountPaid),
        paymentMethod,
        transportEnrollment: tempTransportEnrollment,
        transportType: tempTransportType,
        busRoute: tempBusRoute,
        busNumber: tempBusNumber,
        pickupLocation: tempPickupLocation,
        dropLocation: tempDropLocation,
        boardingPoint: tempBoardingPoint
      });

      if (res.payment) {
        setTransportReceipt(res.payment);
      }
      
      setSuccessMsg('Transportation clearance completed successfully!');
      fetchStats();
      fetchQueue();
      fetchStudents();
    } catch (err) {
      setFormError(err.message || 'Transportation payment submission failed');
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

      await api.post('/fees/transportation/action', {
        studentId,
        remarks: rejectRemarks
      });
      setRejectId(null);
      fetchStats();
      fetchQueue();
      fetchStudents();
    } catch (err) {
      console.error('Error rejecting transport:', err);
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
      const data = await api.get('/reports/transportation');
      let filtered = [];
      if (type === 'total') {
        filtered = data;
      } else if (type === 'paid') {
        filtered = data.filter(r => r.status === 'Paid');
      } else if (type === 'pending') {
        filtered = data.filter(r => r.status === 'Pending');
      } else if (type === 'collected') {
        const collectionsRes = await api.get('/reports/collections');
        filtered = (collectionsRes.payments || []).filter(p => p.feeType === 'Transportation');
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
      const route = item.student?.busRoute || '';
      const receiptNumber = item.receiptNumber || '';
      return (
        studentName.toLowerCase().includes(q) ||
        studentId.toLowerCase().includes(q) ||
        route.toLowerCase().includes(q) ||
        receiptNumber.toLowerCase().includes(q)
      );
    });
  };

  const getFilteredStudents = () => {
    return studentList.filter(item => {
      const name = item.student?.name || '';
      const sid = item.student?.studentId || '';
      const route = item.student?.busRoute || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            sid.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRoute = filterRoute === '' || route === filterRoute;
      return matchesSearch && matchesRoute;
    });
  };

  const getRouteList = () => {
    if (!stats || !stats.routeBreakdown) return [];
    return stats.routeBreakdown.map(r => r.route);
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
            Logistics Workspace
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Transportation Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Route mapping, bus assignments, and logistics clearance tracking</p>
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
              <span className="hidden sm:inline">Export Transport CSV</span>
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
            {/* Route Breakdown Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-4">
              <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
                Route Wise Breakdowns
              </h3>
              
              {statsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : !stats || stats.routeBreakdown?.length === 0 ? (
                <p className="text-xs text-slate-450 text-center py-6">No route statistics generated.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                  {stats.routeBreakdown.map((r, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-800">{r.route} ({r.busNumber})</span>
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-bold">
                          {r.studentCount} Students
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <div>
                          <span className="block text-slate-400">Collected:</span>
                          <span className="font-bold text-emerald-600">₹{r.collected.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400">Balance:</span>
                          <span className="font-bold text-rose-600">₹{r.pending.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Transport stats summary */}
              {stats && (
                <div className="pt-4 border-t border-slate-100 text-xs space-y-2.5">
                  <div className="flex justify-between text-slate-500">
                    <span>School Bus Enrolled:</span>
                    <span className="font-bold text-slate-800">{stats.schoolBusCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Parent Transport:</span>
                    <span className="font-bold text-slate-800">{stats.parentTransportCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Outsourced Transport:</span>
                    <span className="font-bold text-slate-800">{stats.outsourcedTransportCount}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Student Register Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Transport Student Directory</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">List of students enrolled in school transportation</p>
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
                    className="block w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-405 focus:outline-none focus:border-indigo-600 text-xs"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
                <select
                  value={filterRoute}
                  onChange={(e) => setFilterRoute(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer bg-white"
                >
                  <option value="">All Routes</option>
                  {getRouteList().map((route, idx) => (
                    <option key={idx} value={route}>{route}</option>
                  ))}
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
                        <th className="py-2.5 px-3 bg-slate-50">Transport Type</th>
                        <th className="py-2.5 px-3 bg-slate-50">Route</th>
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
                          <td className="py-3 px-3 font-semibold text-slate-600">{item.student?.transportType || 'N/A'}</td>
                          <td className="py-3 px-3">{item.student?.busRoute || 'N/A'}</td>
                          <td className="py-3 px-3 font-semibold">₹{item.feeAmount || 0}</td>
                          <td className="py-3 px-3 font-semibold text-emerald-600">₹{item.amountPaid || 0}</td>
                          <td className="py-3 px-3 font-bold text-rose-600">₹{item.balanceAmount || 0}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                              item.status === 'Paid'
                                ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                                : item.status === 'Not Applicable'
                                  ? 'bg-slate-50 border-slate-200 text-slate-500'
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
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Logistics Clearance Queue</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Students who require transportation fee collections and clearance clearance</p>
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
              <p className="text-xs text-slate-700 font-bold">No students pending transportation clearance.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">All student routes are currently fully paid and en-route.</p>
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
                    <th className="py-2.5 px-4 bg-slate-50">Configured Route</th>
                    <th className="py-2.5 px-4 bg-slate-50">Transport Fee</th>
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
                        {req.student?.busRoute || 'N/A'} ({req.student?.transportType})
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-800">
                        ₹{req.student?.transportFee?.feeAmount?.toLocaleString() || 0}
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
                  <Bus className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Transportation Fee Clearance</span>
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
                
                {/* Transport configuration form */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200/60 pb-1.5">
                    Transportation Configuration
                  </h5>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transportation Enrollment</label>
                    <select
                      value={tempTransportEnrollment}
                      onChange={(e) => handleTransportEnrollmentChange(e.target.value)}
                      className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-medium"
                    >
                      <option value="No">No (Opt Out / Revert transport settings)</option>
                      <option value="Yes">Yes (Opted In)</option>
                    </select>
                  </div>

                  {tempTransportEnrollment === 'Yes' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Transport Type</label>
                          <select
                            value={tempTransportType}
                            onChange={(e) => handleTransportTypeChange(e.target.value)}
                            className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-medium"
                          >
                            <option value="School Bus">School Bus</option>
                            <option value="Parent Transport">Parent Transport</option>
                            <option value="Outsourced Transport">Outsourced Transport</option>
                          </select>
                        </div>
                        
                        {tempTransportType === 'School Bus' && (
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Bus Route</label>
                            <select
                              value={tempBusRoute}
                              onChange={(e) => handleBusRouteChange(e.target.value)}
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-600 cursor-pointer font-medium"
                            >
                              {allRoutesList.map((r, idx) => (
                                <option key={idx} value={r.route}>
                                  {r.route} (₹{r.feeAmount?.toLocaleString()})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {tempTransportType === 'School Bus' && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/40">
                          <div>
                            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Boarding Point</label>
                            <input
                              type="text"
                              value={tempBoardingPoint}
                              onChange={(e) => setTempBoardingPoint(e.target.value)}
                              placeholder="Boarding point"
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Pickup Location</label>
                            <input
                              type="text"
                              value={tempPickupLocation}
                              onChange={(e) => setTempPickupLocation(e.target.value)}
                              placeholder="Pickup"
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Drop Location</label>
                            <input
                              type="text"
                              value={tempDropLocation}
                              onChange={(e) => setTempDropLocation(e.target.value)}
                              placeholder="Drop"
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Transportation Fee and payment Details */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium font-bold text-slate-800">Transport Route Fee:</span>
                      <span className="font-extrabold text-slate-850">₹{transportFeeAmount.toLocaleString()}</span>
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
                      <span>₹{Math.max(0, transportFeeAmount - (Number(amountPaid) || 0)).toLocaleString()}</span>
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
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer font-bold"
                  >
                    {formSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      'Record Transportation Clearance & Clear Student'
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
                  <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Student {activeRequest.student.name} transportation clearance recorded successfully.
                  </p>
                </div>

                {transportReceipt && (
                  <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl max-w-md mx-auto">
                    <div className="text-left">
                      <span className="font-bold text-slate-850">Transportation Fee Receipt</span>
                      <span className="block text-[9px] text-slate-400 font-mono mt-0.5">No: {transportReceipt.receiptNumber} | Amount: ₹{transportReceipt.amount?.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrintReceipt(transportReceipt)}
                      className="flex items-center space-x-1 font-bold text-indigo-650 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200/50 cursor-pointer"
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
              <span className="text-sm font-bold">Reject Transport Clearance</span>
              <button onClick={() => setRejectId(null)} className="text-slate-200 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-start space-x-2 text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <span>Rejecting will return the student status back to Uniform Clearance queue.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1 uppercase tracking-wider">Remarks / Reason</label>
                <textarea
                  required
                  placeholder="e.g. Needs route configuration updates, address correction, admin request, etc."
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
                  Transportation Desk Details
                </span>
                <h4 className="text-base font-black mt-1">
                  {selectedMetric === 'total' && 'Total Transportation Enrollment'}
                  {selectedMetric === 'paid' && 'Transportation Fee Paid Registry'}
                  {selectedMetric === 'pending' && 'Transportation Fee Pending Registry'}
                  {selectedMetric === 'collected' && 'Transportation Fee Collections Ledger'}
                  {selectedMetric === 'outstanding' && 'Transportation Outstanding Balances'}
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
                  className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-850 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-xs"
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
                        <th className="py-3 px-4 bg-slate-50">Route</th>
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
                            <td className="py-3 px-4 font-bold">{student?.busRoute || 'N/A'}</td>
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
                                      : item.status === 'Not Applicable'
                                        ? 'bg-slate-50 border-slate-200 text-slate-500'
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
