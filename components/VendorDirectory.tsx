
import React, { useMemo, useState } from 'react';
import { Expense, Vendor } from '../types';

interface VendorDirectoryProps {
  expenses: Expense[];
}

export const VendorDirectory: React.FC<VendorDirectoryProps> = ({ expenses }) => {
  const [selectedVendorName, setSelectedVendorName] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount'; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });

  const vendorData = useMemo(() => {
    const map = new Map<string, Vendor>();
    
    expenses.forEach(e => {
      const name = e.vendor || 'Unspecified Vendor';
      const existing = map.get(name);
      
      if (existing) {
        existing.totalSpent += e.amount;
        existing.transactionCount += 1;
        if (new Date(e.date) > new Date(existing.lastTransactionDate)) {
          existing.lastTransactionDate = e.date;
        }
      } else {
        map.set(name, {
          name,
          totalSpent: e.amount,
          transactionCount: 1,
          lastTransactionDate: e.date,
          primaryCategory: e.category
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [expenses]);

  const maxSpent = useMemo(() => {
    return vendorData.length > 0 ? Math.max(...vendorData.map(v => v.totalSpent)) : 1;
  }, [vendorData]);

  const vendorHistory = useMemo(() => {
    if (!selectedVendorName) return [];
    
    let history = expenses.filter(e => (e.vendor || 'Unspecified Vendor') === selectedVendorName);
    
    history.sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });
    
    return history;
  }, [selectedVendorName, expenses, sortConfig]);

  const handleSort = (key: 'date' | 'amount') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Commercial Partners</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Aggregate business outflow by merchant</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase">Unique Partners</p>
             <p className="text-2xl font-black text-indigo-600">{vendorData.length}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendorData.map(vendor => {
          const spendIntensity = (vendor.totalSpent / maxSpent) * 100;
          const isSelected = selectedVendorName === vendor.name;
          
          return (
            <div 
              key={vendor.name} 
              className={`bg-white p-6 rounded-[2.5rem] border transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden group ${
                isSelected 
                  ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-2xl scale-[1.02] z-10' 
                  : 'border-slate-100 hover:shadow-xl hover:shadow-indigo-50/50 hover:-translate-y-1'
              }`}
              onClick={() => setSelectedVendorName(isSelected ? null : vendor.name)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                  {vendor.name.charAt(0)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase tracking-tight">
                    {vendor.primaryCategory}
                  </span>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-800 mb-1 truncate">{vendor.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Last Active: {vendor.lastTransactionDate}</p>
                
                <div className="mb-6 space-y-1.5">
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Spending Intensity</p>
                    <p className="text-[10px] font-black text-slate-900">₹{vendor.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${spendIntensity}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Volume</p>
                  <p className="text-sm font-black text-slate-900">{vendor.transactionCount} Txns</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</p>
                  <p className="text-sm font-black text-indigo-600 group-hover:translate-x-1 transition-transform">
                    {isSelected ? 'Close View' : 'View History →'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedVendorName && (
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/30 border border-indigo-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
          <div className="px-10 py-8 bg-indigo-50/50 border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit History: {selectedVendorName}</h3>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Granular Transaction breakdown</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleSort('date')}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  sortConfig.key === 'date' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                }`}
              >
                Sort by Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                onClick={() => handleSort('amount')}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  sortConfig.key === 'amount' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                }`}
              >
                Sort by Value {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                onClick={() => setSelectedVendorName(null)}
                className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-rose-500 hover:border-rose-100 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-10 py-5">Post Date</th>
                  <th className="px-10 py-5">Sub-Category</th>
                  <th className="px-10 py-5">Vehicle Reference</th>
                  <th className="px-10 py-5">ITC Credit</th>
                  <th className="px-10 py-5 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorHistory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-10 py-6 text-xs font-black text-slate-400 tracking-tight">{item.date}</td>
                    <td className="px-10 py-6">
                      <span className="text-[13px] font-black text-slate-700 uppercase tracking-wide">{item.subCategory || 'General'}</span>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl border border-slate-200/50">
                        {item.truckId}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`text-[11px] font-black ${item.gstPaid > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                        ₹{item.gstPaid.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right font-black text-slate-900 text-base">
                      ₹{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-10 py-6 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End of History Trail</p>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-black text-slate-500">Total Filtered Exposure:</span>
              <span className="text-sm font-black text-indigo-600">₹{vendorHistory.reduce((s, i) => s + i.amount, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
