
import React, { useState, useEffect, useRef } from 'react';
import { Truck, RouteSuggestion } from '../types';
import { planOptimizedRoute } from '../geminiService';

declare var L: any; // Leaflet global

interface RoutePlannerProps {
  trucks: Truck[];
  onSaveRoute: (route: RouteSuggestion) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({ trucks, onSaveRoute }) => {
  const [truckId, setTruckId] = useState(trucks[0]?.id || '');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [newWaypoint, setNewWaypoint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ 
    text: string, 
    mapsUrl: string, 
    optimizedWaypoints: string[],
    groundingSources: {title: string, uri: string}[]
  } | null>(null);

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('route-map', {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([20.5937, 78.9629], 5); // Center of India
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Geocoding Helper using Nominatim
  const geocode = async (query: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    }
    return null;
  };

  // Fetch road path from OSRM
  const getRoadPath = async (coords: [number, number][]) => {
    if (coords.length < 2) return null;
    const coordString = coords.map(c => `${c[1]},${c[0]}`).join(';');
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      }
    } catch (e) {
      console.error('Routing error:', e);
    }
    return coords; // Fallback to straight lines if OSRM fails
  };

  const updateMapVisuals = async (forceWaypoints?: string[]) => {
    if (!mapRef.current) return;

    // Clear old markers and polyline
    markersRef.current.forEach(m => mapRef.current.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    const currentWaypoints = forceWaypoints || waypoints;

    const locations = [
      { name: origin, type: 'start' },
      ...currentWaypoints.map(w => ({ name: w, type: 'waypoint' })),
      { name: destination, type: 'end' }
    ].filter(l => l.name.trim() !== '');

    const foundCoords: [number, number][] = [];

    for (const loc of locations) {
      const coords = await geocode(loc.name);
      if (coords) {
        const color = loc.type === 'start' ? '#10b981' : loc.type === 'end' ? '#ef4444' : '#6366f1';
        const label = loc.type === 'start' ? 'Origin' : loc.type === 'end' ? 'Destination' : 'Stop';
        
        const markerIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const marker = L.marker([coords.lat, coords.lon], { icon: markerIcon })
          .addTo(mapRef.current)
          .bindPopup(`<div class="p-1"><b class="text-indigo-600">${label}</b><br/><span class="text-xs text-slate-500">${loc.name}</span></div>`);
        
        markersRef.current.push(marker);
        foundCoords.push([coords.lat, coords.lon]);
      }
    }

    if (foundCoords.length >= 2) {
      const roadPath = await getRoadPath(foundCoords);
      if (roadPath) {
        polylineRef.current = L.polyline(roadPath, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.8,
          lineJoin: 'round',
          dashArray: '1, 10'
        }).addTo(mapRef.current);

        L.polyline(roadPath, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.4
        }).addTo(mapRef.current);
      }
    }

    if (foundCoords.length > 0) {
      const bounds = L.latLngBounds(foundCoords);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((origin || destination) && !result) {
        updateMapVisuals();
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [origin, destination, waypoints, result]);

  const addWaypoint = () => {
    if (newWaypoint.trim()) {
      setWaypoints([...waypoints, newWaypoint.trim()]);
      setNewWaypoint('');
      setResult(null); // Reset optimization if points change
    }
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setIsLoading(true);
    const optimized = await planOptimizedRoute(origin, destination, waypoints);
    setResult(optimized);
    setIsLoading(false);
    updateMapVisuals(optimized.optimizedWaypoints);
  };

  const handleSave = () => {
    if (!result) return;
    onSaveRoute({
      id: `R-${Date.now()}`,
      truckId,
      origin,
      destination,
      waypoints: result.optimizedWaypoints,
      optimizedRoute: result.text,
      estimatedTime: 'Calculating...',
      estimatedDistance: 'Calculating...',
      mapsUrl: result.mapsUrl,
      timestamp: new Date().toISOString()
    });
    alert('Optimized Dispatch assigned to driver!');
    setResult(null);
    setOrigin('');
    setDestination('');
    setWaypoints([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 h-fit space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900 flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m5 9 7-7 7 7"/><path d="m19 15-7 7-7-7"/></svg>
            </div>
            <span>Intelligent Dispatch</span>
          </h3>
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
             <div className="px-3 py-1 text-[9px] font-black text-indigo-600 uppercase">OSRM v1</div>
          </div>
        </div>
        
        <form onSubmit={handleOptimize} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Allocation</label>
            <select 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-black text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
            >
              {trucks.map(t => <option key={t.id} value={t.id}>{t.regNumber} • {t.model.split(' ').pop()}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Fleet Origin</label>
              <div className="relative">
                <input 
                  type="text" required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="e.g. Navi Mumbai Terminal"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Delivery Nodes (Waypoints)</label>
              <div className="space-y-2 mb-4">
                {waypoints.map((wp, i) => (
                  <div key={i} className="flex items-center space-x-2 group animate-in slide-in-from-left-2 duration-200">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 truncate shadow-sm">
                      {wp}
                    </div>
                    <button type="button" onClick={() => removeWaypoint(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <input 
                  type="text"
                  className="flex-1 px-5 py-4 bg-white border border-slate-200 rounded-[1.5rem] font-bold text-xs focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-inner"
                  placeholder="Enter loading stop..."
                  value={newWaypoint}
                  onChange={(e) => setNewWaypoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWaypoint())}
                />
                <button 
                  type="button"
                  onClick={addWaypoint}
                  className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                  Add Node
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Final Destination</label>
              <div className="relative">
                <input 
                  type="text" required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="e.g. Delhi Dry Port"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-500 border-4 border-white shadow-sm"></div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !origin || !destination}
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-[1.8rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-3 active:scale-95 group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><path d="M12 3v11"/><path d="m8 11 4 4 4-4"/><path d="M8 5c1 .5 2 1 3 1"/><path d="M3 12h1"/><path d="M20 12h1"/><path d="M5 19h14"/></svg>
            )}
            <span className="text-[11px] uppercase tracking-[0.2em]">{isLoading ? 'AI Optimizing Engine Running...' : 'AI Solve Shortest Route'}</span>
          </button>
        </form>
      </div>

      <div className="space-y-8 flex flex-col h-full min-h-[650px]">
        {/* Map Visualizer */}
        <div className="bg-white p-4 rounded-[3.5rem] shadow-xl border border-slate-100 flex-1 relative overflow-hidden card-3d-premium">
          <div id="route-map" className="w-full h-full z-10 transition-transform duration-1000"></div>
          
          <div className="absolute top-8 right-8 z-20">
            <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-slate-100 text-[10px] font-black text-slate-900 flex items-center space-x-3 pointer-events-none uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <span>Grounding Active</span>
            </div>
          </div>
        </div>

        {/* AI Results Analysis */}
        {result && (
          <div className="bg-white p-10 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(99,102,241,0.2)] border border-indigo-100 animate-in slide-in-from-bottom-10 duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">AI Dispatch Optimization</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sequence Solved: Shortest Path</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex space-x-1">
                  {[1,2,3,4,5].map(s => <div key={s} className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>)}
                </div>
                <span className="text-[9px] font-black text-emerald-600 uppercase mt-1">Efficiency 99%</span>
              </div>
            </div>
            
            <div className="prose prose-slate prose-sm mb-8 max-h-40 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 text-slate-600 font-semibold leading-relaxed text-xs relative">
              <div className="absolute top-4 right-4 text-[9px] font-black text-indigo-300 uppercase italic">Traffic Reasoning Engine</div>
              {result.text}
            </div>

            {/* Grounding Sources (Required for Search Grounding) */}
            {result.groundingSources.length > 0 && (
              <div className="mb-8">
                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Live Intelligence Sources</h5>
                <div className="flex flex-wrap gap-2">
                  {result.groundingSources.map((source, i) => (
                    <a 
                      key={i} href={source.uri} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[9px] font-black text-indigo-600 uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center space-x-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      <span>{(source.title || "").slice(0, 20)}...</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <a 
                href={result.mapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="py-5 bg-slate-900 text-white text-center text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 shadow-xl active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4 4-4-4"/><path d="M12 8v8"/></svg>
                <span>External Nav</span>
              </a>
              <button 
                onClick={handleSave}
                className="py-5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-95"
              >
                Dispatch to Fleet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
