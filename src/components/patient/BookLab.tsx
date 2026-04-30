import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Upload, FileText, X, FlaskConical, CheckCircle2, ChevronDown, ChevronUp, 
  Activity, Star, Clock, Beaker, Bell, Menu, ShieldCheck, Download, Eye, Edit3, Trash2, 
  Cpu, ArrowRight, Share2, ClipboardList, ChevronRight, Plus, SlidersHorizontal, Microscope
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserProfile, Case } from '../../types';
import { db, storage } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp, setDoc, getDocs, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import CreateCaseModal from './CreateCaseModal';

interface BookLabProps {
  user: UserProfile;
  userCases: Case[];
  onBack: () => void;
  t: any;
}

export default function BookLab({ user, userCases, onBack, t }: BookLabProps) {
  const [activeTab, setActiveTab] = useState<'find' | 'reports'>('find');
  const [labs, setLabs] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [selectedLab, setSelectedLab] = useState<UserProfile | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  
  // Booking State
  const [showBookingModal, setShowBookingModal] = useState<UserProfile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number, timestamp: string} | null>(null);
  const [selectedTests, setSelectedTests] = useState<{testName: string, price: number}[]>([]);
  
  // Lab Tests for current lab
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [expandedLabId, setExpandedLabId] = useState<string | null>(null);

  // Bookings / Reports
  const [allRequests, setAllRequests] = useState<any[]>([]);

  // Cities for filtering
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    // Fetch registered labs with real-time availability
    const q = query(collection(db, 'users'), where('role', '==', 'lab'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const labsData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as UserProfile);
      setLabs(labsData);
      
      // Extract unique cities
      const uniqueCities = Array.from(new Set(labsData.map(l => l.city || 'Regional'))).filter(Boolean).sort();
      setCities([t.allCities || 'All Cities', ...uniqueCities]);
    });

    // Real-time listener for all user lab requests
    const rq = query(collection(db, 'patients', user.uid, 'labRequests'));
    const unsubRequests = onSnapshot(rq, (snapshot) => {
      setAllRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubRequests();
    };
  }, [user.uid]);

  const fetchLabTests = async (labId: string) => {
    const testsRef = collection(db, 'labs', labId, 'tests');
    const snap = await getDocs(testsRef);
    setAvailableTests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleLabSelection = (lab: UserProfile) => {
    if (lab.isAvailable === false) {
      toast.error('CENTER OFFLINE: This laboratory is currently not accepting new samples.');
      return;
    }
    if (expandedLabId === lab.uid) {
      setExpandedLabId(null);
    } else {
      setExpandedLabId(lab.uid);
      fetchLabTests(lab.uid);
    }
  };

  const handleBooking = async () => {
    if (!showBookingModal) return;
    setUploading(true);
    try {
      if (!selectedCaseId) {
        setShowCreateCaseModal(true);
        return;
      }
      const targetCase = userCases.find(c => c.caseId === selectedCaseId);
      
      let prescriptionUrl = null;
      if (file) {
        const sRef = ref(storage, `lab_prescriptions/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        prescriptionUrl = await getDownloadURL(sRef);
      }

      const requestId = `LAB-REQ-${Date.now()}`;
      const data = {
        labRequestId: requestId,
        caseId: selectedCaseId,
        patientId: user.uid,
        labId: showBookingModal.uid,
        patientName: user.fullName,
        patientPhone: user.phoneNumber || '',
        tests: selectedTests,
        prescriptionUrl,
        patientLocation: location || { address: user.address || 'Address from profile' },
        status: 'requested',
        priceEstimate: selectedTests.reduce((acc, curr) => acc + (curr.price || 0), 0) || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        labName: showBookingModal.labName || showBookingModal.fullName
      };

      if (targetCase) {
        await updateDoc(doc(db, 'patients', user.uid, 'cases', targetCase.id), {
          'healthJourney.bookLab': true,
          labRequests: arrayUnion(data),
          updatedAt: serverTimestamp()
        });
      }

      const labRequestData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'patients', user.uid, 'labRequests', requestId), labRequestData);
      
      toast.success('Lab request successfully transmitted!');
      setShowBookingModal(null);
      setSelectedLab(null);
      setActiveTab('reports');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredLabs = labs.filter(l => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (l.labName || l.fullName || '').toLowerCase().includes(term) ||
      (l.city || '').toLowerCase().includes(term) ||
      (l.address || '').toLowerCase().includes(term);
    
    const matchesCity = selectedCity === 'All Cities' || l.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="flex-1 flex flex-col w-full bg-transparent font-sans">
      {/* 1. STICKY TOP NAVIGATION */}
      <div className="bg-[#F0F9F4]/95 backdrop-blur-md space-y-1 pb-2 sticky top-0 z-30 px-4">
        <div className="pt-0">
          <div className="flex p-1 bg-white rounded-[22px] shadow-sm border border-gray-100 w-full max-w-md mx-auto">
             {['find', 'reports'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => { setActiveTab(tab as any); setSelectedLab(null); }}
                 className={`flex-1 py-3 rounded-[18px] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.15em] transition-all duration-300 ${
                   activeTab === tab 
                     ? 'bg-[#0b6b4f] text-white shadow-md' 
                     : 'text-gray-400 hover:text-[#0b6b4f]'
                 }`}
               >
                 {tab === 'find' ? t.diagnosticLabs : t.reportArchives}
               </button>
             ))}
          </div>
        </div>

        {activeTab === 'find' && !selectedLab && (
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder={t.searchLab || "Search by lab name or location..."} 
                  className="h-12 sm:h-14 pl-12 bg-white border-gray-100 rounded-[16px] sm:rounded-[20px] font-medium text-slate-700 placeholder:text-gray-300 shadow-sm focus:ring-[#0b6b4f]/10 focus:border-[#0b6b4f] text-xs sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex gap-2">
                <div className="relative w-full sm:w-48">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0b6b4f]" />
                   <select 
                     className="w-full h-12 sm:h-14 pl-10 pr-8 bg-white border border-gray-100 rounded-[16px] sm:rounded-[20px] font-black text-slate-700 text-[10px] uppercase tracking-tight outline-none appearance-none cursor-pointer shadow-sm"
                     value={selectedCity}
                     onChange={(e) => setSelectedCity(e.target.value)}
                   >
                     {cities.map(city => <option key={city} value={city}>{city}</option>)}
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                </div>
                <button className="h-12 sm:h-14 w-12 sm:w-14 rounded-[16px] sm:rounded-[20px] border border-gray-100 bg-white flex items-center justify-center text-[#0b6b4f] hover:bg-gray-50 transition-all shadow-sm">
                   <SlidersHorizontal className="w-5 h-5" />
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="flex-1 no-scrollbar px-4 pt-2 pb-20 space-y-4">
        {activeTab === 'find' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* LAB LISTING - CLEAN RECTANGULAR STYLE */}
              <div className="space-y-4">
                {filteredLabs.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center gap-6">
                     <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center">
                        <Search className="w-6 h-6 text-gray-300" />
                     </div>
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">No Labs found</p>
                  </div>
                ) : filteredLabs.map((lab) => {
                  const isExpanded = expandedLabId === lab.uid;
                  return (
                    <motion.div 
                      key={lab.uid}
                      layout
                      className={`bg-white rounded-[24px] border-2 transition-all overflow-hidden ${isExpanded ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-slate-50 hover:border-emerald-500/20 shadow-sm'}`}
                    >
                       <div 
                         onClick={() => handleLabSelection(lab)}
                         className={`p-5 flex items-center justify-between gap-4 cursor-pointer ${lab.isAvailable === false ? 'opacity-60 grayscale' : ''}`}
                       >
                          <div className="flex items-center gap-4 flex-1">
                             <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#0b0f19] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                                {lab.labName?.[0] || lab.fullName?.[0]}
                             </div>
                             <div>
                                <h4 className="text-[16px] sm:text-[18px] font-black text-slate-900 uppercase tracking-tight">{lab.labName || lab.fullName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                   <MapPin className="w-3 h-3 text-[#0b6b4f]" />
                                   {lab.city || 'Regional'} • {lab.address || 'Main Center'}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                {isExpanded ? 'View Less' : 'View Details'}
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                             </button>
                          </div>
                       </div>

                       <AnimatePresence>
                         {isExpanded && (
                           <motion.div 
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="border-t-2 border-slate-50 bg-slate-50/30"
                           >
                             <div className="p-6 space-y-6">
                                {/* ACTION BUTTONS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <button 
                                     onClick={() => setShowBookingModal(lab)}
                                     className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-emerald-100 rounded-2xl text-[11px] font-black text-emerald-700 uppercase tracking-widest shadow-sm hover:bg-emerald-50 transition-all"
                                   >
                                      <Upload className="w-4 h-4" /> Upload Prescription
                                   </button>
                                   <button className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest shadow-sm opacity-50 cursor-not-allowed">
                                      <FileText className="w-4 h-4" /> Download Prices
                                   </button>
                                </div>

                                {/* TEST CATALOG */}
                                <div className="space-y-3">
                                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Available Tests & Pricing</h5>
                                   {availableTests.length > 0 ? (
                                      <div className="grid grid-cols-1 gap-2">
                                         {availableTests.map((test) => (
                                           <div key={test.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm group hover:border-emerald-500/30 transition-all">
                                              <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                                    <Microscope className="w-4 h-4" />
                                                 </div>
                                                 <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{test.testName}</span>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                 <span className="text-sm font-black text-slate-900">₹{test.price}</span>
                                                 <button 
                                                   onClick={() => { setSelectedTests([{ testName: test.testName, price: test.price }]); setShowBookingModal(lab); }}
                                                   className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                                                 >
                                                   Select
                                                 </button>
                                              </div>
                                           </div>
                                         ))}
                                      </div>
                                   ) : (
                                      <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No online tests listed</p>
                                      </div>
                                   )}
                                </div>

                                <button 
                                  onClick={() => setShowBookingModal(lab)}
                                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                >
                                   Proceed with Order
                                </button>
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="max-w-3xl mx-auto space-y-4">
             <div className="flex justify-between items-end mb-4 px-2">
                <div>
                   <h2 className="text-[20px] sm:text-[24px] font-black text-slate-900 uppercase tracking-tight leading-none">{t.reportArchives}</h2>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">Verified Digital Diagnostic Records</p>
                </div>
             </div>

             {allRequests.length === 0 ? (
               <div className="py-24 flex flex-col items-center justify-center text-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center">
                     <FileText className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t.noReportsFound}</p>
               </div>
             ) : allRequests.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).map((req) => (
               <motion.div 
                 key={req.id} 
                 className="bg-white rounded-[24px] p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
               >
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#0b0f19] rounded-xl flex items-center justify-center text-emerald-400 shadow-md font-black">
                           {req.labName?.[0]}
                        </div>
                        <div>
                           <h3 className="text-[16px] font-black text-slate-900 uppercase tracking-tight">{req.labName}</h3>
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">ORD: #{req.labRequestId?.slice(-8)}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                          req.status === 'completed' ? 'bg-[#F0F9F4] text-[#0b6b4f] border-[#0b6b4f]/10' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {req.status}
                        </span>
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-3">{req.createdAt?.toDate?.()?.toLocaleDateString() || new Date(req.createdAt).toLocaleDateString()}</p>
                     </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-4 space-y-4">
                     <div className="flex flex-wrap gap-2">
                        {req.tests?.map((t: any, i: number) => (
                          <span key={i} className="px-3 py-1 bg-white border border-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                            {t.testName}
                          </span>
                        ))}
                     </div>
                     {req.status === 'completed' && (
                       <div className="flex gap-3 pt-2">
                          <Button className="flex-1 h-10 bg-[#0b6b4f] text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-sm hover:bg-[#08553f] transition-all">
                             <Eye className="w-4 h-4 mr-2" /> View Report
                          </Button>
                          <Button variant="outline" className="w-10 h-10 rounded-xl border border-gray-100 bg-white shadow-sm hover:border-[#0b6b4f] transition-all p-0 flex items-center justify-center">
                             <Download className="w-4 h-4 text-gray-400" />
                          </Button>
                       </div>
                     )}
                  </div>
               </motion.div>
             ))}
          </div>
        )}
      </div>

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBookingModal(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-2xl bg-white rounded-[56px] shadow-[0_50px_120px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[95vh] text-slate-900">
               <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center shadow-xl">
                        <FlaskConical className="w-7 h-7 text-emerald-400" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t.finalizeOrder}</h3>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Safe & Secure transmission</p>
                     </div>
                  </div>
                  <button onClick={() => setShowBookingModal(null)} className="w-14 h-14 rounded-[24px] bg-white border-2 border-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"><X /></button>
               </div>

               <div className="p-10 space-y-10 overflow-y-auto no-scrollbar">
                  {/* CASE SELECTION */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between px-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{t.attachToJourney}</p>
                        <button 
                          onClick={() => setShowCreateCaseModal(true)}
                          className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" /> {t.createNew || "Create New"}
                        </button>
                     </div>
                     <div className="relative">
                        <select 
                          className="w-full h-24 bg-slate-50 border-4 border-transparent focus:border-emerald-500/10 rounded-[32px] px-10 font-black text-slate-900 uppercase tracking-tight outline-none appearance-none cursor-pointer text-lg"
                          value={selectedCaseId}
                          onChange={(e) => setSelectedCaseId(e.target.value)}
                        >
                           <option value="">{t.selectCaseProfile}</option>
                           {userCases.filter(c => c.status === 'active').map(c => (
                             <option key={c.id} value={c.caseId}>{c.caseId} • {c.caseName}</option>
                           ))}
                        </select>
                        <ChevronDown className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300 pointer-events-none" />
                     </div>
                  </div>

                  {/* TEST RECAP */}
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] pl-6">{t.orderBreakdown}</p>
                     <div className="bg-emerald-50 rounded-[40px] p-10 space-y-6">
                        {selectedTests.map((t, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-emerald-100/50 pb-6 last:border-0 last:pb-0">
                             <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.testName}</p>
                             <p className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">₹{t.price}</p>
                          </div>
                        ))}
                        {selectedTests.length === 0 && (
                          <div className="text-center py-6">
                             <FileText className="w-10 h-10 text-emerald-200 mx-auto mb-4" />
                             <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">Custom Prescription Fulfillment</p>
                          </div>
                        )}
                        <div className="pt-6 mt-6 border-t-4 border-emerald-100 flex justify-between items-center">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.grandTotal}</p>
                           <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">₹{selectedTests.reduce((acc, curr) => acc + (curr.price || 0), 0)}</p>
                        </div>
                     </div>
                  </div>

                  {/* PRESCRIPTION UPLOAD */}
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] pl-6">Prescription Document (Optional)</p>
                     <label className="flex flex-col items-center justify-center w-full h-48 border-4 border-dashed border-slate-100 rounded-[40px] bg-slate-50/50 cursor-pointer hover:bg-emerald-50 transition-all group overflow-hidden relative">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform">
                              <Upload className="w-8 h-8 text-emerald-500" />
                           </div>
                           <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{file ? file.name : 'Drop file or tap to select'}</p>
                        </div>
                        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                     </label>
                  </div>
               </div>

               <div className="p-10 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-4">
                  <Button 
                    onClick={handleBooking}
                    disabled={uploading}
                    className="w-full h-24 bg-slate-900 text-white rounded-[32px] font-black uppercase text-sm tracking-[0.4em] shadow-[0_20px_60px_rgba(0,0,0,0.3)] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {uploading ? t.transmitting : t.dispatchRequest}
                  </Button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateCaseModal && (
          <CreateCaseModal 
            patientId={user.uid}
            existingCases={userCases}
            onClose={() => setShowCreateCaseModal(false)}
            onCaseCreated={(caseId) => {
              setSelectedCaseId(caseId);
              setShowCreateCaseModal(false);
              toast.success("Health Journey active. Ready for lab booking.");
            }}
            initialView="form"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
