'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Eye, Loader2 } from 'lucide-react';

export default function StudentHistoryRegistry({ onOpenStudentHistory }) {
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [filterSchoolType, setFilterSchoolType] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filterSchoolType, filterClass, filterSection, searchQuery]);

  const fetchClasses = async () => {
    try {
      const cls = await api.get('/classes');
      setClasses(cls);
    } catch (err) {
      console.error(err);
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
      if (searchQuery.trim()) params.push(`q=${encodeURIComponent(searchQuery)}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const data = await api.get(url);
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const getFilteredClasses = () => {
    if (!filterSchoolType) return [];
    return classes.filter(c => c.schoolType === filterSchoolType);
  };

  const getFilteredSections = () => {
    if (!filterSchoolType || !filterClass) return [];
    const config = classes.find(c => c.schoolType === filterSchoolType && c.name === filterClass);
    return config ? config.sections : [];
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-800">Clearance Histories Registry</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Select a student record to inspect its clearance workflow logs, payment receipt ledgers, and departments clearance progression maps</p>
      </div>

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-50 p-4 border border-slate-150 rounded-2xl text-xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full border border-slate-250 bg-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 text-slate-800 font-semibold"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">School Board</label>
          <select
            value={filterSchoolType}
            onChange={(e) => {
              setFilterSchoolType(e.target.value);
              setFilterClass('');
              setFilterSection('');
            }}
            className="block w-full border border-slate-250 bg-white rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="">All Boards</option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE">ICSE</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Class</label>
          <select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setFilterSection('');
            }}
            disabled={!filterSchoolType}
            className="block w-full border border-slate-250 bg-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 text-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <option value="">All Classes</option>
            {getFilteredClasses().map(c => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Section</label>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            disabled={!filterClass}
            className="block w-full border border-slate-250 bg-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 text-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <option value="">All Sections</option>
            {getFilteredSections().map((sec, idx) => (
              <option key={idx} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setFilterSchoolType(''); setFilterClass(''); setFilterSection(''); setSearchQuery(''); }}
            className="w-full py-1.5 text-center text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {studentsLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="animate-spin h-7 w-7 text-indigo-600" />
        </div>
      ) : students.length === 0 ? (
        <p className="text-center text-slate-450 text-xs py-8">No student records found matching current query filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Class-Sec</th>
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
                  <td className="py-3.5 px-4 font-bold text-slate-850">{s.class} - {s.section}</td>
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
                      className="inline-flex items-center space-x-1 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/65 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View History</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
