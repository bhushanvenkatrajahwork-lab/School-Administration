'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  User, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Receipt, 
  BookOpen, 
  Shirt, 
  FileText, 
  UserCheck, 
  XCircle,
  HelpCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileDown,
  Bus,
  Utensils
} from 'lucide-react';

export default function StudentHistory({ studentId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [studentId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/students/${studentId}/history`);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load student history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
        <XCircle className="h-10 w-10 text-red-500 mb-2" />
        <p className="text-sm text-slate-800 font-semibold">{error || 'Student not found'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Back
        </button>
      </div>
    );
  }

  const { student, tuition, books, uniform, transport, lunch, payments, workflowHistory, activityHistory } = data;

  // Print receipt function
  const handlePrintReceipt = (payment) => {
    // We create a temporary print style iframe or print layout
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
                <p><span class="label">Student ID:</span> ${student.studentId}</p>
                <p><span class="label">Admission No:</span> ${student.admissionNumber}</p>
                <p><span class="label">Name:</span> ${student.name}</p>
                <p><span class="label">Class & Section:</span> ${student.class} - ${student.section}</p>
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
              <p>Date Generated: ${new Date().toLocaleString()}</p>
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

  // Determine stage visual status
  const getStageStatus = (stage) => {
    // Sequential stages check
    const status = student.clearanceStatus;
    if (stage === 'Tuition') {
      return status !== 'TUITION_PENDING' ? 'CLEARED' : 'PENDING';
    }
    if (stage === 'Book') {
      if (status === 'TUITION_PENDING' || status === 'BOOKS_PENDING') return 'PENDING';
      return 'CLEARED';
    }
    if (stage === 'Uniform') {
      if (['TRANSPORT_PENDING', 'LUNCH_PENDING', 'COMPLETED'].includes(status)) return 'CLEARED';
      if (uniform && uniform.status === 'Paid') return 'CLEARED';
      return 'PENDING';
    }
    if (stage === 'Transport') {
      if (['LUNCH_PENDING', 'COMPLETED'].includes(status)) return 'CLEARED';
      if (transport && transport.status === 'Paid') return 'CLEARED';
      return 'PENDING';
    }
    if (stage === 'Lunch') {
      if (status === 'COMPLETED') return 'CLEARED';
      if (lunch && lunch.status === 'Paid') return 'CLEARED';
      return 'PENDING';
    }
    return 'PENDING';
  };

  const getWorkflowApprover = (dept) => {
    const log = workflowHistory.find(w => w.department === dept && w.status === 'APPROVED');
    return log ? { date: log.actionedAt, user: log.actionedBy?.name || 'Staff' } : null;
  };

  const tuitionApprover = getWorkflowApprover('BOOK_DEPT'); // book dept approval is triggered after tuition cleared, or tuition log updatedBy
  const bookApprover = getWorkflowApprover('BOOK_DEPT');
  const uniformApprover = getWorkflowApprover('UNIFORM_DEPT');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clearance Timeline</h2>
          <p className="text-xs text-slate-500">Student Profile, Clearance workflows, and Receipts Ledger</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: PERSONAL PROFILE */}
        {/* ========================================== */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 flex items-end pb-4">
              <div className="h-16 w-16 bg-white border-4 border-white rounded-xl shadow-md flex items-center justify-center font-bold text-indigo-700 text-2xl uppercase">
                {student.name.slice(0, 2)}
              </div>
            </div>
            <div className="pt-10 px-6 pb-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                <span className={`inline-block text-[10px] font-semibold border px-2 py-0.5 rounded-full mt-1.5 uppercase ${
                  student.clearanceStatus === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {student.clearanceStatus.replace('_', ' ')}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Student ID</span>
                  <span className="font-semibold text-slate-800">{student.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Admission No</span>
                  <span className="font-semibold text-slate-800">{student.admissionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Roll Number</span>
                  <span className="font-semibold text-slate-800">{student.rollNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">School Type</span>
                  <span className="font-semibold text-slate-800">{student.schoolType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Class &amp; Section</span>
                  <span className="font-semibold text-slate-800">{student.class} - {student.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Academic Year</span>
                  <span className="font-semibold text-slate-800">{student.academicYear}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>DOB: {new Date(student.dob).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Parents: {student.fatherName} &amp; {student.motherName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>Mobile: {student.parentMobile}</span>
                </div>
                {student.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{student.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: WORKFLOW VISUAL TIMELINE & TRANS */}
        {/* ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Clearance Workflow Status Map */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">
              Clearance Progression Map
            </h3>

            <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              
              {/* Stage 1: Tuition clearance */}
              <div className="relative">
                <div className={`absolute -left-8 rounded-full h-7 w-7 border-4 border-white flex items-center justify-center text-white text-xs ${
                  getStageStatus('Tuition') === 'CLEARED' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  <Receipt className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">Tuition Fee Department</h4>
                    {getStageStatus('Tuition') === 'CLEARED' ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Cleared
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  {tuition ? (
                    <div className="mt-2 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <p>Total Fee: ₹{tuition.feeAmount} | Paid: ₹{tuition.amountPaid} | Balance: ₹{tuition.balanceAmount}</p>
                      {(tuition.status === 'Paid' || tuition.status === 'Partial') && (
                        <p className="text-[10px] text-slate-400">
                          Payment recorded on {new Date(tuition.paymentDate).toLocaleDateString()} via {tuition.paymentMethod} (Ref: {tuition.transactionRef || 'N/A'})
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Pending payment collection</p>
                  )}
                </div>
              </div>

              {/* Stage 2: Book clearance */}
              <div className="relative">
                <div className={`absolute -left-8 rounded-full h-7 w-7 border-4 border-white flex items-center justify-center text-white text-xs ${
                  getStageStatus('Book') === 'CLEARED' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">Book Distribution Department</h4>
                    {getStageStatus('Book') === 'CLEARED' ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Cleared
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  {books && (books.status === 'Paid' || books.status === 'Partial') ? (
                    <div className="mt-2 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <p>Book Fee: ₹{books.feeAmount} | Paid: ₹{books.amountPaid}</p>
                      <p className="font-semibold text-slate-700">Issued Books ({books.issuedBooks?.length || 0}):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {books.issuedBooks?.map((b, i) => (
                          <span key={i} className="bg-slate-200/70 text-slate-800 text-[9px] px-1.5 py-0.5 rounded">
                            ✓ {b}
                          </span>
                        ))}
                      </div>
                      {bookApprover && (
                        <p className="text-[10px] text-slate-400 pt-1">
                          Approved by {bookApprover.user} on {new Date(bookApprover.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {student.clearanceStatus === 'BOOKS_PENDING' ? 'Waiting in department queue' : 'Locked until Tuition is cleared'}
                    </p>
                  )}
                </div>
                    {/* Stage 3: Uniform clearance */}
              <div className="relative">
                <div className={`absolute -left-8 rounded-full h-7 w-7 border-4 border-white flex items-center justify-center text-white text-xs ${
                  getStageStatus('Uniform') === 'CLEARED' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  <Shirt className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">Uniform Distribution Department</h4>
                    {getStageStatus('Uniform') === 'CLEARED' ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Cleared
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  {uniform && (uniform.status === 'Paid' || uniform.status === 'Partial') ? (
                    <div className="mt-2 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <p>Uniform Fee: ₹{uniform.feeAmount} | Paid: ₹{uniform.amountPaid}</p>
                      <p className="font-semibold text-slate-700">Issued Uniform Items ({uniform.issuedItems?.length || 0}):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uniform.issuedItems?.map((item, i) => (
                          <span key={i} className="bg-slate-200/70 text-slate-800 text-[9px] px-1.5 py-0.5 rounded">
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                      {uniformApprover && (
                        <p className="text-[10px] text-slate-400 pt-1">
                          Approved by {uniformApprover.user} on {new Date(uniformApprover.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {student.clearanceStatus === 'UNIFORM_PENDING' ? 'Waiting in department queue' : 'Locked until Books are cleared'}
                    </p>
                  )}
                </div>
              </div>

              {/* Stage 4: Transportation clearance */}
              <div className="relative">
                <div className={`absolute -left-8 rounded-full h-7 w-7 border-4 border-white flex items-center justify-center text-white text-xs ${
                  student.transportEnrollment === 'Yes' && student.transportType === 'School Bus'
                    ? (getStageStatus('Transport') === 'CLEARED' ? 'bg-emerald-500' : 'bg-slate-300')
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <Bus className="h-3.5 w-3.5" />
                </div>
                <div>
                  {student.transportEnrollment === 'Yes' && student.transportType === 'School Bus' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Transportation Clearance</h4>
                        {getStageStatus('Transport') === 'CLEARED' ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Cleared
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      {transport && (transport.status === 'Paid' || transport.status === 'Partial') ? (
                        <div className="mt-2 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <p>Route: {student.busRoute} (Bus: {student.busNumber || 'N/A'})</p>
                          <p>Transport Fee: ₹{transport.feeAmount} | Paid: ₹{transport.amountPaid}</p>
                          {transport.paymentDate && (
                            <p className="text-[10px] text-slate-400">
                              Payment recorded on {new Date(transport.paymentDate).toLocaleDateString()} via {transport.paymentMethod}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {student.clearanceStatus === 'TRANSPORT_PENDING' ? 'Waiting for transportation fee payment' : 'Locked until Uniform is cleared'}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Transportation Clearance</h4>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {student.transportEnrollment === 'Yes' ? student.transportType : 'Not Enrolled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-450 mt-1">Auto-cleared (No bus fee required)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Stage 5: Lunch Facility clearance */}
              <div className="relative">
                <div className={`absolute -left-8 rounded-full h-7 w-7 border-4 border-white flex items-center justify-center text-white text-xs ${
                  student.lunchEnrollment === 'Lunch at School'
                    ? (getStageStatus('Lunch') === 'CLEARED' ? 'bg-emerald-500' : 'bg-slate-300')
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <Utensils className="h-3.5 w-3.5" />
                </div>
                <div>
                  {student.lunchEnrollment === 'Lunch at School' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Lunch Facility Clearance</h4>
                        {getStageStatus('Lunch') === 'CLEARED' ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Cleared
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      {lunch && (lunch.status === 'Paid' || lunch.status === 'Partial') ? (
                        <div className="mt-2 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <p>Period: {student.lunchPeriod}</p>
                          <p>Lunch Fee: ₹{lunch.feeAmount} | Paid: ₹{lunch.amountPaid}</p>
                          {lunch.paymentDate && (
                            <p className="text-[10px] text-slate-400">
                              Payment recorded on {new Date(lunch.paymentDate).toLocaleDateString()} via {lunch.paymentMethod}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {student.clearanceStatus === 'LUNCH_PENDING' ? 'Waiting for lunch fee payment' : 'Locked until Transport is cleared'}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">Lunch Facility Clearance</h4>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Not Enrolled
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-450 mt-1">Auto-cleared (Not taking school meals)</p>
                    </>
                  )}
                </div>
              </div>
              </div>

            </div>
          </div>

          {/* Payment History & Receipts Download */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Ledger Transactions &amp; Receipts
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No payment transactions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                  <thead>
                    <tr className="text-slate-400 font-semibold bg-slate-50/50">
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Fee Type</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{p.receiptNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            p.feeType === 'Tuition' 
                              ? 'bg-indigo-50 text-indigo-700' 
                              : p.feeType === 'Book' 
                                ? 'bg-amber-50 text-amber-700' 
                                : p.feeType === 'Uniform'
                                  ? 'bg-rose-50 text-rose-700'
                                  : p.feeType === 'Transportation'
                                    ? 'bg-cyan-50 text-cyan-700'
                                    : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {p.feeType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3">{p.paymentMethod}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handlePrintReceipt(p)}
                            className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileDown className="h-3 w-3" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Logs Activities for Student */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Audit Logs &amp; Activity History
            </h3>

            {activityHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No activity records logged yet.</p>
            ) : (
              <div className="space-y-4">
                {activityHistory.map(audit => (
                  <div key={audit._id} className="flex items-start space-x-3 text-xs">
                    <div className="h-2.5 w-2.5 bg-slate-300 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-800 font-semibold">{audit.details}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-500">Actor: {audit.user}</span>
                        <span>•</span>
                        <span>{new Date(audit.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
