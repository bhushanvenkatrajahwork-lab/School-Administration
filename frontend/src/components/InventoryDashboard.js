'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Boxes, 
  Plus, 
  Search, 
  Trash, 
  Loader2, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  FolderOpen, 
  Truck, 
  ClipboardList, 
  IndianRupee, 
  Filter, 
  Sparkles, 
  Calendar,
  X,
  Edit2
} from 'lucide-react';

export default function InventoryDashboard() {
  const { user } = useAuth();
  // Navigation inside inventory portal
  const [subTab, setSubTab] = useState('overview'); // overview, catalog, suppliers, purchases, issues

  // Data States
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    recentlyIssued: 0,
    recentlyPurchased: 0,
    totalValue: 0
  });
  
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [issues, setIssues] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [classes, setClasses] = useState([]);

  // Loading States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [loadingForecasts, setLoadingForecasts] = useState(true);

  // Search & Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState('');
  const [catalogAlertFilter, setCatalogAlertFilter] = useState('');
  
  // Form / Modal States
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form Fields
  const [newItem, setNewItem] = useState({
    itemType: 'Uniform',
    name: '',
    class: '',
    size: 'N/A',
    quantity: 0,
    reorderThreshold: 10,
    unitCost: 0
  });

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    gstNumber: '',
    address: ''
  });

  const [newPurchase, setNewPurchase] = useState({
    supplierId: '',
    invoiceNumber: '',
    purchaseDate: '',
    itemType: 'Uniform',
    itemName: '',
    size: 'N/A',
    quantity: 1,
    cost: 0
  });

  const getFilteredStats = () => {
    let filteredItems = items;
    let filteredPurchases = purchases;
    let filteredIssues = issues;

    if (user?.role === 'UNIFORM_DEPT') {
      filteredItems = items.filter(i => i.itemType === 'Uniform');
      filteredPurchases = purchases.filter(p => p.itemType === 'Uniform');
      filteredIssues = issues.filter(is => is.itemType === 'Uniform');
    } else if (user?.role === 'BOOK_DEPT') {
      filteredItems = items.filter(i => i.itemType === 'Book');
      filteredPurchases = purchases.filter(p => p.itemType === 'Book');
      filteredIssues = issues.filter(is => is.itemType === 'Book');
    }

    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;

    filteredItems.forEach(item => {
      const qty = Number(item.quantity) || 0;
      totalStock += qty;
      totalValue += qty * (Number(item.unitCost) || 0);

      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= (Number(item.reorderThreshold) || 10)) {
        lowStockCount++;
      }
    });

    let recentlyIssued = 0;
    filteredIssues.forEach(is => {
      recentlyIssued++;
    });

    let recentlyPurchased = 0;
    filteredPurchases.forEach(p => {
      recentlyPurchased += Number(p.quantity) || 0;
    });

    return {
      totalStock,
      lowStockCount,
      outOfStockCount,
      recentlyIssued,
      recentlyPurchased,
      totalValue
    };
  };

  const computedStats = getFilteredStats();

  // Load baseline configurations
  useEffect(() => {
    fetchStats();
    fetchClasses();
    if (subTab === 'overview') {
      fetchStats();
      fetchForecasts();
    } else if (subTab === 'catalog') {
      fetchItems();
    } else if (subTab === 'suppliers') {
      fetchSuppliers();
    } else if (subTab === 'purchases') {
      fetchPurchases();
      fetchSuppliers(); // needed for purchase logging dropdown
    } else if (subTab === 'issues') {
      fetchIssues();
    }
  }, [subTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.get('/inventory/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching inventory stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await api.get('/classes');
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes config:', err);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      let url = '/inventory/items';
      const params = [];
      if (catalogSearch) params.push(`search=${encodeURIComponent(catalogSearch)}`);
      if (catalogTypeFilter) params.push(`itemType=${catalogTypeFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const data = await api.get(url);
      setItems(data);
    } catch (err) {
      console.error('Error fetching inventory catalog:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const data = await api.get('/inventory/suppliers');
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchPurchases = async () => {
    setLoadingPurchases(true);
    try {
      const data = await api.get('/inventory/purchases');
      setPurchases(data);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchIssues = async () => {
    setLoadingIssues(true);
    try {
      const data = await api.get('/inventory/issues');
      setIssues(data);
    } catch (err) {
      console.error('Error fetching student issues:', err);
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchForecasts = async () => {
    setLoadingForecasts(true);
    try {
      const data = await api.get('/inventory/forecast');
      setForecasts(data);
    } catch (err) {
      console.error('Error fetching forecasts:', err);
    } finally {
      setLoadingForecasts(false);
    }
  };

  // Submit handlers
  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/inventory/items/${editingItem._id}`, newItem);
      } else {
        await api.post('/inventory/items', newItem);
      }
      setShowItemModal(false);
      setEditingItem(null);
      resetItemForm();
      fetchItems();
      fetchStats();
    } catch (err) {
      alert(err.message || 'Error saving inventory item');
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/suppliers', newSupplier);
      setShowSupplierModal(false);
      resetSupplierForm();
      fetchSuppliers();
    } catch (err) {
      alert(err.message || 'Error registering supplier');
    }
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/purchases', newPurchase);
      setShowPurchaseModal(false);
      resetPurchaseForm();
      fetchPurchases();
      fetchStats();
    } catch (err) {
      alert(err.message || 'Error recording purchase entry');
    }
  };

  const startEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      itemType: item.itemType,
      name: item.name,
      class: item.class || '',
      size: item.size || 'N/A',
      quantity: item.quantity,
      reorderThreshold: item.reorderThreshold,
      unitCost: item.unitCost
    });
    setShowItemModal(true);
  };

  const resetItemForm = () => {
    setNewItem({
      itemType: user?.role === 'BOOK_DEPT' ? 'Book' : 'Uniform',
      name: '',
      class: '',
      size: 'N/A',
      quantity: 0,
      reorderThreshold: 10,
      unitCost: 0
    });
  };

  const resetSupplierForm = () => {
    setNewSupplier({
      name: '',
      phone: '',
      gstNumber: '',
      address: ''
    });
  };

  const resetPurchaseForm = () => {
    setNewPurchase({
      supplierId: '',
      invoiceNumber: '',
      purchaseDate: '',
      itemType: user?.role === 'BOOK_DEPT' ? 'Book' : 'Uniform',
      itemName: '',
      size: 'N/A',
      quantity: 1,
      cost: 0
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Boxes className="h-6 w-6 text-indigo-600" />
            <span>School Inventory & Clearance Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centralized inventory tracking, purchase ledger logging, size-wise allocations, and AI-simulated clearance run-out projections.
          </p>
        </div>
        
        {/* SUBTAB TOOLBAR */}
        <div className="flex flex-wrap gap-1 mt-4 md:mt-0 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
          <button 
            onClick={() => setSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${subTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-950'}`}
          >
            Overview & Alerts
          </button>
          <button 
            onClick={() => setSubTab('catalog')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${subTab === 'catalog' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-950'}`}
          >
            Stock Catalog
          </button>
          <button 
            onClick={() => setSubTab('purchases')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${subTab === 'purchases' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-950'}`}
          >
            Purchase Ledger
          </button>
          <button 
            onClick={() => setSubTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${subTab === 'suppliers' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-950'}`}
          >
            Suppliers
          </button>
          <button 
            onClick={() => setSubTab('issues')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${subTab === 'issues' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-950'}`}
          >
            Issues Log
          </button>
        </div>
      </div>

      {/* METRICS DASHBOARD (ALWAYS SHOWN ON TOP OF OVERVIEW & STATS READY) */}
      {loadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 animate-pulse">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-slate-100 h-20 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
          {/* Total Value Card */}
          <div 
            onClick={() => { setSubTab('catalog'); setCatalogAlertFilter(''); setCatalogSearch(''); setCatalogTypeFilter(''); }}
            className="bg-gradient-to-br from-[#0B1528] to-[#050B14] p-4 rounded-2xl border border-slate-800 text-white relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <IndianRupee className="absolute right-2.5 top-2.5 h-10 w-10 text-slate-700/25 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Valuation</span>
            <h4 className="text-lg font-black mt-1">₹{(computedStats.totalValue || 0).toLocaleString('en-IN')}</h4>
          </div>

          {/* Total Stock Available */}
          <div 
            onClick={() => { setSubTab('catalog'); setCatalogAlertFilter(''); setCatalogSearch(''); setCatalogTypeFilter(''); }}
            className="bg-white p-4 rounded-2xl border border-slate-200 relative overflow-hidden group hover:shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Boxes className="absolute right-2.5 top-2.5 h-10 w-10 text-slate-100 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Stock</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">{computedStats.totalStock || 0} <span className="text-[10px] text-slate-500 font-semibold">pcs</span></h4>
          </div>

          {/* Low Stock Alerts */}
          <div 
            onClick={() => { setSubTab('catalog'); setCatalogAlertFilter('low'); setCatalogSearch(''); setCatalogTypeFilter(''); }}
            className={`p-4 rounded-2xl border relative overflow-hidden group hover:shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${computedStats.lowStockCount > 0 ? 'bg-amber-50/50 border-amber-250' : 'bg-white border-slate-200'}`}
          >
            <AlertTriangle className={`absolute right-2.5 top-2.5 h-10 w-10 group-hover:scale-110 transition-transform ${computedStats.lowStockCount > 0 ? 'text-amber-300/40' : 'text-slate-100'}`} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Low Stock items</span>
            <h4 className={`text-lg font-black mt-1 ${computedStats.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{computedStats.lowStockCount || 0}</h4>
          </div>

          {/* Out of Stock Items */}
          <div 
            onClick={() => { setSubTab('catalog'); setCatalogAlertFilter('out'); setCatalogSearch(''); setCatalogTypeFilter(''); }}
            className={`p-4 rounded-2xl border relative overflow-hidden group hover:shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${computedStats.outOfStockCount > 0 ? 'bg-rose-50/50 border-rose-250 animate-pulse' : 'bg-white border-slate-200'}`}
          >
            <X className={`absolute right-2.5 top-2.5 h-10 w-10 group-hover:scale-110 transition-transform ${computedStats.outOfStockCount > 0 ? 'text-rose-300/45' : 'text-slate-100'}`} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Out of Stock</span>
            <h4 className={`text-lg font-black mt-1 ${computedStats.outOfStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{computedStats.outOfStockCount || 0}</h4>
          </div>

          {/* Recently Issued count */}
          <div 
            onClick={() => setSubTab('issues')}
            className="bg-white p-4 rounded-2xl border border-slate-200 relative overflow-hidden group hover:shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Users className="absolute right-2.5 top-2.5 h-10 w-10 text-slate-100 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Issued Stock</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">{computedStats.recentlyIssued || 0} <span className="text-[10px] text-slate-500 font-semibold">items</span></h4>
          </div>

          {/* Recently Purchased count */}
          <div 
            onClick={() => setSubTab('purchases')}
            className="bg-white p-4 rounded-2xl border border-slate-200 relative overflow-hidden group hover:shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <TrendingUp className="absolute right-2.5 top-2.5 h-10 w-10 text-slate-100 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Purchased Stock</span>
            <h4 className="text-lg font-black text-slate-800 mt-1">{computedStats.recentlyPurchased || 0} <span className="text-[10px] text-slate-500 font-semibold">pcs</span></h4>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 1. OVERVIEW & ALERT SUBTAB */}
      {/* ========================================== */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI-powered run-out projection checklist */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Clearance Stock AI-Forecast Predictions</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-bold">Simulated Model</span>
              </div>
              
              <p className="text-[11px] text-slate-500 leading-relaxed">
                We cross-analyze remaining registered students who haven't completed their Book or Uniform department clearances against current stock levels. This calculates actual imminent item shortages.
              </p>

              {loadingForecasts ? (
                <div className="h-36 flex items-center justify-center">
                  <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                </div>
              ) : forecasts.length === 0 ? (
                <p className="text-center text-slate-450 py-6 text-xs font-semibold">All configured stock items have sufficient quantities for remaining student clearances.</p>
              ) : (
                <div className="space-y-2">
                  {forecasts.filter(f => user?.role === 'SUPER_ADMIN' ? true : f.itemType === (user?.role === 'UNIFORM_DEPT' ? 'Uniform' : 'Book')).slice(0, 5).map((f, index) => {
                    const isShortage = f.shortage > 0;
                    const isOut = f.quantity === 0;
                    return (
                      <div key={index} className={`p-3.5 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isOut ? 'bg-rose-50/50 border-rose-200' : isShortage ? 'bg-amber-50/45 border-amber-250' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${f.itemType === 'Uniform' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{f.itemType}</span>
                            <span className="font-bold text-slate-800">{f.name}</span>
                            <span className="text-[10px] text-slate-500">({f.class} / Size: {f.size})</span>
                          </div>
                          
                          <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-slate-500 font-medium">
                            <span>Current Stock: <strong className="text-slate-700">{f.quantity}</strong></span>
                            <span>Remaining Students: <strong className="text-slate-700">{f.pendingDemand}</strong></span>
                            {isShortage && <span className="text-rose-600 font-bold">Deficit: -{f.shortage} pcs</span>}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isOut 
                              ? 'bg-rose-100 border border-rose-200 text-rose-800' 
                              : isShortage 
                                ? 'bg-amber-100 border border-amber-200 text-amber-800' 
                                : f.status === 'Low Stock'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {f.status}
                          </span>
                          <p className="text-[9px] text-slate-550 font-bold mt-1 uppercase tracking-wider">
                            {f.daysToRunOut === 0 
                              ? 'Run out complete' 
                              : f.daysToRunOut === 'N/A' 
                                ? 'Adequate supply' 
                                : `Est. runout: ~${f.daysToRunOut} days`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick links & Live alerts panel */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">Department Operations Quick Tasks</h3>
              
              <div className="grid grid-cols-1 gap-2.5">
                <button 
                  onClick={() => { resetPurchaseForm(); setShowPurchaseModal(true); }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-left transition-colors font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Truck className="h-4.5 w-4.5" /></div>
                    <div>
                      <p>Log Inbound Purchase</p>
                      <span className="text-[10px] text-slate-400 font-semibold">Restock items & increase stock counts</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-slate-400" />
                </button>

                <button 
                  onClick={() => { resetItemForm(); setEditingItem(null); setShowItemModal(true); }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-left transition-colors font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Boxes className="h-4.5 w-4.5" /></div>
                    <div>
                      <p>Configure New Stock Item</p>
                      <span className="text-[10px] text-slate-400 font-semibold">Define textbook configurations or uniform sizes</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-slate-400" />
                </button>

                <button 
                  onClick={() => { resetSupplierForm(); setShowSupplierModal(true); }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-left transition-colors font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Truck className="h-4.5 w-4.5" /></div>
                    <div>
                      <p>Register New Supplier</p>
                      <span className="text-[10px] text-slate-400 font-semibold">Add supplier records & contact card profiles</span>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. STOCK CATALOG SUBTAB */}
      {/* ========================================== */}
      {subTab === 'catalog' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Active Inventory Catalog</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Manage size lists, thresholds, unit costs and search stock</p>
            </div>
            
            <button 
              onClick={() => { resetItemForm(); setEditingItem(null); setShowItemModal(true); }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Configure Stock Item</span>
            </button>
          </div>

          {/* Filtering Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 bg-slate-50 p-3.5 border border-slate-200/80 rounded-xl text-xs items-center w-full">
            {catalogAlertFilter && (
              <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-1.5 rounded-xl font-bold shrink-0">
                <span>Filtering: {catalogAlertFilter === 'low' ? 'Low Stock Only' : 'Out of Stock Only'}</span>
                <button 
                  onClick={() => setCatalogAlertFilter('')}
                  className="hover:text-indigo-950 font-black cursor-pointer text-sm leading-none"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog by name, class board..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-250 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-800 font-bold placeholder-slate-400"
              />
            </div>
            
            <div className="w-full md:w-48">
              <select
                value={catalogTypeFilter}
                onChange={(e) => setCatalogTypeFilter(e.target.value)}
                className="w-full border border-slate-250 bg-white rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="">All Item Types</option>
                <option value="Uniform">Uniforms Only</option>
                <option value="Book">Textbooks Only</option>
              </select>
            </div>

            <button
              onClick={() => { setCatalogSearch(''); setCatalogTypeFilter(''); fetchItems(); }}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors font-bold text-slate-600 cursor-pointer"
            >
              Reset
            </button>

            <button
              onClick={fetchItems}
              className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-250 text-indigo-750 font-bold rounded-xl cursor-pointer transition-colors"
            >
              Search
            </button>
          </div>

          {/* Catalog Table */}
          {loadingItems ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin h-7 w-7 text-indigo-600" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-slate-450 py-12 text-xs font-semibold">No stock items configured in database catalog.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                    <th className="py-2.5 px-4">Item Type</th>
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">Class Config</th>
                    <th className="py-2.5 px-4">Size</th>
                    <th className="py-2.5 px-4 text-center">In-Stock Quantity</th>
                    <th className="py-2.5 px-4 text-right">Reorder Threshold</th>
                    <th className="py-2.5 px-4 text-right">Estimated Cost (₹)</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.filter(item => {
                    if (user?.role === 'UNIFORM_DEPT' && item.itemType !== 'Uniform') return false;
                    if (user?.role === 'BOOK_DEPT' && item.itemType !== 'Book') return false;
                    const qty = Number(item.quantity) || 0;
                    const threshold = Number(item.reorderThreshold) || 10;
                    if (catalogAlertFilter === 'low') {
                      return qty <= threshold && qty > 0;
                    }
                    if (catalogAlertFilter === 'out') {
                      return qty === 0;
                    }
                    return true;
                  }).map(item => {
                    const qty = Number(item.quantity) || 0;
                    const threshold = Number(item.reorderThreshold) || 10;
                    const isLow = qty <= threshold;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            item.itemType === 'Uniform' 
                              ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                              : 'bg-blue-50 border border-blue-100 text-blue-700'
                          }`}>
                            {item.itemType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{item.class || 'General / All'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">{item.size || 'N/A'}</td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            qty === 0 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200 font-extrabold' 
                              : isLow 
                                ? 'bg-amber-100 text-amber-700 border border-amber-200 font-extrabold animate-pulse' 
                                : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {qty} pcs
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-650">{threshold} pcs</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">₹{(item.unitCost || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => startEditItem(item)}
                            className="inline-flex items-center space-x-1 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit / Restock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 3. SUPPLIER DIRECTORY SUBTAB */}
      {/* ========================================== */}
      {subTab === 'suppliers' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Registered Supplier Directory</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Manage external uniform vendors and textbook printing presses</p>
            </div>
            
            <button 
              onClick={() => { resetSupplierForm(); setShowSupplierModal(true); }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Register Supplier</span>
            </button>
          </div>

          {loadingSuppliers ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin h-7 w-7 text-indigo-600" />
            </div>
          ) : suppliers.length === 0 ? (
            <p className="text-center text-slate-450 py-12 text-xs font-semibold">No suppliers registered in system database.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suppliers.map(sup => (
                <div key={sup._id} className="bg-slate-50 p-4.5 border border-slate-200 rounded-2xl relative group hover:border-indigo-300 transition-colors">
                  <Truck className="absolute right-4.5 top-4.5 h-6 w-6 text-slate-350" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{sup.name}</h4>
                  
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-550">
                    <p className="font-semibold text-slate-700">Phone: <span className="font-mono text-slate-800">{sup.phone}</span></p>
                    <p className="font-semibold">GSTIN: <span className="font-mono text-slate-800">{sup.gstNumber || 'N/A'}</span></p>
                    <p className="leading-relaxed font-medium">Address: <span className="text-slate-800">{sup.address || 'N/A'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 4. PURCHASE LEDGER LOGS SUBTAB */}
      {/* ========================================== */}
      {subTab === 'purchases' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Purchase entry & Invoice ledgers</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Logs of stock acquisitions, invoice details and stock increments</p>
            </div>
            
            <button 
              onClick={() => { resetPurchaseForm(); setShowPurchaseModal(true); }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Record Purchase Invoice</span>
            </button>
          </div>

          {loadingPurchases ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin h-7 w-7 text-indigo-600" />
            </div>
          ) : purchases.length === 0 ? (
            <p className="text-center text-slate-450 py-12 text-xs font-semibold">No purchase history recorded in database.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                    <th className="py-2.5 px-4">Invoice No</th>
                    <th className="py-2.5 px-4">Supplier</th>
                    <th className="py-2.5 px-4">Purchase Date</th>
                    <th className="py-2.5 px-4">Item Type</th>
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">Size</th>
                    <th className="py-2.5 px-4 text-center">Acquired Quantity</th>
                    <th className="py-2.5 px-4 text-right">Invoice Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {purchases.filter(p => {
                    if (user?.role === 'UNIFORM_DEPT' && p.itemType !== 'Uniform') return false;
                    if (user?.role === 'BOOK_DEPT' && p.itemType !== 'Book') return false;
                    return true;
                  }).map(p => (
                    <tr key={p._id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.invoiceNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{p.supplier?.name || 'Unknown Supplier'}</td>
                      <td className="py-3 px-4 font-medium text-slate-550">
                        {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          p.itemType === 'Uniform' 
                            ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                            : 'bg-blue-50 border border-blue-100 text-blue-700'
                        }`}>
                          {p.itemType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-850">{p.itemName}</td>
                      <td className="py-3 px-4 font-mono text-slate-550">{p.size || 'N/A'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-750">{p.quantity} units</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">₹{(p.cost || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 5. DISTRIBUTION HISTORY (STUDENT ISSUE LOG) */}
      {/* ========================================== */}
      {subTab === 'issues' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Student clearance stock issue logs</h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Timeline track of books and uniforms checked out to students during clearance</p>
          </div>

          {loadingIssues ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin h-7 w-7 text-indigo-600" />
            </div>
          ) : issues.length === 0 ? (
            <p className="text-center text-slate-450 py-12 text-xs font-semibold">No stock allocations or student clearances logged yet.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="min-w-full text-left text-xs divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider text-[9px] border-b border-slate-200">
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Class-Sec</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Distributed Item Details</th>
                    <th className="py-2.5 px-4">Allocation Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {issues.filter(is => {
                    if (user?.role === 'UNIFORM_DEPT' && is.itemType !== 'Uniform') return false;
                    if (user?.role === 'BOOK_DEPT' && is.itemType !== 'Book') return false;
                    return true;
                  }).map((issue, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{issue.studentId}</td>
                      <td className="py-3 px-4 font-bold text-slate-805">{issue.studentName}</td>
                      <td className="py-3 px-4 font-bold text-slate-600">{issue.class} - {issue.section}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          issue.itemType === 'Uniform' 
                            ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                            : 'bg-blue-50 border border-blue-100 text-blue-700'
                        }`}>
                          {issue.itemType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{issue.itemName}</td>
                      <td className="py-3 px-4 font-medium text-slate-550">
                        {issue.date ? new Date(issue.date).toLocaleDateString('en-GB') + ' ' + new Date(issue.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold rounded-full text-[9px] uppercase">
                          {issue.status}
                        </span>
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
      {/* ITEM REGISTRATION MODAL */}
      {/* ========================================== */}
      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-scale-up">
            <button 
              onClick={() => { setShowItemModal(false); setEditingItem(null); }}
              className="absolute right-4.5 top-4.5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-4 border-b border-slate-100 pb-2.5">
              {editingItem ? 'Edit Inventory Item' : 'Configure Stock Item'}
            </h3>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              {user?.role === 'SUPER_ADMIN' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Item Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItem({ ...newItem, itemType: 'Uniform' })}
                      className={`py-2 text-center font-bold rounded-xl border transition-all cursor-pointer ${newItem.itemType === 'Uniform' ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-250 hover:bg-slate-50'}`}
                    >
                      Uniform Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItem({ ...newItem, itemType: 'Book' })}
                      className={`py-2 text-center font-bold rounded-xl border transition-all cursor-pointer ${newItem.itemType === 'Book' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-250 hover:bg-slate-50'}`}
                    >
                      Course Textbook
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Item Type</label>
                  <input
                    type="text"
                    readOnly
                    value={newItem.itemType === 'Uniform' ? 'Uniform Item' : 'Course Textbook'}
                    className="w-full border border-slate-200 bg-slate-100 rounded-xl px-3 py-2 text-slate-500 font-bold focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Record Book, White Shirt Size 32"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Target Class (Optional)</label>
                  <select
                    value={newItem.class}
                    onChange={(e) => setNewItem({ ...newItem, class: e.target.value })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-805 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="">General / All Classes</option>
                    {[...new Set(classes.map(c => c.name))].map((cls, idx) => (
                      <option key={idx} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Size (Uniforms)</label>
                  <input
                    type="text"
                    placeholder="e.g. 32, 34, Medium, N/A"
                    value={newItem.size}
                    onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Stock Qty</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Reorder Level</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newItem.reorderThreshold}
                    onChange={(e) => setNewItem({ ...newItem, reorderThreshold: Number(e.target.value) })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Unit Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setShowItemModal(false); setEditingItem(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Save Item Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER REGISTRATION MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-scale-up">
            <button 
              onClick={() => setShowSupplierModal(false)}
              className="absolute right-4.5 top-4.5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-4 border-b border-slate-100 pb-2.5">
              Register New Supplier
            </h3>

            <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanguard Uniforms Ltd"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Contact Phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  value={newSupplier.gstNumber}
                  onChange={(e) => setNewSupplier({ ...newSupplier, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Corporate Address (Optional)</label>
                <textarea
                  placeholder="Corporate office or factory address details"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600 h-16 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PURCHASE MODAL */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-scale-up">
            <button 
              onClick={() => setShowPurchaseModal(false)}
              className="absolute right-4.5 top-4.5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-4 border-b border-slate-100 pb-2.5">
              Record Purchase Invoice
            </h3>

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Select Supplier</label>
                  <select
                    required
                    value={newPurchase.supplierId}
                    onChange={(e) => setNewPurchase({ ...newPurchase, supplierId: e.target.value })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-805 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Invoice Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-908"
                    value={newPurchase.invoiceNumber}
                    onChange={(e) => setNewPurchase({ ...newPurchase, invoiceNumber: e.target.value })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Invoice Date (Optional)</label>
                  <input
                    type="date"
                    value={newPurchase.purchaseDate}
                    onChange={(e) => setNewPurchase({ ...newPurchase, purchaseDate: e.target.value })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                  />
                </div>
                {user?.role === 'SUPER_ADMIN' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Item Type</label>
                    <select
                      value={newPurchase.itemType}
                      onChange={(e) => setNewPurchase({ ...newPurchase, itemType: e.target.value })}
                      className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-805 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="Uniform">Uniform</option>
                      <option value="Book">Textbook</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Item Type</label>
                    <input
                      type="text"
                      readOnly
                      value={newPurchase.itemType === 'Uniform' ? 'Uniform' : 'Textbook'}
                      className="w-full border border-slate-200 bg-slate-100 rounded-xl px-3 py-2 text-slate-500 font-bold focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics Class 9, White Pants Size 32"
                  value={newPurchase.itemName}
                  onChange={(e) => setNewPurchase({ ...newPurchase, itemName: e.target.value })}
                  className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Size (Uniforms)</label>
                  <input
                    type="text"
                    placeholder="e.g. 32, N/A"
                    value={newPurchase.size}
                    onChange={(e) => setNewPurchase({ ...newPurchase, size: e.target.value })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPurchase.quantity}
                    onChange={(e) => setNewPurchase({ ...newPurchase, quantity: Number(e.target.value) })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Invoice Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newPurchase.cost}
                    onChange={(e) => setNewPurchase({ ...newPurchase, cost: Number(e.target.value) })}
                    className="w-full border border-slate-250 bg-white rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Log Invoice & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
