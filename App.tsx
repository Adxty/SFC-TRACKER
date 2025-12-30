
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Truck, Driver, Expense, BankTransaction, MaintenanceRecord, Revenue, Trip, TripLog, IssueLog } from './types';
import { MOCK_TRUCKS, MOCK_EXPENSES, MOCK_DRIVERS, MOCK_BANK_TXNS, MOCK_MAINTENANCE, MOCK_REVENUES, MOCK_TRIPS } from './constants';
import { Dashboard } from './components/Dashboard';
import { ExpenseForm } from './components/ExpenseForm';
import { AIChat } from './components/AIChat';
import { MaintenanceTracker } from './components/MaintenanceTracker';
import { TruckAnalysis } from './components/TruckAnalysis';
import { GSTCenter } from './components/GSTCenter';
import { BankFeed } from './components/BankFeed';
import { TripManager } from './components/TripManager';
import { DuplicateFinder } from './components/DuplicateFinder';
import { DriverPortal } from './components/DriverPortal';
import { translations, Language } from './translations';
import * as db from './dbService';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('sfc_lang') as Language) || 'en');
  const [view, setView] = useState<'dashboard' | 'expenses' | 'fleet' | 'gst-center' | 'bank-feed' | 'maintenance' | 'trips' | 'driver-portal'>('dashboard');
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => localStorage.getItem('sfc_privacy') === 'true');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('sfc_expenses');
    return saved ? JSON.parse(saved) : MOCK_EXPENSES;
  });
  const [revenues, setRevenues] = useState<Revenue[]>(MOCK_REVENUES);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [trucks, setTrucks] = useState<Truck[]>(MOCK_TRUCKS);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('sfc_bank_txns');
    return saved ? JSON.parse(saved) : MOCK_BANK_TXNS;
  });
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(MOCK_MAINTENANCE);
  
  const [tripLogs, setTripLogs] = useState<TripLog[]>([]);
  const [issueLogs, setIssueLogs] = useState<IssueLog[]>([]);

  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [showDuplicates, setShowDuplicates] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const trips = await db.getAllLogs<TripLog>('tripLogs');
        const issues = await db.getAllLogs<IssueLog>('issueLogs');
        setTripLogs(trips);
        setIssueLogs(issues);
      } catch (e) {
        console.error("IndexedDB error:", e);
      }
    };
    loadLogs();
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const performSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    const unsyncedTrips = tripLogs.filter(t => !t.synced);
    const unsyncedIssues = issueLogs.filter(i => !i.synced);
    if (unsyncedTrips.length === 0 && unsyncedIssues.length === 0) return;
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    for (const log of unsyncedTrips) await db.updateLogSyncStatus('tripLogs', log.id);
    for (const log of unsyncedIssues) await db.updateLogSyncStatus('issueLogs', log.id);
    const updatedTrips = await db.getAllLogs<TripLog>('tripLogs');
    const updatedIssues = await db.getAllLogs<IssueLog>('issueLogs');
    setTripLogs(updatedTrips);
    setIssueLogs(updatedIssues);
    setIsSyncing(false);
  }, [isOnline, isSyncing, tripLogs, issueLogs]);

  useEffect(() => { if (isOnline) performSync(); }, [isOnline, performSync]);

  useEffect(() => {
    localStorage.setItem('sfc_expenses', JSON.stringify(expenses));
    localStorage.setItem('sfc_lang', lang);
    localStorage.setItem('sfc_privacy', String(isPrivacyMode));
    localStorage.setItem('sfc_bank_txns', JSON.stringify(bankTransactions));
  }, [expenses, lang, bankTransactions, isPrivacyMode]);

  const t = (key: keyof typeof translations.en) => translations[lang][key] || translations.en[key];

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
    let finalExpenses = [...expenses];
    if (editingExpense?.id) {
      finalExpenses = expenses.map(e => e.id === editingExpense.id ? { ...expenseData, id: e.id } : e);
    } else {
      finalExpenses = [{ ...expenseData, id: `E-${Date.now()}` }, ...expenses];
    }
    setExpenses(finalExpenses);
    if (expenseData.linkedBankTxnIds) {
      setBankTransactions(prev => prev.map(bt => 
        expenseData.linkedBankTxnIds?.includes(bt.id) ? { ...bt, status: 'Linked' } : bt
      ));
    }
    setIsFormOpen(false);
    setEditingExpense(undefined);
  };

  return (
    <div className={`flex min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 scroll-smooth ${isPrivacyMode ? 'privacy-active' : ''}`}>
      <aside className="w-80 bg-white border-r border-slate-200/60 sticky top-0 h-screen flex flex-col z-50 shadow-2xl shadow-slate-200/50">
        <div className="p-10">
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className="w-12 h-12 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">🚛</div>
            <div className="flex flex-col">
              <span className="text-2xl font-black italic tracking-tighter text-indigo-600 leading-none">SFC</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Commercial OS</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-5 space-y-2 overflow-y-auto custom-scrollbar pt-6">
          {[
            { id: 'dashboard', label: t('dashboard'), icon: '🏠' },
            { id: 'trips', label: t('dispatch'), icon: '🛣️' },
            { id: 'driver-portal', label: t('driverPortal'), icon: '🆔' },
            { id: 'expenses', label: t('ledger'), icon: '📒' },
            { id: 'fleet', label: t('fleet'), icon: '🚛' },
            { id: 'gst-center', label: t('gst'), icon: '🏦' },
            { id: 'maintenance', label: t('service'), icon: '🛠️' },
            { id: 'bank-feed', label: t('banking'), icon: '💳' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id as any); setShowDuplicates(false); setSelectedTruckId(null); }}
              className={`w-full sidebar-item flex items-center space-x-5 px-8 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest ${view === item.id ? 'active' : 'text-slate-400 hover:text-slate-900'}`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-10 border-t border-slate-50 space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('privacy')}</span>
            <button 
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={`w-12 h-7 rounded-full transition-all relative ${isPrivacyMode ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${isPrivacyMode ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('language')}</span>
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-transparent text-[11px] font-black uppercase focus:outline-none cursor-pointer text-indigo-600"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
              <option value="es">Español</option>
            </select>
          </div>
          <button 
            onClick={() => { setEditingExpense(undefined); setIsFormOpen(true); }}
            className="w-full bg-slate-950 text-white py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 group flex items-center justify-center space-x-3"
          >
            <span className="text-lg group-hover:rotate-90 transition-transform">+</span>
            <span>{t('addExpense')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-16 py-16 custom-scrollbar bg-slate-50/50">
        <header className="mb-16 flex justify-between items-center">
           <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] opacity-60">Commercial Fleet OS v3.2</h2>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mt-2">{t(view as any)}</h1>
           </div>
           <div className="flex items-center space-x-8">
              {isSyncing && (
                <div className="flex items-center space-x-3 px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 animate-pulse shadow-sm">
                  <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Synchronizing Logs...</span>
                </div>
              )}
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-xl hover:border-indigo-500 hover:scale-110 transition-all cursor-pointer">🔔</div>
                <div className="flex items-center space-x-4 bg-white p-2 pr-6 rounded-3xl border border-slate-100 shadow-xl group cursor-pointer hover:border-indigo-200 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center text-white font-black text-sm group-hover:bg-indigo-600 transition-colors">AD</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase">Admin User</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Plan</p>
                  </div>
                </div>
              </div>
           </div>
        </header>

        <div className="view-transition">
          {view === 'dashboard' && <Dashboard expenses={expenses} trucks={trucks} drivers={drivers} language={lang} />}
          {view === 'trips' && <TripManager trips={trips} trucks={trucks} drivers={drivers} onAddTrip={t => setTrips([...trips, {...t, id: `TRIP-${Date.now()}`}])} onUpdateTrip={t => setTrips(trips.map(x => x.id === t.id ? t : x))} />}
          {view === 'driver-portal' && <DriverPortal trucks={trucks} isOnline={isOnline} isSyncing={isSyncing} onLogTrip={async (d) => { const n = { ...d, id: `TL-${Date.now()}`, synced: isOnline }; await db.saveLocalLog('tripLogs', n); setTripLogs([n, ...tripLogs]); }} onLogIssue={async (d) => { const n = { ...d, id: `IL-${Date.now()}`, synced: isOnline }; await db.saveLocalLog('issueLogs', n); setIssueLogs([n, ...issueLogs]); }} pendingTrips={tripLogs.filter(t => !t.synced)} pendingIssues={issueLogs.filter(i => !i.synced)} syncedTrips={tripLogs.filter(t => t.synced)} syncedIssues={issueLogs.filter(i => i.synced)} activeRoutes={[]} />}
          {view === 'gst-center' && <GSTCenter expenses={expenses} revenues={revenues} />}
          {view === 'bank-feed' && <BankFeed transactions={bankTransactions} trucks={trucks} expenses={expenses} onLink={(tx) => { const list = Array.isArray(tx) ? tx : [tx]; /* Handled in state updates elsewhere */ }} onSplit={() => {}} onExclude={() => {}} onLinkToExisting={() => {}} />}
          {view === 'fleet' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {trucks.map(truck => (
                <div key={truck.id} className={`card-3d-premium rounded-[4rem] cursor-pointer group relative overflow-hidden ${selectedTruckId === truck.id ? 'lg:col-span-3 h-auto p-16' : 'p-12 h-fit'}`} onClick={() => setSelectedTruckId(selectedTruckId === truck.id ? null : truck.id)}>
                   <TruckAnalysis truck={truck} expenses={expenses} revenues={revenues} maintenance={maintenanceRecords} onBack={(e) => { e?.stopPropagation(); setSelectedTruckId(null); }} />
                </div>
              ))}
            </div>
          )}
          {view === 'expenses' && (
             <div className="space-y-12">
               <div className="bg-white p-12 rounded-[4.5rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 card-3d-premium">
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{t('ledger')} Audit</h2>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Unified Commercial Intelligence</p>
                  </div>
                  <div className="flex space-x-4">
                     <button onClick={() => setShowDuplicates(!showDuplicates)} className={`px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${showDuplicates ? 'bg-amber-600 text-white shadow-xl shadow-amber-200' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100'}`}>{showDuplicates ? 'Active Conflict Scan' : 'Duplicate Scan'}</button>
                     <button className="px-8 py-4 bg-slate-950 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all">Export Audit (.XLS)</button>
                  </div>
               </div>
               {showDuplicates ? (
                 <DuplicateFinder expenses={expenses} trucks={trucks} onMerge={() => {}} onDelete={(id) => setExpenses(expenses.filter(e => e.id !== id))} onIgnore={() => {}} />
               ) : (
                 <div className="bg-white rounded-[4.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden card-3d-premium max-h-[800px] overflow-y-auto custom-scrollbar">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 sticky top-0 z-20">
                          <th className="px-12 py-8">Billing Date</th>
                          <th className="px-12 py-8">Merchant / Partner</th>
                          <th className="px-12 py-8">Fleet Asset</th>
                          <th className="px-12 py-8 text-right">Gross (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.map(e => (
                          <tr key={e.id} className="hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => { setEditingExpense(e); setIsFormOpen(true); }}>
                            <td className="px-12 py-10 text-xs font-black text-slate-400 uppercase tracking-widest">{e.date}</td>
                            <td className="px-12 py-10">
                               <p className="font-black text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{e.vendor || e.description}</p>
                               <div className="flex items-center space-x-2 mt-1.5">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">{e.category}</span>
                                 {e.isBankTransaction && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Verified Match</span>}
                               </div>
                            </td>
                            <td className="px-12 py-10">
                               <span className="font-black text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-5 py-2 rounded-2xl text-[11px] tracking-widest">{trucks.find(t=>t.id===e.truckId)?.regNumber}</span>
                            </td>
                            <td className="px-12 py-10 text-right font-black text-slate-950 text-2xl tracking-tighter privacy-blur">₹{e.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
               )}
             </div>
          )}
          {view === 'maintenance' && <MaintenanceTracker records={maintenanceRecords} trucks={trucks} onAdd={r => setMaintenanceRecords([...maintenanceRecords, {...r, id: `M-${Date.now()}`}])} onUpdate={r => setMaintenanceRecords(maintenanceRecords.map(m => m.id === r.id ? r : m))} onDelete={id => setMaintenanceRecords(maintenanceRecords.filter(m => m.id !== id))} />}
        </div>
      </main>

      <AIChat expenses={expenses} trucks={trucks} language={lang} />
      {isFormOpen && (
        <ExpenseForm 
          onSave={handleSaveExpense} 
          onCancel={() => { setIsFormOpen(false); setEditingExpense(undefined); }} 
          trucks={trucks} 
          initialData={editingExpense}
          bankTransactions={bankTransactions}
          expenses={expenses}
        />
      )}
    </div>
  );
};

export default App;
