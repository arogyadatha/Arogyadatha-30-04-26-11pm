import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  TrendingUp, 
  Calendar, 
  Activity, 
  Search,
  ChevronRight,
  MoreVertical,
  Filter,
  Download,
  Upload,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  UserCheck,
  ClipboardList,
  Building2,
  ShieldCheck,
  CreditCard,
  History,
  AlertTriangle,
  FileText,
  Settings as SettingsIcon,
  Globe,
  Database,
  X,
  FileSpreadsheet,
  CheckCircle2,
  LogOut,
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  LayoutDashboard,
  ShieldAlert,
  Brain,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  AlertCircle,
  HardDrive,
  BarChart3,
  SearchCode,
  Mail,
  Smartphone,
  MapPin,
  Lock,
  ArrowRight,
  Zap,
  RefreshCw
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, 
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as signSecondaryOut } from "firebase/auth";
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

type AdminTab = 'dashboard' | 'doctors' | 'hospitals' | 'labs' | 'pharmacies' | 'patients' | 'appointments' | 'cases' | 'revenue' | 'subscriptions' | 'reports' | 'alerts' | 'settings' | 'ai' | 'audit-logs' | 'support' | 'landing-page';

const firebaseConfig = {
  apiKey: "AIzaSyD5sTxlmdPFr2qjms3uganXKdgjizTlPpk",
  authDomain: "arogyadatha-app.firebaseapp.com",
  projectId: "arogyadatha-app",
  storageBucket: "arogyadatha-app.firebasestorage.app",
  messagingSenderId: "543960283236",
  appId: "1:543960283236:web:9dc3311071bb7454f78771",
};

export default function AdminDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalHospitals: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalLabs: 0,
    totalPharmacies: 0,
    totalNetwork: 0,
    activeDoctors: 0,
    thisWeekRevenue: 0,
    thisMonthRevenue: 0,
    premiumHospitals: 0,
    premiumDoctors: 0,
    premiumLabs: 0,
    premiumPharmacies: 0,
    todayPatients: 0,
    weeklyPatients: 0,
    newHospitals: 0,
    todayPatientGrowth: 0,
    weeklyPatientGrowth: 0,
    newHospitalGrowth: 0
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [labsList, setLabsList] = useState<any[]>([]);
  const [pharmaciesList, setPharmaciesList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [labRequestsList, setLabRequestsList] = useState<any[]>([]);
  const [counters, setCounters] = useState<any>(null);
  
  const [loadingStakeholders, setLoadingStakeholders] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [authSubTab, setAuthSubTab] = useState<'patients' | 'doctors' | 'hospitals' | 'labs' | 'pharmacies' | 'orphaned'>('patients');
  const [realAuthUsers, setRealAuthUsers] = useState<any[]>([]);
  const [loadingAuthUsers, setLoadingAuthUsers] = useState(false);

  // Upload Progress States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  
  const [manualData, setManualData] = useState<any>({
    fullName: '', hospitalName: '', labName: '', pharmacyName: '',
    email: '', phoneNumber: '', city: '', specialization: '',
    experience: '', hospitalCode: '', address: '', departments: '',
    state: '', district: '', pincode: '', consultationFee: '', availability: '', services: '',
    latitude: '', longitude: '',
    hospitalLinkType: 'Independent Doctor', hospitalId: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Landing Page Management States
  const [landingConfig, setLandingConfig] = useState<any>(null);
  const [loadingLanding, setLoadingLanding] = useState(true);
  const [isSavingLanding, setIsSavingLanding] = useState(false);

  const geocodeAddress = async (address: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) return { lat: data[0].lat, lon: data[0].lon };
    } catch (e) {
      console.error('Geocoding failed:', e);
    }
    return null;
  };

  const handleEditClick = (item: any) => {
    setIsEditMode(true);
    setEditingItemId(item.id);
    setManualData({
      fullName: item.fullName || '',
      hospitalName: item.hospitalName || '',
      labName: item.labName || '',
      pharmacyName: item.pharmacyName || '',
      email: item.email || item.gmail || '',
      phoneNumber: item.phoneNumber || item.phone || '',
      city: item.city || item.district || '',
      specialization: item.specialization || '',
      experience: item.experience || '',
      hospitalCode: item.hospitalCode || '',
      address: item.address || item.addressOfHospital || '',
      departments: Array.isArray(item.departments) ? item.departments.join(', ') : (item.departments || ''),
      state: item.state || '',
      district: item.district || '',
      pincode: item.pincode || '',
      consultationFee: item.consultationFee || item.fee || '',
      availability: item.availability || '',
      services: Array.isArray(item.services) ? item.services.join(', ') : (item.services || ''),
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      hospitalLinkType: item.hospitalId ? 'Hospital Attached Doctor' : 'Independent Doctor',
      hospitalId: item.hospitalId || ''
    });
    setShowManualForm(true);
    setShowAddModal(true);
  };

  const handleManualSubmit = async () => {
    const name = manualData.fullName || manualData.hospitalName || manualData.labName || manualData.pharmacyName;
    const email = manualData.email;
    
    if (!name || !email) {
      toast.error("Name and Email are required!");
      return;
    }

    try {
      let payload = {
        ...manualData,
        updatedAt: serverTimestamp()
      };

      if (payload.departments && typeof payload.departments === 'string') {
        payload.departments = payload.departments.split(',').map((d: string) => d.trim()).filter(Boolean);
      }
      if (payload.services && typeof payload.services === 'string') {
        payload.services = payload.services.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      if (isEditMode && editingItemId) {
        toast.loading(`Updating ${activeTab.slice(0, -1)}...`);
        await updateDoc(doc(db, activeTab, editingItemId), payload);
        toast.dismiss();
        toast.success(`${activeTab.slice(0, -1)} updated successfully!`);
      } else {
        toast.loading(`Adding ${activeTab.slice(0, -1)}...`);
        const arogyadathaId = `AD-${Math.floor(100000 + Math.random() * 900000)}`;
        payload = {
          ...payload,
          role: activeTab.slice(0, -1),
          arogyadathaId,
          isActive: true,
          visibility: 'active',
          isVerified: true,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, activeTab), payload);
        
        // Auto Doctor Count Update
        if (activeTab === 'doctors' && payload.hospitalId) {
          await updateDoc(doc(db, 'hospitals', payload.hospitalId), {
            numberOfDoctors: increment(1)
          });
        }
        
        toast.dismiss();
        toast.success(`${activeTab.slice(0, -1)} added successfully!`);
      }

      setShowManualForm(false);
      setShowAddModal(false);
      setIsEditMode(false);
      setEditingItemId(null);
      setManualData({
        fullName: '', hospitalName: '', labName: '', pharmacyName: '',
        email: '', phoneNumber: '', city: '', specialization: '',
        experience: '', hospitalCode: '', address: '', departments: '',
        state: '', district: '', pincode: '', consultationFee: '', availability: '', services: '',
        hospitalLinkType: 'Independent Doctor', hospitalId: ''
      });
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to save record");
    }
  };

  const handleSaveLanding = async (newConfig: any) => {
    setIsSavingLanding(true);
    try {
      await setDoc(doc(db, 'landing_page_config', 'main'), {
        ...newConfig,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      toast.success("Landing Page updated successfully!");
    } catch (e) {
      console.error("Save Error:", e);
      toast.error("Failed to update Landing Page");
    } finally {
      setIsSavingLanding(false);
    }
  };

  const handleAction = async (action: 'delete' | 'restore' | 'premium' | 'toggle', item: any, collectionName: string) => {
    try {
      if (action === 'delete') {
        setItemToDelete({ item, collectionName });
        setIsDeleteDialogOpen(true);
      } else if (action === 'restore') {
        await updateDoc(doc(db, collectionName, item.id), { status: 'Verified', subscriptionStatus: 'active' });
        toast.success("Restored successfully");
      } else if (action === 'premium') {
        const amount = prompt("Enter Premium Amount (₹):", item.subscription?.amount || item.premiumAmount || "1000");
        if (amount !== null) {
          await updateDoc(doc(db, collectionName, item.id), { 
            subscription: {
              isActive: true,
              plan: 'premium',
              amount: Number(amount),
              updatedAt: serverTimestamp()
            },
            premiumAmount: Number(amount),
            subscriptionStatus: 'active',
            isPremium: true
          });
          toast.success(`Premium set to ₹${amount}`);
        }
      } else if (action === 'toggle') {
        const nextStatus = item.visibility === 'active' || item.isActive !== false ? 'inactive' : 'active';
        await updateDoc(doc(db, collectionName, item.id), { 
          visibility: nextStatus,
          isActive: nextStatus === 'active',
          subscriptionStatus: nextStatus
        });
        toast.success(`Visibility is now ${nextStatus}`);
      }
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { item, collectionName } = itemToDelete;
      
      // Delete from Firestore
      await deleteDoc(doc(db, collectionName, item.id));
      await deleteDoc(doc(db, 'users', item.id));
      
      // Delete from Firebase Auth using Local API Bridge
      try {
        const response = await fetch('http://localhost:3001/api/delete-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uids: [item.id] })
        });
        if (!response.ok) {
          const errData = await response.json();
          toast.error(`Auth Removal Failed: ${errData.error || 'Check server logs'}`);
          console.warn("Failed to delete Auth record. Local server error:", errData.error);
        }
      } catch (apiErr) {
        toast.error("Auth System Offline: Account deleted from storage only. Start 'node server.mjs' and add 'serviceAccountKey.json' to fix this.");
        console.warn("Local API server error. Is it running on port 3001?", apiErr);
      }

      toast.success("Deleted permanently from system and auth");
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setTotalToProcess(selectedItems.length);
      setProcessedCount(0);
      setUploadStatus(`Starting deletion for ${activeTab}...`);

      let deletedCount = 0;
      
      // Parallel processing for speed (chunks of 10)
      const batchSize = 10;
      for (let i = 0; i < selectedItems.length; i += batchSize) {
        const batch = selectedItems.slice(i, i + batchSize);
        await Promise.all(batch.map(async (id) => {
          try {
            await deleteDoc(doc(db, activeTab, id));
            await deleteDoc(doc(db, 'users', id));
          } catch (err) { console.error(`Failed to delete ${id}:`, err); }
          
          deletedCount++;
          setProcessedCount(deletedCount);
          setUploadProgress(Math.round((deletedCount / selectedItems.length) * 100));
          setUploadStatus(`Deleted ${deletedCount} of ${selectedItems.length}...`);
        }));
      }
      
      // Bulk Delete from Firebase Auth using Local API Bridge
      setUploadStatus('Finalizing Auth removal...');
      try {
        const response = await fetch('http://localhost:3001/api/delete-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uids: selectedItems })
        });
        if (!response.ok) {
          const errData = await response.json();
          console.warn("Bulk Auth Removal partial failure:", errData.error);
        }
      } catch (apiErr) {
        console.warn("Auth System Offline during bulk delete.");
      }

      setUploadStatus('Completed ✅');
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 2000);
      
      toast.success(`Deleted ${selectedItems.length} records successfully.`);
      setIsBulkDeleteDialogOpen(false);
      setSelectedItems([]);
    } catch (e) {
      setIsUploading(false);
      toast.error("Bulk delete failed");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(filteredStakeholders.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  useEffect(() => {
    setSelectedItems([]);
    if (activeTab === 'authentications') {
      fetchAuthUsers();
    }
  }, [activeTab]);

  const fetchAuthUsers = async () => {
    setLoadingAuthUsers(true);
    try {
      const response = await fetch('http://localhost:3001/api/list-auth-users');
      const data = await response.json();
      if (data.success) {
        setRealAuthUsers(data.users);
      } else {
        toast.error(data.error || "Failed to fetch real auth data");
      }
    } catch (e) {
      console.error("Auth Fetch Error:", e);
      toast.error("Bridge Server Offline: Fetching from storage only.");
    } finally {
      setLoadingAuthUsers(false);
    }
  };

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, 'hospitals'), (snap) => {
        setHospitalsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(collection(db, 'doctors'), (snap) => {
        setDoctorsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(collection(db, 'patients'), (snap) => {
        setPatientsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(collection(db, 'labs'), (snap) => {
        setLabsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(collection(db, 'pharmacies'), (snap) => {
        setPharmaciesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(collection(db, 'appointments'), (snap) => {
        setAppointmentsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(collection(db, 'LabRequests'), (snap) => {
        setLabRequestsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }),
      onSnapshot(collection(db, 'counters'), (snap) => {
        if (!snap.empty) setCounters(snap.docs[0].data());
      }),
      onSnapshot(doc(db, 'landing_page_config', 'main'), (snap) => {
        if (snap.exists()) {
          setLandingConfig(snap.data());
        } else {
          // Initialize with defaults if not exists
          const defaults = {
            isEnabled: true,
            headings: {
              hero: "ONE HEALTH ID. ONE PLACE. FULL JOURNEY.",
              whatWeDo: "WHAT WE DO",
              services: "Our Services",
              ai: "Personalized AI",
              impact: "Impact & Growth"
            },
            contentBlocks: {
              heroDesc: "Don't leave your health data in hospitals. Carry your health data in your mobile.",
              whatWeDoDesc: "We help people manage their complete health in one place."
            },
            contactInfo: {
              phoneNumbers: ["8008334948"],
              emails: ["Arogyadatha24@gmail.com"],
              address: "Guntur, Andhra Pradesh, India"
            },
            buttons: {
              heroCta: "JOIN AROGYADATHA COMMUNITY",
              heroCtaLink: "https://chat.whatsapp.com/CsvbKgcYB3qE2dMpSxNoAR?mode=gi_t",
              navbarLogin: "Login",
              signUpCta: "Create Your Health ID",
              whatsappSupport: "WHATSAPP SUPPORT",
              collabCta: "Submit Collaboration Request",
              messageAdminCta: "Message Admin"
            },
            teamMembers: [],
            lastUpdated: serverTimestamp()
          };
          setLandingConfig(defaults);
        }
        setLoadingLanding(false);
      })
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  // Live Metrics Calculation
  useEffect(() => {
    const activeDoctors = doctorsList.filter(d => d.isActive).length;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayAppts = appointmentsList.filter(a => {
      const d = a.dateTime?.seconds ? new Date(a.dateTime.seconds * 1000) : null;
      return d && d.toISOString().split('T')[0] === todayStr;
    }).length;

    const weeklyAppts = appointmentsList.filter(a => {
      const d = a.dateTime?.seconds ? new Date(a.dateTime.seconds * 1000) : null;
      return d && d > sevenDaysAgo;
    }).length;

    const newHospitalsCount = hospitalsList.filter(h => {
      const d = h.createdAt?.seconds ? new Date(h.createdAt.seconds * 1000) : null;
      return d && d > sevenDaysAgo;
    }).length;
    
    // Revenue Calculation
    const totalRev = appointmentsList.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
    const premiumH = hospitalsList.reduce((acc, curr) => acc + (Number(curr.premiumAmount) || 0), 0);
    const premiumD = doctorsList.reduce((acc, curr) => acc + (Number(curr.premiumAmount) || 0), 0);
    const premiumL = labsList.reduce((acc, curr) => acc + (Number(curr.premiumAmount) || 0), 0);

    setStats(prev => ({
      ...prev,
      totalHospitals: hospitalsList.length,
      totalDoctors: doctorsList.length,
      activeDoctors,
      totalPatients: patientsList.length,
      totalLabs: labsList.length,
      totalPharmacies: pharmaciesList.length,
      totalNetwork: hospitalsList.length + doctorsList.length + labsList.length + pharmaciesList.length,
      thisMonthRevenue: totalRev + premiumH + premiumD + premiumL,
      premiumHospitals: premiumH,
      premiumDoctors: premiumD,
      premiumLabs: premiumL,
      todayPatients: todayAppts,
      weeklyPatients: weeklyAppts,
      newHospitals: newHospitalsCount,
      todayPatientGrowth: todayAppts > 0 ? 100 : 0,
      weeklyPatientGrowth: weeklyAppts > 0 ? 100 : 0,
      newHospitalGrowth: newHospitalsCount > 0 ? 100 : 0
    }));
  }, [hospitalsList, doctorsList, patientsList, labsList, pharmaciesList, appointmentsList]);

  useEffect(() => {
    if (activeTab === 'dashboard') return;
    setLoadingStakeholders(true);
    const collectionMap: Record<string, any[]> = {
      hospitals: hospitalsList,
      doctors: doctorsList,
      patients: patientsList,
      labs: labsList,
      pharmacies: pharmaciesList,
      appointments: appointmentsList
    };
    setStakeholders(collectionMap[activeTab] || []);
    setLoadingStakeholders(false);
  }, [activeTab, hospitalsList, doctorsList, patientsList, labsList, pharmaciesList, appointmentsList]);

  const downloadTemplate = () => {
    const templates: Record<string, any[]> = {
      patients: [{ "Full Name": 'John Doe', "Email": 'john@example.com', "Phone Number": '9876543210', "City": 'Guntur', "Age": 30, "Gender": 'Male' }],
      doctors: [{ "Full Name": 'Dr. Smith', "Email": 'smith@example.com', "Phone Number": '9876543211', "Specialization": 'Cardiology', "Hospital Name": 'City Hospital', "Experience": '10', "Fee": 500 }],
      hospitals: [{ "State": 'Andhra Pradesh', "District": 'Guntur', "Hospital Code": 'HSP-001', "Hospital Name": 'ABC Hospital', "Address of the Hospital": 'Kothapet', "Pincode": '522001', "Phone Number": '9876543210', "Email": 'abc@gmail.com', "Departments": 'Cardiology, Neurology', "Latitude": '16.30', "Longitude": '80.44' }],
      labs: [{ "Lab Name": 'Safe Lab', "Email": 'info@safelab.com', "Phone Number": '9876543212', "City": 'Nellore', "Address": 'Lab Street' }],
      pharmacies: [{ "Pharmacy Name": 'MediPlus', "Email": 'orders@mediplus.com', "Phone Number": '9876543213', "City": 'Ongole', "Address": 'Pharma Lane' }]
    };
    const data = templates[activeTab] || [{ name: 'Example', info: 'Fill data here' }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `Arogyadatha_${activeTab}_Template.xlsx`);
    toast.success(`${activeTab.toUpperCase()} Template Downloaded!`);
  };

  const filteredStakeholders = stakeholders.filter(item => {
    const s = searchQuery.toLowerCase();
    const name = String(item.fullName || item.hospitalName || item.labName || item.pharmacyName || '').toLowerCase();
    const phone = String(item.phoneNumber || item.phone || '').toLowerCase();
    const city = String(item.city || item.district || '').toLowerCase();
    const aid = String(item.arogyadathaId || '').toLowerCase();
    const hosp = String(item.hospitalName || '').toLowerCase();
    
    return name.includes(s) || phone.includes(s) || city.includes(s) || aid.includes(s) || hosp.includes(s);
  });

  const handleExport = () => {
    const loadingToast = toast.loading(`Preparing ${activeTab} data for Excel...`);
    try {
      let dataToExport = [];
      
      // Speed Optimization: Pre-calculate lookups to avoid nested filters (O(N) instead of O(N^2))
      const apptByPatient = appointmentsList.reduce((acc, a) => {
        if (a.patientId) (acc[a.patientId] = acc[a.patientId] || []).push(a);
        return acc;
      }, {} as any);

      const docsByHospital = doctorsList.reduce((acc, d) => {
        if (d.hospitalId) (acc[d.hospitalId] = (acc[d.hospitalId] || 0) + 1);
        return acc;
      }, {} as any);

      if (activeTab === 'patients') {
        dataToExport = patientsList.map(p => {
          const appts = apptByPatient[p.id] || [];
          const latestAppt = appts[0] || {};
          return {
            "Arogyadatha ID": p.arogyadathaId || 'N/A',
            "Patient Name": p.fullName || 'N/A',
            "Email": p.email || 'N/A',
            "Phone": p.phoneNumber || 'N/A',
            "City": p.city || 'N/A',
            "District": p.district || 'N/A',
            "Case ID": latestAppt.caseId || 'N/A',
            "Recent Doctor": latestAppt.doctorName || 'N/A',
            "Recent Hospital": latestAppt.hospitalName || 'N/A',
            "Subscription Status": p.subscriptionStatus || 'Inactive',
            "Registration Date": p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
          };
        });
      } else if (activeTab === 'doctors') {
        dataToExport = doctorsList.map(d => ({
          "Arogyadatha ID": d.arogyadathaId || 'N/A',
          "Doctor Name": d.fullName || 'N/A',
          "Email": d.email || 'N/A',
          "Phone": d.phoneNumber || 'N/A',
          "Specialization": d.specialization || 'N/A',
          "Hospital Name": d.hospitalName || 'Independent',
          "Hospital ID": d.hospitalId || 'N/A',
          "Experience (Years)": d.experience || 0,
          "Premium Amount (₹)": d.premiumAmount || 0,
          "Status": d.subscriptionStatus || d.visibility || 'Active',
          "Joined Date": d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
        }));
      } else if (activeTab === 'hospitals') {
        dataToExport = hospitalsList.map(h => ({
          "Hospital Code": h.hospitalCode || 'N/A',
          "Hospital Name": h.hospitalName || 'N/A',
          "Email": h.email || 'N/A',
          "Phone": h.phoneNumber || 'N/A',
          "State": h.state || 'N/A',
          "District": h.district || 'N/A',
          "Address": h.address || 'N/A',
          "Total Doctors": docsByHospital[h.id] || h.numberOfDoctors || 0,
          "Departments": Array.isArray(h.departments) ? h.departments.join(', ') : (h.departments || 'N/A'),
          "Premium Status": h.subscription?.plan || 'Standard',
          "Onboarding Date": h.createdAt ? new Date(h.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
        }));
      } else if (activeTab === 'labs' || activeTab === 'pharmacies') {
        dataToExport = (activeTab === 'labs' ? labsList : pharmaciesList).map((item: any) => ({
          "Arogyadatha ID": item.arogyadathaId || 'N/A',
          "Name": item.labName || item.pharmacyName || item.fullName || 'N/A',
          "Email": item.email || 'N/A',
          "Phone": item.phoneNumber || 'N/A',
          "City": item.city || 'N/A',
          "Address": item.address || 'N/A',
          "Services": Array.isArray(item.services) ? item.services.join(', ') : (item.services || 'N/A'),
          "Status": item.visibility || 'Active',
          "Created At": item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
        }));
      } else {
        // Generic export for other tabs
        dataToExport = filteredStakeholders.map(({id, uid, ...rest}) => {
          const cleanObj: any = {};
          Object.keys(rest).forEach(key => {
            if (typeof rest[key] !== 'object') cleanObj[key] = rest[key];
          });
          return cleanObj;
        });
      }

      if (dataToExport.length === 0) {
        toast.error("No data found to export!");
        toast.dismiss(loadingToast);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab);
      
      // Auto-size columns for better "Same format" feel
      const max_widths = dataToExport.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key, i) => {
          const val = String(row[key]);
          acc[i] = Math.max(acc[i] || 10, val.length + 2);
        });
        return acc;
      }, []);
      ws['!cols'] = max_widths.map((w: number) => ({ wpx: w * 7 }));

      XLSX.writeFile(wb, `Arogyadatha_${activeTab}_Master_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.dismiss(loadingToast);
      toast.success("Excel Export Successful!");
    } catch (e) {
      console.error("Export Error:", e);
      toast.dismiss(loadingToast);
      toast.error("Export failed. Please check console.");
    }
  };

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>, customTab?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetTab = customTab || activeTab;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
        
        if (rawData.length === 0) { toast.error("File is empty!"); return; }
        
        setIsUploading(true);
        setUploadProgress(0);
        setTotalToProcess(rawData.length);
        setProcessedCount(0);
        setUploadStatus(`Starting upload for ${targetTab}...`);
        
        const secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
        const authSecondary = getAuth(secondaryApp);

        let createdCount = 0;
        let updatedCount = 0;

        for (let i = 0; i < rawData.length; i++) {
          const record = rawData[i] as any;
          setProcessedCount(i + 1);
          setUploadProgress(Math.round(((i + 1) / rawData.length) * 100));
          
          // Helper to find value by case-insensitive key
          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const foundKey = Object.keys(record).find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
              if (foundKey) return record[foundKey];
            }
            return null;
          };

          const email = (getVal(["Email", "Gmail", "Email Address", "Gmail/Email"]) || '').toString().toLowerCase().trim();
          if (!email) {
            setUploadStatus(`Skipping row ${i + 1}: Missing Email`);
            continue;
          }

          setUploadStatus(`Processing ${email}...`);

          let normalizedRecord: any = {};
          
          if (targetTab === 'hospitals') {
            normalizedRecord = {
              state: getVal(["State"]) || 'Not Given',
              district: getVal(["District"]) || 'Not Given',
              hospitalCode: getVal(["Hospital Code"]) || 'N/A',
              hospitalName: getVal(["Hospital Name"]) || 'Hospital',
              address: getVal(["Address of the Hospital", "Address"]) || 'Address Not Given',
              pincode: getVal(["Pincode"]) || '',
              phoneNumber: getVal(["Phone Number", "Phone"]) || 'Phone Not Given',
              phone: getVal(["Phone Number", "Phone"]) || 'Phone Not Given',
              email: email,
              latitude: getVal(["Latitude"]) || '',
              longitude: getVal(["Longitude"]) || '',
              rating: '4.8',
              departments: getVal(["Departments"]) ? getVal(["Departments"]).toString().split(',').map((d: string) => d.trim()).filter(Boolean) : ["Not Available"]
            };
          } else if (targetTab === 'doctors') {
            normalizedRecord = {
              fullName: getVal(["Full Name", "Doctor Name"]) || 'Doctor',
              email: email,
              phoneNumber: getVal(["Phone Number", "Phone"]) || 'Phone Not Given',
              specialization: getVal(["Specialization"]) || 'General',
              hospitalName: getVal(["Hospital Name"]) || 'Independent',
              experience: getVal(["Experience"]) || '0',
              consultationFee: getVal(["Fee", "Consultation Fee"]) || 500,
              city: getVal(["City", "District"]) || 'Not Given',
              rating: '4.9'
            };
          } else if (targetTab === 'labs') {
            normalizedRecord = {
              labName: getVal(["Lab Name"]) || 'Lab',
              email: email,
              phoneNumber: getVal(["Phone Number", "Phone"]) || 'Phone Not Given',
              city: getVal(["City"]) || 'Not Given',
              address: getVal(["Address"]) || 'Address Not Given'
            };
          } else if (targetTab === 'pharmacies') {
            normalizedRecord = {
              pharmacyName: getVal(["Pharmacy Name"]) || 'Pharmacy',
              email: email,
              phoneNumber: getVal(["Phone Number", "Phone"]) || 'Phone Not Given',
              city: getVal(["City"]) || 'Not Given',
              address: getVal(["Address"]) || 'Address Not Given'
            };
          } else {
            normalizedRecord = { ...record };
          }

          const name = normalizedRecord.fullName || normalizedRecord.hospitalName || normalizedRecord.labName || normalizedRecord.pharmacyName || 'User';
          const rawName = name.split(' ')[0].replace(/[^a-zA-Z]/g, '');
          const tempPass = `${rawName}@123`;
          
          try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const existingDoc = querySnapshot.docs[0];
              const uid = existingDoc.id;
              const existingData = existingDoc.data();
              
              // Only add missing fields (Duplicate Control)
              let payload: any = { updatedAt: serverTimestamp() };
              Object.keys(normalizedRecord).forEach(key => {
                if (existingData[key] === undefined || existingData[key] === null || existingData[key] === '' || (Array.isArray(existingData[key]) && existingData[key].length === 0)) {
                  payload[key] = normalizedRecord[key];
                }
              });

              await updateDoc(doc(db, 'users', uid), { fullName: name, updatedAt: serverTimestamp() });
              await setDoc(doc(db, targetTab, uid), payload, { merge: true });
              updatedCount++;
            } else {
              const userCredential = await createUserWithEmailAndPassword(authSecondary, email, tempPass);
              const uid = userCredential.user.uid;
              await signSecondaryOut(authSecondary);

              const arogyadathaId = `AD-${Math.floor(100000 + Math.random() * 900000)}`;
              const role = targetTab.endsWith('s') ? targetTab.slice(0, -1) : targetTab;

              const payload = {
                ...normalizedRecord,
                uid,
                email,
                fullName: name,
                role,
                arogyadathaId,
                isActive: true,
                isVerified: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };

              await setDoc(doc(db, 'users', uid), { uid, email, fullName: name, role, arogyadathaId, createdAt: serverTimestamp() });
              await setDoc(doc(db, targetTab, uid), payload);
              createdCount++;
            }
          } catch (err) { console.error(`Error processing ${email}:`, err); }
        }
        
        setUploadStatus('Completed ✅');
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 2000);
        toast.success(`Bulk Upload Complete! Created: ${createdCount}, Updated: ${updatedCount}`);
      } catch (err) { 
        setIsUploading(false);
        toast.error("Failed to read file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'authentications', label: 'Authentications', icon: Lock },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'hospitals', label: 'Hospitals', icon: Building2 },
    { id: 'labs', label: 'Labs', icon: FlaskConical },
    { id: 'pharmacies', label: 'Pharmacies', icon: Pill },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'cases', label: 'Cases', icon: ClipboardList },
    { id: 'revenue', label: 'Revenue & Premiums', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: UserCheck },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'alerts', label: 'Alerts & Warnings', icon: ShieldAlert, badge: 23 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'ai', label: 'AI Insights', icon: Brain },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    { id: 'landing-page', label: 'Landing Page', icon: Globe },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  const MetricCard = ({ label, value, icon: Icon, bg, lightBg }: any) => {
    const colorBase = bg.replace('bg-', '').split('-')[0];
    return (
      <Card className={`border-none shadow-sm rounded-[16px] sm:rounded-3xl overflow-hidden hover:shadow-lg transition-all group ${lightBg} bg-opacity-40 border border-${colorBase}-100/30 relative`}>
        <div className={`absolute top-0 left-0 w-0.5 h-full bg-${colorBase}-500 opacity-20`} />
        <CardContent className="p-1.5 sm:p-4 flex flex-col justify-between min-h-[70px] sm:min-h-[110px]">
          <div className="mb-0.5">
            <p className={`text-[6px] sm:text-[9px] font-black text-${colorBase}-700/60 uppercase tracking-tighter sm:tracking-[0.25em] truncate`}>{label}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 mt-auto">
            <div className={`w-6 h-6 sm:w-12 sm:h-12 ${bg} rounded-lg sm:rounded-2xl flex items-center justify-center shadow-md shadow-${colorBase}-500/10 group-hover:scale-105 transition-transform border border-white/50`}>
              <Icon className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className={`text-[13px] sm:text-3xl font-black text-${colorBase}-950 tracking-tighter leading-none truncate`}>
              {value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}
            </h3>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ControlPanel = ({ title, icon: Icon, data, collectionName, onAdd, onBulk, color }: any) => (
    <Card className="border-none shadow-lg rounded-2xl overflow-hidden flex flex-col h-full bg-white border border-slate-50">
      <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 ${color} bg-opacity-10 rounded-lg flex items-center justify-center shadow-inner`}>
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </div>
          <CardTitle className="text-xs font-black text-slate-900">{title}</CardTitle>
        </div>
        <button onClick={() => setActiveTab(collectionName as AdminTab)} className="text-[9px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest">Manage</button>
      </CardHeader>
      <CardContent className="p-3 pt-1 flex-1 flex flex-col gap-2">
        {data.slice(0, 4).map((item: any) => (
          <div key={item.id} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-600 shadow-sm border border-white">
                {item.fullName?.[0] || item.hospitalName?.[0]}
              </div>
              <div className="max-w-[100px]">
                <p className="text-[11px] font-bold text-slate-800 truncate">{item.fullName || item.hospitalName || item.labName || item.pharmacyName}</p>
                <p className="text-[8px] text-slate-500 font-medium truncate uppercase tracking-tighter">{item.specialization || item.district || item.city || 'ACTIVE'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleAction('toggle', item, collectionName)} className={`w-5 h-5 rounded-lg flex items-center justify-center ${item.subscriptionStatus === 'active' ? 'text-emerald-500' : 'text-slate-300'}`}>
                {item.subscriptionStatus === 'active' ? <UserCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
              </button>
              <button onClick={() => handleAction('premium', item, collectionName)} className={`w-5 h-5 flex items-center justify-center ${item.premiumAmount > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                <Zap className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        <div className="mt-auto pt-1 grid grid-cols-2 gap-2">
          <Button onClick={onAdd} variant="outline" className="h-7 rounded-xl text-[8px] font-black border-emerald-100 text-emerald-700 hover:bg-emerald-50 shadow-sm">
            <Plus className="w-2.5 h-2.5 mr-0.5" /> ADD
          </Button>
          <div className="relative">
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full h-7 rounded-xl text-[8px] font-black border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm">
              <Upload className="w-2.5 h-2.5 mr-0.5" /> BULK
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900 font-black">
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-[45] bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transition-transform duration-300 transform lg:relative lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar relative">
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-10 shrink-0">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl p-2 flex items-center justify-center">
              <img src="/assets/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-medium tracking-tight text-slate-900 font-black">Arogyadatha</h2>
              <p className="text-[8px] font-medium text-emerald-500 uppercase tracking-widest mt-0.5">ఆరోగ్యదాత</p>
            </div>
          </div>
          
          <nav className="space-y-1 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as AdminTab); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 font-bold hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-500 font-black group-hover:text-gray-600'}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                {item.badge && <span className="bg-rose-500 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-10 p-4 bg-gray-50 rounded-2xl shrink-0">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Storage</p>
              <p className="text-[10px] font-medium text-slate-900 font-black">68.4 / 100 GB</p>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[68%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="sticky top-0 z-40 h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 lg:px-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 border-2 border-white">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Arogyadatha <span className="text-emerald-600">Admin</span></h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">SUPER ADMIN PORTAL</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button className="p-2.5 text-slate-500 hover:bg-white hover:text-emerald-600 hover:shadow-sm rounded-xl transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
              </button>
              <button className="p-2.5 text-slate-500 hover:bg-white hover:text-emerald-600 hover:shadow-sm rounded-xl transition-all">
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none">Administrator</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">Live System</p>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-12 h-12 bg-slate-100 rounded-2xl border-2 border-white shadow-md overflow-hidden flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-all active:scale-95"
                >
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'Admin'}`} alt="User" className="w-full h-full object-cover" />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-50 mb-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Actions</p>
                        </div>
                        <button 
                          onClick={onLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-10 no-scrollbar bg-[#F8FAFC]">
          {activeTab === 'dashboard' ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Row 1: Top Metrics - Ultra Compact */}
              <div className="grid grid-cols-6 gap-1.5 sm:gap-4 lg:gap-6">
                <MetricCard label="Total Hospitals" value={stats.totalHospitals} icon={Building2} bg="bg-indigo-600" lightBg="bg-indigo-50" />
                <MetricCard label="Active Doctors" value={stats.totalDoctors} icon={Stethoscope} bg="bg-blue-600" lightBg="bg-blue-50" />
                <MetricCard label="Total Patients" value={stats.totalPatients} icon={Users} bg="bg-purple-600" lightBg="bg-purple-50" />
                <MetricCard label="Labs" value={stats.totalLabs} icon={FlaskConical} bg="bg-amber-600" lightBg="bg-amber-50" />
                <MetricCard label="Pharmacies" value={stats.totalPharmacies} icon={Pill} bg="bg-emerald-600" lightBg="bg-emerald-50" />
                <MetricCard label="Total Network" value={stats.totalNetwork} icon={Activity} bg="bg-rose-600" lightBg="bg-rose-50" />
              </div>

              {/* Row 2: Revenue & Registrations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="p-6 pb-2 flex flex-row items-center gap-3 space-y-0">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><CreditCard className="w-5 h-5 text-emerald-600" /></div>
                    <CardTitle className="text-base font-medium">Revenue Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">This Week Revenue</p>
                      <h4 className="text-lg font-medium mt-1">₹{stats.thisWeekRevenue.toLocaleString()}</h4>
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">+{stats.revenueGrowth}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">This Month Revenue</p>
                      <h4 className="text-lg font-medium mt-1">₹{stats.thisMonthRevenue.toLocaleString()}</h4>
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">+{stats.monthRevenueGrowth}%</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Premium Collected</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-[10px] font-medium"><span>Hospitals</span><span>₹{stats.premiumHospitals.toLocaleString()}</span></div>
                        <div className="flex justify-between text-[10px] font-medium"><span>Doctors</span><span>₹{stats.premiumDoctors.toLocaleString()}</span></div>
                        <div className="flex justify-between text-[10px] font-medium"><span>Labs</span><span>₹{stats.premiumLabs.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="p-6 pb-2 flex flex-row items-center gap-3 space-y-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><UserCheck className="w-5 h-5 text-indigo-600" /></div>
                    <CardTitle className="text-base font-medium">New Registrations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Today Patients</p>
                      <h4 className="text-lg font-medium mt-1">{stats.todayPatients}</h4>
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">+{stats.todayPatientGrowth}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">This Week Patients</p>
                      <h4 className="text-lg font-medium mt-1">{stats.weeklyPatients.toLocaleString()}</h4>
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">+{stats.weeklyPatientGrowth}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">New Hospitals</p>
                      <h4 className="text-lg font-medium mt-1">{stats.newHospitals}</h4>
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">+{stats.newHospitalGrowth}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Control Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6">
                <ControlPanel title="Doctors" icon={Stethoscope} data={doctorsList} collectionName="doctors" onAdd={() => {setActiveTab('doctors'); setShowAddModal(true);}} color="text-blue-600" />
                <ControlPanel title="Hospitals" icon={Building2} data={hospitalsList} collectionName="hospitals" onAdd={() => {setActiveTab('hospitals'); setShowAddModal(true);}} color="text-indigo-600" />
                <ControlPanel title="Labs" icon={FlaskConical} data={labsList} collectionName="labs" onAdd={() => {setActiveTab('labs'); setShowAddModal(true);}} color="text-amber-600" />
                <ControlPanel title="Pharmacies" icon={Pill} data={pharmaciesList} collectionName="pharmacies" onAdd={() => {setActiveTab('pharmacies'); setShowAddModal(true);}} color="text-emerald-600" />
                <ControlPanel title="Patients" icon={Users} data={patientsList} collectionName="patients" onAdd={() => setActiveTab('patients')} color="text-purple-600" />
              </div>

              {/* Row 4: Lower Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* Alerts */}
                <Card className="lg:col-span-4 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                  <CardHeader className="p-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center"><AlertCircle className="w-4 h-4 text-rose-500" /></div>
                      <CardTitle className="text-sm font-medium">Alerts & Warnings</CardTitle>
                    </div>
                    <button className="text-[10px] font-medium text-slate-500 font-black hover:text-slate-900 font-black">See All</button>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    {doctorsList.filter(d => !d.isVerified || d.subscriptionStatus !== 'active').slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-all group">
                        <div className={`w-8 h-8 ${!item.isVerified ? 'bg-amber-50' : 'bg-rose-50'} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}>
                          {!item.isVerified ? <ShieldAlert className="w-4 h-4 text-amber-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-slate-900">{!item.isVerified ? 'Pending Verification' : 'Subscription Expired'}</p>
                          <p className="text-[10px] text-slate-600 font-bold truncate">{item.fullName || item.hospitalName}</p>
                        </div>
                        <button onClick={() => setActiveTab('doctors')} className="text-[9px] font-black text-emerald-600 hover:underline uppercase tracking-widest">Fix</button>
                      </div>
                    ))}
                    {doctorsList.filter(d => !d.isVerified || d.subscriptionStatus !== 'active').length === 0 && (
                      <div className="text-center py-10">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Urgent Alerts</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Storage & AI Insights */}
                <div className="lg:col-span-5 grid grid-cols-1 gap-4 lg:gap-6">
                  <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center"><HardDrive className="w-4 h-4 text-indigo-600" /></div>
                        <CardTitle className="text-sm font-medium">Storage Usage - Top Users</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-4">
                      {[
                        { name: 'Lokesh', value: 92.4, color: 'bg-rose-500' },
                        { name: 'Harsha', value: 78.7, color: 'bg-amber-500' },
                        { name: 'Ramya', value: 65.3, color: 'bg-indigo-500' },
                        { name: 'Suresh', value: 48.6, color: 'bg-blue-500' },
                        { name: 'Anusha', value: 32.1, color: 'bg-emerald-500' },
                      ].map((u) => (
                        <div key={u.name} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-medium"><span>{u.name}</span><span>{u.value} GB</span></div>
                          <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                            <div className={`h-full ${u.color} rounded-full`} style={{ width: `${u.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardHeader className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center"><Brain className="w-4 h-4 text-emerald-600" /></div>
                        <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-3">
                      {[
                        { label: 'Most Booked Doctor', value: appointmentsList.length > 0 ? (appointmentsList.reduce((acc:any, curr:any) => { acc[curr.doctorName] = (acc[curr.doctorName] || 0) + 1; return acc; }, {}) && Object.keys(appointmentsList.reduce((acc:any, curr:any) => { acc[curr.doctorName] = (acc[curr.doctorName] || 0) + 1; return acc; }, {})).reduce((a, b) => appointmentsList.reduce((acc:any, curr:any) => { acc[curr.doctorName] = (acc[curr.doctorName] || 0) + 1; return acc; }, {})[a] > appointmentsList.reduce((acc:any, curr:any) => { acc[curr.doctorName] = (acc[curr.doctorName] || 0) + 1; return acc; }, {})[b] ? a : b)) : 'No Data', extra: 'Top Performer', icon: Stethoscope },
                        { label: 'Total Consultations', value: appointmentsList.length.toLocaleString(), extra: 'Lifetime', icon: Calendar },
                        { label: 'Network Size', value: (stats.totalHospitals + stats.totalDoctors + stats.totalLabs).toLocaleString(), extra: 'Entities', icon: Activity },
                      ].map((insight) => (
                        <div key={insight.label} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 bg-slate-50/30">
                          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm"><insight.icon className="w-4 h-4 text-emerald-600" /></div>
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{insight.label}</p>
                            <p className="text-xs font-black text-slate-900 truncate">{insight.value}</p>
                          </div>
                          <span className="text-[9px] font-black text-emerald-600 uppercase">{insight.extra}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="lg:col-span-3 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                  <CardHeader className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center"><Zap className="w-4 h-4 text-amber-500" /></div>
                      <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <button onClick={() => { setActiveTab('hospitals'); setTimeout(() => fileInputRef.current?.click(), 100); }} className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all group">
                        <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">Bulk Upload Hospitals</span>
                      </button>
                      <button onClick={() => { setActiveTab('doctors'); setTimeout(() => fileInputRef.current?.click(), 100); }} className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-all group">
                        <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">Bulk Upload Doctors</span>
                      </button>
                      <button onClick={() => { setActiveTab('labs'); setTimeout(() => fileInputRef.current?.click(), 100); }} className="flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-2xl hover:bg-purple-100 transition-all group">
                        <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">Import Labs (Excel)</span>
                      </button>
                      <button className="flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-2xl hover:bg-amber-100 transition-all group">
                        <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">Premium Settings</span>
                      </button>
                      <button className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition-all group">
                        <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-medium">Send Notification</span>
                      </button>
                    </div>
                    <div className="pt-4 space-y-3">
                      <p className="text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest px-2">Settings</p>
                      <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all">
                        <div className="flex items-center gap-3"><SettingsIcon className="w-4 h-4 text-slate-500 font-black" /><span className="text-xs font-medium">Profile Settings</span></div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all">
                        <div className="flex items-center gap-3"><Lock className="w-4 h-4 text-slate-500 font-black" /><span className="text-xs font-medium">Change Password</span></div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="pt-4 text-center">
                <p className="text-[10px] text-slate-500 font-black font-medium">© 2025 Arogyadatha. All rights reserved. <span className="ml-4">Version 1.0.0</span></p>
              </div>
            </div>
          ) : activeTab === 'authentications' ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500 h-full">
              <Card className="border-none shadow-sm rounded-3xl bg-white p-6 lg:p-8 h-full flex flex-col min-h-[600px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-medium text-slate-900 font-black uppercase tracking-tight">Authentications Manager</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4 overflow-x-auto custom-scrollbar">
                  {['patients', 'doctors', 'hospitals', 'labs', 'pharmacies', 'orphaned'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setAuthSubTab(tab as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${authSubTab === tab ? 'bg-rose-600 text-white shadow-md' : 'bg-gray-50 text-slate-500 hover:bg-gray-100'}`}
                    >
                      {tab === 'orphaned' ? '⚠️ Orphaned / Unlinked' : tab}
                    </button>
                  ))}
                  <Button onClick={fetchAuthUsers} variant="outline" className="ml-auto h-9 rounded-xl text-[10px] font-black uppercase border-slate-200">
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingAuthUsers ? 'animate-spin' : ''}`} /> Sync Real Data
                  </Button>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-4 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Authenticated User</th>
                        <th className="text-left py-4 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Email / UID</th>
                        <th className="text-left py-4 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Last Active</th>
                        <th className="text-right py-4 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Danger Zone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        let list: any[] = [];
                        
                        if (authSubTab === 'orphaned') {
                          // Find users in Auth but NOT in Firestore users collection
                          const allFirestoreIds = [
                            ...patientsList.map(p => p.id),
                            ...doctorsList.map(d => d.id),
                            ...hospitalsList.map(h => h.id),
                            ...labsList.map(l => l.id),
                            ...pharmaciesList.map(p => p.id)
                          ];
                          list = realAuthUsers.filter(au => !allFirestoreIds.includes(au.uid));
                        } else {
                          const firestoreList = authSubTab === 'patients' ? patientsList :
                                                authSubTab === 'doctors' ? doctorsList :
                                                authSubTab === 'hospitals' ? hospitalsList :
                                                authSubTab === 'labs' ? labsList :
                                                pharmaciesList;
                          
                          // Merge real auth data with firestore labels
                          list = firestoreList.map(fs => {
                            const auth = realAuthUsers.find(au => au.uid === fs.id);
                            return { ...fs, ...auth, isLinked: !!auth };
                          });
                        }
                        
                        if (loadingAuthUsers) {
                          return <tr><td colSpan={4} className="py-20 text-center text-xs font-medium text-slate-500 font-black animate-pulse">Syncing with Firebase Authentication...</td></tr>;
                        }

                        if (list.length === 0) {
                          return <tr><td colSpan={4} className="py-20 text-center text-xs font-medium text-slate-500 font-black">No {authSubTab} users found in the system.</td></tr>;
                        }

                        return list.map((item) => (
                          <tr key={item.uid || item.id} className="hover:bg-rose-50/30 transition-all group">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium font-bold ${item.isLinked === false ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                  <Lock className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900 font-black">{item.fullName || item.hospitalName || item.displayName || 'UNLINKED USER'}</p>
                                  <p className="text-[10px] font-medium text-slate-500 font-black tracking-tight">{item.uid || item.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-[11px] font-medium text-slate-700">{item.email}</p>
                              {item.isLinked === false && <span className="text-[9px] font-black text-amber-600 uppercase">Orphaned Account</span>}
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-[10px] font-black text-slate-500 uppercase">
                                {item.lastSignInTime ? new Date(item.lastSignInTime).toLocaleString() : 'Never'}
                              </p>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button 
                                variant="destructive" 
                                onClick={() => { setItemToDelete({ item: { id: item.uid || item.id, ...item }, collectionName: authSubTab }); setIsDeleteDialogOpen(true); }}
                                className="h-9 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white font-black text-[10px] uppercase tracking-widest shadow-none opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Wipe Entirely
                              </Button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : activeTab === 'landing-page' ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500 h-full space-y-6">
              <Card className="border-none shadow-sm rounded-3xl bg-white p-6 lg:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Landing Page Manager</h2>
                    <p className="text-xs font-medium text-slate-500 mt-1">Control visibility and content of your public landing page.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Status:</span>
                    <button 
                      onClick={() => handleSaveLanding({ isEnabled: !landingConfig?.isEnabled })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${landingConfig?.isEnabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {landingConfig?.isEnabled ? 'Publicly Enabled' : 'Hidden / Disabled'}
                    </button>
                  </div>
                </div>

                {loadingLanding ? (
                  <div className="py-20 text-center animate-pulse">
                    <Globe className="w-10 h-10 text-emerald-200 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Configuration...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Headings & Text */}
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><FileText className="w-4 h-4 text-emerald-600" /></div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Core Headings</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Title</label>
                            <Input 
                              value={landingConfig?.headings?.hero || ''} 
                              onChange={(e) => setLandingConfig({...landingConfig, headings: {...landingConfig.headings, hero: e.target.value}})}
                              className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Description</label>
                            <textarea 
                              value={landingConfig?.contentBlocks?.heroDesc || ''} 
                              onChange={(e) => setLandingConfig({...landingConfig, contentBlocks: {...landingConfig.contentBlocks, heroDesc: e.target.value}})}
                              className="w-full min-h-[80px] p-4 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">What We Do Title</label>
                              <Input 
                                value={landingConfig?.headings?.whatWeDo || ''} 
                                onChange={(e) => setLandingConfig({...landingConfig, headings: {...landingConfig.headings, whatWeDo: e.target.value}})}
                                className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Section Title</label>
                              <Input 
                                value={landingConfig?.headings?.ai || ''} 
                                onChange={(e) => setLandingConfig({...landingConfig, headings: {...landingConfig.headings, ai: e.target.value}})}
                                className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><Zap className="w-4 h-4 text-emerald-600" /></div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Buttons & CTAs</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero CTA Text</label>
                              <Input 
                                value={landingConfig?.buttons?.heroCta || ''} 
                                onChange={(e) => setLandingConfig({...landingConfig, buttons: {...landingConfig.buttons, heroCta: e.target.value}})}
                                className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero CTA Link</label>
                              <Input 
                                value={landingConfig?.buttons?.heroCtaLink || ''} 
                                onChange={(e) => setLandingConfig({...landingConfig, buttons: {...landingConfig.buttons, heroCtaLink: e.target.value}})}
                                className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sign Up Button</label>
                              <Input 
                                value={landingConfig?.buttons?.signUpCta || ''} 
                                onChange={(e) => setLandingConfig({...landingConfig, buttons: {...landingConfig.buttons, signUpCta: e.target.value}})}
                                className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Support</label>
                              <Input 
                                value={landingConfig?.buttons?.whatsappSupport || ''} 
                                onChange={(e) => setLandingConfig({...landingConfig, buttons: {...landingConfig.buttons, whatsappSupport: e.target.value}})}
                                className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Collab Request Button</label>
                              <Input 
                                value={landingConfig?.buttons?.collabCta || ''} 
                                onChange={(e) => setLandingConfig({...landingConfig, buttons: {...landingConfig.buttons, collabCta: e.target.value}})}
                                className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Admin Button</label>
                              <Input 
                                value={landingConfig?.buttons?.messageAdminCta || ''} 
                                onChange={(e) => setLandingConfig({...landingConfig, buttons: {...landingConfig.buttons, messageAdminCta: e.target.value}})}
                                className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><Mail className="w-4 h-4 text-emerald-600" /></div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Contact Information</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Numbers (Comma separated)</label>
                            <Input 
                              value={landingConfig?.contactInfo?.phoneNumbers?.join(', ') || ''} 
                              onChange={(e) => setLandingConfig({...landingConfig, contactInfo: {...landingConfig.contactInfo, phoneNumbers: e.target.value.split(',').map((s:any) => s.trim())}})}
                              className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Addresses (Comma separated)</label>
                            <Input 
                              value={landingConfig?.contactInfo?.emails?.join(', ') || ''} 
                              onChange={(e) => setLandingConfig({...landingConfig, contactInfo: {...landingConfig.contactInfo, emails: e.target.value.split(',').map((s:any) => s.trim())}})}
                              className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Office Address</label>
                            <Input 
                              value={landingConfig?.contactInfo?.address || ''} 
                              onChange={(e) => setLandingConfig({...landingConfig, contactInfo: {...landingConfig.contactInfo, address: e.target.value}})}
                              className="h-11 rounded-xl bg-white border-slate-200 text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team & Save */}
                    <div className="space-y-6 flex flex-col">
                      <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex-1">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm"><Users className="w-4 h-4 text-emerald-600" /></div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Team Members</h3>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setLandingConfig({...landingConfig, teamMembers: [...(landingConfig.teamMembers || []), {name: 'New Member', role: 'Role', image: ''}]})}
                            className="h-8 rounded-lg text-[10px] font-black border-emerald-100 text-emerald-600"
                          >
                            <Plus className="w-3 h-3 mr-1" /> ADD
                          </Button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                          {(landingConfig?.teamMembers || []).map((member: any, idx: number) => (
                            <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <Input 
                                  value={member.name} 
                                  onChange={(e) => {
                                    const newTeam = [...landingConfig.teamMembers];
                                    newTeam[idx].name = e.target.value;
                                    setLandingConfig({...landingConfig, teamMembers: newTeam});
                                  }}
                                  placeholder="Name"
                                  className="h-9 rounded-lg text-[11px] font-bold"
                                />
                                <Input 
                                  value={member.role} 
                                  onChange={(e) => {
                                    const newTeam = [...landingConfig.teamMembers];
                                    newTeam[idx].role = e.target.value;
                                    setLandingConfig({...landingConfig, teamMembers: newTeam});
                                  }}
                                  placeholder="Role"
                                  className="h-9 rounded-lg text-[11px] font-bold"
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const newTeam = landingConfig.teamMembers.filter((_:any, i:number) => i !== idx);
                                  setLandingConfig({...landingConfig, teamMembers: newTeam});
                                }}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(landingConfig?.teamMembers || []).length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Team Members Added</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-8 bg-emerald-600 rounded-[32px] text-white space-y-4 shadow-xl shadow-emerald-900/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
                          <div>
                            <h4 className="text-lg font-black tracking-tight leading-none">Apply Changes</h4>
                            <p className="text-[10px] font-medium text-emerald-100 uppercase tracking-widest mt-1">Updates are Instant & Global</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleSaveLanding(landingConfig)}
                          disabled={isSavingLanding}
                          className="w-full h-14 bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-black/10 active:scale-95 transition-all"
                        >
                          {isSavingLanding ? 'Saving Updates...' : 'Publish to Live Site'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500 h-full">
              <Card className="border-none shadow-sm rounded-3xl bg-white p-6 lg:p-8 h-full flex flex-col min-h-[600px]">
                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex items-center gap-2 w-full">
                    {/* Premium Search Bar */}
                    <div className="relative group flex-1 min-w-0">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-[2px] opacity-10 group-hover:opacity-30 transition duration-500"></div>
                      <div className="relative flex items-center bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-slate-50 border-r border-slate-50 shrink-0">
                          <Search className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <Input 
                          placeholder="Search..." 
                          className="border-none bg-transparent h-8 sm:h-12 focus-visible:ring-0 text-[11px] sm:text-xs font-bold placeholder:text-slate-400 placeholder:font-black w-full min-w-0 px-2 sm:px-4" 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                      </div>
                    </div>

                    {/* Compact Excel Export */}
                    <Button 
                      onClick={handleExport} 
                      variant="outline" 
                      className="h-8 w-8 sm:h-12 sm:w-12 rounded-2xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 shadow-sm transition-all p-0 flex items-center justify-center shrink-0"
                      title="Export to Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>

                    <Button 
                      onClick={() => setShowAddModal(true)} 
                      className="h-8 w-8 sm:h-12 sm:w-auto sm:px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 active:scale-95 transition-all p-0 sm:p-auto shrink-0"
                      title="Add New Record"
                    >
                      <Plus className="w-4 h-4" /> 
                      <span className="hidden sm:inline">Add New</span>
                    </Button>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="w-full">
                      <Button 
                        onClick={() => setIsBulkDeleteDialogOpen(true)} 
                        className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-900/10 animate-in slide-in-from-right-4 duration-300"
                      >
                        <Trash2 className="w-4 h-4" /> Delete ({selectedItems.length})
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-6 px-4 w-10">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            checked={filteredStakeholders.length > 0 && selectedItems.length === filteredStakeholders.length}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="text-left py-6 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Entity / User</th>
                        <th className="text-left py-6 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Arogyadatha ID</th>
                        <th className="text-left py-6 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Location</th>
                        <th className="text-left py-6 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Status</th>
                        <th className="text-right py-6 px-4 text-[10px] font-medium text-slate-500 font-black uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loadingStakeholders ? (
                        <tr><td colSpan={5} className="py-20 text-center text-xs font-medium text-slate-500 font-black animate-pulse">Loading directory...</td></tr>
                      ) : filteredStakeholders.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-xs font-medium text-slate-500 font-black">No records found matching your search.</td></tr>
                      ) : filteredStakeholders.map((item) => (
                        <tr key={item.id} className={`hover:bg-gray-50/50 transition-all group ${selectedItems.includes(item.id) ? 'bg-emerald-50/30' : ''}`}>
                          <td className="py-5 px-4">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                            />
                          </td>
                          <td className="py-5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-medium text-slate-600 font-bold">
                                {item.fullName?.[0] || item.hospitalName?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 font-black">{item.fullName || item.hospitalName || item.labName || item.pharmacyName}</p>
                                <p className="text-[10px] font-medium text-slate-500 font-black tracking-tight">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-4 font-mono text-[10px] font-medium text-slate-600 font-bold"><code>{item.arogyadathaId || 'PENDING'}</code></td>
                          <td className="py-5 px-4 text-[11px] font-medium text-gray-600">{item.city || item.district || 'N/A'}</td>
                          <td className="py-5 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${item.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg uppercase ${item.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {item.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-4 text-right relative">
                            <div className="flex items-center justify-end gap-1 transition-opacity">
                              <button onClick={() => handleAction('toggle', item, activeTab)} title="Toggle Visibility" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${item.visibility === 'active' || item.isActive !== false ? 'text-emerald-500 bg-emerald-50 border border-emerald-100' : 'text-slate-500 font-black bg-gray-100 border border-slate-200'}`}>
                                {item.visibility === 'active' || item.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              {activeTab !== 'patients' && (
                                <button onClick={() => handleAction('premium', item, activeTab)} title="Premium Settings" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${item.subscription?.plan === 'premium' || item.isPremium ? 'text-amber-500 bg-amber-50 border border-amber-100' : 'text-slate-500 font-black bg-gray-100 border border-slate-200'}`}>
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => handleEditClick(item)} title="Edit Record" className="w-7 h-7 text-slate-600 font-bold hover:text-emerald-600 bg-white border border-slate-200 rounded-lg flex items-center justify-center transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleAction('delete', item, activeTab)} title="Delete Record" className="w-7 h-7 text-slate-600 font-bold hover:text-rose-600 bg-white border border-slate-200 rounded-lg flex items-center justify-center transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-rose-600" /></div>
            <DialogTitle className="text-xl font-medium font-black">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-600 mt-2">
              Are you sure you want to remove <span className="text-slate-900 font-black">"{itemToDelete?.item?.fullName || itemToDelete?.item?.hospitalName || itemToDelete?.item?.labName || itemToDelete?.item?.pharmacyName}"</span>? This action permanently removes them from the database and authentication.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0 mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl flex-1 h-11 font-black">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="rounded-xl flex-1 h-11 bg-rose-600 hover:bg-rose-700 font-black shadow-lg shadow-rose-200">Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4"><ShieldAlert className="w-6 h-6 text-rose-600" /></div>
            <DialogTitle className="text-xl font-medium font-black text-rose-600">Caution: Bulk Deletion</DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-600 mt-2">
              You are about to permanently delete <strong className="text-slate-900 font-black">{selectedItems.length} records</strong>. This will completely remove them from storage and authentication. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0 mt-6">
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)} className="rounded-xl flex-1 h-11 font-black">Cancel</Button>
            <Button variant="destructive" onClick={confirmBulkDelete} className="rounded-xl flex-1 h-11 bg-rose-600 hover:bg-rose-700 font-black shadow-lg shadow-rose-200 uppercase tracking-widest text-[10px]">Delete All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Modals for adding entries */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[32px] p-6 lg:p-10 max-w-2xl w-full relative z-10 shadow-2xl overflow-hidden">
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"><X className="w-5 h-5 text-slate-600 font-bold" /></button>
              
              <div className="mb-8">
                <h2 className="text-2xl font-medium text-slate-900 font-black tracking-tight">Add New {activeTab.slice(0, -1)}</h2>
                <p className="text-xs font-medium text-slate-600 font-bold">Expand the Arogyadatha ecosystem by adding a new entity.</p>
              </div>

              {!showManualForm ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                      className="p-6 rounded-2xl border-2 border-gray-50 bg-gray-50/50 hover:bg-white hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-center group cursor-pointer"
                      onClick={() => setShowManualForm(true)}
                    >
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform"><Plus className="w-6 h-6 text-emerald-600" /></div>
                      <h3 className="text-sm font-medium text-slate-900 font-black mb-1">Manual Entry</h3>
                      <p className="text-[10px] text-slate-500 font-black font-medium">Add a single record manually</p>
                    </div>
                    
                    <div 
                      className="p-6 rounded-2xl border-2 border-emerald-50 bg-emerald-50/20 hover:bg-white hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all text-center group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform"><FileSpreadsheet className="w-6 h-6 text-emerald-600" /></div>
                      <h3 className="text-sm font-medium text-slate-900 font-black mb-1">Bulk Upload</h3>
                      <p className="text-[10px] text-slate-500 font-black font-medium">Upload multiple records via Excel</p>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><Download className="w-4 h-4 text-slate-500 font-black" /></div>
                      <p className="text-[10px] font-medium text-slate-600 font-bold uppercase tracking-widest">Need a format guide?</p>
                    </div>
                    <button onClick={downloadTemplate} className="text-[10px] font-medium text-emerald-600 hover:underline">DOWNLOAD TEMPLATE</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar p-1">
                  {/* Name & Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                        {activeTab === 'hospitals' ? 'Hospital Name' : activeTab === 'labs' ? 'Lab Name' : activeTab === 'pharmacies' ? 'Pharmacy Name' : 'Full Name'}
                      </label>
                      <Input 
                        value={manualData.fullName || manualData.hospitalName || manualData.labName || manualData.pharmacyName} 
                        onChange={e => {
                          const val = e.target.value;
                          if (activeTab === 'hospitals') setManualData({...manualData, hospitalName: val});
                          else if (activeTab === 'labs') setManualData({...manualData, labName: val});
                          else if (activeTab === 'pharmacies') setManualData({...manualData, pharmacyName: val});
                          else setManualData({...manualData, fullName: val});
                        }} 
                        placeholder="Official Name" 
                        title={manualData.fullName || manualData.hospitalName || manualData.labName || manualData.pharmacyName}
                        className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold focus:bg-white transition-colors" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Email Address</label>
                      <Input 
                        value={manualData.email} 
                        title={manualData.email} 
                        onChange={e => setManualData({...manualData, email: e.target.value})} 
                        placeholder="email@example.com" 
                        className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold focus:bg-white transition-colors" 
                      />
                    </div>
                  </div>

                  {/* Phone & City */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Phone Number</label>
                      <Input value={manualData.phoneNumber} title={manualData.phoneNumber} onChange={e => setManualData({...manualData, phoneNumber: e.target.value})} placeholder="Phone" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">City / Location</label>
                      <Input value={manualData.city} title={manualData.city} onChange={e => setManualData({...manualData, city: e.target.value})} placeholder="Location" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                    </div>
                  </div>

                  {/* Doctor Specific Fields */}
                  {activeTab === 'doctors' && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Specialization</label>
                          <Input value={manualData.specialization} title={manualData.specialization} onChange={e => setManualData({...manualData, specialization: e.target.value})} placeholder="e.g. Cardiology" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Experience (Years)</label>
                          <Input value={manualData.experience} title={manualData.experience} onChange={e => setManualData({...manualData, experience: e.target.value})} placeholder="e.g. 10" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Hospital Link Type</label>
                          <select 
                             value={manualData.hospitalLinkType || 'Independent Doctor'}
                             onChange={e => setManualData({...manualData, hospitalLinkType: e.target.value})}
                             className="w-full h-10 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold px-3 focus:bg-white outline-none"
                          >
                            <option value="Independent Doctor">Independent Doctor</option>
                            <option value="Hospital Attached Doctor">Hospital Attached Doctor</option>
                          </select>
                        </div>
                        {manualData.hospitalLinkType === 'Hospital Attached Doctor' && (
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Select Hospital</label>
                             <select 
                               value={manualData.hospitalId || ''}
                               onChange={e => {
                                 const hosp = hospitalsList.find(h => h.id === e.target.value);
                                 setManualData({
                                    ...manualData, 
                                    hospitalId: hosp?.id || '', 
                                    hospitalCode: hosp?.hospitalCode || '', 
                                    hospitalName: hosp?.hospitalName || ''
                                 });
                               }}
                               className="w-full h-10 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold px-3 focus:bg-white outline-none"
                             >
                               <option value="">Choose Hospital...</option>
                               {hospitalsList.filter(h => h.isActive !== false).map(h => (
                                 <option key={h.id} value={h.id}>{h.hospitalName}</option>
                               ))}
                             </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hospital Specific Fields */}
                  {activeTab === 'hospitals' && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">State</label>
                          <Input value={manualData.state} title={manualData.state} onChange={e => setManualData({...manualData, state: e.target.value})} placeholder="State" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">District</label>
                          <Input value={manualData.district} title={manualData.district} onChange={e => setManualData({...manualData, district: e.target.value})} placeholder="District" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Hospital Code</label>
                          <Input value={manualData.hospitalCode} title={manualData.hospitalCode} onChange={e => setManualData({...manualData, hospitalCode: e.target.value})} placeholder="Code" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Departments</label>
                          <Input value={manualData.departments} title={manualData.departments} onChange={e => setManualData({...manualData, departments: e.target.value})} placeholder="Comma separated" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Pincode</label>
                          <Input value={manualData.pincode} title={manualData.pincode} onChange={e => setManualData({...manualData, pincode: e.target.value})} placeholder="Pincode" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Location (Lat, Lng)</label>
                          <div className="flex gap-2">
                            <Input value={manualData.latitude} title={manualData.latitude} onChange={e => setManualData({...manualData, latitude: e.target.value})} placeholder="Lat" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold flex-1" />
                            <Input value={manualData.longitude} title={manualData.longitude} onChange={e => setManualData({...manualData, longitude: e.target.value})} placeholder="Lng" className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Common: Address */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Full Address</label>
                    <Input value={manualData.address} title={manualData.address} onChange={e => setManualData({...manualData, address: e.target.value})} placeholder="Street, Area, etc." className="h-10 rounded-xl bg-slate-50 border-slate-100 text-[11px] font-bold" />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
                    <Button onClick={() => setShowManualForm(false)} variant="outline" className="flex-1 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-200 text-slate-600">Back</Button>
                    <Button onClick={handleManualSubmit} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/10 active:scale-95 transition-all">Save {activeTab.slice(0, -1)}</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Progress Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-emerald-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center animate-pulse">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Bulk Uploading</h3>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Live Sync in Progress</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 leading-none">{uploadProgress}%</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{processedCount} / {totalToProcess}</p>
                </div>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <p className="text-xs font-black text-slate-600 truncate uppercase tracking-tighter">
                  {uploadStatus}
                </p>
              </div>

              <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-[0.2em] mt-6">
                Please do not close this window
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
