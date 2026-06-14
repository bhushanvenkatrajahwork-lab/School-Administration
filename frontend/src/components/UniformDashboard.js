'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Shirt, Users, CheckCircle, Clock, Check, X, AlertCircle, Loader2 } from 'lucide-react';

export default function UniformDashboard() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);

  // Reject dialog state
  const [rejectId, setRejectId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Distribution form modal state
  const [activeRequest, setActiveRequest] = useState(null);
  const [classItems, setClassItems] = useState([]);
  const [uniformFeeAmount, setUniformFeeAmount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
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

  // Accept action: opens distribution form
  const handleAcceptClick = async (request) => {
    setActiveRequest(request);
    setFormError('');
    setSelectedItems([]);
    setAmountPaid('');

    try {
      const config = await api.get(`/fees/uniforms/config/${request.student.class}`);
      setClassItems(config.items || []);
      setUniformFeeAmount(config.feeAmount || 2500);

      // Auto select all items as default configuration
      setSelectedItems(config.items || []);
    } catch (err) {
      console.error(err);
      setFormError('Failed to load class uniform configs');
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

  // Handle form submission
  const handleDistributionSubmit = async (e) => {
    e.preventDefault();
    if (amountPaid === '' || Number(amountPaid) < 0) {
      setFormError('Please input a valid uniform fee paid amount');
      return;
    }

    if (Number(amountPaid) > uniformFeeAmount) {
      setFormError('Amount paid exceeds standard uniform fee amount');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      await api.post('/fees/uniforms/distribute', {
        studentId: activeRequest.student._id,
        requestId: activeRequest._id,
        itemsIssued: selectedItems,
        feeAmount: uniformFeeAmount,
        amountPaid: Number(amountPaid),
        paymentMethod
      });

      // Clear states & Refresh
      setActiveRequest(null);
      fetchStats();
      fetchQueue();
    } catch (err) {
      setFormError(err.message || 'Uniform distribution submission failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                <p className="text-xl font-bold text-slate-800">{stats.pendingRequests}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Approved Requests</p>
                <p className="text-xl font-bold text-slate-800">{stats.approvedRequests}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Completed Clearances</p>
                <p className="text-xl font-bold text-slate-800">{stats.completedDistributions}</p>
              </div>
            </div>
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

      {/* ========================================== */}
      {/* 3. UNIFORM DISTRIBUTION MODAL */}
      {/* ========================================== */}
      {activeRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-[#0B192C] text-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold">Uniform Distribution Checklist</h4>
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

              {/* Uniform checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Select Uniform Items Issued
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-4 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                  {classItems.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-2 text-center py-2">No uniform items configured for this class.</p>
                  ) : (
                    classItems.map((item, idx) => {
                      const isChecked = selectedItems.includes(item);
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => handleItemToggle(item)}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg text-xs font-medium text-left border cursor-pointer transition-colors ${
                            isChecked 
                              ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="truncate">{item}</span>
                        </button>
                      );
                    })
                  )}
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
                    <span className="text-slate-500 font-medium">Amount Paid (₹):</span>
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
                    'Record Distribution & Complete Clearance'
                  )}
                </button>
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

    </div>
  );
}
