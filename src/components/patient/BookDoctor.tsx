import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Star, Clock, Video, Building2, ChevronDown, ChevronUp, FileText, Upload, Edit, Trash2,
  Stethoscope, FlaskConical, Pill, Activity, User, SlidersHorizontal, X, ShieldCheck, CheckCircle2, Microscope, UserCircle,
  Phone, ArrowLeft, ArrowRight, Calendar, Sparkles, Plus, Eye, Mail, MessageSquare, Download
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserProfile, Case, Appointment } from '../../types';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, serverTimestamp, setDoc, getDocs, getDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { toast } from 'sonner';
import CreateCaseModal from './CreateCaseModal';

interface BookDoctorProps {
  user: UserProfile;
  userCases: Case[];
  onBack: () => void;
  t: any;
  preSelectedCaseId?: string | null;
}

const CustomSearchableSelect = ({ options, value, onChange, placeholder, icon, onOpen }: any) => {
  return (
    <div className="w-full">
      {/* TRIGGER BUTTON */}
      <button 
        type="button"
        onClick={onOpen}
        className="w-full h-12 px-4 rounded-2xl border-2 border-slate-100 bg-white hover:bg-emerald-50/50 hover:border-emerald-200 transition-all flex items-center justify-between group shadow-sm active:scale-95"
      >
        <div className="flex items-center gap-3 truncate">
          <span className="text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0">{icon}</span>
          <span className="truncate font-black text-[11px] uppercase tracking-wider text-slate-700">
            {value === 'All' ? placeholder : value}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </button>
    </div>
  );
};

const HospitalCard = ({ hospital, t }: { hospital: any, t: any }) => {
  const departments = (Array.isArray(hospital.departments) ? hospital.departments : 
                      (typeof hospital.departments === 'string' ? hospital.departments.split(',').map((d: any) => d.trim()).filter(Boolean) : []))
                      .filter((dept: string) => {
                        // Filter out latitude/longitude-like strings that might have leaked into departments
                        const isCoordinate = /^-?\d+\.\d+$/.test(dept);
                        return !isCoordinate;
                      });
  
  const getDirections = () => {
    const lat = hospital.latitude;
    const lon = hospital.longitude;
    const url = lat && lon 
      ? `https://www.google.com/maps?q=${lat},${lon}`
      : `https://www.google.com/maps?q=${encodeURIComponent(displayAddress)}`;
    window.open(url, '_blank');
  };

  const fullAddress = [
    hospital.address, 
    hospital.district, 
    hospital.state
  ].filter(Boolean).join(', ') + (hospital.pincode ? ` - ${hospital.pincode}` : '');

  const displayAddress = fullAddress || 'Address Not Given';
  const displayPhone = hospital.phoneNumber || hospital.phone || 'Phone Not Given';
  const displayEmail = hospital.email || 'Email Not Given';
  const whatsappLink = displayPhone !== 'Phone Not Given' ? `https://wa.me/${String(displayPhone).replace(/[^0-9]/g, '')}` : '#';

  const deptColors = [
    'bg-rose-50 text-rose-600', 
    'bg-purple-50 text-purple-600', 
    'bg-orange-50 text-orange-600', 
    'bg-emerald-50 text-emerald-600', 
    'bg-blue-50 text-blue-600'
  ];

  return (
    <Card className="bg-white border border-slate-100 rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all group mb-4">
      {/* MOBILE LAYOUT (As requested by user reference image) */}
      <div className="flex sm:hidden flex-col px-3 py-3 gap-2.5">
        {/* ROW 1: Name, Rating, Code */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[13px] font-black text-blue-600 tracking-tight uppercase flex-1 leading-tight">{hospital.hospitalName}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-black text-amber-700">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {hospital.rating || '4.8'}
            </div>
            {hospital.hospitalCode && (
              <div className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest">
                {hospital.hospitalCode}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Departments */}
        <div className="flex flex-wrap gap-1">
          {departments.length > 0 ? (
            <>
              {departments.slice(0, 5).map((dept: string, i: number) => (
                <span key={i} className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${deptColors[i % deptColors.length]}`}>
                  {dept}
                </span>
              ))}
              {departments.length > 5 && (
                <span className="px-1.5 py-0.5 text-blue-600 text-[8px] font-black uppercase tracking-wider">
                  + View More
                </span>
              )}
            </>
          ) : (
            <span className="text-[9px] font-black text-slate-400 uppercase italic">Not Available</span>
          )}
        </div>

        {/* ROW 3: Contact */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {displayPhone !== 'Phone Not Given' ? (
            <a href={`tel:${displayPhone}`} className="flex items-center gap-1 text-blue-600">
              <Phone className="w-3 h-3" />
              <span className="text-[10px] font-black underline underline-offset-2">{displayPhone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <Phone className="w-3 h-3" />
              <span className="text-[10px] font-black">{displayPhone}</span>
            </div>
          )}
          
          {displayEmail !== 'Email Not Given' ? (
            <a href={`mailto:${displayEmail}`} className="flex items-center gap-1 text-rose-500">
              <Mail className="w-3 h-3" />
              <span className="text-[10px] font-black underline underline-offset-2">{displayEmail}</span>
            </a>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <Mail className="w-3 h-3" />
              <span className="text-[10px] font-black">{displayEmail}</span>
            </div>
          )}

          {displayPhone !== 'Phone Not Given' && (
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-600">
              <MessageSquare className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase">WhatsApp</span>
            </a>
          )}
        </div>

        {/* ROW 4: Address */}
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[10px] font-black text-slate-700 leading-snug">
            {displayAddress}
          </p>
        </div>

        {/* ROW 5: Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
          {displayPhone !== 'Phone Not Given' && (
            <a href={`tel:${displayPhone}`} className="flex-1">
              <Button variant="outline" className="w-full h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0b6b4f] border-[#0b6b4f] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Call Now
              </Button>
            </a>
          )}
          <Button 
            onClick={getDirections}
            className="flex-1 bg-[#0b6b4f] hover:bg-[#08523c] text-white font-black text-[10px] uppercase tracking-widest h-9 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 justify-center"
          >
            Get Directions
          </Button>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden sm:flex p-5 flex-col gap-4">
        {/* HEADER AREA */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-[17px] font-black text-blue-600 tracking-tight leading-tight uppercase truncate">{hospital.hospitalName}</h3>
            {hospital.hospitalCode && (
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black tracking-wider border border-emerald-100">
                {hospital.hospitalCode}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-xl text-[11px] font-black text-amber-700 border border-amber-100 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {hospital.rating || '4.8'}
            </div>
          </div>
        </div>

        {/* DEPARTMENTS CHIPS */}
        <div className="flex flex-wrap gap-2">
          {departments.length > 0 ? (
            <>
              {departments.slice(0, 6).map((dept: string, i: number) => (
                <span key={i} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${deptColors[i % deptColors.length]}`}>
                  {dept}
                </span>
              ))}
              {departments.length > 6 && (
                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                  + View More
                </span>
              )}
            </>
          ) : (
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Not Available</p>
          )}
        </div>

        {/* CONTACT ROW */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
          {displayPhone !== 'Phone Not Given' ? (
            <a href={`tel:${displayPhone}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-black tracking-tight">{displayPhone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black tracking-tight">{displayPhone}</span>
            </div>
          )}

          {displayEmail !== 'Email Not Given' ? (
            <a href={`mailto:${displayEmail}`} className="flex items-center gap-2 text-slate-600 hover:text-rose-600 transition-colors">
              <Mail className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-[11px] font-black lowercase truncate max-w-[150px]">{displayEmail}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black lowercase truncate">{displayEmail}</span>
            </div>
          )}

          {displayPhone !== 'Phone Not Given' && (
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black uppercase tracking-tight">WhatsApp</span>
            </a>
          )}
        </div>

        {/* ADDRESS & CTA */}
        <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] font-black text-slate-600 leading-relaxed">
                {displayAddress}
              </p>
           </div>
           
           <div className="flex items-center gap-2 mt-2 sm:mt-0">
             {displayPhone !== 'Phone Not Given' && (
               <a href={`tel:${displayPhone}`}>
                 <Button variant="outline" className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0b6b4f] border-[#0b6b4f] hover:bg-emerald-50 flex items-center gap-2">
                   <Phone className="w-3.5 h-3.5" /> Call Now
                 </Button>
               </a>
             )}
             <Button 
              onClick={getDirections}
              className="bg-[#0b6b4f] hover:bg-[#08523c] text-white font-black text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2 justify-center"
             >
               Get Directions <ArrowRight className="w-3.5 h-3.5" />
             </Button>
           </div>
        </div>
      </div>
    </Card>
  );
};


export default function BookDoctor({ user, userCases, onBack, t, preSelectedCaseId, initialTab }: BookDoctorProps & { initialTab?: 'find' | 'hospitals' | 'history' }) {
  const [activeTab, setActiveTab] = useState<'find' | 'hospitals' | 'history'>(initialTab || 'find');
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [allHospitals, setAllHospitals] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(preSelectedCaseId || '');
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpModalInitialView, setFollowUpModalInitialView] = useState<'options' | 'all-cases'>('all-cases');
  const [preSelectedCaseForFollowUp, setPreSelectedCaseForFollowUp] = useState<string | null>(null);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);

  // Booking Modal States
  const [selectedDoctor, setSelectedDoctor] = useState<UserProfile | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [viewingSession, setViewingSession] = useState<{ caseItem: any, session: any, index: number } | null>(null);
  const [consultationType, setConsultationType] = useState<'Online' | 'Offline'>('Online');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<'All' | 'Online' | 'Offline'>('All');
  const [expFilter, setExpFilter] = useState('All');
  const [feeFilter, setFeeFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState(t.all || 'All');
  const [hospitalFilter, setHospitalFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [activeSearchModal, setActiveSearchModal] = useState<{
    isOpen: boolean;
    type: 'City' | 'Hospital';
    options: string[];
    value: string;
    placeholder: string;
    icon: any;
  }>({
    isOpen: false,
    type: 'City',
    options: [],
    value: '',
    placeholder: '',
    icon: null
  });
  const [modalSearch, setModalSearch] = useState('');

  // Prevent scroll when any modal is open
  useEffect(() => {
    const anyOpen = selectedDoctor || selectedHospital || activeSearchModal.isOpen;
    document.body.style.overflow = anyOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedDoctor, selectedHospital, activeSearchModal.isOpen]);

  useEffect(() => {
    const doctorsRef = collection(db, 'doctors');
    const unsubscribeDoctors = onSnapshot(doctorsRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
      setDoctors(docs);
    });

    const unsubscribeHospitals = onSnapshot(collection(db, 'hospitals'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllHospitals(docs);
    });

    const q = query(collection(db, 'appointmentRequests'), where('patientId', '==', user.uid));
    const unsubscribeAppointments = onSnapshot(q, (snapshot) => {
      let allBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allBookings.sort((a, b) => {
        const timeA = a.dateTime?.seconds || (a.dateTime instanceof Date ? Math.floor(a.dateTime.getTime()/1000) : 0);
        const timeB = b.dateTime?.seconds || (b.dateTime instanceof Date ? Math.floor(b.dateTime.getTime()/1000) : 0);
        return timeB - timeA;
      });
      setAppointments(allBookings as Appointment[]);
    });

    return () => {
      unsubscribeDoctors();
      unsubscribeHospitals();
      unsubscribeAppointments();
    };
  }, [user.uid]);

  useEffect(() => {
    if (preSelectedCaseId) {
      setSelectedCaseId(preSelectedCaseId);
    }
  }, [preSelectedCaseId]);

  const confirmBooking = async () => {
    if (!selectedDoctor) return;
    if (!selectedCaseId) {
      setShowCreateCaseModal(true);
      return;
    }

    // Check if doctor is on leave or busy
    if (selectedDoctor.status === 'On Leave' || selectedDoctor.status === 'Emergency' || selectedDoctor.status === 'In Surgery') {
      toast.error(`Doctor is currently ${selectedDoctor.status.toLowerCase()}. Please check back later.`);
      return;
    }

    const doctor = selectedDoctor;
    const targetCase = userCases.find(c => c.caseId === selectedCaseId);
    if (!targetCase) {
      toast.error('Could not find the selected Case ID. Please re-select.');
      return;
    }

    // Defensive check to avoid "undefined" error in Firestore
    const newBooking = {
      bookingId: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
      doctorId: doctor.uid || 'N/A',
      doctorName: doctor.fullName || 'Doctor',
      doctorSpecialty: doctor.specialization || 'General',
      type: consultationType || 'Online',
      status: 'Pending',
      dateTime: new Date(),
      revenue: doctor.consultationFee || 500,
      symptoms: targetCase.symptoms || 'Not specified',
      createdAt: new Date()
    };

    try {
      // Robustly identify the case document ID
      const caseDocId = targetCase.id || targetCase.caseId || selectedCaseId;
      if (!caseDocId) throw new Error("Missing Case ID");

      // Update the case document with the new appointment in the array
      await updateDoc(doc(db, 'patients', user.uid, 'cases', caseDocId), {
        status: 'active',
        'healthJourney.bookDoctor': true,
        appointments: arrayUnion(newBooking)
      });

      const apptData = {
        ...newBooking,
        patientId: user.uid,
        patientName: user.fullName,
        patientPhone: user.phoneNumber || '',
        patientLocation: user.address || '',
        caseId: selectedCaseId,
        caseName: targetCase.caseName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'Pending'
      };

      // Also save to the top-level appointmentRequests collection for global visibility
      await setDoc(doc(db, 'appointmentRequests', newBooking.bookingId), apptData);

      toast.success(t.apptBooked || "Appointment booked successfully!");
      setSelectedDoctor(null);
      onBack();
    } catch (e: any) {
      console.error("Booking Error:", e);
      toast.error('Failed to book appointment: ' + (e.message || 'Firestore Error'));
    }
  };

  const handleDeleteFollowUp = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this follow-up?')) return;
    try {
        await deleteDoc(doc(db, 'appointmentRequests', bookingId));
        toast.success(t.followUpDeleted || 'Follow-up deleted');
    } catch (e: any) {
      toast.error('Failed to delete follow-up');
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (doc.fullName || '').toLowerCase().includes(searchLower) || 
                            (doc.specialization && doc.specialization.toLowerCase().includes(searchLower)) ||
                            (doc.hospitalName && doc.hospitalName.toLowerCase().includes(searchLower)) ||
                            (doc.focus && doc.focus.toLowerCase().includes(searchLower));

      const matchesMode = modeFilter === 'All' || doc.mode === modeFilter || doc.mode === 'Both';
      
      let matchesExp = true;
      const exp = parseInt(doc.experience || '0', 10);
      if (expFilter === '0-5') matchesExp = exp <= 5;
      else if (expFilter === '5-10') matchesExp = exp > 5 && exp <= 10;
      else if (expFilter === '10+') matchesExp = exp > 10;

      let matchesFee = true;
      const fee = parseInt(doc.consultationFee?.toString() || '500', 10);
      if (feeFilter === '0-500') matchesFee = fee <= 500;
      else if (feeFilter === '500-1000') matchesFee = fee > 500 && fee <= 1000;
      else if (feeFilter === '1000+') matchesFee = fee > 1000;

      const matchesCity = cityFilter === 'All' || doc.city === cityFilter;
      const matchesHospital = hospitalFilter === 'All' || doc.hospitalName === hospitalFilter;

      let matchesRating = true;
      const rating = parseFloat(doc.rating?.toString() || '4.5');
      if (ratingFilter === '4+') matchesRating = rating >= 4.0;
      else if (ratingFilter === '3+') matchesRating = rating >= 3.0;

      return matchesSearch && matchesMode && matchesExp && matchesFee && matchesCity && matchesHospital && matchesRating;
    });
  }, [doctors, searchTerm, modeFilter, expFilter, feeFilter, cityFilter, hospitalFilter, ratingFilter]);

  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set([
      ...doctors.map(d => d.city),
      ...allHospitals.map(h => h.city || h.Location)
    ].filter(Boolean))).sort();
    return [t.all || 'All', ...uniqueCities];
  }, [doctors, allHospitals, t.all]);

  const hospitals = useMemo(() => {
    const uniqueHospitals = Array.from(new Set([
      ...doctors.map(d => d.hospitalName),
      ...allHospitals.map(h => h.hospitalName)
    ].filter(Boolean))).sort();
    return [t.all || 'All', ...uniqueHospitals];
  }, [doctors, allHospitals, t.all]);

  return (
    <>
    <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-0 bg-transparent overflow-x-hidden">
      <div className="flex-shrink-0 z-50 space-y-1 pb-3 sticky top-0 bg-[#F0F9F4]/98 backdrop-blur-md w-full overflow-x-hidden border-b border-emerald-50">
        <div className="pt-0 px-0">
          <div className="flex p-1 bg-white shadow-sm border-b border-emerald-50 w-full">
            <button
              onClick={() => setActiveTab('find')}
              className={`flex-1 py-2.5 px-1 rounded-xl font-black text-[10px] sm:text-[12px] uppercase tracking-tighter whitespace-nowrap transition-all duration-300 ${
                activeTab === 'find' ? 'bg-[#0B6B4F] text-white shadow-md' : 'text-slate-900 hover:text-[#0B6B4F]'
              }`}
            >
              {t.findDoctor || "Find Doctor"}
            </button>
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`flex-1 py-2.5 px-1 rounded-xl font-black text-[10px] sm:text-[12px] uppercase tracking-tighter whitespace-nowrap transition-all duration-300 ${
                activeTab === 'hospitals' ? 'bg-[#0B6B4F] text-white shadow-md' : 'text-slate-900 hover:text-[#0B6B4F]'
              }`}
            >
              Hospitals
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2.5 px-1 rounded-xl font-black text-[10px] sm:text-[12px] capitalize tracking-tighter whitespace-nowrap transition-all duration-300 ${
                activeTab === 'history' ? 'bg-[#0B6B4F] text-white shadow-md' : 'text-slate-900 hover:text-[#0B6B4F]'
              }`}
            >
              Appointment History
            </button>
          </div>
        </div>

        {activeTab === 'find' && (
          <div className="space-y-4">
            <div className="flex gap-2 max-w-3xl mx-auto w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input 
                  placeholder={t.searchDoctor || "Search..."} 
                  className="h-11 sm:h-14 pl-10 bg-white border-gray-100 rounded-[12px] font-medium text-slate-700 placeholder:text-gray-300 shadow-sm focus:ring-[#0b6b4f]/10 focus:border-[#0b6b4f] text-[11px] sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`h-11 sm:h-14 w-11 sm:w-14 rounded-[12px] border flex items-center justify-center transition-all shrink-0 ${
                  showFilters ? 'bg-[#0b6b4f] border-[#0b6b4f] text-white' : 'bg-white border-gray-100 text-[#0b6b4f] hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Side-by-Side Quick Filters */}
            <div className="flex gap-2 max-w-3xl mx-auto w-full px-0.5">
               <div className="flex-1 min-w-0">
                  <CustomSearchableSelect 
                    options={cities} 
                    value={cityFilter} 
                    onChange={setCityFilter} 
                    placeholder={t.allLocations || "All Locations"}
                    icon={<MapPin className="w-4 h-4 text-emerald-500" />}
                    onOpen={() => setActiveSearchModal({
                      isOpen: true,
                      type: 'City',
                      options: cities,
                      value: cityFilter,
                      placeholder: t.allLocations || "All Locations",
                      icon: <MapPin className="w-5 h-5 text-emerald-500" />
                    })}
                  />
               </div>
               <div className="flex-1 min-w-0">
                  <CustomSearchableSelect 
                    options={hospitals} 
                    value={hospitalFilter === 'All' ? 'All Hospitals' : hospitalFilter} 
                    onChange={(val) => setHospitalFilter(val === 'All Hospitals' ? 'All' : val)} 
                    placeholder={t.allHospitals || "All Hospitals"}
                    icon={<Building2 className="w-4 h-4 text-blue-500" />}
                    onOpen={() => setActiveSearchModal({
                      isOpen: true,
                      type: 'Hospital',
                      options: hospitals,
                      value: hospitalFilter === 'All' ? 'All Hospitals' : hospitalFilter,
                      placeholder: t.allHospitals || "All Hospitals",
                      icon: <Building2 className="w-5 h-5 text-blue-500" />
                    })}
                  />
               </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="relative"
                >
                  <div className="bg-white/80 backdrop-blur-xl border-2 border-emerald-100/50 rounded-[24px] p-6 shadow-[0_20px_50px_rgba(16,185,129,0.1)] mt-4 mb-4 relative overflow-hidden">
                    {/* PREMIUM ACCENT */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                          <SlidersHorizontal className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{t.advancedFilters}</h4>
                      </div>
                      <button 
                        onClick={() => { setModeFilter('All'); setExpFilter('All'); setFeeFilter('All'); setCityFilter('All'); setHospitalFilter('All'); setSearchTerm(''); }}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
                      >
                        {t.resetAll || "Reset All"}
                      </button>
                    </div>

                    <div className="max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-2">
                        {/* MODE FILTER */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mode</p>
                          <div className="relative group">
                            <select className="w-full h-12 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-xs uppercase tracking-wider appearance-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 outline-none transition-all cursor-pointer" value={modeFilter} onChange={(e) => setModeFilter(e.target.value as any)}>
                              <option value="All">{t.allModes || "All Modes"}</option>
                              <option value="Online">{t.onlineOnly || "Online Only"}</option>
                              <option value="Offline">{t.clinicVisit || "Clinic Visit"}</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* EXPERIENCE FILTER */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Experience</p>
                          <div className="relative group">
                            <select className="w-full h-12 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-xs uppercase tracking-wider appearance-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 outline-none transition-all cursor-pointer" value={expFilter} onChange={(e) => setExpFilter(e.target.value)}>
                              <option value="All">{t.anyExp || "Any Experience"}</option>
                              <option value="0-5">0-5 Years</option>
                              <option value="5-10">5-10 Years</option>
                              <option value="10+">{t.expert10Plus || "10+ Years Expert"}</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* FEE FILTER */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Budget</p>
                          <div className="relative group">
                            <select className="w-full h-12 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-xs uppercase tracking-wider appearance-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 outline-none transition-all cursor-pointer" value={feeFilter} onChange={(e) => setFeeFilter(e.target.value)}>
                              <option value="All">{t.anyBudget || "Any Budget"}</option>
                              <option value="0-500">Under ₹500</option>
                              <option value="500-1000">₹500 - ₹1000</option>
                              <option value="1000+">Premium (₹1000+)</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* OTHER FILTERS in advanced section */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rating</p>
                          <div className="relative group">
                            <select className="w-full h-12 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-xs uppercase tracking-wider appearance-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 outline-none transition-all cursor-pointer" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                              <option value="All">All Ratings</option>
                              <option value="4+">4.0+ Stars</option>
                              <option value="3+">3.0+ Stars</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-end gap-3 pt-6 sm:pt-0">
                          <Button 
                            onClick={() => setShowFilters(false)} 
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black h-12 rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all active:scale-95 border-none"
                          >
                            {t.showResults || "Show Results"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 pt-1 pb-20">
        {activeTab === 'find' && (
          <div className="grid grid-cols-1 gap-4 pt-4">
            {/* CONDITIONAL HOSPITAL CARD - Simplified for density */}
            {(() => {
               if (hospitalFilter !== 'All') {
                  const h = allHospitals.find(h => h.hospitalName === hospitalFilter);
                  if (h) return <HospitalCard hospital={h} t={t} />;
               }
               return null;
            })()}

            {filteredDoctors.length === 0 ? (
               <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                     <Search className="w-6 h-6 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{t.noResultsFound || "No results found"}</h3>
                  <p className="text-gray-400 text-[10px] mt-1 font-black uppercase tracking-widest">Adjust filters</p>
               </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                  {filteredDoctors.map((doc) => {
                    const doctorStatus = doc.status || 'Available';
                    const todayIdx = (new Date().getDay() + 6) % 7;
                    const isAvailableDay = doc.availableDays?.includes(todayIdx);
                    const isActuallyAvailable = isAvailableDay && (doctorStatus === 'Available');
                    
                    return (
                      <Card key={doc.uid} className="bg-white border border-gray-100 rounded-[12px] overflow-hidden shadow-sm hover:shadow-md h-full flex flex-col">
                        <div className="p-3 flex-1 flex flex-col">
                          <div className="flex gap-3">
                            <div className="w-14 h-14 bg-[#0b6b4f] rounded-[8px] flex items-center justify-center shrink-0 text-white font-black text-2xl shadow-inner">
                              {doc.profileImage ? (
                                <img src={doc.profileImage} alt={doc.fullName} className="w-full h-full object-cover rounded-[8px]" />
                              ) : (
                                doc.fullName?.charAt(0) || 'D'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                 <h3 className="font-black text-[14px] text-slate-900 truncate">{doc.fullName}</h3>
                                 <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-[6px] text-[10px] font-black text-amber-700 shrink-0">
                                   <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {doc.rating || '4.9'}
                                 </div>
                              </div>
                              <p className="text-[11px] text-slate-700 truncate mt-0.5 font-bold">{doc.specialization || 'Internal Medicine'}</p>
                              <div 
                                className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 truncate font-black cursor-pointer hover:underline hover:text-blue-700 active:scale-95 transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (doc.hospitalLinkType === 'Hospital Attached Doctor' || doc.hospitalId) {
                                    const hosp = allHospitals.find(h => h.id === doc.hospitalId) || allHospitals.find(h => h.hospitalName === doc.hospitalName);
                                    if (hosp) setSelectedHospital(hosp);
                                    else toast.error('Hospital details not found.');
                                  } else {
                                    toast.info('This doctor is independent.');
                                  }
                                }}
                              >
                                 <Building2 className="w-3 h-3 shrink-0" /> <span className="truncate underline underline-offset-2">{doc.hospitalName || 'Independent'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                 <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-[6px] text-[9px] font-black flex items-center gap-1 border border-blue-100/50">
                                    <Clock className="w-2.5 h-2.5" /> {doc.experience || '12'} years
                                 </span>
                                 <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-[6px] text-[9px] font-black flex items-center gap-1 border border-emerald-100/50">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> 1500+ patients
                                 </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-auto pt-3">
                            <div className="bg-slate-50 rounded-[8px] p-2.5 flex justify-between items-center border border-slate-100">
                               <div>
                                  <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Consultation Fee</p>
                                  <p className="text-[16px] font-black text-[#0b6b4f] leading-none mt-1">₹{doc.consultationFee || 400}</p>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="text-right pr-3 border-r border-slate-200 hidden sm:block">
                                     <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Next Available</p>
                                     <p className="text-[10px] font-black text-slate-800 mt-0.5 flex items-center justify-end gap-1"><Clock className="w-3 h-3"/>{isActuallyAvailable ? 'Today' : 'Tomorrow'}</p>
                                  </div>
                                  <button 
                                     onClick={() => {
                                       if (!isActuallyAvailable) { toast.error(!isAvailableDay ? "Doctor is not scheduled for today." : `Doctor is currently ${doctorStatus.toLowerCase()}.`); } 
                                       else { setSelectedDoctor(doc); }
                                     }}
                                     className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${isActuallyAvailable ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                  >
                                     {t.bookAppointment || "Book"}
                                  </button>
                               </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
            )}
          </div>
        )}
        {activeTab === 'hospitals' && (
          <div className="space-y-0">
            {/* TOP STICKY BAR - SEARCH & FILTERS */}
            <div className="sticky top-[72px] z-40 bg-[#F0F9F4]/98 backdrop-blur-md pt-0 pb-1 px-2 space-y-0.5 border-b-2 border-slate-200">
               {/* SEARCH BAR AT TOP */}
               <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-700 z-10" />
                  <Input 
                    placeholder="Search Hospitals..." 
                    className="h-10 pl-9 bg-white border-2 border-slate-300 rounded-lg font-black text-slate-800 placeholder:text-slate-400 shadow-none focus:ring-0 focus:border-emerald-600 text-[11px] uppercase tracking-tighter"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>

               {/* SIDE-BY-SIDE HORIZONTAL FILTERS */}
               <div className="flex gap-1 w-full">
                  <div className="flex-1">
                     <button 
                       type="button"
                       onClick={() => setActiveSearchModal({
                         isOpen: true,
                         type: 'City',
                         options: cities,
                         value: cityFilter,
                         placeholder: "Search City",
                         icon: <MapPin className="w-5 h-5 text-emerald-600" />
                       })}
                       className="w-full h-10 px-2 rounded-lg border-2 border-slate-300 bg-white flex items-center justify-between group active:scale-95 transition-all"
                     >
                       <div className="flex items-center gap-1.5 truncate">
                         <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                         <span className="truncate font-black text-[10px] uppercase tracking-tighter text-slate-800">
                           {cityFilter === 'All' ? 'Location' : cityFilter}
                         </span>
                       </div>
                       <ChevronDown className="w-3 h-3 text-slate-400" />
                     </button>
                  </div>
                  <div className="flex-1">
                     <div className="relative">
                        <select 
                          className="w-full h-10 pl-8 pr-6 rounded-lg border-2 border-slate-300 bg-white font-black text-[10px] uppercase tracking-tighter appearance-none outline-none cursor-pointer text-slate-800"
                          value={hospitalFilter} 
                          onChange={(e) => setHospitalFilter(e.target.value)}
                        >
                          <option value="All">Departments</option>
                          {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Dermatology'].sort().map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-600" />
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 gap-1 pb-24 pt-1">
              {allHospitals.length === 0 ? (
               <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                     <Building2 className="w-6 h-6 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No Hospitals Linked</h3>
                  <p className="text-gray-400 text-[10px] mt-1 font-black uppercase tracking-widest">Master Directory is empty</p>
               </div>
            ) : (
               allHospitals
                .filter(h => {
                  const s = searchTerm.toLowerCase();
                  const matchesSearch = (h.hospitalName || '').toLowerCase().includes(s) || (h.address || '').toLowerCase().includes(s);
                  const matchesCity = cityFilter === 'All' || h.city === cityFilter || h.district === cityFilter;
                  return matchesSearch && matchesCity;
                })
                .map((h) => <HospitalCard key={h.id} hospital={h} t={t} />)
            )}
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="space-y-6 pt-4 pb-24">
            {userCases.length === 0 ? (
               <div className="py-24 text-center">
                  <div className="w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                     <FileText className="w-10 h-10 text-emerald-500 opacity-40" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t.noAppointmentHistory || "No Appointment history"}</h3>
                  <p className="text-slate-400 text-sm mt-2 font-black uppercase tracking-widest opacity-60">Your journey will appear here</p>
               </div>
            ) : (
               userCases.map((c, index) => {
                 // Merge internal appointments array with external appointmentRequests for this case
                 const internalAppts = c.appointments || [];
                 const externalAppts = appointments.filter(a => a.caseId === c.caseId);
                 
                 // Unique by bookingId or id
                 const allApptsMap = new Map();
                 [...internalAppts, ...externalAppts].forEach(a => {
                    const id = a.bookingId || a.id;
                    if (id) allApptsMap.set(id, a);
                 });

                 const caseAppointments = Array.from(allApptsMap.values()).sort((a,b) => {
                    const timeA = a.dateTime?.seconds || (a.dateTime instanceof Date ? Math.floor(a.dateTime.getTime()/1000) : 0);
                    const timeB = b.dateTime?.seconds || (b.dateTime instanceof Date ? Math.floor(b.dateTime.getTime()/1000) : 0);
                    return timeA - timeB;
                 });
                 const isExpanded = expandedCase === c.id;
                 const firstVisit = caseAppointments[0];
                 
                 // Mock scientific names based on common cases
                 const getScientificName = (name: string) => {
                    const mapping: Record<string, string> = {
                       'Typhoid Fever': '(Enteric Fever)',
                       'Liver Cirrhosis': '(Hepatic Cirrhosis)',
                       'Seasonal Flu': '(Influenza)',
                       'Knee Pain': '(Arthralgia)',
                       'Post-viral fatigue': '(Myocarditis)'
                    };
                    return mapping[name] || '';
                 };

                 return (
                    <div key={c.id} className="space-y-4">
                      {/* CASE CARD */}
                      <Card className={`border ${isExpanded ? 'border-emerald-500/20' : 'border-gray-100'} bg-white rounded-[24px] overflow-hidden shadow-sm transition-all duration-300`}>
                        <div className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => setExpandedCase(isExpanded ? null : c.id)}>
                          <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                   <h3 className="text-[20px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                                      <span className="text-blue-600">{index + 1}.</span> {c.caseName}
                                   </h3>
                                   <button className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-blue-100">
                                      <Sparkles className="w-3 h-3" /> All Follow-ups
                                   </button>
                                </div>
                                <p className="text-slate-400 text-[12px] font-bold mt-0.5">{getScientificName(c.caseName)}</p>
                                
                                <div className="mt-4 space-y-1">
                                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                      First visit: <span className="text-slate-900">{firstVisit?.dateTime?.toDate?.().toLocaleDateString() || '01 Aug, 2024'}</span>
                                   </p>
                                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                      Doctor: <span className="text-slate-900">Dr. {firstVisit?.doctorName || 'Anjali'} ({firstVisit?.doctorSpecialty || 'General Physician'})</span>
                                   </p>
                                </div>
                             </div>
                             <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-emerald-500 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                <ChevronDown className="w-5 h-5" />
                             </div>
                          </div>
                        </div>
                      </Card>

                      {/* FOLLOW-UP LIST */}
                      <AnimatePresence>
                        {isExpanded && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-1 space-y-4 pt-2">
                                 {/* ADD FOLLOW-UP ACTION */}
                                 <div className="flex justify-center mb-6">
                                    <button 
                                      onClick={() => { 
                                        setPreSelectedCaseForFollowUp(c.caseId);
                                        setFollowUpModalInitialView('all-cases');
                                        setShowFollowUpModal(true);
                                      }}
                                      className="h-12 px-8 bg-[#0b6b4f] text-white rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 flex items-center gap-2 active:scale-95 transition-all"
                                    >
                                       <Plus className="w-4 h-4" /> Add Follow-up
                                    </button>
                                 </div>

                                 {caseAppointments.length === 0 ? (
                                    <div className="text-center py-10 bg-white/50 rounded-[32px] border-2 border-dashed border-slate-200">
                                       <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No encounter records found</p>
                                    </div>
                                 ) : (
                                   caseAppointments.map((app, ai) => {
                                      return (
                                        <div key={app.id || ai} className="bg-white rounded-[32px] p-6 border-2 border-slate-100 shadow-sm space-y-6 hover:border-[#0b6b4f]/20 transition-all">
                                           <div className="flex justify-between items-start">
                                              <div className="flex-1">
                                                 <h4 className="text-[18px] font-black text-slate-900 tracking-tight mb-2">
                                                   <span className="text-blue-600">{index + 1}.{ai + 1})</span> {(() => {
                                                     const num = ai + 1;
                                                     const ord = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
                                                     return `${num}${ord}`;
                                                   })()} Follow-up
                                                 </h4>
                                                 <p className="text-[13px] font-black text-slate-700 tracking-tight">
                                                   Dr. {app.doctorName} • {(() => {
                                                     const d = app.dateTime?.toDate?.() || (app.dateTime?.seconds ? new Date(app.dateTime.seconds * 1000) : new Date());
                                                     return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                   })()}
                                                 </p>
                                              </div>
                                              
                                              {/* STATUS BADGE - TOP RIGHT */}
                                              <div className="shrink-0 pt-1">
                                                <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-sm ${
                                                   app.status === 'Completed' 
                                                     ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                     : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                   <CheckCircle2 className={`w-3.5 h-3.5 ${app.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                   <span className="text-[9px] font-black tracking-widest">{app.status || 'Pending'}</span>
                                                </div>
                                              </div>
                                           </div>

                                           {/* ACTION BUTTONS GRID */}
                                           <div className="grid grid-cols-2 gap-3 pt-2">
                                              <button 
                                                onClick={() => setViewingSession({ caseItem: c, session: app, index: ai })}
                                                className="h-12 bg-[#0b6b4f] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                              >
                                                 <Eye className="w-4 h-4" /> View Details
                                              </button>
                                              <button 
                                                onClick={() => toast.info("Preparing report download...")}
                                                className="h-12 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                                              >
                                                 <Download className="w-4 h-4" /> Download
                                              </button>
                                           </div>
                                        </div>
                                      );
                                    })
                                 )}

                                 {/* RECOVERY CARD REMOVED */}
                              </div>
                           </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                 );
               })
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeSearchModal.isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setActiveSearchModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[28px] shadow-[0_30px_70px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[60vh] border border-slate-100"
            >
              {/* Header Row */}
              <div className="px-6 pt-4 pb-0 flex items-center justify-between bg-white relative z-10">
                 <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.1em]">{activeSearchModal.placeholder}</h3>
                 <button 
                  onClick={() => setActiveSearchModal(prev => ({ ...prev, isOpen: false }))} 
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all active:scale-90"
                 >
                    <X className="w-4 h-4" />
                 </button>
              </div>

              {/* Search Box - Visible Border */}
              <div className="px-5 py-2">
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                   <input 
                     className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-xl text-[11px] font-bold uppercase tracking-wider focus:outline-none transition-all" 
                     placeholder={t.typeToSearch || "Search..."}
                     value={modalSearch}
                     onChange={(e) => setModalSearch(e.target.value)}
                     autoFocus
                   />
                </div>
              </div>

              {/* List Spacing - Tight Stacked List */}
              <div className="overflow-y-auto no-scrollbar flex-1 px-3 pb-4 pt-1">
                <div className="space-y-0">
                  {activeSearchModal.options.filter(o => o.toLowerCase().includes(modalSearch.toLowerCase())).length > 0 ? (
                    activeSearchModal.options.filter(o => o.toLowerCase().includes(modalSearch.toLowerCase())).map((opt: string) => {
                      const isSelected = activeSearchModal.value === opt;
                      const isCity = activeSearchModal.type === 'City';
                      
                      return (
                        <button 
                          key={opt}
                          onClick={() => { 
                            if (activeSearchModal.type === 'City') setCityFilter(opt);
                            else setHospitalFilter(opt === 'All Hospitals' ? 'All' : opt);
                            setActiveSearchModal(prev => ({ ...prev, isOpen: false }));
                            setModalSearch(''); 
                          }}
                          className={`w-full text-left px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.05em] transition-all flex items-center justify-between group active:scale-98 ${
                            isSelected 
                              ? (isCity ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700')
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{opt}</span>
                          {isSelected && <CheckCircle2 className={`w-4 h-4 ${isCity ? 'text-blue-500' : 'text-emerald-500'}`} />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
                       <Search className="w-5 h-5 text-slate-200" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.noResultsFound || "No results"}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoctor(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.98, opacity: 0, y: 10 }} 
              onClick={(e) => e.stopPropagation()} 
              className="relative bg-white rounded-[32px] p-6 max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden"
            >
              <button onClick={() => setSelectedDoctor(null)} className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-full transition-all active:scale-90"><X className="w-4 h-4" /></button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                   <UserCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{t.bookAppointment || "Book"} {selectedDoctor.fullName}</h3>
                <p className="text-emerald-600 font-bold mt-1 uppercase text-[9px] tracking-[0.1em]">{selectedDoctor.specialization}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                   <div className="flex items-center justify-between px-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Patient Case</p>
                      <button 
                        onClick={() => setShowCreateCaseModal(true)}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-2.5 h-2.5" /> {t.createNew || "Create New"}
                      </button>
                   </div>
                   <select 
                    value={selectedCaseId} 
                    onChange={(e) => setSelectedCaseId(e.target.value)} 
                    className="w-full h-11 bg-slate-50 border border-slate-100 focus:border-emerald-500/30 rounded-xl px-4 font-bold text-[11px] outline-none transition-all"
                   >
                     <option value="">{t.selectHealthCase || "Select Health Case"}</option>
                     {userCases.filter(c => c.status === 'active').map((c) => <option key={c.id} value={c.caseId}>{c.caseId} • {c.caseName}</option>)}
                   </select>
                </div>

                <div className="space-y-1.5">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Mode</p>
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => setConsultationType('Online')} className={`h-20 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 ${consultationType === 'Online' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-emerald-100'}`}>
                        <Video className={`w-4 h-4 ${consultationType === 'Online' ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span className={`font-black text-[9px] uppercase tracking-widest ${consultationType === 'Online' ? 'text-emerald-700' : 'text-slate-400'}`}>{t.online || "Online"}</span>
                     </button>
                     <button onClick={() => setConsultationType('Offline')} className={`h-20 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 ${consultationType === 'Offline' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-emerald-100'}`}>
                        <MapPin className={`w-4 h-4 ${consultationType === 'Offline' ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span className={`font-black text-[9px] uppercase tracking-widest ${consultationType === 'Offline' ? 'text-emerald-700' : 'text-slate-400'}`}>{t.inPerson || "In-Person"}</span>
                     </button>
                   </div>
                </div>
              </div>

              <button 
                onClick={confirmBooking} 
                className="w-full h-12 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
              >
                 <ShieldCheck className="w-4 h-4" /> {t.confirm || "Confirm"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHospital && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHospital(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.98, opacity: 0, y: 10 }} 
              onClick={(e) => e.stopPropagation()} 
              className="relative bg-white rounded-[32px] p-6 max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden"
            >
              <button onClick={() => setSelectedHospital(null)} className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-full transition-all active:scale-90"><X className="w-4 h-4" /></button>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{selectedHospital.hospitalName}</h3>
                {selectedHospital.hospitalCode && (
                   <div className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black tracking-widest border border-emerald-100">
                      {selectedHospital.hospitalCode}
                   </div>
                )}
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.address || "Address"}</p>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                       {[selectedHospital.address, selectedHospital.district, selectedHospital.state, selectedHospital.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t.contact || "Contact"}</p>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{selectedHospital.phoneNumber || selectedHospital.phone || 'Phone Not Given'}</p>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed lowercase mt-0.5">{selectedHospital.email || 'Email Not Given'}</p>
                  </div>
                </div>

                {selectedHospital.departments && (
                   <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-start gap-3">
                     <Building2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                     <div className="flex-1 min-w-0">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Departments</p>
                       <div className="flex flex-wrap gap-1">
                          {(Array.isArray(selectedHospital.departments) ? selectedHospital.departments : selectedHospital.departments.split(',')).map((d: string, i: number) => (
                             <span key={i} className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[8px] font-black uppercase tracking-wider">{d.trim()}</span>
                          ))}
                       </div>
                     </div>
                   </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedHospital(null)}
                className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95"
              >
                {t.close || "Close"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingSession && (
          <SessionDetailsModal
            caseItem={viewingSession.caseItem}
            session={viewingSession.session}
            index={viewingSession.index}
            patientId={user.uid}
            onClose={() => setViewingSession(null)}
            onDelete={() => {}} // History deletion not allowed here for safety
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showFollowUpModal || showCreateCaseModal) && (
          <CreateCaseModal
            patientId={user.uid}
            existingCases={userCases as any}
            onClose={() => { setShowFollowUpModal(false); setShowCreateCaseModal(false); setPreSelectedCaseForFollowUp(null); }}
            onCaseCreated={(id) => { 
              setSelectedCaseId(id);
              setShowFollowUpModal(false); 
              setShowCreateCaseModal(false);
              setActiveTab('find');
              setPreSelectedCaseForFollowUp(null);
              toast.success("Health Journey active. Ready for booking.");
            }}
            initialView={showCreateCaseModal ? 'form' : (followUpModalInitialView === 'all-cases' ? 'all-cases' : 'options')}
            preSelectedCase={preSelectedCaseForFollowUp}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatDate = (ts: any) => {
  if (!ts) return 'Not Available';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : (ts instanceof Date ? ts : new Date(ts));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  const mm = m < 10 ? '0' + m : m;
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} | ${hh}:${mm} ${ampm}`;
};

/* ─── Session Details Modal ─────────────────────────────────────── */
function SessionDetailsModal({ caseItem, session, index, patientId, onClose, onDelete }: { caseItem: any, session: any, index: number, patientId: string, onClose: () => void, onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSession, setEditedSession] = useState({ ...session });

  const handleUpdate = async () => {
    toast.error('Update restricted in this view');
  };

  const MiniCard = ({ children, title, icon: Icon, color }: any) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-50">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color} text-white shadow-sm`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{title}</h4>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-[#F8FAFC] rounded-[2rem] border-[4px] border-white overflow-hidden shadow-2xl relative flex flex-col max-h-[96vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <FileText className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-0.5">Clinical Prescription</h3>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                 Report <span className="w-0.5 h-0.5 bg-emerald-300 rounded-full" /> {formatDate(session.completedAt || session.dateTime)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition-all hover:bg-rose-50 hover:text-rose-500">
              <X className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* High Density Content Grid */}
        <div id="prescription-content" className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* COMPLAINTS (WIDER) */}
            <div className="md:col-span-2">
              <MiniCard title="1. Symptoms" icon={Stethoscope} color="bg-blue-600">
                 <div className="bg-blue-50/20 rounded-xl p-3 border border-blue-50 min-h-[60px] flex items-center">
                   <p className="text-[12px] font-bold text-slate-700 leading-snug italic">
                     "{session.symptoms || 'None recorded'}"
                   </p>
                 </div>
              </MiniCard>
            </div>

            {/* VITALS (COMPACT) */}
            <MiniCard title="2. Vitals" icon={Activity} color="bg-rose-600">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'BP', value: session.vitals?.bp },
                  { label: 'SpO2', value: session.vitals?.oxygen },
                  { label: 'Wt', value: session.vitals?.weight },
                  { label: 'Ht', value: session.vitals?.height }
                ].map((vital) => (
                  <div key={vital.label} className="bg-slate-50/50 rounded-xl p-2 border border-slate-50 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">{vital.label}</p>
                    <p className="text-[11px] font-black text-slate-900">{vital.value || '--'}</p>
                  </div>
                ))}
              </div>
            </MiniCard>

            {/* CONSULTATION */}
            <MiniCard title="3. Consultation" icon={UserCircle} color="bg-emerald-600">
              <div className="bg-emerald-50/20 rounded-xl p-3 border border-emerald-50 space-y-2">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-emerald-600 uppercase mb-0.5">Physician</span>
                  <p className="text-[11px] font-black text-slate-900 truncate">Dr. {session.doctorName || 'Not Assigned'}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-emerald-600 uppercase mb-0.5">Time</span>
                  <p className="text-[9px] font-bold text-slate-500 truncate">{formatDate(session.completedAt || session.dateTime) || '--'}</p>
                </div>
              </div>
            </MiniCard>

            {/* DIAGNOSIS */}
            <MiniCard title="4. Diagnosis" icon={Activity} color="bg-indigo-600">
               <div className="bg-indigo-50/20 rounded-xl p-3 border border-indigo-50 h-full flex flex-col justify-center">
                  <p className="text-[12px] font-black text-indigo-900 uppercase tracking-tight">{session.diagnosis || 'Provisional'}</p>
               </div>
            </MiniCard>

            {/* FOLLOW UP */}
            <MiniCard title="5. Follow-up" icon={Calendar} color="bg-slate-900">
              <div className="bg-slate-900 rounded-xl p-3 text-white h-full flex flex-col justify-center text-center">
                <p className="text-[12px] font-black uppercase tracking-tight">
                  {session.nextFollowUpDate || 'TBD'}
                </p>
                <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mt-1">Reminder Set</p>
              </div>
            </MiniCard>

            {/* MEDICINES & DIAGNOSTICS (FULL WIDTH TABS STYLE) */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
               {/* MEDICINES */}
               <MiniCard title="6. Prescription" icon={Pill} color="bg-amber-600">
                 <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                   {session.medicines?.length > 0 ? session.medicines.map((med: any, i: number) => (
                     <div key={i} className="bg-white border border-amber-50 p-2 rounded-xl flex items-center justify-between group">
                       <div className="flex-1 min-w-0">
                         <h5 className="text-[10px] font-black text-slate-900 uppercase truncate">{med.name}</h5>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{med.dosage} • {med.food || 'After'} Food</p>
                       </div>
                       <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest">
                         {med.frequency?.morning ? '1' : '0'}-{med.frequency?.afternoon ? '1' : '0'}-{med.frequency?.night ? '1' : '0'}
                       </div>
                     </div>
                   )) : (
                     <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4">No meds prescribed</p>
                   )}
                 </div>
               </MiniCard>

               {/* DIAGNOSTICS */}
               <MiniCard title="7. Lab Tests" icon={FlaskConical} color="bg-purple-600">
                 <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                   {session.labRequests?.length > 0 ? session.labRequests.map((req: any, i: number) => (
                     <div key={i} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50">
                       <span className="text-[10px] font-black text-slate-800 uppercase truncate pr-2">{req.name || req.testName}</span>
                       <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[7px] font-black uppercase">Stat</span>
                     </div>
                   )) : (
                     <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4">No tests required</p>
                   )}
                 </div>
               </MiniCard>
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-5 py-4 bg-white border-t border-slate-100 flex flex-col gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => {
                toast.success("Downloading...");
                window.print();
              }}
              className="flex-1 h-12 bg-[#0b6b4f] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <FileText className="w-5 h-5" /> PDF
            </button>
            <button 
              onClick={() => toast.info("Downloading...")}
              className="flex-1 h-12 bg-white border border-slate-200 text-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download className="w-5 h-5" /> Image
            </button>
          </div>
          <p className="text-center text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] opacity-60">National Health Registry • v4.0</p>
        </div>
      </motion.div>
    </div>
  );
}
