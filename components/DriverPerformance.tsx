
import React from 'react';
import { Driver, MaintenanceRecord } from '../types';

interface DriverPerformanceProps {
  drivers: Driver[];
  issues: MaintenanceRecord[];
}

export const DriverPerformance: React.FC<DriverPerformanceProps> = ({ drivers, issues }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Fleet Performance Audit</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time efficiency and safety metrics</p>
        </div>
        <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="px-6 py-2 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase">Avg Rating</p>
            <p className="text-lg font-black text-indigo-600">
              {(drivers.reduce((s, d) => s + (d.rating || 0), 0) / drivers.length).toFixed(1)}
            </p>
          </div>
          <div className="px-6 py-2 text-center border-l border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase">Efficiency</p>
            <p className="text-lg font-black text-emerald-600">
              {Math.round(drivers.reduce((s, d) => s + (d.fuelEfficiencyRating || 0), 0) / drivers.length * 10)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map(driver => {
          const driverIssues = issues.filter(i => i.description.toLowerCase().includes(driver.name.toLowerCase()));
          
          return (
            <div key={driver.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-50/50 hover:-translate-y-1 transition-all duration-300">
              <div className="bg-indigo-600 p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black text-xl border border-white/30 backdrop-blur-sm">
                    {driver.name.charAt(0)}
                  </div>
                  <div className="flex items-center space-x-1 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                    <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <span className="text-xs font-black">{driver.rating}</span>
                  </div>
                </div>
                <h3 className="text-lg font-black tracking-tight">{driver.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">ID: {driver.id} • {driver.licenseNumber}</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Avg Trip</p>
                    <p className="text-sm font-black text-slate-900">{driver.avgTripDuration}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Completed</p>
                    <p className="text-sm font-black text-slate-900">{driver.tripsCompleted} Loads</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing Accuracy</span>
                      <span className="text-xs font-black text-emerald-600">{driver.onTimePercentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${driver.onTimePercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fuel Efficiency</span>
                      <span className="text-xs font-black text-indigo-600">{driver.fuelEfficiencyRating}/10</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(driver.fuelEfficiencyRating || 0) * 10}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Incident Logs</h4>
                  {driverIssues.length > 0 ? (
                    <div className="space-y-2">
                      {driverIssues.slice(0, 2).map(issue => (
                        <div key={issue.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                          <p className="text-[9px] font-black text-rose-600 uppercase mb-0.5">{issue.scheduledDate} • Safety Alert</p>
                          <p className="text-xs font-bold text-rose-900 truncate">{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      <span className="text-[10px] font-black text-emerald-700 uppercase">Clean Safety Record</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
