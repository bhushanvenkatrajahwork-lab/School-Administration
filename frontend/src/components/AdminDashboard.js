'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../utils/api';
import { 
  Users, CheckCircle, Clock, ShieldAlert, Receipt, BookOpen, Shirt, Plus, 
  Search, Trash2, Edit3, UserCheck, Shield, ChevronRight, HelpCircle, 
  Settings, Loader2, Download, ToggleLeft, ToggleRight, Info, Eye,
  Building, Library, FolderKanban, Check, X, AlertCircle, FileSpreadsheet
} from 'lucide-react';

export default function AdminDashboard({ activeTab, onOpenStudentHistory }) {
  const activeSubTab = activeTab || 'overview';
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Interactive metrics modal states
  const [selectedMetric, setSelectedMetric] = useState(null); // 'students' | 'collections' | 'pending' | 'clearance'
  const [metricDetailData, setMetricDetailData] = useState([]);
  const [metricDetailLoading, setMetricDetailLoading] = useState(false);
  const [metricSearchQuery, setMetricSearchQuery] = useState('');

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
    tuitionFeeAmount: '',
    transportEnrollment: 'No', transportType: 'Parent Transport', busRoute: '',
    busNumber: '', boardingPoint: '', transportRemarks: '',
    pickupLocation: '', dropLocation: '',
    outsourcedName: '', outsourcedContactPerson: '', outsourcedContactNumber: '',
    outsourcedRoute: '', outsourcedPickup: '', outsourcedDrop: '',
    lunchEnrollment: 'Not Taking School Lunch', lunchPeriod: 'Monthly'
  });
  const [studentFormError, setStudentFormError] = useState('');
  
  // Bulk Import state
  const [parsedStudents, setParsedStudents] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [overwriteConflicts, setOverwriteConflicts] = useState(false);
  const [bulkResult, setBulkResult] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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

  // Transport Config states
  const [transportConfigs, setTransportConfigs] = useState([]);
  const [showAddTransportConfig, setShowAddTransportConfig] = useState(false);
  const [transportConfigForm, setTransportConfigForm] = useState({ route: '', feeAmount: '', busNumber: '' });

  // Lunch Config states
  const [lunchConfigs, setLunchConfigs] = useState([]);
  const [showAddLunchConfig, setShowAddLunchConfig] = useState(false);
  const [lunchConfigForm, setLunchConfigForm] = useState({ period: 'Monthly', feeAmount: '' });

  // User Management states
  const [usersList, setUsersList] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'TUITION_DEPT', name: '' });
  const [userFormError, setUserFormError] = useState('');

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Filter classes by selected board
  const getDirectoryFilteredClasses = () => {
    if (!filterSchoolType) return [];
    return classes.filter(c => c.schoolType === filterSchoolType);
  };

  // Filter sections by selected board & class
  const getDirectoryFilteredSections = () => {
    if (!filterSchoolType || !filterClass) return [];
    const config = classes.find(c => c.schoolType === filterSchoolType && c.name === filterClass);
    return config ? config.sections : [];
  };

  useEffect(() => {
    fetchStats();
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'students' || activeSubTab === 'history') {
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
      const trn = await api.get('/classes/transportation');
      const ln = await api.get('/classes/lunch');
      setClasses(cls);
      setBooksConfig(bks);
      setUniformsConfig(uni);
      setTransportConfigs(trn || []);
      setLunchConfigs(ln || []);
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

  const handleMetricCardClick = async (type) => {
    setSelectedMetric(type);
    setMetricDetailLoading(true);
    setMetricDetailData([]);
    setMetricSearchQuery('');
    try {
      let data = [];
      if (type === 'students') {
        data = await api.get('/students');
      } else if (type === 'collections') {
        const res = await api.get('/reports/collections');
        data = res.payments || [];
      } else if (type === 'pending') {
        data = await api.get('/reports/pending');
      } else if (type === 'clearance') {
        const res = await api.get('/reports/clearance');
        data = res.filter(s => s.clearanceStatus === 'COMPLETED');
      }
      setMetricDetailData(data);
    } catch (err) {
      console.error('Error fetching metric details:', err);
    } finally {
      setMetricDetailLoading(false);
    }
  };

  const getFilteredMetricData = () => {
    if (!metricSearchQuery.trim()) return metricDetailData;
    const q = metricSearchQuery.toLowerCase();
    return metricDetailData.filter(item => {
      if (selectedMetric === 'students') {
        return (
          item.name?.toLowerCase().includes(q) ||
          item.studentId?.toLowerCase().includes(q) ||
          item.class?.toLowerCase().includes(q) ||
          item.admissionNumber?.toLowerCase().includes(q)
        );
      } else if (selectedMetric === 'collections') {
        return (
          item.student?.name?.toLowerCase().includes(q) ||
          item.student?.studentId?.toLowerCase().includes(q) ||
          item.receiptNumber?.toLowerCase().includes(q) ||
          item.feeType?.toLowerCase().includes(q) ||
          item.paymentMethod?.toLowerCase().includes(q)
        );
      } else if (selectedMetric === 'pending') {
        return (
          item.name?.toLowerCase().includes(q) ||
          item.studentId?.toLowerCase().includes(q) ||
          item.feeType?.toLowerCase().includes(q) ||
          item.classSection?.toLowerCase().includes(q)
        );
      } else if (selectedMetric === 'clearance') {
        return (
          item.name?.toLowerCase().includes(q) ||
          item.studentId?.toLowerCase().includes(q) ||
          item.class?.toLowerCase().includes(q) ||
          item.admissionNumber?.toLowerCase().includes(q)
        );
      }
      return false;
    });
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
        tuitionFeeAmount: '',
        transportEnrollment: 'No', transportType: 'Parent Transport', busRoute: '',
        busNumber: '', boardingPoint: '', transportRemarks: '',
        pickupLocation: '', dropLocation: '',
        outsourcedName: '', outsourcedContactPerson: '', outsourcedContactNumber: '',
        outsourcedRoute: '', outsourcedPickup: '', outsourcedDrop: '',
        lunchEnrollment: 'Not Taking School Lunch', lunchPeriod: 'Monthly'
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

  const handleAddTransportConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes/transportation', {
        route: transportConfigForm.route,
        busNumber: transportConfigForm.busNumber,
        feeAmount: Number(transportConfigForm.feeAmount)
      });
      setShowAddTransportConfig(false);
      setTransportConfigForm({ route: '', feeAmount: '', busNumber: '' });
      fetchConfigs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddLunchConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes/lunch', {
        period: lunchConfigForm.period,
        feeAmount: Number(lunchConfigForm.feeAmount)
      });
      setShowAddLunchConfig(false);
      setLunchConfigForm({ period: 'Monthly', feeAmount: '' });
      fetchConfigs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Admission Number',
      'Student Name',
      'Gender',
      'Date of Birth (YYYY-MM-DD)',
      'School Board (CBSE/ICSE)',
      'Class',
      'Section',
      'Roll Number',
      'Father Name',
      'Mother Name',
      'Parent Mobile',
      'Parent Email',
      'Residential Address',
      'Academic Year (e.g. 2026-2027)',
      'Tuition Fee Amount (Optional)',
      'Transport Enrollment (Yes/No)',
      'Transport Type (School Bus/Parent Transport/Outsourced Transport)',
      'Bus Route',
      'Pickup Location',
      'Drop Location',
      'Boarding Point',
      'Transport Remarks',
      'Outsourced Name',
      'Outsourced Contact Person',
      'Outsourced Contact Number',
      'Outsourced Route',
      'Outsourced Pickup',
      'Outsourced Drop',
      'Lunch Enrollment (Lunch at School/Not Taking School Lunch)',
      'Lunch Period (Monthly/Quarterly/Annual)'
    ];
    
    const sampleData = [
      {
        'Admission Number': 'ADM2026001',
        'Student Name': 'Rahul Sharma',
        'Gender': 'Male',
        'Date of Birth (YYYY-MM-DD)': '2010-05-15',
        'School Board (CBSE/ICSE)': 'CBSE',
        'Class': 'Class 10',
        'Section': 'A',
        'Roll Number': '15',
        'Father Name': 'Amit Sharma',
        'Mother Name': 'Sunita Sharma',
        'Parent Mobile': '9876543210',
        'Parent Email': 'rahul.parent@example.com',
        'Residential Address': '123 Park Street, Sector 4, Bangalore',
        'Academic Year (e.g. 2026-2027)': '2026-2027',
        'Tuition Fee Amount (Optional)': 12000
      },
      {
        'Admission Number': 'ADM2026002',
        'Student Name': 'Priya Patel',
        'Gender': 'Female',
        'Date of Birth (YYYY-MM-DD)': '2011-09-22',
        'School Board (CBSE/ICSE)': 'ICSE',
        'Class': 'Class 9',
        'Section': 'B',
        'Roll Number': '24',
        'Father Name': 'Vikram Patel',
        'Mother Name': 'Neha Patel',
        'Parent Mobile': '9898989898',
        'Parent Email': 'priya.parent@example.com',
        'Residential Address': '456 Garden Road, Indiranagar, Bangalore',
        'Academic Year (e.g. 2026-2027)': '2026-2027',
        'Tuition Fee Amount (Optional)': 15000
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk Import Format');
    XLSX.writeFile(workbook, 'student_bulk_import_template.xlsx');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkError('');
    setBulkResult('');
    setParsedStudents([]);
    setUploadErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setBulkError('The uploaded file contains no data rows.');
          return;
        }

        const headerMapping = {
          'Admission Number': 'admissionNumber',
          'Student Name': 'name',
          'Gender': 'gender',
          'Date of Birth (YYYY-MM-DD)': 'dob',
          'School Board (CBSE/ICSE)': 'schoolType',
          'Class': 'class',
          'Section': 'section',
          'Roll Number': 'rollNumber',
          'Father Name': 'fatherName',
          'Mother Name': 'motherName',
          'Parent Mobile': 'parentMobile',
          'Parent Email': 'email',
          'Residential Address': 'address',
          'Academic Year (e.g. 2026-2027)': 'academicYear',
          'Tuition Fee Amount (Optional)': 'tuitionFeeAmount',
          'Transport Enrollment (Yes/No)': 'transportEnrollment',
          'Transport Type (School Bus/Parent Transport/Outsourced Transport)': 'transportType',
          'Bus Route': 'busRoute',
          'Pickup Location': 'pickupLocation',
          'Drop Location': 'dropLocation',
          'Boarding Point': 'boardingPoint',
          'Transport Remarks': 'transportRemarks',
          'Outsourced Name': 'outsourcedName',
          'Outsourced Contact Person': 'outsourcedContactPerson',
          'Outsourced Contact Number': 'outsourcedContactNumber',
          'Outsourced Route': 'outsourcedRoute',
          'Outsourced Pickup': 'outsourcedPickup',
          'Outsourced Drop': 'outsourcedDrop',
          'Lunch Enrollment (Lunch at School/Not Taking School Lunch)': 'lunchEnrollment',
          'Lunch Period (Monthly/Quarterly/Annual)': 'lunchPeriod'
        };

        const requiredHeaders = [
          'Admission Number',
          'Student Name',
          'Gender',
          'Date of Birth (YYYY-MM-DD)',
          'School Board (CBSE/ICSE)',
          'Class',
          'Section',
          'Roll Number',
          'Father Name',
          'Mother Name',
          'Parent Mobile',
          'Residential Address',
          'Academic Year (e.g. 2026-2027)'
        ];

        // Validate critical headers are present in the sheet
        const excelKeys = Object.keys(jsonData[0]);
        const missingCritical = requiredHeaders.filter(h => !excelKeys.includes(h));
        if (missingCritical.length > 0) {
          setBulkError(`Format mismatch. Missing critical spreadsheet columns: ${missingCritical.slice(0, 3).join(', ')}...`);
          return;
        }

        const validatedList = [];
        const errorList = [];

        jsonData.forEach((row, idx) => {
          const student = {};
          const rowErrors = [];
          const rowNum = idx + 2;

          Object.entries(headerMapping).forEach(([excelHeader, key]) => {
            let val = row[excelHeader] !== undefined ? String(row[excelHeader]).trim() : '';
            
            if (key === 'gender') {
              if (val) {
                val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
              }
            }
            if (key === 'schoolType') {
              val = val.toUpperCase();
            }

            student[key] = val;
          });

          // Optional field fallbacks for missing columns
          if (!student.transportEnrollment) student.transportEnrollment = 'No';
          if (!student.transportType) student.transportType = 'Parent Transport';
          if (!student.lunchEnrollment) student.lunchEnrollment = 'Not Taking School Lunch';

          const requiredFields = {
            admissionNumber: 'Admission Number',
            name: 'Student Name',
            gender: 'Gender',
            dob: 'Date of Birth (YYYY-MM-DD)',
            schoolType: 'School Board (CBSE/ICSE)',
            class: 'Class',
            section: 'Section',
            rollNumber: 'Roll Number',
            fatherName: "Father's Name",
            motherName: "Mother's Name",
            parentMobile: 'Parent Mobile',
            address: 'Residential Address',
            academicYear: 'Academic Year'
          };

          Object.entries(requiredFields).forEach(([key, label]) => {
            if (!student[key]) {
              rowErrors.push(`Missing field: ${label}`);
            }
          });

          if (student.dob) {
            // Check if dob is excel numeric date or string
            if (/^\d+$/.test(student.dob)) {
              // Convert excel date serial number to string
              const utc_days = Math.floor(Number(student.dob) - 25569);
              const dateVal = new Date(utc_days * 86400 * 1000);
              student.dob = dateVal.toISOString().split('T')[0];
            } else {
              const dateVal = new Date(student.dob);
              if (isNaN(dateVal.getTime())) {
                rowErrors.push('Invalid Date format. Use YYYY-MM-DD.');
              }
            }
          }

          if (student.schoolType && !['CBSE', 'ICSE'].includes(student.schoolType)) {
            rowErrors.push('Invalid Board. Use CBSE or ICSE.');
          }

          if (student.gender && !['Male', 'Female', 'Other'].includes(student.gender)) {
            rowErrors.push('Invalid Gender. Use Male, Female, or Other.');
          }

          if (student.parentMobile && !/^\d+$/.test(student.parentMobile)) {
            rowErrors.push('Mobile must be numbers only.');
          }

          if (!student.tuitionFeeAmount) {
            if (student.schoolType === 'CBSE') {
              student.tuitionFeeAmount = 12000;
            } else if (student.schoolType === 'ICSE') {
              student.tuitionFeeAmount = 15000;
            }
          } else {
            student.tuitionFeeAmount = Number(student.tuitionFeeAmount);
            if (isNaN(student.tuitionFeeAmount) || student.tuitionFeeAmount < 0) {
              rowErrors.push('Tuition Fee must be positive number.');
            }
          }

          const isValid = rowErrors.length === 0;
          validatedList.push({
            rowNumber: rowNum,
            data: student,
            errors: rowErrors,
            valid: isValid
          });

          if (!isValid) {
            errorList.push(`Row ${rowNum}: ${rowErrors.join(' | ')}`);
          }
        });

        setParsedStudents(validatedList);
        setUploadErrors(errorList);
      } catch (err) {
        console.error(err);
        setBulkError('Failed to parse spreadsheet file. Please check format.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    setBulkError('');
    setBulkResult('');

    if (parsedStudents.length === 0) {
      setBulkError('Please upload a spreadsheet with student rows.');
      return;
    }

    const invalidRows = parsedStudents.filter(s => !s.valid);
    if (invalidRows.length > 0) {
      setBulkError(`Please correct the ${invalidRows.length} invalid rows before importing.`);
      return;
    }

    setBulkSubmitting(true);
    try {
      const studentPayload = parsedStudents.map(s => s.data);
      const res = await api.post('/students/import', { 
        students: studentPayload,
        overwriteConflicts
      });
      
      setBulkResult(`Processed: ${res.successCount} imported/updated successfully. ${res.failCount} skipped/failed.`);
      if (res.errors && res.errors.length > 0) {
        setUploadErrors(res.errors);
      } else {
        setParsedStudents([]);
        setUploadErrors([]);
      }
      fetchStats();
      fetchStudents();
    } catch (err) {
      setBulkError(err.message || 'Bulk student import failed.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub tabs navigation removed to rely on sidebar */}

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
                    { label: 'Student Enrolled', value: stats.metrics.totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50/80 border-indigo-100/50', type: 'students' },
                    { label: 'Fees Collected', value: `₹${stats.metrics.totalCollected.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/80 border-emerald-100/50', type: 'collections' },
                    { label: 'Pending Balance', value: `₹${stats.metrics.totalPending.toLocaleString('en-IN')}`, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50/80 border-rose-100/50', type: 'pending' },
                    { label: 'Clearances Issued', value: stats.workflowProgress.completed, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50/80 border-teal-100/50', type: 'clearance' }
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => handleMetricCardClick(card.type)}
                        className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium hover-lift cursor-pointer hover:border-indigo-400/80 hover:shadow-lg transition-all"
                      >
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
                  {getDirectoryFilteredClasses().map(c => (
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
                  {getDirectoryFilteredSections().map((sec, idx) => (
                    <option key={idx} value={sec}>{sec}</option>
                  ))}
                </select>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium space-y-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Bulk Student Spreadsheet Importer
                </h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Ingest multiple student records at once via Excel spreadsheet format</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center space-x-1.5 py-2 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Download Sample Excel Template</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-xs text-slate-500 bg-indigo-50/50 p-4 border border-indigo-200/40 rounded-xl flex items-start space-x-2.5">
                <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800">Spreadsheet Ingestion Guidelines:</p>
                  <p className="mt-1 leading-normal">
                    Download the official template above, fill out all student details, and upload the sheet below. CBSE student tuition structures automatically default to <strong>₹12,000</strong> and ICSE to <strong>₹15,000</strong> if left blank. Gender must be Male, Female, or Other.
                  </p>
                </div>
              </div>

              {/* Excel Drag & Drop Picker Zone */}
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-600 bg-indigo-50/15' 
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/20 hover:bg-slate-50/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files) {
                    handleFileUpload({ target: { files: e.dataTransfer.files } });
                  }
                }}
              >
                <input 
                  type="file" 
                  id="excel-file-upload" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                <label htmlFor="excel-file-upload" className="cursor-pointer flex flex-col items-center">
                  <FileSpreadsheet className="h-10 w-10 text-indigo-500 mb-2" />
                  <span className="text-xs font-bold text-slate-800">
                    Click to select file or drag & drop student sheet
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports Microsoft Excel (.xlsx, .xls) and CSV files</span>
                </label>
              </div>

              {/* Overwrite conflicts settings */}
              <div className="flex items-center space-x-2.5 p-3.5 bg-slate-50 border border-slate-150 rounded-2xl text-xs max-w-lg">
                <button
                  type="button"
                  onClick={() => setOverwriteConflicts(!overwriteConflicts)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none shrink-0"
                >
                  {overwriteConflicts ? (
                    <ToggleRight className="h-6.5 w-6.5 text-indigo-650" />
                  ) : (
                    <ToggleLeft className="h-6.5 w-6.5 text-slate-400" />
                  )}
                </button>
                <div>
                  <p className="font-bold text-slate-850">Overwrite existing records</p>
                  <p className="text-[10px] text-slate-450 mt-0.5">If matching Admission Numbers already exist, update their profiles with the Excel values instead of skipping.</p>
                </div>
              </div>

              {/* Excel Preview Grid */}
              {parsedStudents.length > 0 && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden space-y-3 p-4 bg-slate-50/30">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold text-slate-800">
                      Parsed Rows Summary ({parsedStudents.length} rows detected)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      parsedStudents.every(s => s.valid) 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                        : 'bg-rose-50 text-rose-700 border border-rose-250'
                    }`}>
                      {parsedStudents.filter(s => s.valid).length} / {parsedStudents.length} Valid
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200/70 rounded-xl bg-white scrollbar-thin">
                    <table className="min-w-full text-left text-xs divide-y divide-slate-150">
                      <thead>
                        <tr className="bg-slate-50 text-slate-455 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10 border-b border-slate-150">
                          <th className="py-2.5 px-3 bg-slate-50">Row</th>
                          <th className="py-2.5 px-3 bg-slate-50">Admission No</th>
                          <th className="py-2.5 px-3 bg-slate-50">Name</th>
                          <th className="py-2.5 px-3 bg-slate-50">Board</th>
                          <th className="py-2.5 px-3 bg-slate-50">Class-Sec</th>
                          <th className="py-2.5 px-3 bg-slate-50">Validation</th>
                          <th className="py-2.5 px-3 bg-slate-50">Notes / Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {parsedStudents.map((item) => (
                          <tr key={item.rowNumber} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-400">{item.rowNumber}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.data.admissionNumber || 'N/A'}</td>
                            <td className="py-2 px-3 font-bold text-slate-800">{item.data.name || 'N/A'}</td>
                            <td className="py-2 px-3 font-semibold text-slate-600">{item.data.schoolType || 'N/A'}</td>
                            <td className="py-2 px-3 font-semibold">{item.data.class ? `${item.data.class}-${item.data.section}` : 'N/A'}</td>
                            <td className="py-2 px-3">
                              {item.valid ? (
                                <Check className="h-4.5 w-4.5 text-emerald-500 bg-emerald-50 border border-emerald-200 rounded p-0.5" />
                              ) : (
                                <X className="h-4.5 w-4.5 text-rose-500 bg-rose-50 border border-rose-200 rounded p-0.5" />
                              )}
                            </td>
                            <td className={`py-2 px-3 text-[10px] ${item.valid ? 'text-slate-450 italic' : 'text-rose-600 font-medium'}`}>
                              {item.valid ? 'Ready to import' : item.errors.join(' | ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status and submit actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="max-w-md shrink pr-4">
                  {bulkError && <p className="text-xs font-semibold text-rose-500 bg-rose-50 p-2 border border-rose-200 rounded-lg">{bulkError}</p>}
                  {bulkResult && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 border border-emerald-200 rounded-lg">{bulkResult}</p>}
                </div>

                <div className="flex space-x-2 shrink-0">
                  {parsedStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setParsedStudents([]); setUploadErrors([]); setBulkError(''); setBulkResult(''); }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Clear File
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleBulkImportSubmit}
                    disabled={bulkSubmitting || parsedStudents.length === 0 || parsedStudents.some(s => !s.valid)}
                    className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-550 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {bulkSubmitting ? 'Importing Data...' : 'Confirm Bulk Import'}
                  </button>
                </div>
              </div>
            </div>
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
                    onChange={(e) => setBookConfigForm(prev => ({ ...prev, schoolType: e.target.value, class: '' }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Class Name</label>
                  <select
                    required
                    value={bookConfigForm.class}
                    onChange={(e) => setBookConfigForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 cursor-pointer text-slate-850"
                  >
                    <option value="">-- Select Class --</option>
                    {classes
                      .filter(c => c.schoolType === bookConfigForm.schoolType)
                      .map(c => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                  </select>
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
                  <select
                    required
                    value={uniformConfigForm.class}
                    onChange={(e) => setUniformConfigForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 cursor-pointer text-slate-850"
                  >
                    <option value="">-- Select Class --</option>
                    {Array.from(new Set(classes.map(c => c.name))).map((className, idx) => (
                      <option key={idx} value={className}>{className}</option>
                    ))}
                  </select>
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

          {/* Transport configs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building className="h-4.5 w-4.5 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transport Routes</h3>
              </div>
              <button onClick={() => setShowAddTransportConfig(true)} className="p-1 text-indigo-650 hover:bg-indigo-50 rounded-lg cursor-pointer">
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            {showAddTransportConfig && (
              <form onSubmit={handleAddTransportConfigSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1">Route Name</label>
                  <input
                    type="text"
                    required
                    value={transportConfigForm.route}
                    onChange={(e) => setTransportConfigForm(prev => ({ ...prev, route: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    placeholder="e.g. Route D"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1">Bus Number</label>
                  <input
                    type="text"
                    value={transportConfigForm.busNumber}
                    onChange={(e) => setTransportConfigForm(prev => ({ ...prev, busNumber: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    placeholder="e.g. BUS-D404"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1">Route Fee amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={transportConfigForm.feeAmount}
                    onChange={(e) => setTransportConfigForm(prev => ({ ...prev, feeAmount: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save</button>
                  <button type="button" onClick={() => setShowAddTransportConfig(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {transportConfigs.map(t => (
                <div key={t._id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{t.route}</span>
                    <span className="ml-2 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-bold">{t.busNumber || 'N/A'}</span>
                  </div>
                  <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-lg">₹{t.feeAmount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lunch configs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FolderKanban className="h-4.5 w-4.5 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Lunch Plans</h3>
              </div>
              <button onClick={() => setShowAddLunchConfig(true)} className="p-1 text-indigo-650 hover:bg-indigo-50 rounded-lg cursor-pointer">
                <Plus className="h-4.5 w-4.5" />
              </button>
            </div>

            {showAddLunchConfig && (
              <form onSubmit={handleAddLunchConfigSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1">Period Plan</label>
                  <select
                    value={lunchConfigForm.period}
                    onChange={(e) => setLunchConfigForm(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1">Lunch Fee amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={lunchConfigForm.feeAmount}
                    onChange={(e) => setLunchConfigForm(prev => ({ ...prev, feeAmount: e.target.value }))}
                    className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save</button>
                  <button type="button" onClick={() => setShowAddLunchConfig(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold">Cancel</button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
              {lunchConfigs.map(l => (
                <div key={l._id} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{l.period} Plan</span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-lg">₹{l.feeAmount}</span>
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
      {/* 6.5 STUDENT HISTORIES VIEW */}
      {/* ========================================== */}
      {activeSubTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Student Histories Registry</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Select a student record to inspect its clearance workflow logs and download fee receipts</p>
          </div>

          {/* Simple filter inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-150 rounded-2xl text-xs">
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
                {getDirectoryFilteredClasses().map(c => (
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
                {getDirectoryFilteredSections().map((sec, idx) => (
                  <option key={idx} value={sec}>{sec}</option>
                ))}
              </select>
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

          {studentsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
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
                        onChange={(e) => setStudentForm(prev => ({ ...prev, schoolType: e.target.value, class: '', section: '' }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
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
                      <select
                        required
                        value={studentForm.class}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, class: e.target.value, section: '' }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer text-slate-800"
                      >
                        <option value="">-- Select Class --</option>
                        {classes
                          .filter(c => c.schoolType === studentForm.schoolType)
                          .map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Section</label>
                      <select
                        required
                        value={studentForm.section}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, section: e.target.value }))}
                        disabled={!studentForm.class}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer text-slate-800 disabled:opacity-50"
                      >
                        <option value="">-- Sec --</option>
                        {(classes.find(c => c.schoolType === studentForm.schoolType && c.name === studentForm.class)?.sections || []).map((sec, idx) => (
                          <option key={idx} value={sec}>{sec}</option>
                        ))}
                      </select>
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

              {/* Transportation Fields */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[10px]">Transportation Enrollment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Enrollment Status</label>
                    <select
                      value={studentForm.transportEnrollment}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, transportEnrollment: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {studentForm.transportEnrollment === 'Yes' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Transport Type</label>
                      <select
                        value={studentForm.transportType}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, transportType: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="School Bus">School Bus</option>
                        <option value="Parent Transport">Parent Transport</option>
                        <option value="Outsourced Transport">Outsourced Transport</option>
                      </select>
                    </div>
                  )}
                </div>

                {studentForm.transportEnrollment === 'Yes' && studentForm.transportType === 'School Bus' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Bus Route</label>
                      <select
                        value={studentForm.busRoute}
                        onChange={(e) => {
                          const routeName = e.target.value;
                          const routeConfig = transportConfigs.find(c => c.route === routeName);
                          setStudentForm(prev => ({ 
                            ...prev, 
                            busRoute: routeName,
                            busNumber: routeConfig ? routeConfig.busNumber : '' 
                          }));
                        }}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Select Route --</option>
                        {transportConfigs.map((t, idx) => (
                          <option key={idx} value={t.route}>{t.route}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Bus Number</label>
                      <input
                        type="text"
                        readOnly
                        value={studentForm.busNumber}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-1.5 focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Pickup Location</label>
                      <input
                        type="text"
                        value={studentForm.pickupLocation}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Drop Location</label>
                      <input
                        type="text"
                        value={studentForm.dropLocation}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, dropLocation: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Boarding Point</label>
                      <input
                        type="text"
                        value={studentForm.boardingPoint}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, boardingPoint: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Transport Remarks</label>
                      <input
                        type="text"
                        value={studentForm.transportRemarks}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, transportRemarks: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {studentForm.transportEnrollment === 'Yes' && studentForm.transportType === 'Outsourced Transport' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Outsourced Provider Name</label>
                      <input
                        type="text"
                        value={studentForm.outsourcedName}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, outsourcedName: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={studentForm.outsourcedContactPerson}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, outsourcedContactPerson: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Contact Number</label>
                      <input
                        type="text"
                        value={studentForm.outsourcedContactNumber}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, outsourcedContactNumber: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Outsourced Route</label>
                      <input
                        type="text"
                        value={studentForm.outsourcedRoute}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, outsourcedRoute: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lunch Fields */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[10px]">Lunch Facility</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Lunch Enrollment</label>
                    <select
                      value={studentForm.lunchEnrollment}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, lunchEnrollment: e.target.value }))}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Not Taking School Lunch">Not Taking School Lunch</option>
                      <option value="Lunch at School">Lunch at School</option>
                    </select>
                  </div>

                  {studentForm.lunchEnrollment === 'Lunch at School' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Lunch Plan Period</label>
                      <select
                        value={studentForm.lunchPeriod}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, lunchPeriod: e.target.value }))}
                        className="w-full border border-slate-200 bg-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Annual">Annual</option>
                      </select>
                    </div>
                  )}
                </div>
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

      {/* METRICS DETAILS MODAL */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden animate-slide-up my-8">
            {/* Header */}
            <div className="px-6 py-4.5 bg-[#0B192C] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2.5 py-0.5 rounded-full">
                  Overview Metrics Details
                </span>
                <h4 className="text-base font-black mt-1">
                  {selectedMetric === 'students' && 'Enrolled Students Listing'}
                  {selectedMetric === 'collections' && 'Cash Ledger Payments History'}
                  {selectedMetric === 'pending' && 'Outstanding Balance Ledgers'}
                  {selectedMetric === 'clearance' && 'Completed Clearances Directory'}
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
                  className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-slate-850 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-xs transition-all"
                />
              </div>

              {/* Data Content */}
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
                    {/* Dynamic Table Header */}
                    {selectedMetric === 'students' && (
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10 border-b border-slate-200/80">
                          <th className="py-3 px-4 bg-slate-50">Student ID</th>
                          <th className="py-3 px-4 bg-slate-50">Name</th>
                          <th className="py-3 px-4 bg-slate-50">Admission No</th>
                          <th className="py-3 px-4 bg-slate-50">Roll No</th>
                          <th className="py-3 px-4 bg-slate-50">Class-Sec</th>
                          <th className="py-3 px-4 bg-slate-50">Board</th>
                          <th className="py-3 px-4 bg-slate-50">Gender</th>
                          <th className="py-3 px-4 bg-slate-50">Clearance Status</th>
                        </tr>
                      </thead>
                    )}

                    {selectedMetric === 'collections' && (
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10 border-b border-slate-200/80">
                          <th className="py-3 px-4 bg-slate-50">Receipt Number</th>
                          <th className="py-3 px-4 bg-slate-50">Student ID</th>
                          <th className="py-3 px-4 bg-slate-50">Student Name</th>
                          <th className="py-3 px-4 bg-slate-50">Class-Sec</th>
                          <th className="py-3 px-4 bg-slate-50">Fee Type</th>
                          <th className="py-3 px-4 bg-slate-50">Amount Paid</th>
                          <th className="py-3 px-4 bg-slate-50">Method</th>
                          <th className="py-3 px-4 bg-slate-50">Payment Date</th>
                        </tr>
                      </thead>
                    )}

                    {selectedMetric === 'pending' && (
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10 border-b border-slate-200/80">
                          <th className="py-3 px-4 bg-slate-50">Student ID</th>
                          <th className="py-3 px-4 bg-slate-50">Student Name</th>
                          <th className="py-3 px-4 bg-slate-50">Class-Sec</th>
                          <th className="py-3 px-4 bg-slate-50">Admission No</th>
                          <th className="py-3 px-4 bg-slate-50">Fee Type</th>
                          <th className="py-3 px-4 bg-slate-50">Total Fee</th>
                          <th className="py-3 px-4 bg-slate-50">Amount Paid</th>
                          <th className="py-3 px-4 bg-slate-50">Outstanding Balance</th>
                          <th className="py-3 px-4 bg-slate-50">Status</th>
                        </tr>
                      </thead>
                    )}

                    {selectedMetric === 'clearance' && (
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10 border-b border-slate-200/80">
                          <th className="py-3 px-4 bg-slate-50">Student ID</th>
                          <th className="py-3 px-4 bg-slate-50">Name</th>
                          <th className="py-3 px-4 bg-slate-50">Admission No</th>
                          <th className="py-3 px-4 bg-slate-50">Class-Sec</th>
                          <th className="py-3 px-4 bg-slate-50">School Board</th>
                          <th className="py-3 px-4 bg-slate-50">Academic Year</th>
                          <th className="py-3 px-4 bg-slate-50">Clearance Status</th>
                        </tr>
                      </thead>
                    )}

                    {/* Table Body */}
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {getFilteredMetricData().map((item, index) => (
                        <tr key={item._id || index} className="hover:bg-slate-50/50 transition-colors">
                          {selectedMetric === 'students' && (
                            <>
                              <td className="py-3.5 px-4 font-bold text-slate-900">{item.studentId}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">{item.name}</td>
                              <td className="py-3.5 px-4 font-mono">{item.admissionNumber}</td>
                              <td className="py-3.5 px-4">{item.rollNumber}</td>
                              <td className="py-3.5 px-4 font-bold">{item.class} - {item.section}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.schoolType === 'CBSE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/40' : 'bg-rose-50 text-rose-700 border border-rose-200/40'}`}>
                                  {item.schoolType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">{item.gender}</td>
                              <td className="py-3.5 px-4 font-semibold text-slate-650">{item.clearanceStatus.replace('_', ' ')}</td>
                            </>
                          )}

                          {selectedMetric === 'collections' && (
                            <>
                              <td className="py-3.5 px-4 font-bold text-slate-900">{item.receiptNumber}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">{item.student?.studentId || 'N/A'}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">{item.student?.name || 'Unknown'}</td>
                              <td className="py-3.5 px-4">{item.student?.class ? `${item.student.class}-${item.student.section}` : 'N/A'}</td>
                              <td className="py-3.5 px-4 font-semibold text-slate-600">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.feeType === 'Tuition' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/40' :
                                  item.feeType === 'Book' ? 'bg-amber-50 text-amber-700 border border-amber-200/40' :
                                  'bg-rose-50 text-rose-700 border border-rose-200/40'
                                }`}>
                                  {item.feeType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{item.amount.toLocaleString()}</td>
                              <td className="py-3.5 px-4 font-medium text-slate-500">{item.paymentMethod}</td>
                              <td className="py-3.5 px-4 text-slate-400">{new Date(item.paymentDate).toLocaleString()}</td>
                            </>
                          )}

                          {selectedMetric === 'pending' && (
                            <>
                              <td className="py-3.5 px-4 font-mono text-slate-550">{item.studentId}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-850">{item.name}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">{item.classSection}</td>
                              <td className="py-3.5 px-4 font-mono">{item.admissionNumber}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.feeType === 'Tuition' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/40' :
                                  item.feeType === 'Book' ? 'bg-amber-50 text-amber-700 border border-amber-200/40' :
                                  'bg-rose-50 text-rose-700 border border-rose-200/40'
                                }`}>
                                  {item.feeType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">₹{item.totalAmount.toLocaleString()}</td>
                              <td className="py-3.5 px-4">₹{item.paidAmount.toLocaleString()}</td>
                              <td className="py-3.5 px-4 font-extrabold text-rose-600 bg-rose-50/30">₹{item.balanceAmount.toLocaleString()}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'Partial' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                  {item.status}
                                </span>
                              </td>
                            </>
                          )}

                          {selectedMetric === 'clearance' && (
                            <>
                              <td className="py-3.5 px-4 font-bold text-slate-900">{item.studentId}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">{item.name}</td>
                              <td className="py-3.5 px-4 font-mono">{item.admissionNumber}</td>
                              <td className="py-3.5 px-4 font-bold">{item.class} - {item.section}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.schoolType === 'CBSE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/40' : 'bg-rose-50 text-rose-700 border border-rose-200/40'}`}>
                                  {item.schoolType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">{item.academicYear}</td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500 text-white shadow-sm border border-emerald-600">
                                  COMPLETED
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
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
