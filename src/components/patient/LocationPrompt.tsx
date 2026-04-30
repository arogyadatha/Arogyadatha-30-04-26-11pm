import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Check, X, Loader2, Map as MapIcon, Globe, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

interface LocationData {
  area: string;
  subArea?: string;
  district: string;
  state: string;
  city?: string;
  postcode?: string;
  latitude: number;
  longitude: number;
}

interface LocationPromptProps {
  user: any;
  onClose: () => void;
}

// Helper: fetch with a hard timeout
const fetchWithTimeout = (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const LocationPrompt: React.FC<LocationPromptProps> = ({ user, onClose }) => {
  const [step, setStep] = useState<'detecting' | 'confirm' | 'manual'>('detecting');
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resolved = useRef(false);

  useEffect(() => {
    return () => {
      resolved.current = true; // prevent state updates after unmount
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // ─── FAST LOCATION DETECTION ───────────────────────────────────
  // Strategy: Race 3 methods. First one to succeed wins. Hard 3s deadline.
  useEffect(() => {
    resolved.current = false;

    const showResult = (loc: LocationData) => {
      if (resolved.current) return;
      resolved.current = true;
      setDetectedLocation(loc);
      setStep('confirm');
    };

    const fallbackToManual = () => {
      if (resolved.current) return;
      resolved.current = true;
      setStep('manual');
    };

    // Hard deadline: if nothing works in 3 seconds, go to manual
    const deadline = setTimeout(fallbackToManual, 3000);

    // Method 1: Browser GPS (low accuracy = fast, often < 1s)
    const tryGPS = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (resolved.current) return;
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetchWithTimeout(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              2500
            );
            const data = await res.json();
            const addr = data.address || {};
            
            // Granular extraction for India / detailed locations
            const area = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.mandal || 'Unknown Area';
            const subArea = addr.road || addr.village || addr.city_district || '';
            const city = addr.city || addr.town || addr.municipality || '';
            const district = addr.county || addr.state_district || city || 'Unknown District';
            const state = addr.state || 'Unknown State';
            const postcode = addr.postcode || '';

            showResult({
              area,
              subArea,
              city,
              district,
              state,
              postcode,
              latitude,
              longitude
            });
          } catch {
            // GPS succeeded but geocode failed
          }
        },
        () => {}, // silently fail, IP methods will handle
        { timeout: 2500, enableHighAccuracy: false, maximumAge: 300000 }
      );
    };

    // Method 2: ipapi.co
    const tryIPAPI = async () => {
      try {
        const res = await fetchWithTimeout('https://ipapi.co/json/', 2500);
        const data = await res.json();
        if (data.city && data.region) {
          showResult({
            area: data.city,
            district: data.region,
            state: data.country_name || 'India',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0
          });
        }
      } catch {}
    };

    // Method 3: ip-api.com
    const tryIPAPI2 = async () => {
      try {
        const res = await fetchWithTimeout('http://ip-api.com/json/?fields=city,regionName,country,lat,lon', 2500);
        const data = await res.json();
        if (data.city && data.regionName) {
          showResult({
            area: data.city,
            district: data.regionName,
            state: data.country || 'India',
            latitude: data.lat || 0,
            longitude: data.lon || 0
          });
        }
      } catch {}
    };

    tryGPS();
    tryIPAPI();
    tryIPAPI2();

    return () => {
      clearTimeout(deadline);
      resolved.current = true;
    };
  }, []);

  // ─── MANUAL SEARCH ─────────────────────────────────────────────
  const searchLocation = async (query: string) => {
    if (query.length < 3) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=in`,
        3000
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.length > 2) {
      searchTimeoutRef.current = setTimeout(() => searchLocation(val), 400);
    } else {
      setSearchResults([]);
    }
  };

  // ─── CONFIRM / SKIP ────────────────────────────────────────────
  const handleConfirm = async (loc: LocationData) => {
    try {
      const updates = {
        area: loc.area,
        subArea: loc.subArea || '',
        city: loc.city || '',
        district: loc.district,
        state: loc.state,
        postcode: loc.postcode || '',
        latitude: loc.latitude,
        longitude: loc.longitude,
        location_confirmed: true,
        last_confirmed_district: loc.district,
        last_confirmed_at: serverTimestamp()
      };
      
      const userRef = doc(db, 'users', user.uid);
      
      // Determine role-based collection
      const roleCollectionMap: Record<string, string> = {
        'patient': 'patients',
        'doctor': 'doctors',
        'lab': 'labs',
        'pharmacy': 'pharmacies',
        'admin': 'admins'
      };
      const roleCollection = roleCollectionMap[user.role] || 'users';
      const roleRef = doc(db, roleCollection, user.uid);
      
      // Use setDoc with merge: true to avoid "document not found" errors
      // if the role-specific profile hasn't been created yet.
      await Promise.all([
        setDoc(userRef, updates, { merge: true }),
        setDoc(roleRef, updates, { merge: true })
      ]);
      
      toast.success('Location updated successfully');
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save location');
    }
  };

  const handleSkip = async () => {
    try {
      const updates = { location_confirmed: false };
      const userRef = doc(db, 'users', user.uid);
      const patientRef = doc(db, 'patients', user.uid);
      await Promise.all([updateDoc(userRef, updates), updateDoc(patientRef, updates)]);
    } catch {}
    onClose();
  };

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-emerald-100"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Location Access</h3>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Ensuring real-time care accuracy</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* ── DETECTING ── */}
            {step === 'detecting' && (
              <motion.div
                key="detecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 space-y-5"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
                  <div className="relative w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Detecting Location...</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase">This will take just a moment</p>
                </div>
              </motion.div>
            )}

            {/* ── CONFIRM ── */}
            {step === 'confirm' && detectedLocation && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-emerald-50/50 rounded-[24px] p-5 border-2 border-dashed border-emerald-200">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-3 text-center">Current Location Detected</p>
                  <div className="flex flex-col items-center text-center gap-1.5">
                    <div className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center mb-1">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                      {detectedLocation.area}
                      {detectedLocation.subArea && <span className="block text-sm text-emerald-600 mt-0.5">{detectedLocation.subArea}</span>}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {detectedLocation.city ? `${detectedLocation.city}, ` : ''}
                      {detectedLocation.district}, {detectedLocation.state}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-bold text-center leading-relaxed">
                  We detected your location as <span className="text-emerald-700">{detectedLocation.area}</span>. Continue with this?
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={() => handleConfirm(detectedLocation)}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Confirm & Continue
                  </button>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setStep('manual')}
                      className="w-full py-3.5 bg-white border-2 border-emerald-100 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Search className="w-3.5 h-3.5" /> Change
                    </button>
                    <button
                      onClick={handleSkip}
                      className="w-full py-3.5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-3.5 h-3.5" /> Skip
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── MANUAL ── */}
            {step === 'manual' && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search Area, District or Pincode..."
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-transparent focus:border-emerald-300 focus:bg-white rounded-2xl outline-none text-sm font-bold text-slate-800 transition-all"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 animate-spin" />}
                </div>

                <div className="max-h-[280px] overflow-y-auto no-scrollbar space-y-1.5">
                  {searchResults.map((res, i) => {
                    const addr = res.address || {};
                    const area = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.mandal || addr.town || addr.village || addr.road || addr.city;
                    const subArea = addr.road || addr.village || addr.city_district || '';
                    const city = addr.city || addr.town || addr.municipality || '';
                    const district = addr.county || addr.state_district || city || 'Unknown District';
                    const state = addr.state || 'Unknown State';
                    const postcode = addr.postcode || '';

                    return (
                      <button
                        key={i}
                        onClick={() => handleConfirm({
                          area: area || res.display_name.split(',')[0],
                          subArea,
                          city,
                          district,
                          state,
                          postcode,
                          latitude: parseFloat(res.lat),
                          longitude: parseFloat(res.lon)
                        })}
                        className="w-full p-3.5 hover:bg-emerald-50 rounded-2xl flex items-start gap-3 transition-all text-left border border-transparent hover:border-emerald-100 group"
                      >
                        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white transition-all">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">
                            {area || res.display_name.split(',')[0]}
                          </p>
                          {subArea && <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">{subArea}</p>}
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{res.display_name}</p>
                        </div>
                      </button>
                    );
                  })}
                  {!isSearching && searchQuery.length > 2 && searchResults.length === 0 && (
                    <div className="py-8 text-center">
                      <MapIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No matching areas</p>
                    </div>
                  )}
                  {searchQuery.length <= 2 && (
                    <div className="py-8 text-center">
                      <Globe className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Type to search areas</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep(detectedLocation ? 'confirm' : 'detecting')}
                  className="w-full py-3 text-[#0b6b4f] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-50 rounded-2xl transition-all"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
