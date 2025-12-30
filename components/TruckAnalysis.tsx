
import React, { useMemo } from 'react';
import { Truck, Expense, MaintenanceRecord, Revenue } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { COLORS, CATEGORIES } from '../constants';

interface TruckAnalysisProps {
  truck: Truck;
  expenses: Expense[];
  revenues: Revenue[];
  maintenance: MaintenanceRecord[];
  onBack: (e?: React.MouseEvent) => void;
}

export const TruckAnalysis: React.FC<TruckAnalysisProps> = ({ truck, expenses, revenues, maintenance, onBack }) => {
  const truckExpenses = useMemo(() => expenses.filter(e => e.truckId === truck.id), [expenses, truck.id]);
  const truckRevenues = useMemo(() => revenues.filter(r => r.truckId === truck.id), [revenues, truck.id]);
  
  const totalExpense = truckExpenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = truckRevenues.reduce((s, r) => s + r.amount, 0);
  const profit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // Segmented Cost Analysis
  const segmentedCosts = useMemo(() => {
    return CATEGORIES.map(cat => ({
      name: cat.name,
      value: truckExpenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0)
    })).filter(v => v.value > 0);
  }, [truckExpenses]);

  // Fuel Analysis
  const fuelExpenses = truckExpenses.filter(e => e.category === 'Fuel' && e.liters);
  const totalLiters = fuelExpenses.reduce((s, e) => s + (e.liters || 0), 0);
  const kmSinceAnalysis = truck.avgMonthlyKm * 3; // Mocking 3 month range
  const kmpl = totalLiters > 0 ? kmSinceAnalysis / totalLiters : 0;

  // Compliance Health
  const checkExpiry = (dateStr: string) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diff = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
    if (diff < 0) return 'Expired';
    if (diff < 30) return 'Expiring Soon';
    return 'Active';
  };

  const compliance = [
    { label: 'Insurance', date: truck.insuranceExpiry, status: checkExpiry(truck.insuranceExpiry) },
    { label: 'Permit', date: truck.permitExpiry, status: checkExpiry(truck.permitExpiry) },
    { label: 'PUC', date: truck.pucExpiry, status: checkExpiry(truck.pucExpiry) },
    { label: 'Fitness', date: truck.fitnessExpiry, status: checkExpiry(truck.fitnessExpiry) },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700" onClick={e => e.stopPropagation()}>
      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-6">
          <button 
            onClick={onBack} 
            className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-[1.5rem] hover:text-indigo-600 hover:border-indigo-500 hover:shadow-2xl transition-all shadow-sm active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{truck.regNumber}</h2>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{truck.model}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-[10px] font-black text-indigo-500 uppercase">Unit Economy Expert View</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="bg-slate-900 px-8 py-5 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <p className="text-[10px] font-black uppercase opacity-60 relative z-10">Unit Profitability</p>
            <p className="text-2xl font-black relative z-10">₹{profit.toLocaleString()}</p>
          </div>
          <div className={`${margin > 20 ? 'bg-emerald-500' : 'bg-amber-500'} px-8 py-5 rounded-[2rem] text-white shadow-2xl transition-colors duration-500`}>
            <p className="text-[10px] font-black uppercase opacity-60">Operating Margin</p>
            <p className="text-2xl font-black">{margin.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metrics & Compliance */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 card-3d">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Cost Segmentation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentedCosts}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {segmentedCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {segmentedCosts.map((c, i) => (
                <div key={c.name} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-2xl">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[9px] font-black text-slate-500 uppercase truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 card-3d">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Compliance Health</h3>
            <div className="space-y-4">
              {compliance.map((item) => (
                <div key={item.label} className="p-5 bg-slate-50/50 rounded-[1.8rem] border border-slate-100 transition-all hover:bg-white hover:border-indigo-100 group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black text-slate-700 group-hover:text-indigo-600">{item.label}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                      item.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>{item.status}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">{item.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Historical & Maintenance */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-slate-100 card-3d overflow-hidden">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operating Burn vs Revenue</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={truckRevenues.map((r, i) => ({ 
                    name: r.date, 
                    rev: r.amount, 
                    exp: truckExpenses[i]?.amount || 0 
                  }))}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.1)', fontWeight: 800 }} />
                  <Area type="monotone" dataKey="rev" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" animationDuration={2000} />
                  <Area type="monotone" dataKey="exp" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" animationDuration={2500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl card-3d text-white border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-125 transition-transform duration-700">🚛</div>
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Service Health Meter</h3>
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-4xl font-black">{truck.totalKm - truck.lastServiceKm} km</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Since Last Overhaul</p>
                  </div>
                  <div className="w-20 h-20 rounded-full border-[10px] border-white/5 flex items-center justify-center relative">
                    <div className="absolute inset-0 border-[10px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg">⚙️</span>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Engine Health</span>
                    <span className="text-emerald-500">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full w-[92%]"></div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 card-3d">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Unit Economic Audit</h3>
               <div className="space-y-6">
                 <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Available ITC</span>
                    <span className="text-lg font-black text-emerald-600">₹{truckExpenses.reduce((s,e) => s + e.gstPaid, 0).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Operational CPK</span>
                    <span className="text-lg font-black text-slate-900">₹{(totalExpense / (kmSinceAnalysis || 1)).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Efficiency Bench</span>
                    <span className="text-lg font-black text-indigo-600">{kmpl.toFixed(1)} KMPL</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
