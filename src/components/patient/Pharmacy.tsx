import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Upload, FileText, X, Pill, CheckCircle2, ChevronDown, ChevronUp, 
  Activity, Star, Clock, Beaker, Bell, Menu, ShieldCheck, Download, Eye, Edit3, Trash2, 
  Cpu, ArrowRight, Share2, ClipboardList, ShoppingCart, Truck, SlidersHorizontal, ChevronRight, Plus, User
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

interface PharmacyProps {
  user: UserProfile;
  userCases: Case[];
  onBack: () => void;
  t: any;
}

export default function Pharmacy({ user, userCases, onBack, t }: PharmacyProps) {
  const [activeTab, setActiveTab] = useState<'find' | 'orders'>('find');
  const [pharmacies, setPharmacies] = useState<UserProfile[]>([]);
  const [expandedPharmacy, setExpandedPharmacy] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  
  // Order State
  const [showOrderModal, setShowOrderModal] = useState<UserProfile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{latitude: number, longitude: number, timestamp: string} | null>(null);
  const [selectedMeds, setSelectedMeds] = useState<{medicineName: string, price: number}[]>([]);
  
  // Medicines for current pharmacy
  const [availableMeds, setAvailableMeds] = useState<any[]>([]);

  // Orders
  const [allOrders, setAllOrders] = useState<any[]>([]);

  // Extract Recommended Medicines from Active Case
  const activeCase = userCases.find(c => c.status === 'active');
  const recommendedMeds = activeCase?.medicines || [];

  useEffect(() => {
    // Fetch registered pharmacies
    const q = query(collection(db, 'users'), where('role', '==', 'pharmacy'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPharmacies(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as UserProfile));
    });

    // Real-time listener for all user pharmacy orders
    const rq = query(collection(db, 'patients', user.uid, 'pharmacyOrders'));
    const unsubOrders = onSnapshot(rq, (snapshot) => {
      setAllOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubOrders();
    };
  }, [user.uid]);

  const fetchPharmacyMeds = async (pharmacyId: string) => {
    const medsRef = collection(db, 'pharmacies', pharmacyId, 'medicines');
    const snap = await getDocs(medsRef);
    setAvailableMeds(snap.docs.map(doc => doc.data()));
  };

  useEffect(() => {
    if (expandedPharmacy) {
      fetchPharmacyMeds(expandedPharmacy);
    }
  }, [expandedPharmacy]);

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => console.error('Location error:', error)
      );
    }
  };

  const handleOrder = async () => {
    if (!showOrderModal) return;
    setUploading(true);
    try {
      if (!selectedCaseId) {
        setShowCreateCaseModal(true);
        return;
      }
      const targetCase = userCases.find(c => c.caseId === selectedCaseId);
      const caseId = targetCase?.caseId || '';
      
      let prescriptionUrl = null;
      if (file) {
        const sRef = ref(storage, `pharmacy_prescriptions/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        prescriptionUrl = await getDownloadURL(sRef);
      }

      const requestId = `PHARM-REQ-${Date.now()}`;
      const data = {
        pharmacyRequestId: requestId,
        caseId,
        patientId: user.uid,
        pharmacyId: showOrderModal.uid,
        patientName: user.fullName,
        patientPhone: user.phoneNumber || '',
        medicines: selectedMeds,
        prescriptionUrl,
        patientLocation: location,
        status: 'requested',
        priceEstimate: selectedMeds.reduce((acc, curr) => acc + (curr.price || 0), 0) || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        pharmacyName: showOrderModal.pharmacyName || showOrderModal.fullName
      };

      // 1. PRIMARY UPDATE: Sync with Health Journey Case INSTANTLY
      if (targetCase) {
        await updateDoc(doc(db, 'patients', user.uid, 'cases', targetCase.id), {
          'healthJourney.pharmacy': true,
          medicines: arrayUnion(data),
          updatedAt: serverTimestamp()
        });
      }

      // 2. IMMEDIATE UI RETURN
      toast.success('Order request sent to pharmacy!');
      setShowOrderModal(null);
      onBack();

      // 3. BACKGROUND LOGS
      const orderData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      setDoc(doc(db, 'patients', user.uid, 'pharmacyOrders', requestId), orderData);

    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-[#059669]';
      case 'out for delivery': return 'bg-emerald-50 text-emerald-600';
      case 'processing': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const timelineSteps = [
    { label: 'Order Placed', icon: ClipboardList },
    { label: 'Quote Shared', icon: Share2 },
    { label: 'Accepted', icon: CheckCircle2 },
    { label: 'Packing', icon: ShoppingCart },
    { label: 'Out for Delivery', icon: Truck },
    { label: 'Delivered', icon: CheckCircle2 }
  ];

  const getCurrentStep = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'requested': return 0;
      case 'quote_sent': return 1;
      case 'accepted': return 2;
      case 'processing': return 3;
      case 'out for delivery': return 4;
      case 'completed': return 5;
      default: return 0;
    }
  };

  const [cityFilter, setCityFilter] = useState(t.allCities || 'All Cities');
  const [showFilters, setShowFilters] = useState(false);

  const filteredPharmacies = pharmacies.filter(p => {
    const name = (p.pharmacyName || p.fullName || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = name.includes(search);
    const matchesCity = cityFilter === (t.allCities || 'All Cities') || p.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const cities = [t.allCities || 'All Cities', ...Array.from(new Set(pharmacies.map(p => p.city).filter(Boolean))).sort()];

  try {
    return (
    <div className="flex-1 flex flex-col w-full bg-transparent font-sans">
      
      {/* 1. STICKY TOP NAVIGATION */}
      <div className="bg-[#F0F9F4]/95 backdrop-blur-md space-y-1 pb-2 sticky top-0 z-30 px-4">
          <div className="pt-0">
            <div className="flex p-1 bg-white rounded-[22px] shadow-sm border border-gray-100 w-full max-w-md mx-auto">
               {['find', 'orders'].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`flex-1 py-3 rounded-[18px] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.15em] transition-all duration-300 ${
                     activeTab === tab 
                       ? 'bg-[#0b6b4f] text-white shadow-md' 
                       : 'text-gray-400 hover:text-[#0b6b4f]'
                   }`}
                 >
                   {tab === 'find' ? t.findPharmacy : t.myOrders}
                 </button>
               ))}
            </div>
          </div>

          {activeTab === 'find' && !selectedOrder && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                 <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder={t.searchMed || "Search pharmacies or medications..."} 
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
                         value={cityFilter}
                         onChange={(e) => setCityFilter(e.target.value)}
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
              
              <div className="flex items-center gap-6 px-2">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0b6b4f]" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.verifiedNetwork}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#0b6b4f]" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.fastDelivery}</span>
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 px-4 pt-2 pb-20 space-y-8">
          {activeTab === 'find' && (
            <div className="max-w-5xl mx-auto space-y-10">
              {/* Main content area (can be used for search results or other primary actions) */}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="max-w-7xl mx-auto space-y-8 px-4">
            <div className="flex justify-between items-end mb-4">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{t.orderArchives}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Verified Digital Prescription Records</p>
               </div>
            </div>

               {allOrders.length === 0 ? (
                 <div className="py-48 flex flex-col items-center justify-center text-center gap-8">
                    <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center">
                       <ShoppingCart className="w-12 h-12 text-slate-200" />
                    </div>
                    <div>
                       <p className="text-lg font-black text-slate-900 uppercase tracking-widest">No Orders Yet</p>
                       <p className="text-xs font-bold text-slate-400 mt-3">Your medicine orders will appear here automatically</p>
                    </div>
                 </div>
               ) : allOrders.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).map((order) => (
                  <motion.div 
                    key={order.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedOrder(order.id)}
                    className="bg-white rounded-[56px] p-10 border-4 border-slate-50 shadow-[0_15px_40px_rgba(0,0,0,0.02)] hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-10">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-emerald-400 shadow-2xl transition-transform group-hover:scale-110 font-black">
                             {order.pharmacyName?.[0] || 'P'}
                          </div>
                          <div>
                             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{order.pharmacyName || 'Local Pharmacy'}</h3>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: #{order.id?.slice(-8)}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">{order.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}</p>
                       </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-[32px] p-8 space-y-6">
                       <div className="flex flex-wrap gap-3">
                          {order.medicines?.map((m: any, i: number) => (
                            <span key={i} className="px-5 py-2.5 bg-white border-2 border-slate-100 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm">
                              {m.medicineName}
                            </span>
                          ))}
                       </div>
                       <div className="flex gap-4 mt-8">
                          <Button className="flex-1 h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-200 hover:bg-emerald-600 transition-all">
                             <Eye className="w-5 h-5 mr-3" /> {t.viewJourneyStatus}
                          </Button>
                          <Button variant="outline" className="w-16 h-16 rounded-[24px] border-2 border-slate-100 bg-white shadow-sm hover:border-slate-900 transition-all">
                             <Download className="w-6 h-6 text-slate-400" />
                          </Button>
                       </div>
                    </div>
                 </motion.div>
               ))}
            </div>
          )}
        </div>

        {/* ORDER JOURNEY EXPANDED */}
        <AnimatePresence>
          {selectedOrder && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col"
              >
                <div className="p-8 bg-slate-900 flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-emerald-500 text-white rounded-[20px] flex items-center justify-center shadow-xl">
                       <Pill className="w-7 h-7" />
                     </div>
                     <div className="text-white">
                        <h3 className="font-black text-2xl uppercase tracking-wider">{allOrders.find(o => o.id === selectedOrder)?.pharmacyName || 'Arogya Pharmacy'}</h3>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
                           <span>Order ID: #{selectedOrder?.slice(-10)}</span>
                        </div>
                     </div>
                   </div>
                   <button onClick={() => setSelectedOrder(null)} className="w-14 h-14 bg-white/10 text-white rounded-full hover:bg-white/20 flex items-center justify-center transition-all">
                     <X className="w-6 h-6" />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-10 flex flex-col lg:flex-row gap-10">
                  <div className="flex-1 space-y-8">
                     <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">{t.prescribedItems}</h4>
                        <div className="bg-white rounded-[48px] p-10 border-4 border-slate-50 shadow-xl space-y-6">
                           <div className="space-y-4">
                              {allOrders.find(o => o.id === selectedOrder)?.medicines?.map((m: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] group transition-all hover:bg-white hover:shadow-xl border-2 border-transparent hover:border-emerald-500/10">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                       <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                     </div>
                                     <p className="font-black text-slate-900 uppercase text-lg tracking-tighter">{m.medicineName}</p>
                                  </div>
                                </div>
                              ))}
                           </div>
                           {allOrders.find(o => o.id === selectedOrder)?.prescriptionUrl && (
                              <div className="mt-12 pt-12 border-t-2 border-slate-50">
                                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Digital Prescription</p>
                                 <div className="bg-slate-50 rounded-[32px] p-6 flex gap-6 border-2 border-slate-50 hover:border-emerald-500/20 transition-all cursor-pointer group">
                                    <div className="w-24 h-24 bg-white rounded-[24px] border-2 border-slate-100 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                      <img src={allOrders.find(o => o.id === selectedOrder)?.prescriptionUrl} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 py-2">
                                       <p className="font-black text-slate-900 uppercase text-sm tracking-tight mb-2">Original Scan.jpg</p>
                                       <Button className="h-10 px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">View Document</Button>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="lg:w-[400px] space-y-8">
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">{t.dispatchLogistics}</h4>
                       <div className="bg-white rounded-[48px] p-10 border-4 border-slate-50 shadow-xl space-y-6">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Delivery Address</p>
                             <p className="text-slate-900 font-black text-lg tracking-tight uppercase">{allOrders.find(o => o.id === selectedOrder)?.patientLocation?.address || 'Verified Home Address'}</p>
                          </div>
                          <div className="p-6 bg-emerald-50 rounded-[32px] border-2 border-emerald-100">
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Status Summary</p>
                             <p className="text-emerald-900 font-black uppercase text-xs">Currently in {allOrders.find(o => o.id === selectedOrder)?.status} phase</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-white border-t-4 border-slate-50 shrink-0 overflow-x-auto no-scrollbar">
                   <div className="min-w-[900px] flex justify-between relative px-20">
                      <div className="absolute top-8 left-[15%] right-[15%] h-1 bg-slate-100 z-0" />
                      <div className="absolute top-8 left-[15%] h-1 bg-emerald-500 z-0 transition-all duration-1000" style={{ width: `${(getCurrentStep(allOrders.find(o => o.id === selectedOrder)?.status) / 4) * 70}%` }} />
                      
                      {timelineSteps.map((step, i) => {
                        const isActive = i <= getCurrentStep(allOrders.find(o => o.id === selectedOrder)?.status);
                        return (
                          <div key={i} className="relative z-10 flex flex-col items-center gap-4 w-32">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border-4 transition-all duration-500 ${isActive ? 'bg-slate-900 border-slate-900 text-emerald-400 shadow-2xl scale-110' : 'bg-white border-slate-100 text-slate-200'}`}>
                              {isActive ? <CheckCircle2 className="w-8 h-8" /> : <step.icon className="w-8 h-8" />}
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-widest text-center ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</p>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* ORDER MODAL - REWORKED */}
        <AnimatePresence>
          {showOrderModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOrderModal(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-md bg-white rounded-[28px] shadow-[0_50px_120px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[95vh] text-slate-900">
                 <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                          <Pill className="w-4 h-4" />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-emerald-600 capitalize tracking-tight">{t.finalizeOrder}</h3>
                          <p className="text-[7px] font-medium text-slate-400 capitalize tracking-widest mt-0.5">Verified Clinical Fulfillment</p>
                       </div>
                    </div>
                    <button onClick={() => setShowOrderModal(null)} className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"><X className="w-4 h-4" /></button>
                 </div>

                 <div className="p-5 space-y-5 overflow-y-auto no-scrollbar">
                    {/* CASE SELECTION */}
                     <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                           <p className="text-[7px] font-bold text-slate-400 capitalize tracking-[0.2em]">{t.attachToPatientJourney}</p>
                           <button 
                             onClick={() => setShowCreateCaseModal(true)}
                             className="text-[7px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1 hover:underline"
                           >
                             <Plus className="w-2.5 h-2.5" /> {t.createNew || "New"}
                           </button>
                        </div>
                        <div className="relative">
                           <select 
                             className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 font-medium text-slate-900 capitalize tracking-tight outline-none appearance-none cursor-pointer text-[13px]"
                             value={selectedCaseId}
                             onChange={(e) => setSelectedCaseId(e.target.value)}
                           >
                              <option value="">{t.selectCaseProfile}</option>
                              {userCases.filter(c => c.status === 'active').map(c => (
                                <option key={c.id} value={c.caseId}>{c.caseId} • {c.caseName}</option>
                              ))}
                           </select>
                           <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        </div>
                     </div>

                    {/* ITEMS RECAP */}
                    <div className="space-y-1.5">
                       <p className="text-[7px] font-bold text-slate-400 capitalize tracking-[0.2em] pl-1">{t.orderComposition}</p>
                       <div className="bg-emerald-50/50 rounded-2xl p-4 space-y-2.5 border border-emerald-100/30">
                          {selectedMeds.length === 0 ? (
                            <div className="text-center py-2">
                               <FileText className="w-6 h-6 text-emerald-200 mx-auto mb-2" />
                               <p className="text-[9px] font-medium text-emerald-600 capitalize tracking-widest text-center">Fulfill with Prescription Scan Only</p>
                            </div>
                          ) : selectedMeds.map((m, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-emerald-100/30 pb-2 last:border-0 last:pb-0">
                               <p className="text-[13px] font-medium text-slate-700 capitalize tracking-tight">{m.medicineName}</p>
                               <p className="text-[15px] font-bold text-emerald-600 tracking-tighter leading-none">₹{m.price || '0'}</p>
                            </div>
                          ))}
                          <div className="pt-2 mt-2 border-t border-emerald-100/50 flex justify-between items-center">
                             <p className="text-[7px] font-bold text-slate-400 capitalize tracking-widest">{t.estimatedValue}</p>
                             <p className="text-xl font-bold text-slate-900 tracking-tighter leading-none">₹{selectedMeds.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0)}</p>
                          </div>
                       </div>
                    </div>

                    {/* PRESCRIPTION UPLOAD */}
                    <div className="space-y-1.5">
                       <p className="text-[7px] font-bold text-slate-400 capitalize tracking-[0.2em] pl-1">Prescription (Optional)</p>
                       <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer hover:bg-emerald-50 transition-all group overflow-hidden relative">
                          <div className="flex flex-col items-center justify-center relative z-10">
                             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm mb-1.5 group-hover:scale-105 transition-transform">
                                <Upload className="w-4 h-4 text-emerald-500" />
                             </div>
                             <p className="text-[7px] font-medium text-slate-400 capitalize tracking-[0.1em]">{file ? file.name : 'Tap to upload'}</p>
                          </div>
                          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                       </label>
                    </div>
                 </div>

                 <div className="p-5 bg-white border-t border-slate-50">
                    <Button 
                      onClick={handleOrder}
                      disabled={uploading}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold capitalize text-[13px] tracking-tight shadow-md active:scale-95 transition-all"
                    >
                      {uploading ? t.transmitting : t.dispatchNow}
                    </Button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* CREATE CASE MODAL */}
        <AnimatePresence>
          {showCreateCaseModal && (
            <CreateCaseModal 
              patientId={user.uid}
              existingCases={userCases}
              onClose={() => setShowCreateCaseModal(false)}
              onCaseCreated={(caseId) => {
                setSelectedCaseId(caseId);
                setShowCreateCaseModal(false);
                toast.success("Health Journey active. Ready for pharmacy order.");
              }}
              initialView="form"
            />
          )}
        </AnimatePresence>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-8 bg-red-50 text-red-600 min-h-screen font-mono">
        <h1 className="text-2xl font-bold mb-4">Pharmacy Portal Error</h1>
        <p className="mb-4">{error.message}</p>
        <pre className="text-xs bg-red-100 p-4 rounded overflow-auto">{error.stack}</pre>
        <Button onClick={onBack} className="mt-4">Return to Dashboard</Button>
      </div>
    );
  }
}
