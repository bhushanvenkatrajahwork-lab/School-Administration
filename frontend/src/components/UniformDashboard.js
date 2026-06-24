'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Shirt, Users, CheckCircle, Clock, Check, X, AlertCircle, Loader2, User, Mail, Shield, ArrowRight, Search, FileDown, Bus, Utensils } from 'lucide-react';

export default function UniformDashboard({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const isSubmittingRef = useRef(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Interactive metrics modal states
  const [selectedMetric, setSelectedMetric] = useState(null); // 'pending' | 'approved' | 'completed'
  const [metricDetailData, setMetricDetailData] = useState([]);
  const [metricDetailLoading, setMetricDetailLoading] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState('');

  // Reject dialog state
  const [rejectId, setRejectId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Distribution form modal state
  const [activeRequest, setActiveRequest] = useState(null);
  const [classItems, setClassItems] = useState([]);
  const [uniformFeeAmount, setUniformFeeAmount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 3-step wizard stepper states
  const [currentStep, setCurrentStep] = useState(1);
  const [transportFeeAmount, setTransportFeeAmount] = useState(0);
  const [transportAmountPaid, setTransportAmountPaid] = useState('');
  const [transportPaymentMethod, setTransportPaymentMethod] = useState('Cash');
  const [lunchFeeAmount, setLunchFeeAmount] = useState(0);
  const [lunchAmountPaid, setLunchAmountPaid] = useState('');
  const [lunchPaymentMethod, setLunchPaymentMethod] = useState('Cash');
  const [uniformReceipt, setUniformReceipt] = useState(null);
  const [transportReceipt, setTransportReceipt] = useState(null);
  const [lunchReceipt, setLunchReceipt] = useState(null);

  // Dynamic service configuration lists
  const [allRoutesList, setAllRoutesList] = useState([]);
  const [allLunchPeriodsList, setAllLunchPeriodsList] = useState([]);

  // Temporary service enrollment selections (editable by store manager)
  const [tempTransportEnrollment, setTempTransportEnrollment] = useState('No');
  const [tempTransportType, setTempTransportType] = useState('Parent Transport');
  const [tempBusRoute, setTempBusRoute] = useState('');
  const [tempBusNumber, setTempBusNumber] = useState('');
  const [tempPickupLocation, setTempPickupLocation] = useState('');
  const [tempDropLocation, setTempDropLocation] = useState('');
  const [tempBoardingPoint, setTempBoardingPoint] = useState('');

  const [tempLunchEnrollment, setTempLunchEnrollment] = useState('Not Taking School Lunch');
  const [tempLunchPeriod, setTempLunchPeriod] = useState('Monthly');

  // Helper function to update Transport Fee based on Route & Type
  const updateTransportFee = (enrollment, type, route, routes = allRoutesList) => {
    if (enrollment === 'Yes' && type === 'School Bus') {
      const match = routes.find(r => r.route?.toLowerCase() === route?.toLowerCase());
      const fee = match ? match.feeAmount : (routes[0]?.feeAmount || 3000);
      setTransportFeeAmount(fee);
      setTransportAmountPaid(fee.toString());
      if (match) {
        setTempBusNumber(match.busNumber || '');
      }
    } else {
      setTransportFeeAmount(0);
      setTransportAmountPaid('0');
      setTempBusNumber('');
    }
  };

  // Helper function to update Lunch Fee based on Period & Enrollment
  const updateLunchFee = (enrollment, period, periods = allLunchPeriodsList) => {
    if (enrollment === 'Lunch at School') {
      const match = periods.find(p => p.period?.toLowerCase() === period?.toLowerCase());
      const fee = match ? match.feeAmount : (
        period === 'Annual' ? 25000 : 
        period === 'Quarterly' ? 7000 : 2500
      );
      setLunchFeeAmount(fee);
      setLunchAmountPaid(fee.toString());
    } else {
      setLunchFeeAmount(0);
      setLunchAmountPaid('0');
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

  const handleLunchEnrollmentChange = (enrollment) => {
    setTempLunchEnrollment(enrollment);
    updateLunchFee(enrollment, tempLunchPeriod);
  };

  const handleLunchPeriodChange = (period) => {
    setTempLunchPeriod(period);
    updateLunchFee(tempLunchEnrollment, period);
  };

  useEffect(() => {
    fetchStats();
    fetchQueue();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.get('/fees/uniforms/stats');
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
      const data = await api.get('/fees/uniforms/queue');
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
        data = await api.get('/fees/uniforms/queue');
      } else if (type === 'approved') {
        const res = await api.get('/fees/uniforms/requests');
        data = res.filter(r => r.status === 'APPROVED');
      } else if (type === 'completed') {
        const res = await api.get('/reports/uniforms');
        data = res.filter(r => r.status === 'Paid' || r.student?.clearanceStatus === 'COMPLETED');
      }
      setMetricDetailData(data);
    } catch (err) {
      console.error('Error fetching uniform metrics:', err);
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
      await api.post('/fees/uniforms/action', {
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

  // Accept action: opens distribution form & setups wizard stepper
  const handleAcceptClick = async (request) => {
    setActiveRequest(request);
    setFormError('');
    setSelectedItems([]);
    setAmountPaid('');
    setUniformReceipt(null);
    setTransportReceipt(null);
    setLunchReceipt(null);

    // Initial step determination
    const status = request.student.clearanceStatus;
    if (status === 'TRANSPORT_PENDING') {
      setCurrentStep(2);
    } else if (status === 'LUNCH_PENDING') {
      setCurrentStep(3);
    } else {
      setCurrentStep(1);
    }

    const st = request.student;
    // Prefill the temp selection states with the student's existing values.
    setTempTransportEnrollment(st.transportEnrollment || 'No');
    setTempTransportType(st.transportType || 'Parent Transport');
    setTempBusRoute(st.busRoute || '');
    setTempBusNumber(st.busNumber || '');
    setTempPickupLocation(st.pickupLocation || '');
    setTempDropLocation(st.dropLocation || '');
    setTempBoardingPoint(st.boardingPoint || '');

    setTempLunchEnrollment(st.lunchEnrollment || 'Not Taking School Lunch');
    setTempLunchPeriod(st.lunchPeriod || 'Monthly');

    try {
      // 1. Fetch Uniform config
      const config = await api.get(`/fees/uniforms/config/${st.class}?schoolType=${st.schoolType}`);
      setClassItems(config.items || []);
      setUniformFeeAmount(config.feeAmount || 2500);
      setSelectedItems(config.items || []);

      // Initialize selected sizes map
      const initialSizes = {};
      (config.items || []).forEach(item => {
        initialSizes[item] = '32';
      });
      setSelectedSizes(initialSizes);

      // 2. Fetch all transportation routes and lunch periods configurations
      const routes = await api.get('/classes/transportation');
      setAllRoutesList(routes || []);

      const periods = await api.get('/classes/lunch');
      setAllLunchPeriodsList(periods || []);

      // Determine initial route and lunch period
      const defaultRoute = st.busRoute || (routes[0]?.route || '');
      const defaultPeriod = st.lunchPeriod || 'Monthly';

      if (!st.busRoute && routes[0]?.route) {
        setTempBusRoute(routes[0].route);
      }

      // Initialize transport fee amount setup
      updateTransportFee(st.transportEnrollment || 'No', st.transportType || 'Parent Transport', defaultRoute, routes);
      
      // Initialize lunch fee amount setup
      updateLunchFee(st.lunchEnrollment || 'Not Taking School Lunch', defaultPeriod, periods);

    } catch (err) {
      console.error(err);
      setFormError('Failed to load catalog configurations');
    }
  };

  // Toggle item checklist checkbox
  const handleItemToggle = (item) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(prev => prev.filter(i => i !== item));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  // Handle Step 1: Uniform form submission
  const handleDistributionSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (Number(amountPaid) !== uniformFeeAmount) {
      setFormError(`Uniform fee must be paid in full (₹${uniformFeeAmount.toLocaleString()}). Partial payment is not allowed.`);
      return;
    }

    isSubmittingRef.current = true;
    setFormSubmitting(true);
    setFormError('');

    try {
      const formattedItems = selectedItems.map(item => ({
        name: item,
        size: selectedSizes[item] || '32'
      }));

      const res = await api.post('/fees/uniforms/distribute', {
        studentId: activeRequest.student._id,
        requestId: activeRequest._id,
        itemsIssued: formattedItems,
        feeAmount: uniformFeeAmount,
        amountPaid: Number(amountPaid),
        paymentMethod,
        
        // Dynamic services configurations
        transportEnrollment: tempTransportEnrollment,
        transportType: tempTransportType,
        busRoute: tempBusRoute,
        busNumber: tempBusNumber,
        pickupLocation: tempPickupLocation,
        dropLocation: tempDropLocation,
        boardingPoint: tempBoardingPoint,
        lunchEnrollment: tempLunchEnrollment,
        lunchPeriod: tempLunchPeriod
      });

      if (res.payment) {
        setUniformReceipt(res.payment);
      }

      const nextStatus = res.clearanceStatus;
      if (nextStatus === 'TRANSPORT_PENDING') {
        setCurrentStep(2);
      } else if (nextStatus === 'LUNCH_PENDING') {
        setCurrentStep(3);
      } else {
        // Completed
        setCurrentStep(4);
        setSuccessMsg('Uniform clearance completed successfully!');
        fetchStats();
        fetchQueue();
      }
    } catch (err) {
      setFormError(err.message || 'Uniform distribution submission failed');
    } finally {
      isSubmittingRef.current = false;
      setFormSubmitting(false);
    }
  };

  // Handle Step 2: Transportation form submission
  const handleTransportSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (Number(transportAmountPaid) !== transportFeeAmount) {
      setFormError(`Transportation fee must be paid in full (₹${transportFeeAmount.toLocaleString()}). Partial payment is not allowed.`);
      return;
    }

    isSubmittingRef.current = true;
    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await api.post('/fees/uniforms/transport', {
        studentId: activeRequest.student._id,
        requestId: activeRequest._id,
        feeAmount: transportFeeAmount,
        amountPaid: Number(transportAmountPaid),
        paymentMethod: transportPaymentMethod,

        // Pass latest transport configuration choices
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

      const nextStatus = res.clearanceStatus;
      if (nextStatus === 'LUNCH_PENDING') {
        setCurrentStep(3);
      } else {
        // Completed
        setCurrentStep(4);
        setSuccessMsg('Transportation fee payment completed successfully!');
        fetchStats();
        fetchQueue();
      }
    } catch (err) {
      setFormError(err.message || 'Transportation fee submission failed');
    } finally {
      isSubmittingRef.current = false;
      setFormSubmitting(false);
    }
  };

  // Handle Step 3: Lunch form submission
  const handleLunchSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (Number(lunchAmountPaid) !== lunchFeeAmount) {
      setFormError(`Lunch fee must be paid in full (₹${lunchFeeAmount.toLocaleString()}). Partial payment is not allowed.`);
      return;
    }

    isSubmittingRef.current = true;
    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await api.post('/fees/uniforms/lunch', {
        studentId: activeRequest.student._id,
        requestId: activeRequest._id,
        feeAmount: lunchFeeAmount,
        amountPaid: Number(lunchAmountPaid),
        paymentMethod: lunchPaymentMethod,

        // Pass latest lunch configuration choices
        lunchEnrollment: tempLunchEnrollment,
        lunchPeriod: tempLunchPeriod
      });

      if (res.payment) {
        setLunchReceipt(res.payment);
      }

      setCurrentStep(4);
      setSuccessMsg('Lunch facility fee payment completed successfully!');
      fetchStats();
      fetchQueue();
    } catch (err) {
      setFormError(err.message || 'Lunch fee submission failed');
    } finally {
      isSubmittingRef.current = false;
      setFormSubmitting(false);
    }
  };

  // Print receipt function
  const handlePrintReceipt = (payment) => {
    if (!payment) return;
    const printContent = `
      <html>
        <head>
          <title>Fee Receipt - \${payment.receiptNumber}</title>
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
                <p>Receipt No: \${payment.receiptNumber}</p>
              </div>
            </div>
            
            <div class="details">
              <div>
                <p><span class="label">Student ID:</span> \${activeRequest?.student?.studentId || 'N/A'}</p>
                <p><span class="label">Admission No:</span> \${activeRequest?.student?.admissionNumber || 'N/A'}</p>
                <p><span class="label">Name:</span> \${activeRequest?.student?.name || 'N/A'}</p>
                <p><span class="label">Class & Section:</span> \${activeRequest?.student?.class || 'N/A'} - \${activeRequest?.student?.section || 'N/A'}</p>
              </div>
              <div>
                <p><span class="label">Receipt Date:</span> \${new Date(payment.paymentDate).toLocaleDateString()}</p>
                <p><span class="label">Payment Method:</span> \${payment.paymentMethod}</p>
                <p><span class="label">Transaction Ref:</span> \${payment.transactionRef || 'N/A'}</p>
                <p><span class="label">Authorized By:</span> \${payment.staffName}</p>
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
                  <td>\${payment.feeType} Fee Payment Clearance</td>
                  <td style="text-align: right;">₹\${payment.amount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="total-section">
              <span>Total Received: ₹\${payment.amount.toLocaleString('en-IN')}</span>
            </div>
            
            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>This is a system-generated official fee receipt of EduClearance Academy.</p>
              <p>Date Generated: \${new Date().toLocaleString()}</p>
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
      {activeTab === 'uniform-overview' ? (
        <>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-400/10 border border-rose-400/20 px-3 py-1 rounded-full">
              Uniform Desk Workspace
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Welcome back, {user?.name || 'Store Manager'}!</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Monitor school uniform clearances, issue configured class sets, and sign off uniform clearance queues.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('uniform-queue')}
            className="flex items-center space-x-2 bg-rose-550 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-3 rounded-2xl text-xs transition-all shadow-lg hover:shadow-rose-600/10 cursor-pointer hover:scale-[1.01]"
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
                  <div className="h-10 w-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                    <Shirt className="h-5 w-5" />
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
                    <span className="text-xs font-medium text-slate-650 truncate max-w-[180px] block">{user?.email}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="h-10 w-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Department Clearance Role</span>
                    <span className="text-xs font-extrabold text-slate-800">Uniform Department</span>
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
                { label: 'Cleared Uniforms', val: stats?.completedDistributions ?? 0, icon: Shirt, color: 'text-rose-600', bg: 'bg-rose-50/80 border-rose-100/50', type: 'completed' }
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
                  <p className="text-[10px] text-slate-400 mt-0.5">Students waiting for school uniform clearances</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-650 border border-slate-200/50">
                  {queue.length} Pending
                </span>
              </div>

              {queueLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-rose-500 animate-spin" />
                </div>
              ) : queue.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-650">No uniform clearance requests in queue.</p>
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
                          setActiveTab('uniform-queue');
                          handleAcceptClick(req);
                        }}
                        className="inline-flex items-center space-x-1 font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-2 rounded-xl transition-colors cursor-pointer text-[10px]"
                      >
                        <Check className="h-3 w-3" />
                        <span>Accept Request</span>
                      </button>
                    </div>
                  ))}
                  {queue.length > 3 && (
                    <button
                      onClick={() => setActiveTab('uniform-queue')}
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
          <h2 className="text-xl font-bold text-slate-900">Uniform Distribution &amp; Clearance</h2>
          <p className="text-xs text-slate-500">Uniform store manager dashboard &amp; school uniform items issue clearance queue</p>
        </div>
        <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
          <Shirt className="h-6 w-6" />
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
              { label: 'Completed Clearances', val: stats.completedDistributions, icon: Shirt, color: 'text-rose-600', bg: 'bg-rose-50/80 border-rose-100/50', type: 'completed' }
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
          <p className="text-[11px] text-slate-400 mt-0.5">Students who cleared Book distributions and are waiting for Uniform materials</p>
        </div>

        {queueLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-rose-600"></div>
          </div>
        ) : queue.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            No uniform distribution requests in queue. Everything caught up!
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
                        className="inline-flex items-center space-x-1 font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
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

      {/* ==========================================       {/* 3. UNIFORM DISTRIBUTION MODAL */}
      {/* ========================================== */}
      {activeRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-[#0B192C] text-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold">Uniform &amp; Services Clearance Stepper</h4>
                <p className="text-[10px] text-slate-300">Student: {activeRequest.student.name} ({activeRequest.student.studentId})</p>
              </div>
              <button onClick={() => setActiveRequest(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper Wizard Header */}
            {currentStep < 4 && (
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      currentStep === 1 
                        ? 'bg-rose-600 text-white' 
                        : currentStep > 1 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-200 text-slate-650'
                    }`}>
                      {currentStep > 1 ? '✓' : '1'}
                    </span>
                    <span className={`font-bold ${currentStep === 1 ? 'text-slate-800' : 'text-slate-450'}`}>Uniforms</span>
                  </div>
                  
                  {tempTransportEnrollment === 'Yes' && tempTransportType === 'School Bus' && (
                    <>
                      <span className="text-slate-300">/</span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          currentStep === 2 
                            ? 'bg-rose-600 text-white' 
                            : currentStep > 2 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-slate-200 text-slate-650'
                        }`}>
                          {currentStep > 2 ? '✓' : '2'}
                        </span>
                        <span className={`font-bold ${currentStep === 2 ? 'text-slate-800' : 'text-slate-450'}`}>Transportation</span>
                      </div>
                    </>
                  )}
 
                  {tempLunchEnrollment === 'Lunch at School' && (
                    <>
                      <span className="text-slate-300">/</span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          currentStep === 3 
                            ? 'bg-rose-600 text-white' 
                            : currentStep > 3 
                              ? 'bg-emerald-550 text-white' 
                              : 'bg-slate-200 text-slate-650'
                        }`}>
                          {currentStep > 3 ? '✓' : '3'}
                        </span>
                        <span className={`font-bold ${currentStep === 3 ? 'text-slate-800' : 'text-slate-450'}`}>Lunch Facility</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="text-[10px] text-slate-455 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-250">
                  Step {currentStep} of {
                    1 + 
                    (tempTransportEnrollment === 'Yes' && tempTransportType === 'School Bus' ? 1 : 0) +
                    (tempLunchEnrollment === 'Lunch at School' ? 1 : 0)
                  }
                </div>
              </div>
            )}

            {/* Step 1: Uniform Checklist & Payment */}
            {currentStep === 1 && (
              <form onSubmit={handleDistributionSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                
                {/* Info grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-455">Class &amp; Section</span>
                    <span className="font-semibold text-slate-800">{activeRequest.student.class} - {activeRequest.student.section}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-455">Roll Number</span>
                    <span className="font-semibold text-slate-800">{activeRequest.student.rollNumber}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-455">School Board</span>
                    <span className="font-semibold text-slate-800">{activeRequest.student.schoolType}</span>
                  </div>
                </div>

                {/* Uniform checklist */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Select Uniform Items Issued
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-4 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                    {classItems.length === 0 ? (
                      <p className="text-xs text-slate-405 col-span-2 text-center py-2">No uniform items configured for this class.</p>
                    ) : (
                      classItems.map((item, idx) => {
                        const isChecked = selectedItems.includes(item);
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition-colors ${
                              isChecked 
                                ? 'bg-rose-500/5 text-rose-800 border-rose-250 shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleItemToggle(item)}
                              className="flex items-center space-x-2.5 text-left cursor-pointer flex-1 focus:outline-none"
                            >
                              <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                                isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isChecked && <Check className="h-3 w-3" />}
                              </div>
                              <span className="truncate text-slate-750">{item}</span>
                            </button>
                            
                            {isChecked && (
                              <select
                                value={selectedSizes[item] || '32'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedSizes(prev => ({
                                    ...prev,
                                    [item]: e.target.value
                                  }));
                                }}
                                className="ml-2 border border-slate-250 bg-white text-slate-705 font-bold px-1.5 py-0.5 rounded text-[10px] focus:outline-none focus:border-rose-600 cursor-pointer"
                              >
                                {['28', '30', '32', '34', '36', 'N/A'].map(sz => (
                                  <option key={sz} value={sz}>{sz}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Services Enrollment Details */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4 text-xs">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5">
                    <Bus className="h-3.5 w-3.5 text-rose-600" />
                    <span>Dynamic Service Enrollment</span>
                  </h5>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Transportation Card */}
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Transportation</label>
                      <select
                        value={tempTransportEnrollment}
                        onChange={(e) => handleTransportEnrollmentChange(e.target.value)}
                        className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
                      >
                        <option value="No">No (Opted Out)</option>
                        <option value="Yes">Yes (Opted In)</option>
                      </select>

                      {tempTransportEnrollment === 'Yes' && (
                        <>
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-0.5 uppercase">Transport Type</label>
                            <select
                              value={tempTransportType}
                              onChange={(e) => handleTransportTypeChange(e.target.value)}
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
                            >
                              <option value="School Bus">School Bus</option>
                              <option value="Parent Transport">Parent Transport</option>
                              <option value="Outsourced Transport">Outsourced Transport</option>
                            </select>
                          </div>

                          {tempTransportType === 'School Bus' && (
                            <>
                              <div>
                                <label className="block text-[9px] font-semibold text-slate-500 mb-0.5 uppercase">Bus Route</label>
                                <select
                                  value={tempBusRoute}
                                  onChange={(e) => handleBusRouteChange(e.target.value)}
                                  className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
                                >
                                  {allRoutesList.map((r, idx) => (
                                    <option key={idx} value={r.route}>
                                      {r.route} (₹{r.feeAmount?.toLocaleString()})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="block text-[9px] font-semibold text-slate-500 mb-0.5 uppercase">Boarding Point</label>
                                  <input
                                    type="text"
                                    value={tempBoardingPoint}
                                    onChange={(e) => setTempBoardingPoint(e.target.value)}
                                    placeholder="e.g. Stop A"
                                    className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-semibold text-slate-500 mb-0.5 uppercase">Bus Number</label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={tempBusNumber}
                                    placeholder="Bus No."
                                    className="block w-full border border-slate-200 bg-slate-100 rounded-lg px-2 py-1 text-xs focus:outline-none text-slate-500 font-mono"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Lunch Facility Card */}
                    <div className="space-y-2.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Lunch Facility</label>
                      <select
                        value={tempLunchEnrollment}
                        onChange={(e) => handleLunchEnrollmentChange(e.target.value)}
                        className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
                      >
                        <option value="Not Taking School Lunch">Not Taking School Lunch</option>
                        <option value="Lunch at School">Lunch at School</option>
                      </select>

                      {tempLunchEnrollment === 'Lunch at School' && (
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 mb-0.5 uppercase">Billing Period</label>
                          <select
                            value={tempLunchPeriod}
                            onChange={(e) => handleLunchPeriodChange(e.target.value)}
                            className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
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
                  </div>
                </div>

                {/* Uniform Fee and payment Details */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Standard Uniform Fee:</span>
                      <span className="font-semibold text-slate-800">₹{uniformFeeAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-505 font-medium">Amount Paid (₹):</span>
                      <input
                        type="number"
                        required
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="Amount collected"
                        className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-rose-600 font-bold"
                      />
                    </div>
                    <div className="flex justify-between text-rose-750 font-bold border-t border-dashed border-slate-200 pt-2 text-rose-700">
                      <span>Balance Outstanding:</span>
                      <span>₹{Math.max(0, uniformFeeAmount - (Number(amountPaid) || 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-3.5 border border-slate-200/60 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">PAYMENT METHOD</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer"
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
                    disabled={formSubmitting || classItems.length === 0}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {formSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      'Record Uniform Distribution & Next'
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* Step 2: Transportation Clearance */}
            {currentStep === 2 && (
              <form onSubmit={handleTransportSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Route detail fields */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transportation Enrollment</label>
                    <select
                      value={tempTransportEnrollment}
                      onChange={(e) => handleTransportEnrollmentChange(e.target.value)}
                      className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
                    >
                      <option value="No">No (Opt Out/Skip Transport Fee)</option>
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
                            className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
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
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
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
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Pickup Location</label>
                            <input
                              type="text"
                              value={tempPickupLocation}
                              onChange={(e) => setTempPickupLocation(e.target.value)}
                              placeholder="Pickup"
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-semibold mb-1">Drop Location</label>
                            <input
                              type="text"
                              value={tempDropLocation}
                              onChange={(e) => setTempDropLocation(e.target.value)}
                              placeholder="Drop"
                              className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Transport Fee and payment Details */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Transportation Route Fee:</span>
                      <span className="font-semibold text-slate-800">₹{transportFeeAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Amount Paid (₹):</span>
                      <input
                        type="number"
                        required
                        value={transportAmountPaid}
                        onChange={(e) => setTransportAmountPaid(e.target.value)}
                        placeholder="Amount collected"
                        className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-rose-600 font-bold"
                      />
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold border-t border-dashed border-slate-200 pt-2">
                      <span>Balance Outstanding:</span>
                      <span>₹{Math.max(0, transportFeeAmount - (Number(transportAmountPaid) || 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-3.5 border border-slate-200/60 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">PAYMENT METHOD</label>
                      <select
                        value={transportPaymentMethod}
                        onChange={(e) => setTransportPaymentMethod(e.target.value)}
                        className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
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
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {formSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      'Record Transportation Clearance & Next'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Lunch Clearance */}
            {currentStep === 3 && (
              <form onSubmit={handleLunchSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Meal plan info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lunch Enrollment</label>
                    <select
                      value={tempLunchEnrollment}
                      onChange={(e) => handleLunchEnrollmentChange(e.target.value)}
                      className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
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
                        className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
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
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Lunch Plan Fee:</span>
                      <span className="font-semibold text-slate-800">₹{lunchFeeAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Amount Paid (₹):</span>
                      <input
                        type="number"
                        required
                        value={lunchAmountPaid}
                        onChange={(e) => setLunchAmountPaid(e.target.value)}
                        placeholder="Amount collected"
                        className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-rose-600 font-bold"
                      />
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold border-t border-dashed border-slate-200 pt-2">
                      <span>Balance Outstanding:</span>
                      <span>₹{Math.max(0, lunchFeeAmount - (Number(lunchAmountPaid) || 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-3.5 border border-slate-200/60 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">PAYMENT METHOD</label>
                      <select
                        value={lunchPaymentMethod}
                        onChange={(e) => setLunchPaymentMethod(e.target.value)}
                        className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-rose-600 cursor-pointer font-medium"
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
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {formSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      'Record Lunch Clearance & Complete'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Complete/Success Screen */}
            {currentStep === 4 && (
              <div className="p-8 space-y-6 text-center overflow-y-auto flex-1">
                <div className="h-16 w-16 bg-emerald-50 text-emerald-500 border border-emerald-250 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="h-10 w-10" />
                </div>
                
                <div>
                  <h5 className="text-base font-black text-slate-900">All Clearance Steps Completed!</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Student {activeRequest.student.name} is now fully cleared. Download the generated official payment receipts below:
                  </p>
                </div>

                <div className="space-y-2.5 max-w-md mx-auto">
                  {uniformReceipt && (
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                      <div className="text-left">
                        <span className="font-bold text-slate-850">Uniform Fee Receipt</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">No: {uniformReceipt.receiptNumber} | Amount: ₹{uniformReceipt.amount.toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(uniformReceipt)}
                        className="flex items-center space-x-1 font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200/50 cursor-pointer text-[10px]"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </div>
                  )}

                  {transportReceipt && (
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                      <div className="text-left">
                        <span className="font-bold text-slate-850">Transportation Fee Receipt</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">No: {transportReceipt.receiptNumber} | Amount: ₹{transportReceipt.amount.toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(transportReceipt)}
                        className="flex items-center space-x-1 font-bold text-cyan-600 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg border border-cyan-200/50 cursor-pointer text-[10px]"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </div>
                  )}

                  {lunchReceipt && (
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                      <div className="text-left">
                        <span className="font-bold text-slate-850">Lunch Plan Fee Receipt</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">No: {lunchReceipt.receiptNumber} | Amount: ₹{lunchReceipt.amount.toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(lunchReceipt)}
                        className="flex items-center space-x-1 font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200/50 cursor-pointer text-[10px]"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        <span>Print Receipt</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveRequest(null);
                    fetchStats();
                    fetchQueue();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Done &amp; Close Clearance Modal
                </button>
              </div>
            )}
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
                <span>Rejecting will return the student status to Book Clearance Pending. Explain details below.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Remarks / Reason</label>
                <textarea
                  required
                  placeholder="e.g. Incomplete books issued, audit mistake, etc."
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
        </>
      )}

      {/* METRICS DETAILS MODAL */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden animate-slide-up my-8">
            {/* Header */}
            <div className="px-6 py-4.5 bg-[#0B192C] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2.5 py-0.5 rounded-full">
                  Uniform Desk Analytics
                </span>
                <h4 className="text-base font-black mt-1">
                  {selectedMetric === 'pending' && 'Pending Uniform Clearance Queue'}
                  {selectedMetric === 'approved' && 'Approved Uniform Distributions'}
                  {selectedMetric === 'completed' && 'Completed Uniform Clearances'}
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
                  className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-850 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-600 text-xs transition-all"
                />
              </div>

              {/* Data Content */}
              {metricDetailLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-rose-600 animate-spin" />
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
                            <th className="py-3 px-4 bg-slate-50">Book Status</th>
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
                                    {(item.itemsIssued || []).map((i, iIdx) => (
                                      <span key={iIdx} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-mono truncate">{i}</span>
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
                                <td className="py-3.5 px-4 text-slate-505 italic truncate max-w-[150px]">{item.remarks || 'None'}</td>
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
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-855 border border-amber-200">
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
    </div>
  );
}
