'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Receipt, Users, CheckCircle, Clock, TrendingUp, ShieldAlert, Loader2, FileDown, Check } from 'lucide-react';

export default function TuitionDashboard() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Form states
  const [schoolType, setSchoolType] = useState('');
  const [classList, setClassList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [sectionList, setSectionList] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Selected Student Details
  const [studentDetails, setStudentDetails] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [fetchingStudent, setFetchingStudent] = useState(false);

  // Payment Inputs
  const [discount, setDiscount] = useState(0);
  const [fine, setFine] = useState(0);
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  
  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastPayment, setLastPayment] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchClasses();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.get('/fees/tuition/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const configs = await api.get('/classes');
      setClassList(configs);
    } catch (err) {
      console.error(err);
    }
  };

  // Dependent Dropdowns Logic
  // Filter classes based on schoolType
  const getFilteredClasses = () => {
    if (!schoolType) return [];
    return classList.filter(c => c.schoolType === schoolType);
  };

  // When schoolType changes, reset class, section, student
  const handleSchoolTypeChange = (e) => {
    setSchoolType(e.target.value);
    setSelectedClass('');
    setSectionList([]);
    setSelectedSection('');
    setStudentList([]);
    setSelectedStudentId('');
    resetStudentForm();
  };

  // When class changes, update section options
  const handleClassChange = (e) => {
    const className = e.target.value;
    setSelectedClass(className);
    setSelectedSection('');
    setStudentList([]);
    setSelectedStudentId('');
    resetStudentForm();

    const config = classList.find(c => c.schoolType === schoolType && c.name === className);
    setSectionList(config ? config.sections : []);
  };

  // When section changes, fetch students
  const handleSectionChange = async (e) => {
    const sect = e.target.value;
    setSelectedSection(sect);
    setSelectedStudentId('');
    resetStudentForm();

    if (!schoolType || !selectedClass || !sect) return;

    try {
      const list = await api.get(`/students?schoolType=${schoolType}&class=${selectedClass}&section=${sect}`);
      setStudentList(list);
    } catch (err) {
      console.error(err);
    }
  };

  // When student is selected, fetch their detailed tuition log
  const handleStudentChange = async (e) => {
    const stuId = e.target.value;
    setSelectedStudentId(stuId);
    resetStudentForm();

    if (!stuId) return;

    setFetchingStudent(true);
    try {
      const tuitionRec = await api.get(`/fees/tuition/student/${stuId}`);
      setStudentDetails(tuitionRec.student);
      setFeeDetails(tuitionRec);
      
      // Pre-fill inputs from record
      setDiscount(tuitionRec.discount || 0);
      setFine(tuitionRec.fine || 0);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load student tuition records');
    } finally {
      setFetchingStudent(false);
    }
  };

  const resetStudentForm = () => {
    setStudentDetails(null);
    setFeeDetails(null);
    setDiscount(0);
    setFine(0);
    setAmountPaidInput('');
    setTransactionRef('');
    setSuccessMsg('');
    setErrorMsg('');
    setLastPayment(null);
  };

  // Real-time calculations
  const calculateTotalAmount = () => {
    if (!feeDetails) return 0;
    return feeDetails.feeAmount - Number(discount) + Number(fine);
  };

  const calculateNewBalance = () => {
    if (!feeDetails) return 0;
    const currentPaid = feeDetails.amountPaid || 0;
    const newPaid = Number(amountPaidInput) || 0;
    const tot = calculateTotalAmount();
    return Math.max(0, tot - (currentPaid + newPaid));
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || amountPaidInput === '' || Number(amountPaidInput) < 0) {
      setErrorMsg('Please specify a valid payment amount');
      return;
    }

    const inputAmt = Number(amountPaidInput);
    if (inputAmt > calculateTotalAmount() - (feeDetails.amountPaid || 0)) {
      setErrorMsg('Amount paid exceeds outstanding balance');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await api.post('/fees/tuition/collect', {
        studentId: selectedStudentId,
        discount: Number(discount),
        fine: Number(fine),
        amountPaid: inputAmt,
        paymentMethod,
        transactionRef
      });

      setSuccessMsg('Payment successfully clearing! Student clearance workflow updated.');
      setLastPayment(result.payment);
      
      // Refresh statistics and active student display
      fetchStats();
      // Re-trigger student fetch to update balance values in form
      const updatedTuition = await api.get(`/fees/tuition/student/${selectedStudentId}`);
      setFeeDetails(updatedTuition);
      setAmountPaidInput('');
      setTransactionRef('');
    } catch (err) {
      setErrorMsg(err.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!lastPayment || !studentDetails) return;
    
    const printContent = `
      <html>
        <head>
          <title>Tuition Receipt - ${lastPayment.receiptNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; padding: 40px; }
            .receipt-box { border: 2px solid #eaeaea; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px dashed #eaeaea; padding-bottom: 20px; margin-bottom: 20px; }
            .school-logo { font-size: 22px; font-weight: bold; color: #0b192c; }
            .title h1 { margin: 0; font-size: 18px; color: #4f46e5; text-transform: uppercase; }
            .title p { margin: 5px 0 0 0; font-size: 11px; color: #666; }
            .details { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 12px; }
            .details .label { font-weight: bold; color: #555; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .table th { background: #f8fafc; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #eaeaea; }
            .table td { padding: 10px; border-bottom: 1px solid #eaeaea; font-size: 12px; }
            .total-section { text-align: right; font-size: 13px; font-weight: bold; margin-bottom: 30px; }
            .footer { text-align: center; border-top: 1px solid #eaeaea; padding-top: 20px; font-size: 10px; color: #777; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="school-logo">EduClearance Academy</div>
              <div class="title">
                <h1>Official Receipt</h1>
                <p>No: ${lastPayment.receiptNumber}</p>
              </div>
            </div>
            
            <div class="details">
              <div>
                <p><span class="label">Student ID:</span> ${studentDetails.studentId}</p>
                <p><span class="label">Admission No:</span> ${studentDetails.admissionNumber}</p>
                <p><span class="label">Name:</span> ${studentDetails.name}</p>
                <p><span class="label">Class & Section:</span> ${studentDetails.class} - ${studentDetails.section}</p>
              </div>
              <div>
                <p><span class="label">Receipt Date:</span> ${new Date(lastPayment.paymentDate).toLocaleDateString()}</p>
                <p><span class="label">Payment Method:</span> ${lastPayment.paymentMethod}</p>
                <p><span class="label">Transaction Ref:</span> ${lastPayment.transactionRef || 'N/A'}</p>
                <p><span class="label">Collected By:</span> ${lastPayment.staffName}</p>
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
                  <td>Tuition Fee Collection Payment (CBSE/ICSE Course)</td>
                  <td style="text-align: right;">₹${lastPayment.amount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="total-section">
              <span>Total Received: ₹${lastPayment.amount.toLocaleString('en-IN')}</span>
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
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tuition Fee Clearance Portal</h2>
          <p className="text-xs text-slate-500">Accounts collection dashboard &amp; sequential student clearance billing</p>
        </div>
        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <Receipt className="h-6 w-6" />
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. METRICS CARDS */}
      {/* ========================================== */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
                <p className="text-lg font-bold text-slate-800">{stats.totalStudents}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fully Paid</p>
                <p className="text-lg font-bold text-slate-800">{stats.paidStudents}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Paid</p>
                <p className="text-lg font-bold text-slate-800">{stats.pendingStudents}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3 col-span-1">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Collected Amt</p>
                <p className="text-lg font-bold text-slate-800">₹{stats.collectedAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3 col-span-1">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Outstanding</p>
                <p className="text-lg font-bold text-slate-800">₹{stats.pendingAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

          </div>
        )
      )}

      {/* ========================================== */}
      {/* 2. PAYMENT COLLECT FORM */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dropdowns Selection Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-2">
            Student Selector
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">School Type</label>
            <select
              value={schoolType}
              onChange={handleSchoolTypeChange}
              className="block w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
            >
              <option value="">-- Select schoolType --</option>
              <option value="CBSE">CBSE (Central Board)</option>
              <option value="ICSE">ICSE (Indian Certificate)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Class</label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              disabled={!schoolType}
              className="block w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- Select Class --</option>
              {getFilteredClasses().map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Section</label>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              disabled={!selectedClass}
              className="block w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- Select Section --</option>
              {sectionList.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Student Name</label>
            <select
              value={selectedStudentId}
              onChange={handleStudentChange}
              disabled={!selectedSection}
              className="block w-full border border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- Select Student --</option>
              {studentList.map(stu => (
                <option key={stu._id} value={stu._id}>
                  {stu.name} (Roll: {stu.rollNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment and Auto details Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
            Tuition Clearance Billing Form
          </h3>

          {fetchingStudent ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : !studentDetails ? (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col justify-center items-center text-center p-4">
              <Receipt className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">Select a student from the left panel to fetch tuition structures and record payments.</p>
            </div>
          ) : (
            <form onSubmit={handleCollectPayment} className="space-y-5">
              
              {/* Auto Fetched Student info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="block font-medium text-slate-400">Student ID</span>
                  <span className="font-semibold text-slate-800">{studentDetails.studentId}</span>
                </div>
                <div>
                  <span className="block font-medium text-slate-400">Admission No</span>
                  <span className="font-semibold text-slate-800">{studentDetails.admissionNumber}</span>
                </div>
                <div>
                  <span className="block font-medium text-slate-400">Roll / Section</span>
                  <span className="font-semibold text-slate-800">{studentDetails.rollNumber} / {studentDetails.section}</span>
                </div>
                <div>
                  <span className="block font-medium text-slate-400">Parents Mob</span>
                  <span className="font-semibold text-slate-800">{studentDetails.parentMobile}</span>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-800">Clearance Status:</span>
                <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase ${
                  feeDetails.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : feeDetails.status === 'Partial'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {feeDetails.status}
                </span>
              </div>

              {/* Fee and Inputs Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Fixed Details Column */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">Annual Tuition Fee:</span>
                    <span className="font-semibold text-slate-800">₹{feeDetails.feeAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="text-slate-500">Authorized Discount (₹):</label>
                    <input
                      type="number"
                      value={discount}
                      disabled={feeDetails.status === 'Paid'}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                      className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="text-slate-500">Fines / Additions (₹):</label>
                    <input
                      type="number"
                      value={fine}
                      disabled={feeDetails.status === 'Paid'}
                      onChange={(e) => setFine(Math.max(0, Number(e.target.value)))}
                      className="w-24 border border-slate-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-slate-800">
                    <span>Adjusted Total:</span>
                    <span>₹{calculateTotalAmount().toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Previously Paid:</span>
                    <span className="font-medium text-slate-700">₹{feeDetails.amountPaid.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between font-bold border-t border-dashed border-slate-200 pt-2 text-indigo-700">
                    <span>Outstanding Balance:</span>
                    <span>₹{(calculateTotalAmount() - feeDetails.amountPaid).toLocaleString()}</span>
                  </div>
                </div>

                {/* Entry Inputs Column */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">PAYMENT AMOUNT (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="Enter amount to pay"
                      value={amountPaidInput}
                      disabled={feeDetails.status === 'Paid'}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      className="block w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">PAYMENT METHOD</label>
                    <select
                      value={paymentMethod}
                      disabled={feeDetails.status === 'Paid'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="block w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash Handover</option>
                      <option value="Card">Card Terminal Swipe</option>
                      <option value="NetBanking">Net Banking Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">TRANSACTION REF (OPTIONAL)</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI ID or Check Ref"
                      value={transactionRef}
                      disabled={feeDetails.status === 'Paid'}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="block w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50"
                    />
                  </div>
                </div>

              </div>

              {/* Status Preview */}
              {feeDetails.status !== 'Paid' && amountPaidInput !== '' && (
                <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-500">Remaining Balance After Payment:</span>
                  <span className="font-bold text-indigo-700">₹{calculateNewBalance().toLocaleString()}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex flex-col space-y-3">
                {errorMsg && (
                  <p className="text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-200">{errorMsg}</p>
                )}

                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 text-xs flex justify-between items-center">
                    <span className="font-medium">{successMsg}</span>
                    {lastPayment && (
                      <button
                        type="button"
                        onClick={handlePrintReceipt}
                        className="inline-flex items-center space-x-1 font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-1.5 rounded-lg cursor-pointer"
                      >
                        <FileDown className="h-4 w-4" />
                        <span>Print Receipt</span>
                      </button>
                    )}
                  </div>
                )}

                {feeDetails.status !== 'Paid' && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      'Collect Payment & Submit Clearance'
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
