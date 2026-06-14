'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Users, CheckCircle, Clock, ShieldAlert, Receipt, BookOpen, Shirt, Plus, 
  Search, Trash2, Edit3, UserCheck, Shield, ChevronRight, HelpCircle, 
  Settings, Loader2, Download, ToggleLeft, ToggleRight, Info, Eye,
  Building, Library, FolderKanban, Check, X, AlertCircle, FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard({ onOpenStudentHistory }) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Student directory states
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterSchoolType, setFilterSchoolType] = useState('');
  
  // Student Form state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    admissionNumber: '', name: '', gender: 'Male', dob: '', schoolType: 'CBSE',
    class: '', section: '', rollNumber: '', fatherName: '', motherName: '',
    parentMobile: '', email: '', address: '', academicYear: '2026-2027',
    tuitionFeeAmount: ''
  });
  const [studentFormError, setStudentFormError] = useState('');
  
  // Bulk Import state
  const [bulkJson, setBulkJson] = useState('');
  const [bulkResult, setBulkResult] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Configurations states
  const [classes, setClasses] = useState([]);
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState({ schoolType: 'CBSE', name: '', sections: 'A, B, C' });
  const [classFormError, setClassFormError] = useState('');

  // Books Config states
  const [booksConfig, setBooksConfig] = useState([]);
  const [showAddBookConfig, setShowAddBookConfig] = useState(false);
  const [bookConfigForm, setBookConfigForm] = useState({ schoolType: 'CBSE', class: '', books: 'English, Mathematics, Science', feeAmount: '' });

  // Uniform Config states
  const [uniformsConfig, setUniformsConfig] = useState([]);
  const [showAddUniformConfig, setShowAddUniformConfig] = useState(false);
  const [uniformConfigForm, setUniformConfigForm] = useState({ class: '', items: 'Shirt, Pant, Tie, Belt, Socks', feeAmount: '' });

  // User Management states
  const [usersList, setUsersList] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'TUITION_DEPT', name: '' });
  const [userFormError, setUserFormError] = useState('');

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'students') {
      fetchStudents();
    } else if (activeSubTab === 'configs') {
      fetchConfigs();
    } else if (activeSubTab === 'users') {
      fetchUsers();
    } else if (activeSubTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeSubTab, filterClass, filterSection, filterSchoolType]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      let url = '/students';
      const params = [];
      if (filterSchoolType) params.push(`schoolType=${filterSchoolType}`);
      if (filterClass) params.push(`class=${filterClass}`);
      if (filterSection) params.push(`section=${filterSection}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const data = await api.get(url);
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const cls = await api.get('/classes');
      const bks = await api.get('/classes/books');
      const uni = await api.get('/classes/uniforms');
      setClasses(cls);
      setBooksConfig(bks);
      setUniformsConfig(uni);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const list = await api.get('/auth/users');
      setUsersList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const logs = await api.get('/audit-logs');
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExportCSV = async (type) => {
    try {
      await api.download(`/reports/export/csv?type=${type}`, `${type}_clearance_report.csv`);
    } catch (err) {
      alert('CSV Export failed: ' + err.message);
    }
  };

  const handleToggleUser = async (id) => {
    try {
      await api.put(`/auth/users/${id}/toggle`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setUserFormError('');
    try {
      await api.post('/auth/users', userForm);
      setUserForm({ username: '', email: '', password: '', role: 'TUITION_DEPT', name: '' });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      setUserFormError(err.message || 'Failed to register staff user');
    }
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    setStudentFormError('');
    try {
      await api.post('/students', studentForm);
      setStudentForm({
        admissionNumber: '', name: '', gender: 'Male', dob: '', schoolType: 'CBSE',
        class: '', section: '', rollNumber: '', fatherName: '', motherName: '',
        parentMobile: '', email: '', address: '', academicYear: '2026-2027',
        tuitionFeeAmount: ''
      });
      setShowAddStudent(false);
      fetchStudents();
      fetchStats();
    } catch (err) {
      setStudentFormError(err.message || 'Failed to register student');
    }
  };

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();
    setClassFormError('');
    try {
      const parsedSections = classForm.sections.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/classes', {
        schoolType: classForm.schoolType,
        name: classForm.name,
        sections: parsedSections
      });
      setClassForm({ schoolType: 'CBSE', name: '', sections: 'A, B, C' });
      setShowAddClass(false);
      fetchConfigs();
    } catch (err) {
      setClassFormError(err.message);
    }
  };

  const handleAddBookConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedBooks = bookConfigForm.books.split(',').map(b => b.trim()).filter(Boolean);
      await api.post('/classes/books', {
        schoolType: bookConfigForm.schoolType,
        class: bookConfigForm.class,
        books: parsedBooks,
        feeAmount: Number(bookConfigForm.feeAmount)
      });
      setShowAddBookConfig(false);
      fetchConfigs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddUniformConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedItems = uniformConfigForm.items.split(',').map(i => i.trim()).filter(Boolean);
      await api.post('/classes/uniforms', {
        class: uniformConfigForm.class,
        items: parsedItems,
        feeAmount: Number(uniformConfigForm.feeAmount)
      });
      setShowAddUniformConfig(false);
      fetchConfigs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    setBulkError('');
    setBulkResult('');
    
    let parsedData;
    try {
      parsedData = JSON.parse(bulkJson);
    } catch (err) {
      setBulkError('Invalid JSON format. Please check syntax (brackets, commas, quotes).');
      return;
    }

    if (!Array.isArray(parsedData)) {
      setBulkError('Data must be a JSON array of student objects.');
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await api.post('/students/import', { students: parsedData });
      setBulkResult(`Success! Imported ${res.successCount} students. ${res.failCount} failed.`);
      setBulkJson('');
      fetchStats();
    } catch (err) {
      setBulkError(err.message || 'Import failed.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap border-b border-slate-200/80 gap-2">
        {[
          { id: 'overview', label: 'Overview Metrics' },
          { id: 'students', label: 'Student Directory' },
          { id: 'configs', label: 'School & Catalog' },
          { id: 'reports', label: 'Analytics Reports' },
          { id: 'users', label: 'Staff Directory' },
          { id: 'audit', label: 'Security Audits' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4.5 py-3 text-xs font-bold rounded-t-2xl transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'bg-white border-t border-x border-slate-200/50 text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================== */}
      {/* 1. OVERVIEW DASHBOARD */}
      {/* ========================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl" />
              ))}
            </div>
          ) : (
            stats && (
              <>
                {/* Metrics row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Student Enrolled', value: stats.metrics.totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50/80 border-indigo-100/50' },
                    { label: 'Fees Collected', value: `₹${stats.metrics.totalCollected.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/80 border-emerald-100/50' },
                    { label: 'Pending Balance', value: `₹${stats.metrics.totalPending.toLocaleString('en-IN')}`, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50/80 border-rose-100/50' },
                    { label: 'Clearances Issued', value: stats.workflowProgress.completed, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50/80 border-teal-100/50' }
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium hover-lift">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                            <p className="text-xl font-extrabold text-slate-800 mt-1.5">{card.value}</p>
                          </div>
                          <div className={`p-2.5 rounded-xl border ${card.bg} ${card.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress pipeline and ratios */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Collections breakdown */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
                    <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wider">
                      Department collections
                    </h3>
                    <div className="space-y-4.5">
                      {[
                        { label: 'Tuition collections', value: stats.metrics.tuitionCollected, color: 'bg-indigo-600', text: 'text-indigo-600' },
                        { label: 'Book collections', value: stats.metrics.bookCollected, color: 'bg-amber-500', text: 'text-amber-600' },
                        { label: 'Uniform collections', value: stats.metrics.uniformCollected, color: 'bg-rose-500', text: 'text-rose-600' }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-500">{item.label}</span>
                            <span className="font-bold text-slate-900">₹{item.value.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${stats.metrics.totalCollected > 0 ? (item.value / stats.metrics.totalCollected) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flow pipeline progress */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium lg:col-span-2">
                    <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 uppercase tracking-wider">
                      Clearance Workflow Pipeline Progression
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Tuition Queue', val: stats.workflowProgress.tuitionPending, bg: 'bg-indigo-50/50 text-indigo-700 border-indigo-200/40', badge: 'bg-indigo-100 border-indigo-200 text-indigo-700' },
                        { label: 'Book Queue', val: stats.workflowProgress.booksPending, bg: 'bg-amber-50/50 text-amber-700 border-amber-200/40', badge: 'bg-amber-100 border-amber-200 text-amber-700' },
                        { label: 'Uniform Queue', val: stats.workflowProgress.uniformPending, bg: 'bg-rose-50/50 text-rose-700 border-rose-200/40', badge: 'bg-rose-100 border-rose-200 text-rose-700' },
                        { label: 'Completed', val: stats.workflowProgress.completed, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60', badge: 'bg-emerald-500 text-white font-bold' }
                      ].map((p, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl border ${p.bg} flex flex-col justify-between text-center`}>
                          <p className="text-xs font-bold text-slate-500 mb-1">{p.label}</p>
                          <p className="text-xl font-extrabold mt-1">{p.val}</p>
                          <span className={`inline-block text-[8px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full mt-2 mx-auto ${p.badge}`}>
                            {idx === 3 ? 'Archived' : 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Ledger & Activities grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Ledger */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
                    <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider">
                      Recent Cash Ledger Transactions
                    </h3>
                    {stats.recentTransactions?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {stats.recentTransactions?.map(tx => (
                          <div key={tx._id} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{tx.student?.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Receipt: {tx.receiptNumber} | {tx.feeType} | Method: {tx.paymentMethod}</p>
                            </div>
                            <span className="font-extrabold text-slate-900 bg-slate-50 px-2.5 py-1 border border-slate-150 rounded-lg">₹{tx.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audit Logs */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
                    <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider">
                      Recent System Audit Activity Trail
                    </h3>
                    {stats.recentActivities?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No recent audit trails.</p>
                    ) : (
                      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                        {stats.recentActivities?.map(act => (
                          <div key={act._id} className="text-xs flex items-start space-x-2.5">
                            <div className="h-2 w-2 bg-indigo-500 rounded-full mt-1.5 shrink-0 shadow-sm" />
                            <div className="flex-1">
                              <p className="text-slate-700 font-semibold leading-relaxed">{act.details}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Actor: {act.user} | {new Date(act.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </>
            )
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 2. STUDENTS DIRECTORY */}
      {/* ========================================== */}
      {activeSubTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium space-y-5">
            
            {/* Toolbar header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Student Directory Registry</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Admit new students and monitor clearance status directories</p>
              </div>
              <button
                onClick={() => setShowAddStudent(true)}
                className="inline-flex items-center space-x-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/15 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Register Student</span>
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-150 rounded-2xl text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">School Board</label>
                <select
                  value={filterSchoolType}
                  onChange={(e) => setFilterSchoolType(e.target.value)}
                  className="block w-full border border-slate-250 bg-white rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="">All Boards</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Class</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="block w-full border border-slate-250 bg-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Section</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="block w-full border border-slate-250 bg-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 text-slate-800"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterSchoolType(''); setFilterClass(''); setFilterSection(''); }}
                  className="w-full py-1.5 text-center text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Directory table */}
            {studentsLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
              </div>
            ) : students.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">No students found matching current filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Admission No</th>
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Class-Sec</th>
                      <th className="py-3 px-4">School Board</th>
                      <th className="py-3 px-4">Clearance Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {students.map(s => (
                      <tr key={s._id} className="hover:bg-slate-50/40">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{s.studentId}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{s.name}</td>
                        <td className="py-3.5 px-4 font-mono">{s.admissionNumber}</td>
                        <td className="py-3.5 px-4 font-mono">{s.rollNumber}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-850">{s.class} - {s.section}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            s.schoolType === 'CBSE' ? 'bg-indigo-50 border-indigo-200/50 text-indigo-700' : 'bg-rose-50 border-rose-200/50 text-rose-700'
                          }`}>
                            {s.schoolType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            s.clearanceStatus === 'COMPLETED'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {s.clearanceStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onOpenStudentHistory(s._id)}
                            className="inline-flex items-center space-x-1 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Clearance Timeline</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bulk Importer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Bulk Student Importer (JSON)
            </h3>
            
            <form onSubmit={handleBulkImportSubmit} className="space-y-4">
              <div className="text-xs text-slate-500 bg-slate-50 p-4 border border-slate-250 rounded-xl flex items-start space-x-2">
                <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-700">Paste JSON array configuration payload:</p>
                  <p className="mt-1">Provide a JSON array containing records with all required student details. An example layout is shown below.</p>
                  <pre className="bg-slate-900 text-slate-300 p-2.5 rounded-lg text-[10px] mt-2 font-mono overflow-x-auto max-w-full">
{`[
  {
    "admissionNumber": "ADM26991",
    "name": "Jane Doe",
    "gender": "Female",
    "dob": "2012-04-18",
    "schoolType": "CBSE",
    "class": "Class 10",
    "section": "A",
    "rollNumber": "120",
    "fatherName": "John Doe",
    "motherName": "Mary Doe",
    "parentMobile": "9988776655",
    "address": "45 Lakeview St, Bangalore",
    "academicYear": "2026-2027",
    "tuitionFeeAmount": 15000
  }
]`}
                  </pre>
                </div>
              </div>

              <div>
                <textarea
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  placeholder="[{ ... }]"
                  rows={6}
                  className="w-full border border-slate-200 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-indigo-600 bg-slate-50/30"
                />
              </div>

              <div className="flex items-center justify-between">
                {bulkError && <p className="text-xs text-rose-500 font-semibold">{bulkError}</p>}
                {bulkResult && <p className="text-xs text-emerald-600 font-semibold">{bulkResult}</p>}
                <button
                  type="submit"
                  disabled={bulkSubmitting || !bulkJson.trim()}
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer ml-auto"
                >
                  {bulkSubmitting ? 'Importing...' : 'Submit Bulk Import'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* 3. SCHOOL & CATALOG TAB */}
      {/* ========================================== */}
      {activeSubTab === 'configs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Classes structure */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building className="h-4.5 w-4.5 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Class Maps</h3>
              </div>
              <button onClick={() => setShowAddClass(true)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            {showAddClass && (
              <form onSubmit={handleAddClassSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">School Board</label>
                  <select
                    value={classForm.schoolType}
                    onChange={(e) => setClassForm(prev => ({ ...prev, schoolType: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Class Name</label>
                  <input
                    type="text"
                    required
                    value={classForm.name}
                    onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    placeholder="e.g. Class 10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Sections (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={classForm.sections}
                    onChange={(e) => setClassForm(prev => ({ ...prev, sections: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save</button>
                  <button type="button" onClick={() => setShowAddClass(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {classes.map(c => (
                <div key={c._id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span className="ml-2 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold">{c.schoolType}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono">Sec: {c.sections?.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Book settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Library className="h-4.5 w-4.5 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Book Checklists</h3>
              </div>
              <button onClick={() => setShowAddBookConfig(true)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            {showAddBookConfig && (
              <form onSubmit={handleAddBookConfigSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">School Board</label>
                  <select
                    value={bookConfigForm.schoolType}
                    onChange={(e) => setBookConfigForm(prev => ({ ...prev, schoolType: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Class Name</label>
                  <input
                    type="text"
                    required
                    value={bookConfigForm.class}
                    onChange={(e) => setBookConfigForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                    placeholder="e.g. Class 10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Books List (comma separated)</label>
                  <textarea
                    required
                    value={bookConfigForm.books}
                    onChange={(e) => setBookConfigForm(prev => ({ ...prev, books: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Book Fee amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={bookConfigForm.feeAmount}
                    onChange={(e) => setBookConfigForm(prev => ({ ...prev, feeAmount: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save</button>
                  <button type="button" onClick={() => setShowAddBookConfig(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {booksConfig.map(b => (
                <div key={b._id} className="py-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{b.schoolType} - {b.class}</span>
                    <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-lg">₹{b.feeAmount}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Books: {b.books?.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Uniform settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FolderKanban className="h-4.5 w-4.5 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Uniform Checklists</h3>
              </div>
              <button onClick={() => setShowAddUniformConfig(true)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            {showAddUniformConfig && (
              <form onSubmit={handleAddUniformConfigSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Class Name</label>
                  <input
                    type="text"
                    required
                    value={uniformConfigForm.class}
                    onChange={(e) => setUniformConfigForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                    placeholder="e.g. Class 10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Items List (comma separated)</label>
                  <textarea
                    required
                    value={uniformConfigForm.items}
                    onChange={(e) => setUniformConfigForm(prev => ({ ...prev, items: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Uniform Fee amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={uniformConfigForm.feeAmount}
                    onChange={(e) => setUniformConfigForm(prev => ({ ...prev, feeAmount: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save</button>
                  <button type="button" onClick={() => setShowAddUniformConfig(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {uniformsConfig.map(u => (
                <div key={u._id} className="py-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{u.class}</span>
                    <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-lg">₹{u.feeAmount}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Items: {u.items?.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* 4. ANALYTICS & REPORTS */}
      {/* ========================================== */}
      {activeSubTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Operational Analytics Exporters</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Download current databases and collections ledgers in CSV spreadsheets</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: 'Tuition Fees collections Ledger', desc: 'Export discounts, fines, collected amounts, and balances for all registered students.', type: 'tuition', color: 'bg-indigo-50/50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-50' },
              { title: 'Book Distribution clearance Registry', desc: 'Export textbook checklist distributions, library collections, and clearance dates.', type: 'books', color: 'bg-amber-50/50 text-amber-700 border-amber-200/50 hover:bg-amber-50' },
              { title: 'Uniform Distribution clearance Registry', desc: 'Export issued uniform items checklist collections and fees clearance ledgers.', type: 'uniforms', color: 'bg-rose-50/50 text-rose-700 border-rose-200/50 hover:bg-rose-50' },
              { title: 'Pending Fees Outstanding Sheet', desc: 'List of all students with non-zero outstanding balances in any clearance department.', type: 'pending', color: 'bg-slate-100/50 text-slate-700 border-slate-300 hover:bg-slate-100' },
              { title: 'Full Clearance Workflow logs', desc: 'List of all students, class details, and their overall sequential clearance status.', type: 'clearance', color: 'bg-emerald-50/50 text-emerald-800 border-emerald-200/50 hover:bg-emerald-50' }
            ].map((r, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-40 hover:shadow-premium transition-all hover:border-slate-300">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-semibold">{r.desc}</p>
                </div>
                <button
                  onClick={() => handleExportCSV(r.type)}
                  className={`w-full inline-flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${r.color}`}
                >
                  <Download className="h-4 w-4" />
                  <span>Download spreadsheet</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. USERS & STAFF DIRECTORY */}
      {/* ========================================== */}
      {activeSubTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Staff Accounts Directory</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage credentials and permissions of department staff</p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="inline-flex items-center space-x-1 font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUserSubmit} className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-500 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-600"
                    placeholder="e.g. David Carter"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-600"
                    placeholder="e.g. david@school.com"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1.5">Username (Login ID)</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-600"
                    placeholder="e.g. david_tuition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-600"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1.5">Department Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="TUITION_DEPT">Tuition Fee Department</option>
                    <option value="BOOK_DEPT">Book Department</option>
                    <option value="UNIFORM_DEPT">Uniform Department</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              {userFormError && <p className="text-xs text-rose-500 font-bold">{userFormError}</p>}

              <div className="flex space-x-2 pt-2 justify-end">
                <button type="submit" className="py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer">Register Account</button>
                <button type="button" onClick={() => setShowAddUser(false)} className="py-2.5 px-4 bg-slate-250 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department/Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{u.name}</td>
                    <td className="py-3.5 px-4 font-semibold">{u.username}</td>
                    <td className="py-3.5 px-4">{u.email}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-500">{u.role}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        u.active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {u.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleUser(u._id)}
                        className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer transition-colors ${
                          u.active
                            ? 'bg-rose-50 hover:bg-rose-105 hover:bg-rose-100 text-rose-600 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-105 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                        }`}
                      >
                        {u.active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 6. SECURITY AUDITS TAB */}
      {/* ========================================== */}
      {activeSubTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Security audits trace timeline</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Chronological record of database edits and workflow sequence approvals</p>
          </div>

          {auditLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-8">No audit logs logged in system.</p>
          ) : (
            <div className="space-y-4.5">
              {auditLogs.map(log => (
                <div key={log._id} className="border border-slate-150 rounded-2xl p-4.5 text-xs space-y-1 hover:bg-slate-50/30 transition-colors hover:border-slate-350">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/40 px-2.5 py-0.5 rounded-full">{log.action}</span>
                    <span className="text-slate-400 font-semibold">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-850 font-bold pt-1.5">{log.details}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold mt-1">
                    <span>User: {log.user}</span>
                    {log.student && (
                      <>
                        <span>•</span>
                        <span>Student Ref: {log.student.studentId}</span>
                      </>
                    )}
                  </div>
                  {(log.oldValue || log.newValue) && (
                    <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[9px] text-slate-300 max-h-32 overflow-y-auto">
                      {log.oldValue && (
                        <div className="mb-1 text-rose-400/90 leading-normal">
                          <span>- PRIOR: </span>
                          <span>{JSON.stringify(log.oldValue)}</span>
                        </div>
                      )}
                      {log.newValue && (
                        <div className="text-emerald-400/90 leading-normal">
                          <span>+ AFTER: </span>
                          <span>{JSON.stringify(log.newValue)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 7. REGISTRATION MODAL */}
      {/* ========================================== */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-slide-up my-8">
            <div className="px-6 py-4 bg-[#0B192C] text-white flex justify-between items-center">
              <span className="text-sm font-bold">Manual Student Registration Form</span>
              <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Academic */}
                <div className="space-y-3.5">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[10px]">Academic Details</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Admission Number</label>
                    <input
                      type="text"
                      required
                      value={studentForm.admissionNumber}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, admissionNumber: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-600"
                      placeholder="e.g. ADM202688"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">School Board</label>
                      <select
                        value={studentForm.schoolType}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, schoolType: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      >
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Academic Year</label>
                      <input
                        type="text"
                        required
                        value={studentForm.academicYear}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, academicYear: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Class</label>
                      <input
                        type="text"
                        required
                        value={studentForm.class}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, class: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                        placeholder="e.g. Class 10"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Section</label>
                      <input
                        type="text"
                        required
                        value={studentForm.section}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, section: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                        placeholder="e.g. A"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Roll Number</label>
                      <input
                        type="text"
                        required
                        value={studentForm.rollNumber}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, rollNumber: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Tuition Fee (₹)</label>
                      <input
                        type="number"
                        value={studentForm.tuitionFeeAmount}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, tuitionFeeAmount: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                        placeholder="e.g. 15000"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal */}
                <div className="space-y-3.5">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[10px]">Personal Information</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Gender</label>
                      <select
                        value={studentForm.gender}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={studentForm.dob}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, dob: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Father's Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.fatherName}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, fatherName: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.motherName}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, motherName: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Contacts and Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Parent Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={studentForm.parentMobile}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, parentMobile: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                    placeholder="10 digit number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                    placeholder="student@school.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Residential Address</label>
                <textarea
                  required
                  value={studentForm.address}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full border border-slate-200 bg-white rounded-2xl px-3 py-2 focus:outline-none"
                  rows={2}
                  placeholder="Street address, City, Pin"
                />
              </div>

              {studentFormError && <p className="text-xs text-rose-500 font-bold">{studentFormError}</p>}

              <div className="flex space-x-2 pt-2 justify-end border-t border-slate-100">
                <button type="submit" className="py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer">Register Student</button>
                <button type="button" onClick={() => setShowAddStudent(false)} className="py-2.5 px-4 bg-slate-250 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
