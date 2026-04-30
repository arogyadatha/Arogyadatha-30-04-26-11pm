import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp, 
  Search,
  Clock,
  MoreVertical,
  Filter,
  Download,
  Settings as SettingsIcon,
  Video,
  MapPin,
  CheckCircle2,
  X,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  LogOut,
  Bell,
  Globe,
  Save,
  Moon,
  Edit2,
  Home,
  Building2,
  Star,
  AlertTriangle,
  ChevronLeft,
  Menu,
  User,
  FileText,
  Shield,
  History,
  Heart,
  Sparkles,
  Gavel,
  AlertCircle,
  Settings,
  UserCircle
} from 'lucide-react';

const DAY_MAP: Record<string, number> = { 'M': 0, 'T': 1, 'W': 2, 'Th': 3, 'F': 4, 'Sa': 5, 'Su': 6 };
import { db, auth } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function DoctorDashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppts: 0,
    thisWeek: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [scheduleGrouped, setScheduleGrouped] = useState<Record<string, any[]>>({});

  // Doctor Settings State (Local copy for editing)
  const [profile, setProfile] = useState({
    fullName: user.fullName || '',
    specialization: user.specialization || '',
    experience: user.experience || '0',
    mode: user.mode || 'Online',
    availableDays: (user.availableDays || [0, 1, 2, 3, 4]).map((d: any) => 
      typeof d === 'number' ? d : (DAY_MAP[d] ?? 0)
    ),
    startTime: user.startTime || '09:00',
    endTime: user.endTime || '17:00',
    status: user.status || 'Available'
  });

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    if (!user.uid) return;

    // Listen to appointments where this doctor is assigned
    // In our schema, appointments are in a subcollection or a top-level collection
    // Let's assume a top-level 'appointments' collection where each doc has doctorId
    // OR we query the 'appointments' collection by patient and filter in JS if needed
    // But better to have a clean 'doctor_appointments' view.
    
    // For this implementation, we'll listen to the main 'appointments' collection
    // and filter for this doctor. 
    // REAL PROJECT NOTE: In a scaled app, we'd have a separate collection for doctor-specific views.
    
    let isInitial = true;
    const q = query(collection(db, 'appointmentRequests'), where('doctorId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!isInitial) {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            toast.success(`New Appointment!`, {
              description: `${data.patientName} is requesting a consultation.`,
              action: {
                label: "View",
                onClick: () => setView('schedule')
              }
            });
            setNotifications(prev => [{
              id: change.doc.id,
              title: 'New Appointment',
              message: `New request from ${data.patientName}`,
              time: new Date(),
              read: false
            }, ...prev]);
          }
        });
      }
      isInitial = false;
      
      let allForMe: any[] = [];
      let rev = 0;
      let uniquePatients = new Set();
      let todayCount = 0;
      let weekCount = 0;
      
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const appt = {
          id: docSnap.id,
          ...data
        };
        allForMe.push(appt);
        uniquePatients.add(data.patientId);
        rev += (data.revenue || 500);

        const apptDate = data.dateTime?.toDate?.() || 
                        (data.dateTime?.seconds ? new Date(data.dateTime.seconds * 1000) : new Date());
        
        if (apptDate >= startOfToday) todayCount++;
        
        const diff = now.getTime() - apptDate.getTime();
        if (diff < 7 * 24 * 60 * 60 * 1000) weekCount++;
      });

      setAppointments(allForMe.sort((a,b) => {
        const timeA = a.dateTime?.seconds || 0;
        const timeB = b.dateTime?.seconds || 0;
        return timeA - timeB; // Ascending for schedule
      }));

      // Derive Patients List
      const pList: any[] = [];
      const pMap: Record<string, any> = {};
      allForMe.forEach(a => {
        if (!pMap[a.patientId]) {
          pMap[a.patientId] = {
            id: a.patientId,
            name: a.patientName,
            totalAppointments: 0,
            lastVisit: a.dateTime,
            cases: new Set()
          };
          pList.push(pMap[a.patientId]);
        }
        pMap[a.patientId].totalAppointments++;
        pMap[a.patientId].cases.add(a.caseId);
        if (a.dateTime?.seconds > pMap[a.patientId].lastVisit?.seconds) {
           pMap[a.patientId].lastVisit = a.dateTime;
        }
      });
      setPatientsList(pList);

      // Group Schedule by Date
      const groups: Record<string, any[]> = {};
      allForMe.forEach(a => {
        const d = a.dateTime?.toDate?.() || new Date(a.dateTime?.seconds * 1000);
        const key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(a);
      });
      setScheduleGrouped(groups);

      setStats({
        totalPatients: uniquePatients.size,
        todayAppts: todayCount,
        thisWeek: weekCount,
        totalRevenue: rev
      });
      setLoading(false);
    });

    return () => unsub();
  }, [user.uid]);

  const handleUpdate = async (updates: Partial<typeof profile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    
    try {
      const doctorRef = doc(db, 'doctors', user.uid);
      await updateDoc(doctorRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      // Silent save or a very subtle indicator could be added here
    } catch (e) {
      toast.error("Failed to autosave changes.");
    }
  };

  const statusOptions = [
    { label: 'Available', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    { label: 'On Leave', color: 'text-gray-600', bg: 'bg-gray-50', dot: 'bg-gray-400' },
    { label: 'Emergency', color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
    { label: 'In Surgery', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  ];

  const currentStatus = statusOptions.find(s => s.label === profile.status) || statusOptions[0];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'schedule' | 'settings'>('dashboard');
  const [subView, setSubView] = useState<'dashboard' | 'privacy' | 'terms'>('dashboard');
  const [activeSettingsSection, setActiveSettingsSection] = useState<'profile' | 'availability' | 'clinic' | 'notifications' | 'security'>('profile');

  const renderLegalHeader = (title: string, date: string, icon: any) => (
    <div className="bg-[#0b6b4f] rounded-[24px] p-6 sm:p-12 text-white relative overflow-hidden mb-6">
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">{React.createElement(icon, { className: "w-6 h-6 text-emerald-300" })}</div>
        <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight mb-2">{title}</h1>
        <p className="text-emerald-100/60 font-bold uppercase tracking-widest text-[10px] sm:text-[12px]">{date}</p>
      </div>
      <div className="absolute right-0 bottom-0 w-1/3 h-full hidden md:flex items-center justify-center pointer-events-none opacity-20">
        <ShieldCheck className="w-40 h-40 text-white" />
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
      <button onClick={() => setSubView('dashboard')} className="flex items-center gap-2 text-[#0b6b4f] font-bold text-[10px] uppercase tracking-widest mb-4 hover:translate-x-1 transition-all">
        <ChevronLeft className="w-4 h-4" strokeWidth={3} /> BACK TO DASHBOARD
      </button>
      
      {renderLegalHeader("Privacy Policy", "Last Updated: April 26, 2026", ShieldCheck)}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[24px] p-2 border border-emerald-50 shadow-sm sticky top-[100px]">
            <div className="p-4 border-b border-slate-50 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">On This Page</p>
            </div>
            {['Information We Collect', 'How We Use Info', 'Data Sharing', 'Data Security', 'Your Rights', 'Cookies', 'Retention', 'Children', 'Changes', 'Contact'].map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => document.getElementById(`doc-privacy-section-${i}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-tight transition-all ${i === 0 ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                >
                  {item}
                </button>
              ))}
          </div>
        </div>
        <div className="lg:col-span-9 space-y-6">
          {[
            { title: 'INFORMATION WE COLLECT', desc: 'We collect information you provide directly, such as your medical history, symptoms, contact details, and identity verification documents. We also automatically collect technical data like device info and usage patterns to ensure platform stability.', icon: FileText },
            { title: 'HOW WE USE YOUR INFORMATION', desc: 'Your data is used to facilitate clinical bookings, provide personalized health journeys, process diagnostic requests, and maintain communication with your healthcare providers. We do not sell your personal data.', icon: UserCircle },
            { title: 'DATA SHARING & DISCLOSURE', desc: 'Clinical data is shared only with the doctors, labs, or pharmacies you interact with. We may disclose data if required by law or to protect our users from fraudulent activities.', icon: Globe },
            { title: 'DATA SECURITY', desc: 'Arogyadatha employs enterprise-grade AES-256 encryption for data at rest and TLS for data in transit. We conduct regular security audits to protect against unauthorized access.', icon: ShieldCheck },
            { title: 'YOUR RIGHTS & CHOICES', desc: 'You have the right to access, rectify, or delete your clinical records. You can manage notification preferences and data sharing permissions through your account settings.', icon: Settings },
            { title: 'COOKIES & TRACKING', desc: 'We use cookies to maintain your session, remember language preferences, and analyze platform performance. You can disable cookies in your browser, though some features may be limited.', icon: Activity },
            { title: 'DATA RETENTION', desc: 'Clinical records are retained as long as necessary to provide care or as required by healthcare regulation. Inactive accounts may be archived after 5 years of no activity.', icon: History },
            { title: "CHILDREN'S PRIVACY", desc: 'Our services are not intended for unsupervised use by minors. Parents or guardians must create and manage accounts for children under 18.', icon: Heart },
            { title: 'CHANGES TO THIS POLICY', desc: 'We may update this policy occasionally. Significant changes will be notified via email or a prominent notice on the dashboard. Continued use implies acceptance of the new terms.', icon: Sparkles },
            { title: 'CONTACT US', desc: 'For privacy-related inquiries, data requests, or security concerns, contact our Data Protection Officer at privacy@arogyadatha.com or via the Admin Support channel.', icon: MapPin }
          ].map((section, i) => (
            <div key={i} id={`doc-privacy-section-${i}`} className="bg-white rounded-[24px] p-8 border border-emerald-50 shadow-sm group hover:border-[#0b6b4f]/20 transition-all scroll-mt-24">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#F0F9F4] transition-all"><section.icon className="w-5 h-5 text-emerald-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold text-[#0b6b4f] bg-[#F0F9F4] px-2 py-0.5 rounded-full">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">{section.title}</h3>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">{section.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
      <button onClick={() => setSubView('dashboard')} className="flex items-center gap-2 text-[#0b6b4f] font-bold text-[10px] uppercase tracking-widest mb-4 hover:translate-x-1 transition-all">
        <ChevronLeft className="w-4 h-4" strokeWidth={3} /> BACK TO DASHBOARD
      </button>

      {renderLegalHeader("Terms & Conditions", "Legal Compliance V2.4", FileText)}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[24px] p-2 border border-emerald-50 shadow-sm sticky top-[100px]">
            <div className="p-4 border-b border-slate-50 mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sections</p>
            </div>
            {['Patient Responsibility', 'Use of Our Services', 'Appointments & Payments', 'Privacy & Data Protection', 'Intellectual Property', 'Limitation of Liability', 'Termination', 'Governing Law', 'Changes to Terms'].map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => document.getElementById(`doc-terms-section-${i}`)?.scrollIntoView({ behavior: 'smooth' })}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-tight transition-all ${i === 0 ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`}
                >
                  {item}
                </button>
              ))}
          </div>
        </div>
        <div className="lg:col-span-9 space-y-6">
          {[
            { title: 'PATIENT RESPONSIBILITY', desc: 'You agree to provide accurate, complete, and current information about your health condition and medical history. You are responsible for maintaining the confidentiality of your account.', num: '01', icon: User },
            { title: 'USE OF OUR SERVICES', desc: 'Arogyadatha provides access to healthcare professionals and related services. You agree to use the platform only for lawful purposes and in accordance with these terms.', num: '02', icon: Activity },
            { title: 'APPOINTMENTS & PAYMENTS', desc: 'All appointments are subject to availability. Payments made on our platform are non-refundable except as required by law or as specifically stated in our refund policy.', num: '03', icon: Calendar },
            { title: 'PRIVACY & DATA PROTECTION', desc: 'Our use of your personal data is governed by our Privacy Policy. By agreeing to these terms, you acknowledge and consent to the collection and use of your data.', num: '04', icon: ShieldCheck },
            { title: 'INTELLECTUAL PROPERTY', desc: 'All content, trademarks, and data on the platform are the property of Arogyadatha or its licensors. Unauthorized reproduction or distribution is strictly prohibited.', num: '05', icon: Sparkles },
            { title: 'LIMITATION OF LIABILITY', desc: 'Arogyadatha is a facilitator between users and healthcare providers. We are not liable for medical advice, treatment outcomes, or service interruptions.', num: '06', icon: AlertCircle },
            { title: 'TERMINATION', desc: 'We reserve the right to suspend or terminate your access to the platform for violations of these terms, fraudulent activity, or at our sole discretion.', num: '07', icon: X },
            { title: 'GOVERNING LAW', desc: 'These terms are governed by and construed in accordance with the laws of the jurisdiction in which Arogyadatha operates. Disputes will be subject to local arbitration.', num: '08', icon: Gavel },
            { title: 'CHANGES TO TERMS', desc: 'Terms may be updated to reflect changes in service or regulation. Users will be notified of major updates. Continued usage constitutes agreement to revised terms.', num: '09', icon: History }
          ].map((section, i) => (
            <div key={i} id={`doc-terms-section-${i}`} className="bg-white rounded-[24px] p-8 border border-emerald-50 shadow-sm group hover:border-[#0b6b4f]/20 transition-all scroll-mt-24">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg group-hover:bg-[#0b6b4f] group-hover:text-white transition-all">{section.num}</div>
                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight mb-2">{section.title}</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">{section.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="text-left">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Doctor Settings</h2>
          <p className="text-slate-400 text-sm font-medium">Manage your profile, preferences and account settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: 'profile', label: 'Profile Information', icon: UserCircle },
            { id: 'availability', label: 'Availability', icon: Calendar },
            { id: 'clinic', label: 'Clinic Information', icon: Building2 },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Password & Security', icon: ShieldCheck }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSettingsSection(item.id as any)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${
                activeSettingsSection === item.id 
                  ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' 
                  : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5" />
                <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeSettingsSection === item.id ? 'translate-x-1' : 'opacity-0'}`} />
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-[32px] border border-emerald-50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="p-8 sm:p-10 border-b border-emerald-50/50">
               <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                 {activeSettingsSection === 'profile' ? 'Profile Information' : 
                  activeSettingsSection === 'availability' ? 'Availability Settings' : 
                  activeSettingsSection === 'clinic' ? 'Clinic Details' : 
                  activeSettingsSection === 'notifications' ? 'Notification Preferences' : 
                  'Security Settings'}
               </h3>
               <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">
                 Update your personal and professional details
               </p>
            </div>

            <div className="p-8 sm:p-10">
              {activeSettingsSection === 'profile' && (
                <div className="space-y-8">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 overflow-hidden border-2 border-emerald-100 shadow-inner">
                         <User className="w-12 h-12" />
                      </div>
                      <button className="absolute -right-1 -bottom-1 w-8 h-8 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Profile Photo</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recommended size: 400x400px</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        value={profile.fullName} 
                        onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                        className="w-full bg-slate-50 border border-transparent focus:border-emerald-500 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input 
                        type="email" 
                        value={user.email} 
                        disabled
                        className="w-full bg-slate-50/50 border border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-400 outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                      <select 
                        value={profile.specialization}
                        onChange={(e) => setProfile({...profile, specialization: e.target.value})}
                        className="w-full bg-slate-50 border border-transparent focus:border-emerald-500 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all appearance-none"
                      >
                        <option value="Cardiologist">Cardiologist</option>
                        <option value="Neurologist">Neurologist</option>
                        <option value="Dermatologist">Dermatologist</option>
                        <option value="General Physician">General Physician</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Experience (Years)</label>
                      <input 
                        type="text" 
                        value={profile.experience}
                        onChange={(e) => setProfile({...profile, experience: e.target.value})}
                        className="w-full bg-slate-50 border border-transparent focus:border-emerald-500 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsSection === 'availability' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Available Days</label>
                    <div className="flex flex-wrap gap-3">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const newDays = profile.availableDays.includes(idx)
                              ? profile.availableDays.filter((d: number) => d !== idx)
                              : [...profile.availableDays, idx];
                            setProfile({...profile, availableDays: newDays});
                          }}
                          className={`w-12 h-12 rounded-2xl text-[12px] font-bold transition-all border ${
                            profile.availableDays.includes(idx) 
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                              : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Shift Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="time" 
                          value={profile.startTime}
                          onChange={(e) => setProfile({...profile, startTime: e.target.value})}
                          className="w-full bg-slate-50 border border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Shift End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="time" 
                          value={profile.endTime}
                          onChange={(e) => setProfile({...profile, endTime: e.target.value})}
                          className="w-full bg-slate-50 border border-transparent focus:border-emerald-500 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsSection === 'clinic' && (
                <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-500"><Building2 className="w-8 h-8" /></div>
                   <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Clinic Details Coming Soon</h4>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">We are integrating clinic management features</p>
                </div>
              )}

              {activeSettingsSection === 'security' && (
                <div className="space-y-6">
                   <div className="p-6 rounded-[24px] bg-red-50 border border-red-100 flex items-start gap-4">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-red-900 uppercase tracking-widest">Security Notice</h4>
                        <p className="text-[10px] font-bold text-red-700/80 mt-1 leading-relaxed uppercase">Changing your password will log you out of all devices. Use a strong key containing symbols and numbers.</p>
                      </div>
                   </div>
                   <div className="space-y-4 pt-4">
                      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all">Reset Password Key</button>
                   </div>
                </div>
              )}

              {/* Save Footer */}
              <div className="mt-12 pt-8 border-t border-emerald-50/50 flex justify-end">
                <button 
                  onClick={() => handleUpdate(profile)}
                  className="flex items-center gap-3 bg-[#0b6b4f] text-white px-10 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-[#08523c] shadow-lg shadow-[#0b6b4f]/20 active:scale-[0.98] transition-all"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F0F9F4] font-sans overflow-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-[100] bg-[#0b6b4f] w-full px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-extrabold tracking-tight text-white uppercase">AROGYADATHA</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 transition-all">
            <Globe className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${showNotifications ? 'bg-white text-[#0b6b4f]' : 'text-white hover:bg-white/10'}`}
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0b6b4f]" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[110]" onClick={() => setShowNotifications(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[120]"
                  >
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                      <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Notifications</h4>
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                        className="text-[9px] font-bold text-emerald-600 hover:underline uppercase"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No new updates</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-3 rounded-xl transition-all cursor-pointer ${n.read ? 'hover:bg-slate-50' : 'bg-emerald-50/50 border border-emerald-100'}`}
                              onClick={() => {
                                setNotifications(prev => prev.map(notif => notif.id === n.id ? {...notif, read: true} : notif));
                                setView('schedule');
                                setShowNotifications(false);
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-[11px] font-bold text-slate-900">{n.title}</p>
                                <span className="text-[8px] font-medium text-slate-400">{n.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-tight">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 pl-4 border-l border-white/10 group cursor-pointer"
            >
              <div className="hidden sm:flex flex-col text-right">
                <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-100/60 leading-none mb-1">DOCTOR</p>
                <p className="text-[11px] font-bold text-white leading-none">{profile.fullName || 'doctor1'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-inner group-hover:bg-white/30 transition-all">
                <User className="w-5 h-5" />
              </div>
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-[110] bg-transparent" 
                    onClick={() => setShowProfileDropdown(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[120] p-2"
                  >
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Settings</p>
                    </div>
                    
                    <button 
                      onClick={() => { setSubView('privacy'); setShowProfileDropdown(false); }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all group"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Privacy Policy</span>
                    </button>
                    
                    <button 
                      onClick={() => { setSubView('terms'); setShowProfileDropdown(false); }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 transition-all group"
                    >
                      <FileText className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Terms & Conditions</span>
                    </button>
                    
                    <div className="h-px bg-slate-50 my-1" />
                    
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-all group"
                    >
                      <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Sign Out</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-8 space-y-8 pb-32">
          {subView === 'privacy' ? renderPrivacy() : subView === 'terms' ? renderTerms() : (
            <>
              {activeTab === 'dashboard' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">Medical Dashboard</h2>
                  </div>

                  {/* STATS CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {[
                      { label: 'Total Patients', value: stats.totalPatients, sub: 'All time', icon: Users, color: 'text-emerald-500', bg: 'bg-white' },
                      { label: "Today's Appointments", value: stats.todayAppts, sub: 'Scheduled', icon: Calendar, color: 'text-blue-500', bg: 'bg-white' },
                      { label: 'This Week', value: stats.thisWeek, sub: 'Appointments', icon: Activity, color: 'text-purple-500', bg: 'bg-white' },
                      { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, sub: 'All time', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-white' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-emerald-50/50 flex items-center gap-6 group hover:shadow-xl hover:scale-[1.02] transition-all">
                        <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6`}>
                          <s.icon className={`w-7 h-7 ${s.color}`} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                          <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{s.value}</h3>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tight mt-0.5">{s.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ASSIGNED PATIENTS TABLE */}
                  <section className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-emerald-50/50 flex flex-col overflow-hidden min-h-[500px]">
                    <div className="p-8 sm:p-10 border-b border-emerald-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="text-left">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assigned Patients</h2>
                        <p className="text-slate-400 text-sm font-medium mt-1">Live appointment queue</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-80">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            type="text" 
                            placeholder="Search patient or case ID..."
                            className="w-full bg-slate-50/50 border-none rounded-2xl pl-12 pr-6 py-4 text-[13px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <button className="flex items-center justify-center gap-2 bg-white border border-slate-100 rounded-2xl px-6 py-4 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
                          <Filter className="w-4 h-4" /> Filter
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-x-auto no-scrollbar">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">#</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Patient Name</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Case ID</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Time</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Wait Time</th>
                            <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50/50">
                          {loading ? (
                            <tr>
                              <td colSpan={7} className="py-32 text-center text-slate-300 font-bold uppercase tracking-[0.2em] animate-pulse">Loading Live Queue...</td>
                            </tr>
                          ) : appointments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-32 text-center">
                                <div className="flex flex-col items-center">
                                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                                    <Activity className="w-10 h-10 text-emerald-500 opacity-40" />
                                  </div>
                                  <h4 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">No patients in queue</h4>
                                  <p className="text-slate-400 text-sm mt-1 font-medium">Assigned patients will appear here</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            appointments
                              .filter(a => (a.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (a.caseId || '').toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((appt, idx) => (
                                <tr key={appt.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                                  <td className="px-10 py-8 text-sm font-bold text-slate-400">{idx + 1}</td>
                                  <td className="px-6 py-8">
                                    <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">{appt.patientName}</p>
                                  </td>
                                  <td className="px-6 py-8">
                                    <code className="text-xs font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{appt.caseId}</code>
                                  </td>
                                  <td className="px-6 py-8 text-sm font-bold text-slate-600 text-center">
                                    {appt.dateTime?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '20:19'}
                                  </td>
                                  <td className="px-6 py-8 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                      appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      appt.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                      'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                      {appt.status || 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-8 text-sm font-bold text-slate-400 text-center">12 min</td>
                                  <td className="px-10 py-8 text-right">
                                    <button className="p-2 hover:bg-white rounded-xl hover:shadow-md transition-all text-slate-300 hover:text-slate-900">
                                      <MoreVertical className="w-5 h-5" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'patients' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">Patient Directory</h2>
                  </div>

                  <section className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-emerald-50/50 flex flex-col overflow-hidden">
                    <div className="p-8 sm:p-10 border-b border-emerald-50/50 flex justify-between items-center">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total {patientsList.length} Unique Patients</p>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Patient Name</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Visits</th>
                            <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Last Visit</th>
                            <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50/50">
                          {patientsList.map((p) => (
                            <tr key={p.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-sm uppercase">{p.name?.charAt(0)}</div>
                                  <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">{p.name}</p>
                                </div>
                              </td>
                              <td className="px-6 py-8 text-sm font-bold text-slate-600 text-center">{p.totalAppointments}</td>
                              <td className="px-6 py-8 text-sm font-bold text-slate-400 text-center">
                                {p.lastVisit?.toDate?.().toLocaleDateString() || 'N/A'}
                              </td>
                              <td className="px-10 py-8 text-right">
                                <button className="px-4 py-2 bg-[#F0F9F4] text-[#0b6b4f] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#0b6b4f] hover:text-white transition-all shadow-sm">Case History</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">Daily Schedule</h2>
                  </div>

                  <div className="space-y-10">
                    {Object.entries(scheduleGrouped).map(([date, appts]) => (
                      <div key={date} className="space-y-4">
                        <div className="flex items-center gap-4">
                           <div className="h-px flex-1 bg-emerald-100" />
                           <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">{date}</h3>
                           <div className="h-px flex-1 bg-emerald-100" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {appts.map((appt) => (
                            <div key={appt.id} className="bg-white rounded-[32px] p-6 border border-emerald-50 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
                              <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-600 group-hover:bg-[#0b6b4f] group-hover:text-white transition-all">
                                   <Clock className="w-5 h-5" />
                                </div>
                                <span className="text-[12px] font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg uppercase">{appt.dateTime?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">{appt.patientName}</h4>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{appt.caseName}</p>
                              </div>
                              <div className="mt-6 pt-6 border-t border-emerald-50 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {appt.caseId}</span>
                                <button className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-[#0b6b4f] hover:text-white transition-all">
                                   <ArrowUpRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </main>

        {/* BOTTOM NAVIGATION */}
        <div className="fixed bottom-0 left-0 right-0 z-[250] bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <nav className="w-full h-[70px] sm:h-[85px] flex items-center justify-around px-4 sm:px-20 lg:px-40 max-w-5xl mx-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'patients', label: 'Patients', icon: Users },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'settings', label: 'Settings', icon: SettingsIcon }
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSubView('dashboard');
                  }}
                  className="flex-1 flex flex-col items-center justify-center transition-all duration-300 group"
                >
                  <div className={`relative flex items-center justify-center transition-all duration-500 ${
                    isActive 
                      ? 'w-10 h-10 sm:w-12 sm:h-12 bg-[#0b6b4f] rounded-2xl shadow-[0_8px_20px_rgba(11,107,79,0.3)] -translate-y-1' 
                      : 'w-8 h-8 group-hover:scale-110'
                  }`}>
                    <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-[#0b6b4f]"}`} strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabGlow"
                        className="absolute inset-0 bg-white/20 rounded-2xl blur-md"
                      />
                    )}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase mt-1.5 tracking-widest transition-colors duration-300 ${
                    isActive ? "text-[#0b6b4f]" : "text-[#9CA3AF] group-hover:text-slate-600"
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
