'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Coffee, Users, CheckCircle, Clock, TrendingUp, ShieldAlert, Loader2, Download, Search, AlertCircle } from 'lucide-react';

export default function LunchDashboard({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [studentList, setStudentList] = useState([]);
  const [studentLoading, setStudentLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  // Stats Details Modal
  const [selectedMetric, setSelectedMetric] = useState(null); // 'total' | 'paid' | 'pending' | 'collected' | 'outstanding'
  const [metricDetailData, setMetricDetailData] = useState([]);
  const [metricDetailLoading, setMetricDetailLoading] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState('');

  useEffect(() => {
    fetchStats();
    fetchStudents();
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

  const handleExportCSV = async () => {
    try {
      await api.download('/reports/export/csv?type=lunch', 'lunch_fee_report.csv');
    } catch (err) {
      alert('CSV Export failed: ' + err.message);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-3 py-1 rounded-full">
            Catering Workspace
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Lunch Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Meal subscription plans, school dining registries, and collections reports</p>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer w-full md:w-auto"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Lunch CSV</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
            <p className="text-xs text-slate-450 text-center py-6">No period statistics generated.</p>
          ) : (
            <div className="space-y-3 pr-1">
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
