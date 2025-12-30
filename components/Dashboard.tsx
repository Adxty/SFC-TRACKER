
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { Expense, Truck, Driver } from '../types';
import { CATEGORIES, COLORS } from '../constants';
import { translations, Language } from '../translations';

interface DashboardProps {
  expenses: Expense[];
  trucks: Truck[];
  drivers: Driver[];
  language?: Language;
}

const GullakWidget: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const [isJiggling, setIsJiggling] = useState(false);

  useEffect(() => {
    setIsJiggling(true);
    const t = setTimeout(() => setIsJiggling(false), 600);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="relative group p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[3.5rem] border border-orange-100 overflow-hidden flex items-center space-x-8 card-3d-premium cursor-pointer">
      <div className={`text-7xl transition-transform duration-500 drop-shadow-2xl ${isJiggling ? 'scale-125 rotate-12' : 'scale-100'}`}>
        🏺
      </div>
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">{label}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
        </div>
        <p className="text-4xl font-black text-slate-900 tracking-tight privacy-blur">₹{value.toLocaleString()}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 opacity-60">Ready for Reconciliation</p>
      </div>
      <div className="absolute top-4 right-6 text-xl animate-bounce opacity-50 group-hover:opacity-100 transition-opacity">✨</div>
    </div>
  );
};

const SpeedStreak: React.FC<{ delay: string; top: string; width: string }> = ({ delay, top, width }) => (
  <div 
    className="speed-streak" 
    style={{ animationDelay: delay, top, width }} 
  />
);

const AnimatedTruckVisual: React.FC = () => {
  return (
    <div className="relative flex items-end scale-125 md:scale-150 transition-all duration-700 hover:scale-[1.9] group/truck cursor-pointer">
      <div className="absolute left-[-25px] bottom-10 flex flex-col items-center pointer-events-none opacity-0 group-hover/truck:opacity-100 transition-opacity">
        <div className="exhaust-puff" style={{ animationDelay: '0s', width: '14px', height: '14px' }}></div>
        <div className="exhaust-puff" style={{ animationDelay: '0.2s', left: '-6px', width: '18px', height: '18px' }}></div>
      </div>
      
      <div className="relative animate-truck flex items-end">
        <span className="text-6xl select-none z-10 drop-shadow-[0_25px_25px_rgba(0,0,0,0.5)] filter saturate-150 group-hover/truck:brightness-110 transition-all">🚛</span>
        {[
          { left: '10px', delay: '0s' },
          { left: '26px', delay: '0.05s' },
          { right: '4px', delay: '0.1s' }
        ].map((pos, i) => (
          <div 
            key={i}
            className="absolute bottom-[6px] w-4 h-4 bg-[#1a202c] rounded-full border-2 border-slate-900 z-20 flex items-center justify-center animate-wheel shadow-xl"
            style={{ 
              left: (pos as any).left || 'auto', 
              right: (pos as any).right || 'auto',
              animationDelay: pos.delay
            }}
          >
            <div className="w-[60%] h-[60%] rounded-full border border-slate-600 flex items-center justify-center">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
            </div>
          </div>
        ))}
        <div className="absolute -left-2 bottom-10 w-3 h-5 bg-rose-500 rounded-full blur-xl opacity-0 group-hover/truck:opacity-100 transition-opacity"></div>
      </div>
      <div className="absolute bottom-[-4px] left-4 right-4 h-3 bg-slate-900/40 blur-2xl rounded-full -z-10"></div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ expenses, trucks, drivers, language = 'en' }) => {
  const t = (key: keyof typeof translations.en) => translations[language][key] || translations.en[key];

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalITC = expenses.reduce((sum, e) => sum + e.gstPaid, 0);
  
  const cpkData = useMemo(() => trucks.map(t => {
    const truckExpenses = expenses.filter(e => e.truckId === t.id);
    const totalSpent = truckExpenses.reduce((s, e) => s + e.amount, 0);
    const estKm = t.avgMonthlyKm * 3;
    const cpkVal = estKm > 0 ? (totalSpent / estKm) : 0;
    return {
      name: t.regNumber.split('-').pop(),
      cpk: parseFloat(cpkVal.toFixed(2))
    };
  }), [expenses, trucks]);

  const categoryPie = useMemo(() => CATEGORIES.map(cat => ({
    name: cat.name,
    value: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0)
  })).filter(v => v.value > 0), [expenses]);

  return (
    <div className="space-y-16 pb-32 scroll-smooth">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 bg-white p-16 rounded-[5rem] border border-slate-100 relative overflow-hidden group card-3d-premium cursor-default">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-50/40 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-24">
              <div>
                <h2 className="text-7xl font-black text-slate-900 tracking-tighter">Command OS</h2>
                <div className="flex items-center space-x-4 mt-8">
                  <span className="bg-emerald-500 text-white text-[11px] font-black px-5 py-2 rounded-2xl uppercase tracking-widest shadow-xl hud-glow-emerald">Fleet Active</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Global Telemetry: Optimal</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('burn')}</p>
                <p className="text-6xl font-black text-slate-900 tracking-tighter privacy-blur">₹{totalExpense.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
               {[
                 { label: t('fleet'), val: trucks.length, desc: 'Operational Units', color: 'indigo' },
                 { label: t('service'), val: trucks.filter(t=>t.status==='Maintenance').length, desc: 'Requires Audit', color: 'rose' },
                 { label: t('compliance'), val: '98%', desc: 'Health Index', color: 'emerald' }
               ].map((item, i) => (
                 <div key={i} className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 transition-all hover:bg-white interactive-scale cursor-pointer group/stat shadow-sm">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover/stat:text-indigo-400 transition-colors">{item.label}</p>
                    <p className="text-5xl font-black text-slate-900">{item.val}</p>
                    <p className={`text-[11px] font-bold text-${item.color}-600 mt-4 uppercase tracking-[0.1em] opacity-80`}>{item.desc}</p>
                 </div>
               ))}
            </div>

            <div className="mt-auto pt-8">
               <div className="relative w-full h-32 bg-slate-950 rounded-[4rem] border border-slate-800 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] px-16 flex items-center overflow-hidden group/viewport interactive-scale cursor-pointer">
                  <div className="absolute inset-0 bg-[#020617]">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-900/50"></div>
                    <div className="absolute inset-0 flex items-center animate-road group-hover/viewport:animate-road-fast transition-all">
                       <div className="w-[300%] h-1 bg-repeat-x opacity-20" style={{ 
                         backgroundImage: 'linear-gradient(90deg, #64748b 60px, transparent 60px)',
                         backgroundSize: '140px 100%' 
                       }}></div>
                    </div>
                  </div>
                  
                  <div className="flex-1"></div>
                  <AnimatedTruckVisual />
                  <div className="flex-1"></div>
                  
                  <div className="absolute top-8 left-12 text-[10px] font-black text-emerald-400 uppercase tracking-widest pointer-events-none flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse hud-glow-emerald"></div>
                    <span className="opacity-80">Cruise Active: 84KMPH</span>
                  </div>
                  <div className="absolute top-8 right-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] pointer-events-none group-hover/viewport:text-indigo-400 transition-colors text-right">{t('telemetry')} v3.0</div>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-12">
          <GullakWidget value={totalITC} label={t('itc')} />
          
          <div className="bg-white p-14 rounded-[4.5rem] border border-slate-100 card-3d-premium h-fit cursor-default">
             <h4 className="text-3xl font-black text-slate-900 mb-12 tracking-tight">{t('fuelShare')}</h4>
             <div className="h-80 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={85} outerRadius={115} paddingAngle={12} dataKey="value" stroke="none">
                      {categoryPie.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '2.5rem', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', fontWeight: 800, padding: '2rem', background: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                   <p className="text-3xl font-black text-indigo-600">88.4%</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-5 mt-10">
                {categoryPie.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center space-x-4 p-5 bg-slate-50 rounded-3xl interactive-scale cursor-pointer group/cat border border-slate-100/50">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-lg" style={{ backgroundColor: COLORS[i] }}></div>
                    <span className="text-[11px] font-black text-slate-500 uppercase truncate group-hover/cat:text-indigo-600 transition-colors">{c.name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         <div className="bg-white p-16 rounded-[5rem] border border-slate-100 card-3d-premium cursor-default">
            <h4 className="text-4xl font-black text-slate-900 tracking-tight mb-16">{t('cpk')} Audit</h4>
            <div className="h-96">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={cpkData}>
                   <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 900 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 900 }} />
                   <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '2.5rem', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.12)', fontWeight: 800, padding: '2rem' }} />
                   <Bar dataKey="cpk" barSize={45} radius={[18, 18, 0, 0]}>
                     {cpkData.map((entry: any, index) => <Cell key={index} fill={entry.cpk > 30 ? '#ef4444' : '#6366f1'} />)}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-16 rounded-[5rem] border border-slate-100 card-3d-premium h-fit cursor-default">
            <div className="flex items-center justify-between mb-16">
              <h4 className="text-4xl font-black text-slate-900 tracking-tight">Driver Performance</h4>
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 transition-all">View All Audit →</button>
            </div>
            <div className="space-y-8 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
               {drivers.map((d, i) => (
                 <div key={d.id} className="group p-10 bg-slate-50/70 rounded-[3.5rem] border border-slate-100 hover:bg-white interactive-scale transition-all flex items-center justify-between cursor-pointer shadow-sm">
                    <div className="flex items-center space-x-8">
                       <div className="w-20 h-20 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-2xl group-hover:bg-indigo-600 group-hover:hud-glow-indigo transition-all duration-500">
                          {d.name.charAt(0)}
                       </div>
                       <div>
                          <p className="text-xl font-black text-slate-900 tracking-tight">{d.name}</p>
                          <p className="text-[12px] font-bold text-indigo-500 uppercase tracking-widest mt-1.5 opacity-80">Fuel Efficiency: {d.fuelEfficiencyRating}/10</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="flex space-x-2 mb-3">
                          {[...Array(5)].map((_, si) => <div key={si} className={`w-2.5 h-9 rounded-full shadow-lg transition-all duration-500 ${si < Math.floor(d.rating || 0) ? 'bg-amber-400 hud-glow-amber' : 'bg-slate-200'}`}></div>)}
                       </div>
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest opacity-60">Fleet Rating</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
