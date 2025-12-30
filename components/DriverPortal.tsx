
import React, { useState } from 'react';
import { Truck, TripLog, IssueLog, RouteSuggestion, Driver } from '../types';
import { MOCK_DRIVERS } from '../constants';

interface DriverPortalProps {
  trucks: Truck[];
  isOnline: boolean;
  isSyncing: boolean;
  onLogTrip: (trip: Omit<TripLog, 'id' | 'synced'>) => void;
  onLogIssue: (issue: Omit<IssueLog, 'id' | 'synced'>) => void;
  pendingTrips: TripLog[];
  pendingIssues: IssueLog[];
  syncedTrips: TripLog[];
  syncedIssues: IssueLog[];
  activeRoutes: RouteSuggestion[];
}

export const DriverPortal: React.FC<DriverPortalProps> = ({ 
  trucks, 
  isOnline, 
  isSyncing,
  onLogTrip, 
  onLogIssue, 
  pendingTrips, 
  pendingIssues,
  syncedTrips,
  syncedIssues,
  activeRoutes
}) => {
  const [activeTab, setActiveTab] = useState<'trip' | 'issue' | 'routes' | 'stats'>('trip');
  const [truckId, setTruckId] = useState(trucks[0]?.id || '');
  
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [route, setRoute] = useState('');

  const [issueDesc, setIssueDesc] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Find associated driver for the current truck
  const currentTruck = trucks.find(t => t.id === truckId);
  const currentDriver = MOCK_DRIVERS.find(d => d.id === currentTruck?.driverId);

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogTrip({
      truckId,
      date: new Date().toISOString().split('T')[0],
      startKm: Number(startKm),
      endKm: Number(endKm),
      route
    });
    setStartKm('');
    setEndKm('');
    setRoute('');
    alert(isOnline ? 'Trip saved successfully!' : 'Saving to local storage (Offline Mode)');
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogIssue({
      truckId,
      date: new Date().toISOString().split('T')[0],
      description: issueDesc,
      severity
    });
    setIssueDesc('');
    alert(isOnline ? 'Issue reported successfully!' : 'Saving to local storage (Offline Mode)');
  };

  const StatusBadge = ({ synced }: { synced: boolean }) => (
    <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
      synced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 animate-pulse'
    }`}>
      {synced ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Synced</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a3.5 3.5 0 1 1-5.8-3c.5-.5 1.3-.8 2.1-.8l2.2-.2c1.2-.1 2.2-.9 2.5-2a3.5 3.5 0 0 1 6.5 1.5c0 2-1.6 3.5-3.5 3.5H17.5Z"/><path d="M12 12V3"/></svg>
          <span>Pending</span>
        </>
      )}
    </div>
  );

  const filteredRoutes = activeRoutes.filter(r => r.truckId === truckId);
  const pendingCount = pendingTrips.length + pendingIssues.length;

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Driver Identity Card */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex items-center space-x-4">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center font-black text-xl border border-white/30">
          {currentDriver?.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight">{currentDriver?.name || 'Unknown Driver'}</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
            {currentTruck?.regNumber} • {currentDriver?.licenseNumber}
          </p>
        </div>
      </div>

      {/* Sync Status Hub */}
      <div className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${isOnline ? 'border-slate-100' : 'border-rose-200 ring-2 ring-rose-50'}`}>
        <div className={`p-4 flex items-center justify-between ${isSyncing ? 'bg-indigo-50' : isOnline ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-indigo-500 animate-spin' : isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isSyncing ? 'text-indigo-700' : isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isSyncing ? 'Synchronizing...' : isOnline ? 'Cloud Connected' : 'Offline Mode Active'}
            </span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
                {pendingCount} logs queued
              </span>
            </div>
          )}
        </div>

        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('trip')}
            className={`flex-1 py-4 text-[10px] font-bold transition-all uppercase tracking-wider ${activeTab === 'trip' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Log Trip
          </button>
          <button 
            onClick={() => setActiveTab('routes')}
            className={`flex-1 py-4 text-[10px] font-bold transition-all uppercase tracking-wider ${activeTab === 'routes' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Routes
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-4 text-[10px] font-bold transition-all uppercase tracking-wider ${activeTab === 'stats' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Stats
          </button>
          <button 
            onClick={() => setActiveTab('issue')}
            className={`flex-1 py-4 text-[10px] font-bold transition-all uppercase tracking-wider ${activeTab === 'issue' ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Report
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">My Vehicle</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
            >
              {trucks.map(t => <option key={t.id} value={t.id}>{t.regNumber}</option>)}
            </select>
          </div>

          {activeTab === 'trip' ? (
            <form onSubmit={handleTripSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Start KM</label>
                  <input 
                    type="number" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="0"
                    value={startKm}
                    onChange={(e) => setStartKm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">End KM</label>
                  <input 
                    type="number" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="0"
                    value={endKm}
                    onChange={(e) => setEndKm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Route Details</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Mumbai -> Pune"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                <span>{isOnline ? 'Log Trip Online' : 'Save Trip Locally'}</span>
              </button>
            </form>
          ) : activeTab === 'routes' ? (
            <div className="space-y-4">
              {filteredRoutes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m5 9 7-7 7 7"/><path d="m19 15-7 7-7-7"/></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-400">No optimized routes assigned</p>
                </div>
              ) : (
                filteredRoutes.map(route => (
                  <div key={route.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-sm font-black text-slate-800">{route.origin} → {route.destination}</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(route.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m5 9 7-7 7 7"/><path d="m19 15-7 7-7-7"/></svg>
                      </div>
                    </div>
                    <a 
                      href={route.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4 4-4-4"/><path d="M12 8v8"/></svg>
                      <span>Start Navigation</span>
                    </a>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'stats' ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Avg. Trip Time</p>
                   <p className="text-lg font-black text-indigo-600">{currentDriver?.avgTripDuration || 'N/A'}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">On-Time rate</p>
                   <p className="text-lg font-black text-emerald-600">{currentDriver?.onTimePercentage || 0}%</p>
                 </div>
               </div>
               
               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Fuel Efficiency Score</p>
                    <span className="text-sm font-black text-slate-900">{currentDriver?.fuelEfficiencyRating || 0}/10</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(currentDriver?.fuelEfficiencyRating || 0) * 10}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Based on throttle control & idling time</p>
               </div>

               <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 text-center">
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className={`w-5 h-5 ${star <= (currentDriver?.rating || 0) ? 'text-amber-500 fill-current' : 'text-slate-300'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm font-black text-indigo-900">Driver Safety Rank: Platinum</p>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Excellent Road Behavior</p>
               </div>
            </div>
          ) : (
            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Medium', 'High'] as const).map((s) => (
                    <button 
                      key={s} type="button"
                      onClick={() => setSeverity(s)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        severity === s 
                          ? 'bg-rose-600 border-rose-600 text-white shadow-lg'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Description</label>
                <textarea 
                  required rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Unusual noise in rear axle"
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Report Issue</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
