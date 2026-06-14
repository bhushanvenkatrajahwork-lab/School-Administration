'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Users, CheckCircle, Clock, ShieldAlert, Receipt, BookOpen, Shirt, Plus, 
  Search, Trash2, Edit3, UserCheck, Shield, ChevronRight, HelpCircle, 
  Settings, Loader2, Download, ToggleLeft, ToggleRight, Info, Eye
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

  // Report export handler
  const handleExportCSV = async (type) => {
    try {
      await api.download(`/reports/export/csv?type=${type}`, `${type}_clearance_report.csv`);
    } catch (err) {
      alert('CSV Export failed: ' + err.message);
    }
  };

  // User status toggler
  const handleToggleUser = async (id) => {
    try {
      await api.put(`/auth/users/${id}/toggle`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // User Creator
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

  // Student Creator
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

  // Class creator
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

  // Books Config creator
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

  // Uniform Config creator
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

  // Bulk Student Importer
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
      
      {/* Super Admin Tab Nav links */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        {[
          { id: 'overview', label: 'Overview Metrics' },
          { id: 'students', label: 'Students Directory' },
          { id: 'configs', label: 'School & Inventory' },
          { id: 'reports', label: 'Analytics Reports' },
          { id: 'users', label: 'Staff Accounts' },
          { id: 'audit', label: 'Audit Timeline' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white border-t border-x border-slate-200/60 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================== */}
      {/* 1. OVERVIEW DASHBOARD TAB */}
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
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Student Enrolled</p>
                      <p className="text-xl font-bold text-slate-800">{stats.metrics.totalStudents}</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fees Collected</p>
                      <p className="text-xl font-bold text-slate-800">₹{stats.metrics.totalCollected.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Balance</p>
                      <p className="text-xl font-bold text-slate-800">₹{stats.metrics.totalPending.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Completed Clearance</p>
                      <p className="text-xl font-bold text-slate-800">{stats.workflowProgress.completed}</p>
                    </div>
                  </div>
                </div>

                {/* Collection breakdown and Pipeline progress grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Financial Collection Ratios */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm col-span-1">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider">
                      Departmental Collections
                    </h3>
                    <div className="space-y-4">
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-600">Tuition Fees</span>
                          <span className="font-bold text-slate-800">₹{stats.metrics.tuitionCollected.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full" style={{ width: `${stats.metrics.totalCollected > 0 ? (stats.metrics.tuitionCollected / stats.metrics.totalCollected) * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-600">Book Fees</span>
                          <span className="font-bold text-slate-800">₹{stats.metrics.bookCollected.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${stats.metrics.totalCollected > 0 ? (stats.metrics.bookCollected / stats.metrics.totalCollected) * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-600">Uniform Fees</span>
                          <span className="font-bold text-slate-800">₹{stats.metrics.uniformCollected.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full" style={{ width: `${stats.metrics.totalCollected > 0 ? (stats.metrics.uniformCollected / stats.metrics.totalCollected) * 100 : 0}%` }} />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Flow pipeline progress */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm col-span-2">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider">
                      Clearance Workflow Pipeline Progression
                    </h3>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <p className="text-xs text-slate-500 font-semibold mb-1">Tuition Queue</p>
                        <p className="text-lg font-bold text-slate-850">{stats.workflowProgress.tuitionPending}</p>
                        <span className="inline-block text-[9px] bg-amber-50 border border-amber-200 text-amber-600 px-1.5 py-0.5 rounded-full mt-1.5">Active</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <p className="text-xs text-slate-500 font-semibold mb-1">Book Queue</p>
                        <p className="text-lg font-bold text-slate-850">{stats.workflowProgress.booksPending}</p>
                        <span className="inline-block text-[9px] bg-amber-50 border border-amber-200 text-amber-600 px-1.5 py-0.5 rounded-full mt-1.5">Active</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <p className="text-xs text-slate-500 font-semibold mb-1">Uniform Queue</p>
                        <p className="text-lg font-bold text-slate-850">{stats.workflowProgress.uniformPending}</p>
                        <span className="inline-block text-[9px] bg-amber-50 border border-amber-200 text-amber-600 px-1.5 py-0.5 rounded-full mt-1.5">Active</span>
                      </div>
                      <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                        <p className="text-xs text-emerald-700 font-semibold mb-1">Completed</p>
                        <p className="text-lg font-bold text-emerald-800">{stats.workflowProgress.completed}</p>
                        <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full mt-1.5 font-bold">Finished</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Recent Transactions & Recent Activities lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Recent Transactions list */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 uppercase tracking-wider">
                      Recent Cash Ledger Transactions
                    </h3>
                    {stats.recentTransactions?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No payment transactions recorded.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {stats.recentTransactions?.map(tx => (
                          <div key={tx._id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-slate-900">{tx.student?.name}</p>
                              <p className="text-[10px] text-slate-400">{tx.receiptNumber} | {tx.feeType} Fee | Method: {tx.paymentMethod}</p>
                            </div>
                            <span className="font-bold text-slate-850">₹{tx.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Activities logs */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 uppercase tracking-wider">
                      Recent System Audit Activity Trail
                    </h3>
                    {stats.recentActivities?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No recent audit trails.</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {stats.recentActivities?.map(act => (
                          <div key={act._id} className="text-xs flex items-start space-x-2">
                            <div className="h-2 w-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                            <div>
                              <p className="text-slate-800 font-semibold leading-tight">{act.details}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Actor: {act.user} | {new Date(act.createdAt).toLocaleString()}</p>
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
      {/* 2. STUDENTS DIRECTORY TAB */}
      {/* ========================================== */}
      {activeSubTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            
            {/* Toolbar header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Student Enrolled Registries</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage student admissions and clearance states</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="inline-flex items-center space-x-1 font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/15 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Manual Registration</span>
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 border border-slate-150 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">SCHOOL BOARD</label>
                <select
                  value={filterSchoolType}
                  onChange={(e) => setFilterSchoolType(e.target.value)}
                  className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="">All Boards</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">CLASS</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10 or Class X"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-600 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">SECTION</label>
                <input
                  type="text"
                  placeholder="e.g. A or B"
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="block w-full border border-slate-200 bg-white rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-600 text-xs"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterSchoolType(''); setFilterClass(''); setFilterSection(''); }}
                  className="w-full py-1.5 text-center text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Students Table */}
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
                    <tr className="bg-slate-50/50 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Admission No</th>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Class-Sec</th>
                      <th className="py-2.5 px-3">School Board</th>
                      <th className="py-2.5 px-3">Clearance status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {students.map(s => (
                      <tr key={s._id} className="hover:bg-slate-50/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{s.studentId}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{s.name}</td>
                        <td className="py-2.5 px-3">{s.admissionNumber}</td>
                        <td className="py-2.5 px-3">{s.rollNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-850">{s.class} - {s.section}</td>
                        <td className="py-2.5 px-3">{s.schoolType}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                            s.clearanceStatus === 'COMPLETED'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {s.clearanceStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onOpenStudentHistory(s._id)}
                            className="inline-flex items-center space-x-1 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Open Timeline</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bulk Import section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Bulk Student Importer
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer ml-auto"
                >
                  {bulkSubmitting ? 'Importing...' : 'Submit Bulk Import'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* 3. SCHOOL & INVENTORY CONFIG TAB */}
      {/* ========================================== */}
      {activeSubTab === 'configs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Class Definitions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Class Maps Configurations</h3>
              <button onClick={() => setShowAddClass(true)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showAddClass && (
              <form onSubmit={handleAddClassSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">School Board</label>
                  <select
                    value={classForm.schoolType}
                    onChange={(e) => setClassForm(prev => ({ ...prev, schoolType: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                    placeholder="e.g. Class 10 or Class I"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Sections (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={classForm.sections}
                    onChange={(e) => setClassForm(prev => ({ ...prev, sections: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="flex-1 py-1.5 bg-indigo-600 text-white rounded font-semibold">Save</button>
                  <button type="button" onClick={() => setShowAddClass(false)} className="flex-1 py-1.5 bg-slate-200 text-slate-700 rounded font-semibold">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {classes.map(c => (
                <div key={c._id} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    <span className="ml-2 bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[10px]">{c.schoolType}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Sec: {c.sections?.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Book Lists per Class */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Book Checklists Settings</h3>
              <button onClick={() => setShowAddBookConfig(true)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showAddBookConfig && (
              <form onSubmit={handleAddBookConfigSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">School Board</label>
                  <select
                    value={bookConfigForm.schoolType}
                    onChange={(e) => setBookConfigForm(prev => ({ ...prev, schoolType: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                    placeholder="e.g. Class 10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Books List (comma separated)</label>
                  <textarea
                    required
                    value={bookConfigForm.books}
                    onChange={(e) => setBookConfigForm(prev => ({ ...prev, books: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="flex-1 py-1.5 bg-indigo-600 text-white rounded font-semibold">Save</button>
                  <button type="button" onClick={() => setShowAddBookConfig(false)} className="flex-1 py-1.5 bg-slate-200 text-slate-700 rounded font-semibold">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {booksConfig.map(b => (
                <div key={b._id} className="py-2.5 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-850">{b.schoolType} - {b.class}</span>
                    <span className="font-bold text-indigo-700">₹{b.feeAmount}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Books: {b.books?.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Uniform Items per Class */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Uniform Checklist Settings</h3>
              <button onClick={() => setShowAddUniformConfig(true)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showAddUniformConfig && (
              <form onSubmit={handleAddUniformConfigSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Class Name</label>
                  <input
                    type="text"
                    required
                    value={uniformConfigForm.class}
                    onChange={(e) => setUniformConfigForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                    placeholder="e.g. Class 10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Items List (comma separated)</label>
                  <textarea
                    required
                    value={uniformConfigForm.items}
                    onChange={(e) => setUniformConfigForm(prev => ({ ...prev, items: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="flex-1 py-1.5 bg-indigo-600 text-white rounded font-semibold">Save</button>
                  <button type="button" onClick={() => setShowAddUniformConfig(false)} className="flex-1 py-1.5 bg-slate-200 text-slate-700 rounded font-semibold">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {uniformsConfig.map(u => (
                <div key={u._id} className="py-2.5 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-850">{u.class}</span>
                    <span className="font-bold text-indigo-700">₹{u.feeAmount}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Items: {u.items?.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* 4. ANALYTICS & REPORTS TAB */}
      {/* ========================================== */}
      {activeSubTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Operational Analytics Exporters</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Download current databases and collections ledgers in CSV spreadsheets</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-36">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Tuition Fees collections Ledger</h4>
                <p className="text-[10px] text-slate-400 mt-1">Export discounts, fines, collected amounts, and balances for all registered students.</p>
              </div>
              <button
                onClick={() => handleExportCSV('tuition')}
                className="w-full inline-flex items-center justify-center space-x-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-lg text-xs font-semibold cursor-pointer border border-indigo-200/50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Tuition Ledger</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-36">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Book Distribution clearance Registry</h4>
                <p className="text-[10px] text-slate-400 mt-1">Export textbook checklist distributions, library collections, and clearance dates.</p>
              </div>
              <button
                onClick={() => handleExportCSV('books')}
                className="w-full inline-flex items-center justify-center space-x-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 rounded-lg text-xs font-semibold cursor-pointer border border-amber-200/50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Book Registry</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-36">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Uniform Distribution clearance Registry</h4>
                <p className="text-[10px] text-slate-400 mt-1">Export issued uniform items checklist collections and fees clearance ledgers.</p>
              </div>
              <button
                onClick={() => handleExportCSV('uniforms')}
                className="w-full inline-flex items-center justify-center space-x-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-lg text-xs font-semibold cursor-pointer border border-rose-200/50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Uniform Registry</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-36">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Pending Fees Outstanding Sheet</h4>
                <p className="text-[10px] text-slate-400 mt-1">List of all students with non-zero outstanding balances in any clearance department.</p>
              </div>
              <button
                onClick={() => handleExportCSV('pending')}
                className="w-full inline-flex items-center justify-center space-x-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-800 rounded-lg text-xs font-semibold cursor-pointer border border-slate-300"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Outstandings Sheet</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-36">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Full Clearance Workflow logs</h4>
                <p className="text-[10px] text-slate-400 mt-1">List of all students, class details, and their overall sequential clearance status.</p>
              </div>
              <button
                onClick={() => handleExportCSV('clearance')}
                className="w-full inline-flex items-center justify-center space-x-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-lg text-xs font-semibold cursor-pointer border border-emerald-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Clearance Logs</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. USERS & STAFF MANAGEMENT TAB */}
      {/* ========================================== */}
      {activeSubTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Staff Accounts Directory</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Manage credentials and permissions of department staff</p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="inline-flex items-center space-x-1 font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUserSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5"
                    placeholder="e.g. David Carter"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5"
                    placeholder="e.g. david@school.com"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5"
                    placeholder="e.g. david_tuition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Department Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5"
                  >
                    <option value="TUITION_DEPT">Tuition Fee Department</option>
                    <option value="BOOK_DEPT">Book Department</option>
                    <option value="UNIFORM_DEPT">Uniform Department</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              {userFormError && <p className="text-xs text-rose-500 font-semibold">{userFormError}</p>}

              <div className="flex space-x-2 pt-2 justify-end">
                <button type="submit" className="py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer">Register Account</button>
                <button type="button" onClick={() => setShowAddUser(false)} className="py-2 px-4 bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer">Cancel</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Department/Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{u.name}</td>
                    <td className="py-2.5 px-3">{u.username}</td>
                    <td className="py-2.5 px-3">{u.email}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">{u.role}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleToggleUser(u._id)}
                        className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
                          u.active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
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
      {/* 6. SYSTEM AUDIT TIMELINE LOGS TAB */}
      {/* ========================================== */}
      {activeSubTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">System modification Audit logs</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Chronological trace of database operations and sequential approvals</p>
          </div>

          {auditLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-8">No audit logs logged in system.</p>
          ) : (
            <div className="space-y-4">
              {auditLogs.map(log => (
                <div key={log._id} className="border border-slate-150 rounded-xl p-3.5 text-xs space-y-1 hover:bg-slate-50/30 transition-colors">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-full">{log.action}</span>
                    <span className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-850 font-semibold pt-1">{log.details}</p>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-500">User: {log.user}</span>
                    {log.student && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-500">Student Ref: {log.student.studentId}</span>
                      </>
                    )}
                  </div>
                  {/* Values diffing preview */}
                  {(log.oldValue || log.newValue) && (
                    <div className="mt-2.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 max-h-32 overflow-y-auto">
                      {log.oldValue && (
                        <div className="mb-1 text-rose-400">
                          <span>- OLD: </span>
                          <span>{JSON.stringify(log.oldValue)}</span>
                        </div>
                      )}
                      {log.newValue && (
                        <div className="text-emerald-400">
                          <span>+ NEW: </span>
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
      {/* 7. MANUAL STUDENT REGISTRATION MODAL */}
      {/* ========================================== */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-slide-up my-8">
            <div className="px-6 py-4 bg-[#0B192C] text-white flex justify-between items-center">
              <span className="text-sm font-bold">Manual Student Registration Form</span>
              <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Academic Fields */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">Academic Details</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Admission Number</label>
                    <input
                      type="text"
                      required
                      value={studentForm.admissionNumber}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, admissionNumber: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                      placeholder="e.g. ADM202688"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">School Board</label>
                      <select
                        value={studentForm.schoolType}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, schoolType: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                        className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                        className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                        className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                        className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Tuition Fee amount (₹)</label>
                      <input
                        type="number"
                        value={studentForm.tuitionFeeAmount}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, tuitionFeeAmount: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                        placeholder="e.g. 15000"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">Personal Information</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Gender</label>
                      <select
                        value={studentForm.gender}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                        className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                      className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      required
                      value={studentForm.motherName}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, motherName: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                    />
                  </div>
                </div>

              </div>

              {/* Contacts and Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Parent Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={studentForm.parentMobile}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, parentMobile: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
                    placeholder="10 digit number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Email address (Optional)</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1"
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
                  className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5"
                  rows={2}
                  placeholder="Street address, City, Pin"
                />
              </div>

              {studentFormError && <p className="text-xs text-rose-500 font-semibold">{studentFormError}</p>}

              <div className="flex space-x-2 pt-2 justify-end border-t border-slate-100">
                <button type="submit" className="py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer">Register Student</button>
                <button type="button" onClick={() => setShowAddStudent(false)} className="py-2 px-4 bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer">Cancel</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
