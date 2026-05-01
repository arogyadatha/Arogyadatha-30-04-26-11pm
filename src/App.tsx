import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShieldCheck,
  Activity,
  UserCircle,
  User,
  Stethoscope,
  Building2,
  FlaskConical,
  Pill,
  ShieldAlert,
  ArrowLeft,
  Eye,
  EyeOff,
  LogOut,
  Loader2,
  Bell,
  Settings,
  ChevronDown,
  Globe,
  Shield,
  FileText,
  Search,
  Droplets,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  History,
  PlusCircle,
  AlertCircle,
  Moon,
  Sun,
  Lock,
  Facebook,
  Menu,
  Plus,
  Home,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  runTransaction,
  onSnapshot,
  collection,
  query,
  where
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { auth, db, googleProvider } from './lib/firebase';
import { UserRole, UserProfile } from './types';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import LoadingScreen from './components/common/LoadingScreen';
import DashboardSkeleton from './components/common/DashboardSkeleton';
import { LandingPage } from './components/landing/LandingPage';

const DoctorDashboard = React.lazy(() => import('./components/doctor/DoctorDashboard'));
const BookDoctor = React.lazy(() => import('./components/patient/BookDoctor'));
const BookLab = React.lazy(() => import('./components/patient/BookLab'));
const Pharmacy = React.lazy(() => import('./components/patient/Pharmacy'));
const LabDashboard = React.lazy(() => import('./components/lab/LabDashboard'));
const PharmacyDashboard = React.lazy(() => import('./components/pharmacy/PharmacyDashboard'));
const SymptomChecker = React.lazy(() => import('./components/patient/SymptomChecker'));
const HealthJourney = React.lazy(() => import('./components/patient/HealthJourney'));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const LocationPrompt = React.lazy(() => import('./components/patient/LocationPrompt').then(m => ({ default: m.LocationPrompt })));
const ArogyaChatbot = React.lazy(() => import('./components/patient/ArogyaChatbot'));

// Seed data removed — no dummy data

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [view, setView] = useState<'landing' | 'hero' | 'role-selection' | 'signup' | 'login' | 'dashboard' | 'symptom-checker' | 'book-doctor' | 'book-lab' | 'pharmacy' | 'profile' | 'settings' | 'privacy' | 'terms'>('landing');
  const [landingConfig, setLandingConfig] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [featureIndex, setFeatureIndex] = useState(0);

  // Smart Login States
  const [loginInput, setLoginInput] = useState(() => localStorage.getItem('lastLoginInput') || '');
  const [detectedRole, setDetectedRole] = useState<UserRole | null>(null);
  const [roleCache, setRoleCache] = useState<Record<string, UserRole>>({});
  const [confirmRole, setConfirmRole] = useState(false);

  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageTelugu, setIsLanguageTelugu] = useState(() => localStorage.getItem('arogya_lang') === 'te');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userCases, setUserCases] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const journeyRef = React.useRef<HTMLDivElement>(null);
  const [preSelectedCaseId, setPreSelectedCaseId] = useState<string | null>(null);
  const [shouldScrollToJourney, setShouldScrollToJourney] = useState(false);
  const [initialBookDoctorTab, setInitialBookDoctorTab] = useState<'find' | 'hospitals' | 'history'>('find');

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Use the standard Vite environment variable for the API key
  const getAi = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

  const translations = {
    en: {
      welcome: "Welcome Back",
      portal: "Your Health Friend",
      systemLive: "System Live",
      quickActions: "Quick Actions",
      recentActivity: "Recent Activity",
      securityStatus: "Security Status",
      healthScore: "Health Score",
      excellentStatus: "Excellent Status",
      logout: "Logout",
      profile: "Profile Page",
      settings: "Settings",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      notifications: "Notifications",
      signedInAs: "Signed in as",
      healthJourney: "Health Journey",
      active: "Active",
      history: "Case History",
      symptomChecker: "Symptom Checker",
      bookDoctor: "Book Doctor",
      bookLab: "Book Lab",
      pharmacy: "Pharmacy",
      newCase: "New Case",
      prescriptions: "Prescriptions",
      appointments: "Appointments",
      recommendedMeds: "Doctor Recommended Medicines",
      findLab: "Find a Lab",
      myReports: "My Reports",
      searchLab: "Search by lab name...",
      recommendedTests: "Doctor Recommended",
      prescribedFor: "Prescribed for your",
      labNav: "Lab",
      searchPharmacy: "Search by pharmacy name...",
      prescriptionReady: "Prescription Ready",
      fromDoctorFor: "From Dr. for your",
      home: "Home",
      symptom: "Symptom",
      doctor: "Doctor",
      lab: "Lab",
      pharmacyNav: "Pharmacy",
      findDoctor: "Find Doctor",
      searchDoctor: "Search by doctor name...",
      symptoms: "Symptoms",
      doctorNav: "Doctor",
      rx: "Rx",
      hide: "Hide",
      journey: "Journey",
      premium: "Premium",
      noActiveCases: "No active cases",
      activeCases: "active cases",
      completed: "Completed",
      cancelled: "Cancelled",
      nearbyLabs: "Nearby Diagnostic Labs",
      labInfo: "Lab Information",
      nearbyPharmacies: "Nearby Pharmacies",
      noPharmacies: "No Pharmacies Found",
      possibleConditions: "Possible Conditions",
      recommendedSpecialists: "Recommended Specialists",
      creatingJourney: "Creating Your Journey...",
      createCaseAndContinue: "Create Case ID & Continue",
      bloodBank: "Blood Bank",
      welcomeMsg: "Welcome to Arogyadatha",
      premiumPortal: "Premium Healthcare Portal",
      systemReady: "System is live and ready",
      operational: "All services operational.",
      welcomeArogya: "Welcome to Arogyadatha!",
      journeyStart: "Your health journey starts here.",
      quickAccess: "Quick Access Services",
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms & Conditions",
      privacyLastUpdate: "Last Updated: April 2026",
      privacyIntro: "Your privacy is of utmost importance to Arogyadatha. This policy outlines how we collect, use, and protect your clinical and personal data.",
      privacyDataHeading: "1. Data Collection",
      privacyDataText: "We collect medical history, symptom reports, and clinical diagnostics only when provided by you. Data is encrypted using AES-256 standards.",
      privacySharingHeading: "2. Data Sharing",
      privacySharingText: "Your records are only shared with doctors or labs you explicitly authorize.",
      termsIntro: "By using Arogyadatha, you agree to our digital health network terms. Our platform bridges patients and verified providers.",
      termsResponsibilityHeading: "Patient Responsibility",
      termsResponsibilityText: "Users are responsible for accurate info. We are not a replacement for emergency services.",
      termsIntegrityHeading: "Case ID Integrity",
      termsIntegrityText: "All bookings must be linked to a valid Case ID.",
      returnDashboard: "Back to Dashboard",
      accountSettings: "Account Settings",
      securityLogin: "Security & Login",
      notificationsLabel: "Notifications",
      appTheme: "App Theme",
      languageLabel: "Language",
      verifiedPatient: "Verified Patient",
      signInTitle: "Sign in to your account",
      identityLabel: "Identity Identifier",
      securityKeyLabel: "Security Key",
      forgotKey: "Forgot Security Key?",
      systemDetection: "System Detection",
      authenticatingAs: "Authenticating as",
      verifyIdentity: "Verify Identity",
      socialAccess: "Social Access",
      dontHaveAccount: "Don't have an account?",
      signUp: "Sign Up",
      back: "Back",
      yourHealth: "Your Health,",
      ourPriority: "Our Priority",
      brandingDesc: "Secure, reliable and accessible healthcare for everyone, everywhere.",
      isoCertified: "ISO 27001 Certified Platform",
      symptomCheckerTitle: "Symptom Checker",
      poweredByGemini: "Powered by Gemini AI",
      howAreYouFeeling: "How are you feeling today?",
      describeSymptomsDetail: "Describe your symptoms in detail...",
      symptomPlaceholder: "Example: I have a headache, fever and body pain since 2 days...",
      commonExamples: "Common examples:",
      diagnosedCount: "10K+ DIAGNOSED",
      accuracyRate: "98% ACCURACY RATE",
      analyzeSymptomsBtn: "Analyze Symptoms",
      analyzing: "Analyzing...",
      medicalIntelligenceReport: "Medical Intelligence Report",
      conditions: "Conditions",
      nextSteps: "Next Steps",
      specialists: "Specialists",
      journeyStarted: "Journey Started!",
      createCaseBtn: "Create Case ID & Book Doctor",
      initializing: "Initializing...",
      lowUrgency: "Low Urgency",
      moderateUrgency: "Moderate Urgency",
      immediateCare: "Immediate Care Needed",
      step1: "Describe Symptoms",
      step2: "Review Analysis",
      step3: "Possible Conditions",
      step4: "Recommendations",
      diagnosticLabs: "Diagnostic Labs",
      reportArchives: "Report Archives",
      allCities: "All Cities",
      certifiedPartner: "Certified Partner",
      operationalNow: "Operational Now",
      backToLabs: "Back to Labs",
      testCatalog: "Test Catalog",
      verifiedDirectory: "Verified Directory",
      finalizeOrder: "Finalize Order",
      dispatchRequest: "Dispatch Request Now",
      attachToJourney: "Attach to Active Journey",
      orderBreakdown: "Order Breakdown",
      grandTotal: "Est. Grand Total",
      selectCaseProfile: "Select Case Profile...",
      transmitting: "Transmitting order...",
      noReportsFound: "No reports archived yet",
      findPharmacy: "Find Pharmacy",
      myOrders: "My Orders",
      searchPharm: "Search pharmacies or medications...",
      featuredPharmacies: "Featured Pharmacies",
      shopByCategory: "Shop By Category",
      popularMeds: "Popular Medications",
      orderArchives: "Order Archives",
      dispatchLogistics: "Dispatch Logistics",
      orderComposition: "Order Composition",
      dispatchNow: "Dispatch Request Now",
      attachToPatientJourney: "Attach to Patient Journey",
      estimatedValue: "Estimated Value",
      viewJourneyStatus: "View Journey Status",
      prescribedItems: "Prescribed Items",
      verifiedNetwork: "Verified Network",
      fastDelivery: "Fast & Reliable Delivery",
      selectFromMaster: "Select from master directory",
      typeToSearch: "Type to search...",
      advancedFilters: "Advanced Filters",
      anyExp: "Any Experience",
      expert10Plus: "10+ Years Expert",
      anyBudget: "Any Budget",
      showResults: "Show Results",
      partnerHospital: "Partner Hospital",
      bookAppointment: "Book Appointment",
      noCaseHistory: "No Case History",
      totalVisits: "Total Visits",
      followUpDeleted: "Follow-up deleted",
      apptBooked: "Appointment booked successfully!",
      online: "Online",
      inPerson: "In-Person",
      selectHealthCase: "Select Health Case",
      yearsExp: "Yrs Exp",
      availableToday: "Available Today",
      availableTomorrow: "Available Tomorrow",
      callNow: "Call Now",
      allModes: "All Modes",
      onlineOnly: "Online Only",
      clinicVisit: "Clinic Visit",
      resetAll: "Reset All",
      healthJourneyTitle: "Health Journey",
      newCaseBtn: "New Case",
      activeTab: "Active",
      historyTab: "History",
      archiveEmpty: "Archive Empty",
      followUp: "Follow-up",
      finishBtn: "COMPLETED",
      journeyArchived: "Journey Archived",
      consulted: "Consulted",
      requested: "Requested",
      ordered: "Ordered",
      action: "Action",
      saveSymptoms: "Save Symptoms",
      startAiCheck: "Start AI Symptom Check",
      generateSmartReport: "Generate Smart Report",
      noJourneyFound: "No Health Journey Found",
      createFirstCase: "Create your first case ID to track doctors, labs, and prescriptions automatically.",
      startJourneyBtn: "Start Journey",
      describeFeeling: "Describe how you are feeling (e.g. Headache since morning, slight fever...)",
      manualEntry: "Manual Entry",
      orUseAi: "Or use AI",
      catMedicines: "Medicines",
      catPersonalCare: "Personal Care",
      catHealthDevices: "Health Devices",
      catBabyCare: "Baby Care",
      catNutrition: "Nutrition",
      itemsSuffix: "items",
      viewAll: "View All",
      tablet: "Tablet",
      freeDeliveryOn: "FREE Delivery on",
      offOnMeds: "OFF on medicines",
      flatOff: "Flat 15% OFF",
      viewDetails: "View Details"
    },
    te: {
      welcome: "తిరిగి స్వాగతం",
      portal: "మీ ఆరోగ్య స్నేహితుడు",
      systemLive: "సిస్టమ్ లైవ్",
      quickActions: "త్వరిత చర్యలు",
      recentActivity: "ఇటీవలి కార్యాచరణ",
      securityStatus: "భద్రతా స్థితి",
      healthScore: "ఆరోగ్య స్కోరు",
      excellentStatus: "అద్భుతమైన స్థితి",
      logout: "లాగ్ అవుట్",
      profile: "ప్రొఫైల్ పేజీ",
      settings: "సెట్టింగులు",
      privacy: "గోప్యతా విధానం",
      terms: "నిబంధనలు & షరతులు",
      notifications: "నోటిఫికేషన్లు",
      signedInAs: "ఇలా లాగిన్ అయ్యారు",
      healthJourney: "ఆరోగ్య ప్రయాణం",
      active: "యాక్టివ్",
      history: "కేస్ చరిత్ర",
      symptomChecker: "లక్షణాల తనిఖీ",
      bookDoctor: "డాక్టర్‌ను బుక్ చేయండి",
      bookLab: "ల్యాబ్‌ను బుక్ చేయండి",
      pharmacy: "ఫార్మసీ",
      newCase: "కొత్త కేస్",
      prescriptions: "ప్రిస్క్రిప్షన్లు",
      appointments: "అపాయింట్‌మెంట్‌లు",
      recommendedMeds: "డాక్టర్ సూచించిన మందులు",
      findLab: "ల్యాబ్‌ను కనుగొనండి",
      myReports: "నా నివేదికలు",
      searchLab: "ల్యాబ్ పేరుతో వెతకండి...",
      recommendedTests: "డాక్టర్ సిఫార్సు చేసినవి",
      prescribedFor: "మీ కోసం సూచించినవి:",
      labNav: "ల్యాబ్",
      findPharmacy: "ఫార్మసీని కనుగొనండి",
      myOrders: "నా ఆర్డర్లు",
      searchPharmacy: "ఫార్మసీ పేరుతో వెతకండి...",
      prescriptionReady: "ప్రిస్క్రిప్షన్ సిద్ధంగా ఉంది",
      fromDoctorFor: "డాక్టర్ నుండి మీ కోసం:",
      home: "హోమ్",
      symptom: "లక్షణాల",
      doctor: "డాక్టర్",
      lab: "ల్యాబ్",
      pharmacyNav: "ఫార్మసీ",
      findDoctor: "డాక్టర్‌ను కనుగొనండి",
      searchDoctor: "డాక్టర్ పేరుతో వెతకండి...",
      symptoms: "లక్షణాలు",
      doctorNav: "డాక్టర్",
      rx: "Rx",
      hide: "దాచు",
      journey: "ప్రయాణం",
      premium: "పీమియం",
      noActiveCases: "యాక్టివ్ కేసులు లేవు",
      activeCases: "యాక్టివ్ కేసులు",
      completed: "పూర్తయింది",
      cancelled: "రద్దు చేయబడింది",
      nearbyLabs: "సమీపంలోని డయాగ్నస్టిక్ ల్యాబ్‌లు",
      labInfo: "ల్యాబ్ సమాచారం",
      nearbyPharmacies: "సమీపంలోని ఫార్మసీలు",
      noPharmacies: "ఫార్మసీలు ఏవీ కనుగొనబడలేదు",
      possibleConditions: "సాధ్యమయ్యే పరిస్థితులు",
      recommendedSpecialists: "సిఫార్సు చేయబడిన నిపుణులు",
      creatingJourney: "మీ ప్రయాణాన్ని సృష్టిస్తోంది...",
      createCaseAndContinue: "కేస్ ఐడిని సృష్టించి కొనసాగించండి",
      bloodBank: "రక్త నిధి",
      welcomeMsg: "ఆరోగ్యదాతకు స్వాగతం",
      premiumPortal: "ప్రీమియం హెల్త్‌కేర్ పోర్టల్",
      systemReady: "సిస్టమ్ లైవ్ మరియు సిద్ధంగా ఉంది",
      operational: "అన్ని సేవలు పని చేస్తున్నాయి.",
      welcomeArogya: "ఆరోగ్యదాతకు స్వాగతం!",
      journeyStart: "మీ ఆరోగ్య ప్రయాణం ఇక్కడ ప్రారంభమవుతుంది.",
      quickAccess: "త్వరిత ప్రాప్తి సేవలు",
      privacyTitle: "గోప్యతా విధానం",
      termsTitle: "నిబంధనలు & షరతులు",
      privacyLastUpdate: "చివరిగా అప్‌డేట్ చేయబడింది: ఏప్రిల్ 2026",
      privacyIntro: "మీ గోప్యత ఆరోగ్యదాతకు చాలా ముఖ్యం. మేము మీ క్లినికల్ మరియు వ్యక్తిగత డేటాను ఎలా సేకరిస్తాము, ఉపయోగిస్తాము మరియు రక్షిస్తాము అనేది ఈ విధానం వివరిస్తుంది.",
      privacyDataHeading: "1. డేటా సేకరణ",
      privacyDataText: "మీరు అందించినప్పుడు మాత్రమే మేము వైద్య చరిత్ర, లక్షణాల నివేదికలు మరియు క్లినికల్ డయాగ్నస్టిక్స్‌ను సేకరిస్తాము. డేటా AES-256 ప్రమాణాలను ఉపయోగించి ఎన్‌క్రిప్ట్ చేయబడింది.",
      privacySharingHeading: "2. డేటా షేరింగ్",
      privacySharingText: "మీ ఆరోగ్య రికార్డులు మీరు స్పష్టంగా అధికారం ఇచ్చే వైద్యులు లేదా ల్యాబ్‌లతో మాత్రమే భాగస్వామ్యం చేయబడతాయి.",
      termsIntro: "ఆరోగ్యదాతను ఉపయోగించడం ద్వారా, మీరు మా డిజిటల్ హెల్త్ నెట్‌వర్క్ నిబంధనలకు అంగీకరిస్తున్నారు. మా ప్లాట్‌ఫారమ్ రోగులకు మరియు ధృవీకరించబడిన ప్రొవైడర్లకు మధ్య వంతెనగా పనిచేస్తుంది.",
      termsResponsibilityHeading: "రోగి బాధ్యత",
      termsResponsibilityText: "ఖచ్చితమైన ఆరోగ్య సమాచారాన్ని అందించడానికి వినియోగదారులు బాధ్యత వహిస్తారు. అత్యవసర వైద్య సేవల కోసం ఆరోగ్యదాత ప్రత్యామ్నాయం కాదు.",
      termsIntegrityHeading: "కేస్ ఐడి సమగ్రత",
      termsIntegrityText: "అన్ని బుకింగ్‌లు మరియు డయాగ్నస్టిక్స్ తప్పనిసరిగా చెల్లుబాటు అయ్యే కేస్ ఐడికి లింక్ చేయబడాలి.",
      returnDashboard: "డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళు",
      accountSettings: "ఖాతా సెట్టింగ్‌లు",
      securityLogin: "భద్రత & లాగిన్",
      notificationsLabel: "నోటిఫికేషన్లు",
      appTheme: "యాప్ థీమ్",
      languageLabel: "భాష",
      verifiedPatient: "ధృవీకరించబడిన రోగి",
      signInTitle: "మీ ఖాతాకు లాగిన్ అవ్వండి",
      identityLabel: "గుర్తింపు ఐడెంటిఫైయర్",
      securityKeyLabel: "భద్రతా కీ",
      forgotKey: "భద్రతా కీని మర్చిపోయారా?",
      systemDetection: "సిస్టమ్ గుర్తింపు",
      authenticatingAs: "గా లాగిన్ అవుతున్నారు",
      verifyIdentity: "గుర్తింపును ధృవీకరించు",
      socialAccess: "సోషల్ యాక్సెస్",
      dontHaveAccount: "ఖాతా లేదా?",
      signUp: "సైన్ అప్",
      back: "వెనుకకు",
      yourHealth: "మీ ఆరోగ్యం,",
      ourPriority: "మా ప్రాధాన్యత",
      brandingDesc: "అందరికీ, ప్రతిచోటా సురక్షితమైన, నమ్మదగిన మరియు అందుబాటులో ఉండే ఆరోగ్య సంరక్షణ.",
      isoCertified: "ISO 27001 ధృవీకరించబడిన ప్లాట్‌ఫారమ్",
      symptomCheckerTitle: "లక్షణాల తనిఖీ",
      poweredByGemini: "జెమిని AI ద్వారా నడపబడుతుంది",
      howAreYouFeeling: "ఈ రోజు మీకు ఎలా అనిపిస్తోంది?",
      describeSymptomsDetail: "మీ లక్షణాలను వివరంగా వివరించండి...",
      symptomPlaceholder: "ఉదాహరణ: నాకు 2 రోజుల నుండి తలనొప్పి, జ్వరం మరియు ఒళ్లు నొప్పులు ఉన్నాయి...",
      commonExamples: "సాధారణ ఉదాహరణలు:",
      diagnosedCount: "10వేల+ మందికి నిర్ధారణ",
      accuracyRate: "98% ఖచ్చితత్వ రేటు",
      analyzeSymptomsBtn: "లక్షణాలను విశ్లేషించండి",
      analyzing: "విశ్లేషిస్తోంది...",
      medicalIntelligenceReport: "మెడికల్ ఇంటెలిజెన్స్ రిపోర్ట్",
      conditions: "పరిస్థితులు",
      nextSteps: "తదుపరి దశలు",
      specialists: "నిపుణులు",
      journeyStarted: "ప్రయాణం ప్రారంభమైంది!",
      createCaseBtn: "కేస్ ఐడిని సృష్టించి డాక్టర్‌ను బుక్ చేయండి",
      initializing: "ప్రారంభిస్తోంది...",
      lowUrgency: "తక్కువ అత్యవసరం",
      moderateUrgency: "మితమైన అత్యవసరం",
      immediateCare: "తక్షణ సంరక్షణ అవసరం",
      step1: "లక్షణాలను వివరించండి",
      step2: "విశ్లేషణను సమీక్షించండి",
      step3: "సాధ్యమయ్యే పరిస్థితులు",
      step4: "సిఫార్సులు",
      diagnosticLabs: "డయాగ్నస్టిక్ ల్యాబ్స్",
      reportArchives: "నివేదికల ఆర్కైవ్స్",
      allCities: "అన్ని నగరాలు",
      certifiedPartner: "ధృవీకరించబడిన భాగస్వామి",
      operationalNow: "ప్రస్తుతం అందుబాటులో ఉంది",
      backToLabs: "ల్యాబ్స్ కి తిరిగి వెళ్ళు",
      testCatalog: "పరీక్షల కేటలాగ్",
      verifiedDirectory: "ధృవీకరించబడిన డైరెక్టరీ",
      finalizeOrder: "ఆర్డర్‌ను ఖరారు చేయండి",
      dispatchRequest: "రిక్వెస్ట్ పంపండి",
      attachToJourney: "యాక్టివ్ జర్నీకి జత చేయండి",
      orderBreakdown: "ఆర్డర్ వివరాలు",
      grandTotal: "మొత్తం అంచనా ధర",
      selectCaseProfile: "కేస్ ప్రొఫైల్‌ను ఎంచుకోండి...",
      transmitting: "ఆర్డర్ పంపుతోంది...",
      noReportsFound: "నివేదికలు ఇంకా ఏవీ లేవు",
      searchPharm: "ఫార్మసీలు లేదా మందుల కోసం వెతకండి...",
      featuredPharmacies: "ప్రముఖ ఫార్మసీలు",
      shopByCategory: "వర్గం ద్వారా షాపింగ్ చేయండి",
      popularMeds: "ప్రముఖ మందులు",
      orderArchives: "ఆర్డర్ ఆర్కైవ్స్",
      dispatchLogistics: "డిస్పాచ్ లాజిస్టిక్స్",
      orderComposition: "ఆర్డర్ వివరాలు",
      dispatchNow: "రిక్వెస్ట్ పంపండి",
      attachToPatientJourney: "పేషెంట్ జర్నీకి జత చేయండి",
      estimatedValue: "అంచనా విలువ",
      viewJourneyStatus: "జర్నీ స్థితిని చూడండి",
      prescribedItems: "సూచించిన మందులు",
      verifiedNetwork: "ధృవీకరించబడిన నెట్‌వర్క్",
      fastDelivery: "వేగవంతమైన డెలివరీ",
      selectFromMaster: "మాస్టర్ డైరెక్టరీ నుండి ఎంచుకోండి",
      typeToSearch: "వెతకడానికి టైప్ చేయండి...",
      advancedFilters: "అడ్వాన్స్‌డ్ ఫిల్టర్లు",
      anyExp: "ఏదైనా అనుభవం",
      expert10Plus: "10+ ఏళ్ల అనుభవం",
      anyBudget: "ఏదైనా బడ్జెట్",
      showResults: "ఫలితాలను చూపించు",
      partnerHospital: "భాగస్వామ్య ఆసుపత్రి",
      bookAppointment: "అపాయింట్‌మెంట్ బుక్ చేయండి",
      noCaseHistory: "కేస్ చరిత్ర లేదు",
      totalVisits: "మొత్తం సందర్శనలు",
      followUpDeleted: "ఫాలో-అప్ తొలగించబడింది",
      apptBooked: "అపాయింట్‌మెంట్ విజయవంతంగా బుక్ చేయబడింది!",
      online: "ఆన్‌లైన్",
      inPerson: "నేరుగా",
      selectHealthCase: "ఆరోగ్య కేస్‌ను ఎంచుకోండి",
      yearsExp: "ఏళ్ల అనుభవం",
      availableToday: "ఈ రోజు అందుబాటులో ఉంది",
      availableTomorrow: "రేపు అందుబాటులో ఉంది",
      callNow: "ఇప్పుడే కాల్ చేయండి",
      allModes: "అన్ని విధాలు",
      onlineOnly: "ఆన్‌లైన్ మాత్రమే",
      clinicVisit: "క్లినిక్ సందర్శన",
      resetAll: "అన్నీ రీసెట్ చేయండి",
      healthJourneyTitle: "ఆరోగ్య ప్రయాణం",
      newCaseBtn: "కొత్త కేస్",
      activeTab: "యాక్టివ్",
      historyTab: "చరిత్ర",
      archiveEmpty: "ఆర్కైవ్ ఖాళీగా ఉంది",
      followUp: "ఫాలో-అప్",
      finishBtn: "COMPLETED",
      journeyArchived: "ప్రయాణం ఆర్కైవ్ చేయబడింది",
      consulted: "సంప్రదించారు",
      requested: "కోరబడింది",
      ordered: "ఆర్డర్ చేయబడింది",
      action: "చర్య",
      saveSymptoms: "లక్షణాలను సేవ్ చేయి",
      startAiCheck: "AI లక్షణాల తనిఖీని ప్రారంభించండి",
      generateSmartReport: "స్మార్ట్ రిపోర్ట్ సృష్టించండి",
      noJourneyFound: "ఆరోగ్య ప్రయాణం ఏదీ కనుగొనబడలేదు",
      createFirstCase: "డాక్టర్లు, ల్యాబ్లు మరియు ప్రిస్క్రిప్షన్లను స్వయంచాలకంగా ట్రాక్ చేయడానికి మీ మొదటి కేస్ ఐడిని సృష్టించండి.",
      startJourneyBtn: "ప్రయాణాన్ని ప్రారంభించండి",
      describeFeeling: "మీకు ఎలా అనిపిస్తుందో వివరించండి (ఉదా. ఉదయం నుండి తలనొప్పి, స్వల్ప జ్వరం...)",
      manualEntry: "మాన్యువల్ ఎంట్రీ",
      orUseAi: "లేదా AIని ఉపయోగించండి",
      catMedicines: "మందులు",
      catPersonalCare: "వ్యక్తిగత సంరక్షణ",
      catHealthDevices: "ఆరోగ్య పరికరాలు",
      catBabyCare: "శిశు సంరక్షణ",
      catNutrition: "పోషకాహారం",
      itemsSuffix: "వస్తువులు",
      viewAll: "అన్నీ చూడండి",
      tablet: "టాబ్లెట్",
      freeDeliveryOn: "దీనిపై ఉచిత డెలివరీ",
      offOnMeds: "మందులపై తగ్గింపు",
      flatOff: "ఫ్లాట్ 15% తగ్గింపు",
      viewDetails: "వివరాలను చూడండి"
    }
  };

  const t = isLanguageTelugu ? translations.te : translations.en;

  const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const Logo = ({ size = "w-10 h-10", iconSize = "w-6 h-6", showText = false, light = false }) => (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className={`relative ${size} transition-all duration-500 group-hover:scale-110`}>
        {/* Main Badge */}
        <div className={`absolute inset-0 bg-gradient-to-br ${light ? 'from-white/20 to-white/5' : 'from-[#0F9D58] to-[#34C759]'} rounded-xl shadow-lg transform group-hover:rotate-6 transition-transform`} />

        {/* Gloss Effect */}
        <div className="absolute inset-0 bg-white/10 rounded-xl backdrop-blur-[2px] border border-white/20" />

        {/* Medical Cross (Plus) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Plus className={`${iconSize} ${light ? 'text-white' : 'text-white'} drop-shadow-md`} strokeWidth={3.5} />
        </div>

        {/* Subtle Heart Overlay */}
        <div className="absolute -top-1 -right-1">
          <Heart className="w-3 h-3 text-red-500 fill-red-500 drop-shadow-sm animate-pulse" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1 className={`text-xl font-black tracking-tighter uppercase leading-none ${light ? 'text-white' : 'text-white'}`}>Arogyadatha</h1>
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none mt-1 ${light ? 'text-white/60' : 'text-emerald-200'}`}>Your Health Friend</span>
        </div>
      )}
    </div>
  );

  // Translations and ID generation logic remained...

  const generateArogyadathaId = async (role: UserRole): Promise<string> => {
    const counterRef = doc(db, 'counters', 'user_ids');
    const roleKeyMap: Record<string, string> = {
      'patient': 'patientCount',
      'doctor': 'doctorCount',
      'lab': 'labCount',
      'pharmacy': 'pharmacyCount'
    };
    const prefixMap: Record<string, string> = {
      'patient': 'PAT',
      'doctor': 'DOC',
      'lab': 'LAB',
      'pharmacy': 'PHARM'
    };

    const roleKey = roleKeyMap[role];
    const prefix = prefixMap[role];
    if (!roleKey || !prefix) return 'ADM-000';

    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let newCount = 1;

      if (counterDoc.exists()) {
        newCount = (counterDoc.data()[roleKey] || 0) + 1;
        transaction.update(counterRef, { [roleKey]: newCount });
      } else {
        transaction.set(counterRef, { [roleKey]: newCount });
      }

      return `${prefix}-${newCount.toString().padStart(3, '0')}`;
    });
  };

  const features = [
    { icon: ShieldCheck, title: "Secure Data", desc: "Your health records are encrypted and safe." },
    { icon: Activity, title: "Real-time Access", desc: "Access your medical history anywhere, anytime." },
    { icon: UserCircle, title: "Unified ID", desc: "A single ID for hospitals, labs, and pharmacies." }
  ];

  // Fetch User Cases
  useEffect(() => {
    if (user && user.role === 'patient') {
      const casesRef = collection(db, 'patients', user.uid, 'cases');
      const apptRef = doc(db, 'appointments', user.uid);

      let baseCases: any[] = [];
      let apptData: any = null;

      const mergeCases = () => {
        if (!baseCases.length) {
          setUserCases([]);
          return;
        }
        if (!apptData || !apptData.cases) {
          setUserCases([...baseCases]);
          return;
        }

        const mergedCases = baseCases.map(c => {
          const ac = apptData?.cases?.find((x: any) => x.caseId === c.caseId);
          return {
            ...c,
            // Only merge if we have external data, otherwise keep existing
            appointments: ac?.bookings || c.appointments || [],
            labRequests: ac?.labRequests || c.labRequests || [],
            pharmacyOrders: ac?.pharmacyOrders || c.pharmacyOrders || []
          }
        });
        setUserCases(mergedCases);
      };

      const unsubCases = onSnapshot(query(casesRef), (snapshot) => {
        const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        baseCases = cases.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);
        mergeCases();
      }, (error) => handleFirestoreError(error, OperationType.LIST, `patients/${user.uid}/cases`));

      const unsubAppts = onSnapshot(apptRef, (snapshot) => {
        if (snapshot.exists()) {
          apptData = snapshot.data();
        } else {
          apptData = null;
        }
        mergeCases();
      });

      return () => {
        unsubCases();
        unsubAppts();
      };
    }
  }, [user]);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [experience, setExperience] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [doctorType, setDoctorType] = useState<'hospital' | 'independent'>('hospital');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [entityName, setEntityName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [adminCode, setAdminCode] = useState('');

  useEffect(() => {
    const fetchLandingConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'landing_page_config', 'main'));
        if (snap.exists()) {
          const config = snap.data();
          setLandingConfig(config);
          if (config.isEnabled === false && view === 'landing') {
            setView('login');
          }
        }
      } catch (e) {
        console.error("Failed to fetch landing config:", e);
      }
    };
    fetchLandingConfig();
  }, []);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (firebaseUser) {
        try {
          // Listen to users collection first for role index
          const userRef = doc(db, 'users', firebaseUser.uid);
          const indexDoc = await getDoc(userRef);

          if (indexDoc.exists()) {
            const indexData = indexDoc.data();
            const roleCollectionMap: Record<string, string> = {
              'patient': 'patients', 'doctor': 'doctors', 'lab': 'labs', 'pharmacy': 'pharmacies', 'admin': 'admins'
            };
            const collectionName = roleCollectionMap[indexData.role] || 'users';

            // Set up real-time listener for the full profile
            profileUnsubscribe = onSnapshot(doc(db, collectionName, firebaseUser.uid), (snap) => {
              if (snap.exists()) {
                const profile = { uid: firebaseUser.uid, ...snap.data() } as UserProfile;
                setUser(profile);

                // Load language preference - Priority: Real-time Profile > Index
                const userLang = profile.language || indexData.language;
                if (userLang) {
                  setIsLanguageTelugu(userLang === 'te');
                  localStorage.setItem('arogya_lang', userLang);
                }

                // If we are on landing/login, move to dashboard
                if (['landing', 'login', 'signup', 'hero'].includes(view)) {
                  setView('dashboard');
                }
              } else {
                // Fallback to index if profile missing
                setUser({ uid: firebaseUser.uid, ...indexData } as UserProfile);
                if (['landing', 'login', 'signup', 'hero'].includes(view)) {
                  setView('dashboard');
                }
              }
            });
          } else {
            setUser(null);
            setView('landing');
          }
        } catch (error) {
          console.error("Error setting up profile listener:", error);
          setUser(null);
          setView('landing');
        }
      } else {
        setUser(null);
        const authViews = ['dashboard', 'symptom-checker', 'book-doctor', 'book-lab', 'pharmacy', 'profile', 'settings', 'privacy', 'terms'];
        if (authViews.includes(view)) setView('login');
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (view === 'dashboard' && shouldScrollToJourney && journeyRef.current) {
      setTimeout(() => {
        journeyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setShouldScrollToJourney(false);
      }, 300);
    }
  }, [view, shouldScrollToJourney]);

  // Sync Language to LocalStorage & Firestore
  useEffect(() => {
    const lang = isLanguageTelugu ? 'te' : 'en';
    localStorage.setItem('arogya_lang', lang);

    const syncLanguage = async () => {
      if (!user?.uid) return;

      try {
        const roleCollectionMap: Record<string, string> = {
          'patient': 'patients', 'doctor': 'doctors', 'lab': 'labs', 'pharmacy': 'pharmacies', 'admin': 'admins'
        };
        const collectionName = roleCollectionMap[user.role] || 'users';

        // Update both the main index and the role-specific collection
        const updates = { language: lang };
        const writes = [
          updateDoc(doc(db, 'users', user.uid), updates),
          updateDoc(doc(db, collectionName, user.uid), updates)
        ];
        await Promise.all(writes);
      } catch (e) {
        console.error("Error syncing language:", e);
      }
    };

    syncLanguage();
  }, [isLanguageTelugu, user?.uid, user?.role]);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const indexData = userDoc.data();
        const roleCollectionMap: Record<string, string> = {
          'patient': 'patients',
          'doctor': 'doctors',
          'lab': 'labs',
          'pharmacy': 'pharmacies',
          'admin': 'admins'
        };
        const collectionName = roleCollectionMap[indexData.role] || 'users';
        const profileDoc = await getDoc(doc(db, collectionName, firebaseUser.uid));

        const profile = (profileDoc.exists() ? profileDoc.data() : indexData) as UserProfile;
        setUser(profile);
        setView('dashboard');
        toast.success("Welcome back!");
      } else {
        // New user via Google - default to patient
        const arogyadathaId = await generateArogyadathaId('patient');
        const profileData: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'Google User',
          role: 'patient',
          phoneNumber: firebaseUser.phoneNumber || '',
          arogyadathaId,
          createdAt: serverTimestamp(),
          dob: '', // To be filled later
          language: isLanguageTelugu ? 'te' : 'en'
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), profileData);
        await setDoc(doc(db, 'patients', firebaseUser.uid), profileData);

        setUser(profileData);
        setView('dashboard');
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (selectedRole === 'admin' && adminCode !== 'AROGYA-ADMIN-2026') {
      toast.error("Invalid Admin Access Code");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    // Phone validation: exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const firebaseUser = userCredential.user;

      const arogyadathaId = await generateArogyadathaId(selectedRole);

      const profileData: UserProfile = {
        uid: firebaseUser.uid,
        email: trimmedEmail,
        fullName: selectedRole === 'lab' ? entityName : fullName,
        role: selectedRole,
        phoneNumber: trimmedPhone,
        arogyadathaId,
        createdAt: serverTimestamp(),
        language: isLanguageTelugu ? 'te' : 'en'
      };

      if (selectedRole === 'patient') {
        profileData.dob = dob;
      } else if (selectedRole === 'doctor') {
        profileData.experience = experience;
        profileData.registrationNumber = regNumber;
        profileData.specialization = specialization;
        profileData.qualification = qualification;
        profileData.doctorType = doctorType;
      } else if (selectedRole === 'lab') {
        profileData.labName = entityName;
        profileData.licenseNumber = licenseNumber;
        profileData.address = address;
        profileData.city = city;
        profileData.state = state;
      } else if (selectedRole === 'pharmacy') {
        profileData.pharmacyName = entityName;
        profileData.licenseNumber = licenseNumber;
        profileData.address = address;
        profileData.city = city;
        profileData.state = state;
      }

      try {
        // Parallelize writes for speed
        const roleCollectionMap: Record<string, string> = {
          'patient': 'patients',
          'doctor': 'doctors',
          'lab': 'labs',
          'pharmacy': 'pharmacies',
          'admin': 'admins'
        };
        const roleCollection = roleCollectionMap[selectedRole];

        const writes = [setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          email: trimmedEmail,
          role: selectedRole,
          arogyadathaId,
          phoneNumber: trimmedPhone,
          fullName: profileData.fullName,
          language: isLanguageTelugu ? 'te' : 'en'
        })];

        if (roleCollection) {
          writes.push(setDoc(doc(db, roleCollection, firebaseUser.uid), profileData));
        }

        await Promise.all(writes);

        setUser(profileData);
        setView('dashboard');
        if (selectedRole === 'patient') setShowLocationPrompt(true);
        toast.success("Account created successfully!");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/network-request-failed') {
        toast.error("Network error. Please check your connection or Firebase configuration.");
      } else {
        toast.error(error.message || "Signup failed");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const trimmedInput = loginInput.trim();
      let loginEmail = trimmedInput;

      // If not an email, find the email associated with the phone or ID
      if (!trimmedInput.includes('@')) {
        // Optimization: If role was already detected, we might already have the email
        // But for security and accuracy, we'll do a quick check if not already found
        let q;
        if (/^\d{10}$/.test(trimmedInput)) {
          q = query(collection(db, 'users'), where('phoneNumber', '==', trimmedInput));
        } else if (/^(PAT|DOC|LAB|PHARM)-\d+$/.test(trimmedInput.toUpperCase())) {
          q = query(collection(db, 'users'), where('arogyadathaId', '==', trimmedInput.toUpperCase()));
        } else {
          throw new Error("Invalid login input. Use Email, 10-digit Phone, or Arogyadatha ID.");
        }

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          throw new Error("User not found with this Phone/ID");
        }
        const userData = querySnapshot.docs[0].data() as UserProfile;
        loginEmail = userData.email;
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      } catch (authError: any) {
        // Fallback: If user not found in Auth, check if they were pre-registered via Excel in Firestore
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          const roles = ['patients', 'doctors', 'hospitals', 'labs', 'pharmacies'];
          let preRegUser: any = null;
          let foundRole = '';

          // Optimized parallel search
          const results = await Promise.all(roles.map(async (role) => {
            const q = query(collection(db, role), where('email', '==', loginEmail));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const data = snap.docs[0].data();
              if (data.initialPassword === password) {
                return { ...data, id: snap.docs[0].id, collection: role };
              }
            }
            return null;
          }));

          preRegUser = results.find(r => r !== null);
          if (preRegUser) foundRole = preRegUser.role;

          if (preRegUser) {
            // Auto-activate account: Create Auth user and sync data
            toast.loading("Activating your professional account...");
            const newAuth = await createUserWithEmailAndPassword(auth, loginEmail, password);
            const uid = newAuth.user.uid;

            // 1. Save to main users index
            await setDoc(doc(db, 'users', uid), {
              uid,
              email: loginEmail,
              fullName: preRegUser.fullName || preRegUser.hospitalName || preRegUser.labName || preRegUser.pharmacyName,
              role: foundRole,
              arogyadathaId: preRegUser.arogyadathaId,
              createdAt: serverTimestamp()
            });

            // 2. Move data to UID-based document in the correct collection
            const { id, initialPassword, ...profileData } = preRegUser;
            await setDoc(doc(db, preRegUser.collection, uid), {
              ...profileData,
              uid,
              passwordSet: true,
              activatedAt: serverTimestamp()
            });

            // 3. Cleanup the old pre-reg doc
            await deleteDoc(doc(db, preRegUser.collection, preRegUser.id));

            toast.dismiss();
            toast.success("Account activated successfully!");
            userCredential = newAuth;
          } else {
            throw authError;
          }
        } else {
          throw authError;
        }
      }

      const firebaseUser = userCredential.user;
      localStorage.setItem('lastLoginInput', trimmedInput);

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const indexData = userDoc.data();
        const roleCollectionMap: Record<string, string> = {
          'patient': 'patients',
          'doctor': 'doctors',
          'lab': 'labs',
          'pharmacy': 'pharmacies',
          'admin': 'admins'
        };
        const collectionName = roleCollectionMap[indexData.role] || 'users';
        const profileDoc = await getDoc(doc(db, collectionName, firebaseUser.uid));

        const profile = (profileDoc.exists() ? profileDoc.data() : indexData) as UserProfile;
        setUser(profile);
        setView('dashboard');

        toast.success(`Welcome back, ${profile.fullName.split(' ')[0]}!`);
      } else {
        toast.error("User profile not found");
        signOut(auth);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
        ? "Invalid credentials. Please check your Email/ID and Password."
        : error.message || "Login failed";
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setView('login');
    setIsMenuOpen(false);
    toast.success("Logged out successfully");
  };

  // Cleanup signup form when entering signup view
  useEffect(() => {
    if (view === 'signup') {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setPhone('');
      setDob('');
      setExperience('');
      setRegNumber('');
      setSpecialization('');
      setQualification('');
      setAddress('');
      setCity('');
      setState('');
      setEntityName('');
      setLicenseNumber('');
    }
  }, [view]);

  useEffect(() => {
    const detectRole = async () => {
      const trimmedInput = loginInput.trim();
      if (trimmedInput.length < 3) {
        setDetectedRole(null);
        return;
      }

      // Check cache first for instant response
      if (roleCache[trimmedInput]) {
        setDetectedRole(roleCache[trimmedInput]);
        return;
      }

      let q;
      if (trimmedInput.includes('@')) {
        q = query(collection(db, 'users'), where('email', '==', trimmedInput));
      } else if (/^\d{10}$/.test(trimmedInput)) {
        q = query(collection(db, 'users'), where('phoneNumber', '==', trimmedInput));
      } else if (/^(PAT|DOC|LAB|PHARM)-\d+$/.test(trimmedInput.toUpperCase())) {
        q = query(collection(db, 'users'), where('arogyadathaId', '==', trimmedInput.toUpperCase()));
      } else {
        setDetectedRole(null);
        return;
      }

      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data() as UserProfile;
          setDetectedRole(userData.role);
          // Cache the result
          setRoleCache(prev => ({ ...prev, [trimmedInput]: userData.role }));
        } else {
          setDetectedRole(null);
        }
      } catch (error) {
        console.error("Error detecting role:", error);
      }
    };

    const timer = setTimeout(detectRole, 200);
    return () => clearTimeout(timer);
  }, [loginInput]);

  // Optimized Location Logic: Only prompt if NO location exists OR if District has changed
  useEffect(() => {
    if (!user || (user.role !== 'patient' && user.role !== 'admin') || view !== 'dashboard' || showLocationPrompt) return;

    const checkLocationNecessity = () => {
      if (!navigator.geolocation) return;

      // 1. If NO district is saved, prompt immediately
      if (!user.district) {
        setShowLocationPrompt(true);
        return;
      }

      // 2. Check if current location matches saved district
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // Quick check: If coordinates are very close to saved ones, don't even geocode (save API calls)
        if (user.latitude && user.longitude) {
          const latDiff = Math.abs(latitude - user.latitude);
          const lngDiff = Math.abs(longitude - user.longitude);
          if (latDiff < 0.05 && lngDiff < 0.05) return; // Within ~5km, assume same district
        }

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          const data = await res.json();
          const currentDistrict = data.address?.county || data.address?.state_district || data.address?.city;

          if (currentDistrict) {
            const normalize = (s: string) => s.toLowerCase().replace(/\bdistrict\b/gi, '').trim();
            const isDifferent = normalize(currentDistrict) !== normalize(user.district || '');

            // Only prompt if they are in a NEW district that we haven't prompted for yet
            if (isDifferent && normalize(currentDistrict) !== normalize(user.last_prompted_district || '')) {
              setShowLocationPrompt(true);
              
              // Store that we prompted for this district to avoid re-prompting this session if they skip
              const userRef = doc(db, 'users', user.uid);
              const roleRef = doc(db, user.role === 'admin' ? 'admins' : 'patients', user.uid);
              await Promise.all([
                updateDoc(userRef, { last_prompted_district: currentDistrict }),
                updateDoc(roleRef, { last_prompted_district: currentDistrict })
              ]);
            }
          }
        } catch (e) {
          console.warn("Location verification failed", e);
        }
      }, () => {}, { enableHighAccuracy: false, timeout: 5000 });
    };

    // Check 2 seconds after dashboard load
    const timer = setTimeout(checkLocationNecessity, 2000);
    return () => clearTimeout(timer);
  }, [user?.uid, user?.district, user?.last_prompted_district, view, showLocationPrompt]);

  if (loading) {
    return <LoadingScreen message="Initializing Your Health Friend..." />;
  }

  const pageVariants = {
    initial: { opacity: 0, scale: 0.99, y: 2 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 1.01, y: -2 }
  };

  const pageTransition = {
    duration: 0.1
  };

  return (
    <div className={`${['landing', 'hero', 'role-selection', 'signup', 'login'].includes(view) ? 'min-h-screen' : 'h-screen overflow-hidden'} ${isDarkMode ? 'dark bg-slate-950' : 'bg-[#F0F9F4]'} font-sans relative flex flex-col`}>
      <Toaster position="top-center" richColors />

      <AnimatePresence mode="wait">
        {authLoading && (
          <LoadingScreen key="auth-loading" message="Authenticating..." />
        )}
      </AnimatePresence>

      <div
        className={`flex flex-col ${['landing', 'login', 'signup', 'role-selection', 'hero'].includes(view) ? 'min-h-screen' : 'h-screen overflow-hidden'} bg-[#F0F9F4]`}
      >
        <React.Suspense fallback={<DashboardSkeleton />}>
          <AnimatePresence mode="wait">
            {view === 'landing' && (
              <motion.div
                key="landing"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="min-h-screen"
              >
                <LandingPage
                  onLoginClick={() => setView('login')}
                  onSignUpClick={() => setView('role-selection')}
                />
              </motion.div>
            )}

            {view === 'hero' && (
              <motion.div
                key="hero"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="min-h-screen flex flex-col items-center justify-center p-6 bg-radial-[at_50%_50%,#F0F9F4_0%,#E0F2F1_100%]"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mb-8 flex justify-center"
                  >
                    <Logo size="w-24 h-24" iconSize="w-12 h-12" />
                  </motion.div>
                  <h1 className="text-5xl font-black text-[#1F2937] mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-[#1F2937] to-[#4B5563] pb-1">Arogyadatha</h1>
                  <p className="text-lg text-[#6B7280] font-medium max-w-xs mx-auto leading-tight">One Patient, One ID. <span className="text-[#10B981] font-bold">Instant</span> Healthcare for All.</p>
                </div>

                <div className="w-full max-w-md mb-8 relative h-40">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Card className="border border-[#10B981]/20 shadow-xl bg-white/90 backdrop-blur-xl w-full overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
                        <CardContent className="py-6 flex items-center gap-4 px-6">
                          <div className="w-12 h-12 bg-[#F0F9F4] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            {React.createElement(features[featureIndex].icon, { className: "w-6 h-6 text-[#10B981]" })}
                          </div>
                          <div className="text-left">
                            <h3 className="font-black text-lg mb-0.5 text-[#1F2937]">{features[featureIndex].title}</h3>
                            <p className="text-xs text-[#6B7280] font-medium leading-snug">{features[featureIndex].desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-md mb-8">
                  <Button
                    onClick={() => setView('login')}
                    className="w-full h-14 text-lg font-black bg-[#10B981] hover:bg-[#059669] shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all active:scale-95 rounded-2xl text-white"
                  >
                    Login Now
                  </Button>
                  <Button
                    onClick={() => setView('role-selection')}
                    variant="outline"
                    className="w-full h-14 text-lg font-black border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/5 hover:-translate-y-1 transition-all active:scale-95 rounded-2xl"
                  >
                    Create Account
                  </Button>
                </div>

                <div className="flex gap-2 mt-auto pb-4">
                  {features.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === featureIndex ? 'w-8 bg-[#10B981]' : 'w-2 bg-[#10B981]/20'}`}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'role-selection' && (
              <motion.div
                key="role-selection"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="min-h-screen bg-gradient-to-br from-[#E0F2F1] to-[#F0F9F4] flex flex-col items-center justify-center p-4 sm:p-6 relative font-sans"
              >
                {/* Floating Back Button */}
                <button
                  onClick={() => setView('landing')}
                  className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center justify-center w-10 h-10 bg-white rounded-full text-[#6B7280] hover:text-[#0F9D58] hover:bg-emerald-50 shadow-sm transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-full max-w-[800px] bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl shadow-[#10B981]/10 overflow-hidden relative z-10 p-6 sm:p-10 md:p-12 border border-gray-100">
                  <div className="text-center mb-8 sm:mb-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl mb-4 border border-emerald-100 shadow-sm">
                      <img src="/assets/images/logo.png" alt="Arogyadatha" className="w-8 h-8 object-contain" />
                    </div>
                    <h2 className="text-[22px] sm:text-[28px] font-black text-[#1F2937] tracking-tight leading-tight">Select Your Role</h2>
                    <p className="text-[12px] sm:text-[14px] text-[#6B7280] font-bold mt-1.5 uppercase tracking-widest">Choose how you want to use Arogyadatha</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
                    {[
                      { id: 'patient', icon: User, title: "Patient", desc: "Manage health" },
                      { id: 'doctor', icon: Stethoscope, title: "Doctor", desc: "Treat patients" },
                      { id: 'lab', icon: FlaskConical, title: "Lab", desc: "Test reports" },
                      { id: 'pharmacy', icon: Pill, title: "Pharmacy", desc: "Prescriptions" },
                      { id: 'admin', icon: ShieldAlert, title: "Admin", desc: "Platform" }
                    ].map((role, i) => (
                      <motion.div
                        key={role.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        className={role.id === 'admin' ? 'col-span-2 md:col-span-1' : ''}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRole(role.id as UserRole);
                            setView('signup');
                          }}
                          className="w-full group text-left p-4 sm:p-5 rounded-[16px] border border-gray-200 hover:border-[#0F9D58] bg-white hover:bg-emerald-50/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center h-full gap-2 sm:gap-3"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] bg-gray-50 group-hover:bg-[#0F9D58] flex items-center justify-center transition-colors duration-300">
                            <role.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#9CA3AF] group-hover:text-white transition-colors duration-300" />
                          </div>
                          <div className="text-center">
                            <h3 className="font-black text-[13px] sm:text-[15px] text-[#1F2937] group-hover:text-[#0F9D58] transition-colors">{role.title}</h3>
                            <p className="text-[9px] sm:text-[10px] text-[#6B7280] font-bold mt-0.5 uppercase tracking-widest leading-tight">{role.desc}</p>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-center pt-6 border-t border-gray-100">
                    <p className="text-[11px] sm:text-[12px] text-[#6B7280] font-bold">
                      Already have an account? <button onClick={() => setView('login')} className="text-[#0F9D58] font-bold hover:underline">Sign In</button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'signup' && (
              <motion.div
                key="signup"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="min-h-screen bg-gradient-to-br from-[#E0F2F1] to-[#F0F9F4] flex items-center justify-center p-3 sm:p-6 relative font-sans"
              >
                {/* Main Card Container */}
                <div className="w-full max-w-[1100px] bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl shadow-[#10B981]/10 overflow-hidden flex flex-col md:flex-row relative z-10 md:h-auto">

                  {/* Floating Back Button (Mobile only inside the card) */}
                  <button
                    onClick={() => setView('landing')}
                    className="md:hidden absolute top-4 right-4 z-50 flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Branding Section (Left) - Desktop & Tablet */}
                  <div className="hidden md:flex w-[45%] bg-[#0F9D58] relative flex-col justify-between p-8 lg:p-10 text-white overflow-hidden shrink-0 border-r border-[#0e8a4d]">
                    {/* Floating Back Button (Desktop) */}
                    <button
                      onClick={() => setView('landing')}
                      className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/10 hover:bg-black/20 rounded-full transition-all text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>

                    {/* Background Layers */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#10B981] via-[#0F9D58] to-[#059669]" />

                    {/* Leaf Patterns - SVG Reconstruction */}
                    <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
                      <svg className="absolute -left-20 -bottom-20 w-[140%] h-[140%]" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M400 800C400 800 500 600 500 400C500 200 400 0 400 0C400 0 300 200 300 400C300 600 400 800 400 800Z" fill="white" fillOpacity="0.1" />
                        <path d="M200 700C200 700 350 550 350 350C350 150 200 0 200 0C200 0 50 150 50 350C50 550 200 700 200 700Z" fill="white" fillOpacity="0.15" transform="rotate(-20 200 700)" />
                        <path d="M600 750C600 750 700 600 700 450C700 300 600 150 600 150C600 150 500 300 500 450C500 600 600 750 600 750Z" fill="white" fillOpacity="0.1" transform="rotate(15 600 750)" />
                      </svg>
                    </div>

                    {/* Top Left Dot Grid */}
                    <div className="absolute top-20 left-8 z-20 grid grid-cols-6 gap-2 opacity-30">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
                      ))}
                    </div>

                    {/* Branding Content */}
                    <div className="relative z-40 space-y-10 lg:space-y-12 mt-16">
                      <div className="flex flex-col items-center w-fit">
                        <div className="w-16 h-16 bg-white rounded-[16px] p-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center justify-center">
                          <img src="/assets/images/logo.png" alt="Arogyadatha" className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-4 text-center">
                          <h2 className="text-xl font-extrabold tracking-tight leading-none text-white">Arogyadatha</h2>
                          <p className="text-[7px] font-bold tracking-[0.3em] uppercase text-[#A7F3D0] mt-1.5">Digital Health Network</p>
                        </div>
                      </div>

                      <div className="space-y-3 max-w-[260px]">
                        <div className="space-y-1">
                          <h2 className="text-[26px] font-medium text-white/90 tracking-tight leading-none">Join the,</h2>
                          <h1 className="text-[38px] font-extrabold text-white leading-[1.1] tracking-tighter">Network</h1>
                        </div>
                        <p className="text-[12px] font-medium text-white/80 leading-snug">
                          Create an account and access the largest digital health platform today.
                        </p>
                      </div>
                    </div>

                    {/* ISO Badge */}
                    <div className="relative z-40 w-fit px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white">{t.isoCertified}</span>
                    </div>
                  </div>

                  {/* Mobile Version Header */}
                  <div className="md:hidden flex items-center justify-center gap-3 pt-5 pb-1 bg-white relative z-10 shrink-0">
                    <div className="w-10 h-10 bg-white rounded-[10px] p-1.5 shadow-[0_4px_16px_rgba(16,185,129,0.15)] border border-emerald-50">
                      <img src="/assets/images/logo.png" alt="Arogyadatha" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-[20px] font-black text-[#0F9D58] leading-none">Arogyadatha</h2>
                      <p className="text-[6px] font-black tracking-[0.3em] text-slate-400 uppercase mt-0.5">Digital Health Network</p>
                    </div>
                  </div>

                  {/* Form Section (Right) */}
                  <div className="flex-1 bg-white flex flex-col items-center justify-start md:justify-center px-5 pb-6 pt-2 sm:p-6 md:p-8 lg:p-10 relative z-10 w-full overflow-y-auto custom-scrollbar border-l border-gray-100">
                    <div className="w-full max-w-[500px] space-y-5 lg:space-y-6">
                      <div className="text-center md:text-left mb-1 pt-1">
                        <h1 className="text-[16px] sm:text-[18px] font-black text-[#1F2937] tracking-tight flex items-center justify-center md:justify-start gap-1.5">
                          Register as <span className="text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded text-[10px] sm:text-[11px]">{selectedRole}</span>
                        </h1>
                      </div>

                      <form onSubmit={handleSignup} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-2">
                          <div className="group sm:col-span-2 space-y-1">
                            <Label className="text-[9px] font-bold text-[#6B7280] ml-1">{selectedRole === 'lab' || selectedRole === 'pharmacy' ? (selectedRole === 'lab' ? 'Lab Name' : 'Pharmacy Name') : 'Full Name'}</Label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                              <Input
                                required
                                placeholder={selectedRole === 'lab' ? 'Enter Lab Name' : selectedRole === 'pharmacy' ? 'Enter Pharmacy Name' : 'Full name'}
                                className="h-[40px] lg:h-[44px] pl-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px]"
                                value={selectedRole === 'lab' || selectedRole === 'pharmacy' ? entityName : fullName}
                                onChange={(e) => selectedRole === 'lab' || selectedRole === 'pharmacy' ? setEntityName(e.target.value) : setFullName(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="group space-y-1">
                            <Label className="text-[9px] font-bold text-[#6B7280] ml-1">Email</Label>
                            <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                              <Input
                                required
                                type="email"
                                placeholder="Email"
                                className="h-[40px] lg:h-[44px] pl-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px]"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="group space-y-1">
                            <Label className="text-[9px] font-bold text-[#6B7280] ml-1">Phone</Label>
                            <div className="relative">
                              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                              <Input
                                required
                                placeholder="Phone"
                                className="h-[40px] lg:h-[44px] pl-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px]"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="group space-y-1">
                            <Label className="text-[9px] font-bold text-[#6B7280] ml-1">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                              <Input
                                required
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="h-[40px] lg:h-[44px] pl-10 pr-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] shadow-sm tracking-widest text-[12px]"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#0F9D58] transition-colors"
                              >
                                {showPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                              </button>
                            </div>
                          </div>

                          <div className="group space-y-1">
                            <Label className="text-[9px] font-bold text-[#6B7280] ml-1">Confirm</Label>
                            <div className="relative">
                              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                              <Input
                                required
                                type="password"
                                placeholder="Confirm"
                                className="h-[40px] lg:h-[44px] pl-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] shadow-sm tracking-widest text-[12px]"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                              />
                            </div>
                          </div>

                          {selectedRole === 'patient' && (
                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-[9px] font-bold text-[#6B7280] ml-1">Date of Birth</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  required
                                  className="h-[40px] lg:h-[44px] rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] shadow-sm text-[12px] text-center appearance-none px-2"
                                  value={dob ? new Date(dob).getDate().toString() : ''}
                                  onChange={(e) => {
                                    const d = dob ? new Date(dob) : new Date(2000, 0, 1);
                                    d.setDate(parseInt(e.target.value));
                                    setDob(d.toISOString().split('T')[0]);
                                  }}
                                >
                                  <option value="" disabled>Day</option>
                                  {Array.from({ length: 31 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                  ))}
                                </select>
                                <select
                                  required
                                  className="h-[40px] lg:h-[44px] rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] shadow-sm text-[12px] text-center appearance-none px-2"
                                  value={dob ? (new Date(dob).getMonth()).toString() : ''}
                                  onChange={(e) => {
                                    const d = dob ? new Date(dob) : new Date(2000, 0, 1);
                                    d.setMonth(parseInt(e.target.value));
                                    setDob(d.toISOString().split('T')[0]);
                                  }}
                                >
                                  <option value="" disabled>Month</option>
                                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                  ))}
                                </select>
                                <select
                                  required
                                  className="h-[40px] lg:h-[44px] rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] shadow-sm text-[12px] text-center appearance-none px-2"
                                  value={dob ? new Date(dob).getFullYear().toString() : ''}
                                  onChange={(e) => {
                                    const d = dob ? new Date(dob) : new Date(2000, 0, 1);
                                    d.setFullYear(parseInt(e.target.value));
                                    setDob(d.toISOString().split('T')[0]);
                                  }}
                                >
                                  <option value="" disabled>Year</option>
                                  {Array.from({ length: 100 }, (_, i) => {
                                    const y = new Date().getFullYear() - i;
                                    return <option key={y} value={y}>{y}</option>;
                                  })}
                                </select>
                              </div>
                            </div>
                          )}

                          {selectedRole === 'doctor' && (
                            <>
                              <div className="group space-y-1">
                                <Label className="text-[9px] font-bold text-[#6B7280] ml-1">Specialization</Label>
                                <Input
                                  required
                                  placeholder="e.g. Cardiologist"
                                  className="h-[40px] lg:h-[44px] rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px]"
                                  value={specialization}
                                  onChange={(e) => setSpecialization(e.target.value)}
                                />
                              </div>
                              <div className="group space-y-1">
                                <Label className="text-[9px] font-bold text-[#6B7280] ml-1">Reg. Number</Label>
                                <Input
                                  required
                                  placeholder="Registration #"
                                  className="h-[40px] lg:h-[44px] rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px]"
                                  value={regNumber}
                                  onChange={(e) => setRegNumber(e.target.value)}
                                />
                              </div>
                            </>
                          )}

                          {(selectedRole === 'lab' || selectedRole === 'pharmacy') && (
                            <>
                              <div className="group space-y-1">
                                <Label className="text-[9px] font-bold text-[#6B7280] ml-1">License #</Label>
                                <Input
                                  required
                                  placeholder="License #"
                                  className="h-[40px] lg:h-[44px] rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px]"
                                  value={licenseNumber}
                                  onChange={(e) => setLicenseNumber(e.target.value)}
                                />
                              </div>
                              <div className="group space-y-1">
                                <Label className="text-[9px] font-bold text-[#6B7280] ml-1">City</Label>
                                <div className="relative">
                                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                                  <Input
                                    required
                                    placeholder="City"
                                    className="h-[40px] lg:h-[44px] pl-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px]"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {selectedRole === 'admin' && (
                            <div className="group space-y-1 sm:col-span-2">
                              <Label className="text-[9px] font-bold text-[#6B7280] ml-1">Admin Access Code</Label>
                              <div className="relative">
                                <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                                <Input
                                  required
                                  type="password"
                                  placeholder="Enter secure admin code"
                                  className="h-[40px] lg:h-[44px] pl-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px] tracking-widest"
                                  value={adminCode}
                                  onChange={(e) => setAdminCode(e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-2 py-1 px-1 mt-2">
                          <input type="checkbox" required className="mt-0.5 w-3.5 h-3.5 rounded border-gray-200 text-[#0F9D58] focus:ring-[#0F9D58]" />
                          <p className="text-[9px] text-[#6B7280] font-bold leading-relaxed">
                            I agree to <button type="button" onClick={() => setView('terms')} className="text-[#0F9D58] hover:underline cursor-pointer">Terms</button> & <button type="button" onClick={() => setView('privacy')} className="text-[#0F9D58] hover:underline cursor-pointer">Privacy Policy</button>
                          </p>
                        </div>

                        <Button
                          disabled={authLoading}
                          type="submit"
                          className="w-full h-[40px] lg:h-[44px] text-[13px] lg:text-[14px] font-bold bg-[#0F9D58] hover:bg-[#0b8a4d] text-white rounded-[12px] shadow-[0_8px_20px_rgba(15,157,88,0.25)] hover:shadow-[0_12px_24px_rgba(15,157,88,0.35)] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                        >
                          {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                        </Button>

                        <p className="text-center text-[#6B7280] font-medium text-[10px] lg:text-[11px] pt-1">
                          Already have an account? <button type="button" onClick={() => setView('login')} className="text-[#0F9D58] font-bold hover:underline">Login</button>
                        </p>
                      </form>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'login' && (
              <motion.div
                key="login"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="min-h-screen bg-gradient-to-br from-[#E0F2F1] to-[#F0F9F4] flex items-center justify-center p-3 sm:p-6 relative font-sans"
              >
                {/* Main Card Container */}
                <div className="w-full max-w-[1100px] bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl shadow-[#10B981]/10 overflow-hidden flex flex-col md:flex-row relative z-10 md:h-auto">

                  {/* Branding Section (Left) - Desktop & Tablet */}
                  <div className="hidden md:flex w-[45%] bg-[#0F9D58] relative flex-col justify-between p-8 lg:p-10 text-white overflow-hidden shrink-0 border-r border-[#0e8a4d]">
                    {/* Background Layers */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#10B981] via-[#0F9D58] to-[#059669]" />

                    {/* Leaf Patterns - SVG Reconstruction */}
                    <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
                      <svg className="absolute -left-20 -bottom-20 w-[140%] h-[140%]" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M400 800C400 800 500 600 500 400C500 200 400 0 400 0C400 0 300 200 300 400C300 600 400 800 400 800Z" fill="white" fillOpacity="0.1" />
                        <path d="M200 700C200 700 350 550 350 350C350 150 200 0 200 0C200 0 50 150 50 350C50 550 200 700 200 700Z" fill="white" fillOpacity="0.15" transform="rotate(-20 200 700)" />
                        <path d="M600 750C600 750 700 600 700 450C700 300 600 150 600 150C600 150 500 300 500 450C500 600 600 750 600 750Z" fill="white" fillOpacity="0.1" transform="rotate(15 600 750)" />
                      </svg>
                    </div>

                    {/* Top Left Dot Grid */}
                    <div className="absolute top-8 left-8 z-20 grid grid-cols-6 gap-2 opacity-30">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
                      ))}
                    </div>

                    {/* Branding Content */}
                    <div className="relative z-40 space-y-10 lg:space-y-12">
                      <div className="flex flex-col items-center w-fit">
                        <div className="w-16 h-16 bg-white rounded-[16px] p-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-center justify-center">
                          <img src="/assets/images/logo.png" alt="Arogyadatha" className="w-full h-full object-contain" />
                        </div>
                        <div className="mt-4 text-center">
                          <h2 className="text-xl font-extrabold tracking-tight leading-none text-white">Arogyadatha</h2>
                          <p className="text-[7px] font-bold tracking-[0.3em] uppercase text-[#A7F3D0] mt-1.5">Digital Health Network</p>
                        </div>
                      </div>

                      <div className="space-y-3 max-w-[260px]">
                        <div className="space-y-1">
                          <h2 className="text-[26px] font-medium text-white/90 tracking-tight leading-none">{t.yourHealth}</h2>
                          <h1 className="text-[38px] font-black text-white leading-[1.1] tracking-tighter">{t.ourPriority}</h1>
                        </div>
                        <p className="text-[12px] font-medium text-white/80 leading-snug">
                          {t.brandingDesc}
                        </p>
                      </div>
                    </div>

                    {/* ISO Badge */}
                    <div className="relative z-40 w-fit px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white">{t.isoCertified}</span>
                    </div>
                  </div>

                  {/* Mobile Version Header */}
                  <div className="md:hidden flex items-center justify-center gap-3 pt-5 pb-1 bg-white relative z-10 shrink-0">
                    <div className="w-10 h-10 bg-white rounded-[10px] p-1.5 shadow-[0_4px_16px_rgba(16,185,129,0.15)] border border-emerald-50">
                      <img src="/assets/images/logo.png" alt="Arogyadatha" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-[20px] font-black text-[#0F9D58] leading-none">Arogyadatha</h2>
                      <p className="text-[6px] font-black tracking-[0.3em] text-slate-400 uppercase mt-0.5">Digital Health Network</p>
                    </div>
                  </div>

                  {/* Form Section (Right) */}
                  <div className="flex-1 bg-white flex flex-col items-center justify-start md:justify-center px-5 pb-6 pt-2 sm:p-6 md:p-8 lg:p-10 relative z-10 w-full">
                    <div className="w-full max-w-[400px] space-y-5 lg:space-y-6">
                      <div className="text-center md:text-left mb-1">
                        <h1 className="text-[16px] sm:text-[18px] font-black text-[#1F2937] tracking-tight">{t.signInTitle}</h1>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-[#6B7280] ml-1">{t.identityLabel}</Label>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                            <Input
                              required
                              type="text"
                              placeholder="lokeshbabu9298@gmail.com"
                              className="h-[44px] lg:h-[48px] pl-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] placeholder:text-[#9CA3AF] shadow-sm text-[12px] lg:text-[13px]"
                              value={loginInput}
                              onChange={(e) => setLoginInput(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-[#6B7280] ml-1">{t.securityKeyLabel}</Label>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF] group-focus-within:text-[#0F9D58] transition-colors" />
                            <Input
                              required
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••••"
                              className="h-[44px] lg:h-[48px] pl-10 pr-10 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:border-[#0F9D58] focus:ring-4 focus:ring-[#0F9D58]/10 transition-all font-medium text-[#1F2937] shadow-sm tracking-widest text-[12px] lg:text-[13px]"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#0F9D58] transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                            </button>
                          </div>
                          <div className="flex justify-end pr-1 pt-1">
                            <button type="button" className="text-[9px] lg:text-[10px] font-bold text-[#0F9D58] hover:underline">{t.forgotKey}</button>
                          </div>
                        </div>

                        {detectedRole && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-2.5 bg-[#F0F9F4] rounded-[12px] border border-[#0F9D58]/20 flex items-center gap-2.5 shadow-sm"
                          >
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#0F9D58]" />
                            </div>
                            <div>
                              <p className="text-[7px] lg:text-[8px] font-bold text-[#6B7280] uppercase tracking-widest leading-none mb-0.5">{t.systemDetection}</p>
                              <p className="text-[10px] lg:text-[11px] font-bold text-[#059669]">{t.authenticatingAs} <span className="uppercase">{detectedRole}</span></p>
                            </div>
                          </motion.div>
                        )}

                        <div className="pt-1">
                          <Button
                            disabled={authLoading}
                            type="submit"
                            className="w-full h-[44px] lg:h-[48px] text-[13px] lg:text-[14px] font-bold bg-[#0F9D58] hover:bg-[#0b8a4d] text-white rounded-[12px] shadow-[0_8px_20px_rgba(15,157,88,0.25)] hover:shadow-[0_12px_24px_rgba(15,157,88,0.35)] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                          >
                            {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                              <>
                                {t.verifyIdentity}
                                <ArrowRight className="w-[16px] h-[16px]" />
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="relative py-2.5 lg:py-3">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                          <div className="relative flex justify-center"><span className="bg-white px-3 text-[8px] lg:text-[9px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em]">Social Access</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <Button type="button" variant="outline" className="h-[40px] lg:h-[44px] border-gray-200 rounded-[10px] hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all shadow-sm px-2" onClick={handleGoogleSignIn}>
                            <GoogleIcon />
                            <span className="font-bold text-[10px] lg:text-[11px] text-[#4B5563] truncate">Google</span>
                          </Button>
                          <Button type="button" variant="outline" className="h-[40px] lg:h-[44px] border-gray-200 rounded-[10px] hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all shadow-sm px-2">
                            <div className="w-4 h-4 bg-[#1877F2] rounded-full flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </div>
                            <span className="font-bold text-[10px] lg:text-[11px] text-[#4B5563] truncate">Facebook</span>
                          </Button>
                        </div>

                        <div className="pt-2 lg:pt-3 text-center space-y-2 lg:space-y-3">
                          <div className="flex items-center justify-center gap-2 text-gray-400">
                            <button type="button" onClick={() => setView('terms')} className="text-[10px] font-bold hover:text-[#0F9D58] transition-colors">Terms</button>
                            <span className="w-1 h-1 bg-gray-200 rounded-full" />
                            <button type="button" onClick={() => setView('privacy')} className="text-[10px] font-bold hover:text-[#0F9D58] transition-colors">Privacy</button>
                          </div>
                          <p className="text-[#6B7280] font-medium text-[10px] lg:text-[11px] pt-3 border-t border-gray-50">
                            Don't have an account? <button type="button" onClick={() => setView('role-selection')} className="text-[#0F9D58] font-bold hover:underline">Sign Up</button>
                          </p>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {(view === 'dashboard' || view === 'symptom-checker' || view === 'book-doctor' || view === 'book-lab' || view === 'pharmacy' || view === 'profile' || view === 'privacy' || view === 'terms') && user && (
              <motion.div
                key="dashboard"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="flex-1 flex flex-col min-h-0 relative overflow-hidden h-full"
              >
                <div className="flex-1 flex flex-col min-h-0">
                  {user.role === 'doctor' ? (
                    <div className="flex-1">
                      <ErrorBoundary><DoctorDashboard user={user} onLogout={handleLogout} /></ErrorBoundary>
                    </div>
                  ) : user.role === 'lab' ? (
                    <div className="flex-1">
                      <ErrorBoundary><LabDashboard user={user} onLogout={handleLogout} /></ErrorBoundary>
                    </div>
                  ) : user.role === 'pharmacy' ? (
                    <div className="flex-1">
                      <ErrorBoundary><PharmacyDashboard user={user} onLogout={handleLogout} /></ErrorBoundary>
                    </div>
                  ) : user.role === 'admin' ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <ErrorBoundary><AdminDashboard user={user} onLogout={handleLogout} /></ErrorBoundary>
                    </div>
                  ) : user.role === 'patient' ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="sticky top-0 z-[100] bg-[#0b6b4f] w-full px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between border-b border-white/10 shadow-lg">
                        <div className="flex items-center gap-3">
                          {view !== 'dashboard' ? (
                            <button onClick={() => setView('dashboard')} className="flex items-center justify-center w-8 h-8 bg-white text-[#0b6b4f] rounded-full transition-all shadow-sm">
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                          ) : (
                            <div
                              className="hidden md:flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setShowLocationPrompt(true)}
                            >
                              <span className="text-[18px] font-black tracking-tight text-white leading-none">AROGYADATHA</span>
                              {user && user.location_confirmed && (
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="w-2.5 h-2.5 text-emerald-300 shrink-0" />
                                  <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider truncate max-w-[200px]">
                                    {user.area}, {user.subArea ? `${user.subArea}, ` : ''}{user.city || user.district}, {user.state} {user.postcode}
                                  </span>
                                </div>
                              )}
                              {user && !user.location_confirmed && (
                                <div className="flex items-center gap-1 mt-1 animate-pulse">
                                  <MapPin className="w-2.5 h-2.5 text-red-300" />
                                  <span className="text-[9px] font-bold text-red-100 uppercase tracking-wider">Set Location</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div
                            className="flex flex-col md:hidden cursor-pointer"
                            onClick={() => setShowLocationPrompt(true)}
                          >
                            <span className="text-[15px] font-black tracking-tight text-white uppercase leading-none">AROGYADATHA</span>
                            {user && user.location_confirmed && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2 h-2 text-emerald-300 shrink-0" />
                                <span className="text-[8px] font-bold text-emerald-200 uppercase truncate max-w-[100px]">
                                  {user.area}, {user.city || user.district} {user.postcode}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {view === 'dashboard' ? (
                          <div className="hidden md:flex flex-1 max-w-[600px] mx-8 relative">
                            <div className="relative w-full flex items-center bg-white rounded-full p-1 pl-4 shadow-inner">
                              <Search className="w-5 h-5 text-gray-400 shrink-0" />
                              <input type="text" placeholder="Search Doctors, Labs..." className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium text-[#1F2937] placeholder:text-gray-400 px-3 h-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                              <button className="bg-[#0b6b4f] text-white px-6 h-9 rounded-full font-bold text-[11px] tracking-wider shrink-0">FIND</button>
                            </div>
                          </div>
                        ) : <div className="flex-1" />}

                        <div className="flex items-center gap-4 sm:gap-6 relative">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <button
                              type="button"
                              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${isLanguageTelugu ? 'bg-white text-[#0b6b4f]' : 'text-white hover:bg-white/10'}`}
                              onClick={() => setIsLanguageTelugu(!isLanguageTelugu)}
                            >
                              <Globe className="w-4 h-4 sm:w-5 h-5" />
                            </button>

                            <div className="relative">
                              <button
                                type="button"
                                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${showNotifications ? 'bg-white text-[#0b6b4f]' : 'text-white hover:bg-white/10'}`}
                                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                              >
                                <Bell className="w-4 h-4 sm:w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0b6b4f]" />
                              </button>

                              <AnimatePresence>
                                {showNotifications && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                    <motion.div
                                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                      className="absolute right-0 mt-3 w-[320px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50"
                                    >
                                      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                        <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Notifications</h4>
                                        <span className="bg-[#10B981] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">New</span>
                                      </div>
                                      <div className="p-2 space-y-1">
                                        <div className="p-3 bg-[#F0F9F4] rounded-2xl border border-[#0b6b4f]/10 group cursor-pointer transition-all">
                                          <p className="text-[11px] font-black text-[#0b6b4f] mb-1">{t.welcomeArogya}</p>
                                          <p className="text-[9px] font-medium text-gray-500">{t.journeyStart}</p>
                                        </div>
                                        <div className="p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-all">
                                          <p className="text-[11px] font-black text-slate-800 mb-1">{t.systemReady}</p>
                                          <p className="text-[9px] font-medium text-gray-400">{t.operational}</p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="relative">
                            <button
                              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                              className={`flex items-center gap-3 pl-3 pr-1.5 py-1 rounded-full transition-all ${showProfileMenu ? 'bg-white' : 'hover:bg-white/10'}`}
                            >
                              <div className="hidden md:flex flex-col text-right">
                                <p className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${showProfileMenu ? 'text-[#0b6b4f]/60' : 'text-emerald-100/60'}`}>PATIENT</p>
                                <p className={`text-[11px] font-black leading-none ${showProfileMenu ? 'text-slate-900' : 'text-white'}`}>{user.fullName?.split(' ')[0]}</p>
                              </div>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showProfileMenu ? 'bg-[#0b6b4f] text-white shadow-md' : 'bg-white/20 text-white'}`}>
                                <User className="w-4 h-4" />
                              </div>
                            </button>

                            <AnimatePresence>
                              {showProfileMenu && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-[260px] bg-white rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 p-2"
                                  >
                                    <div className="p-4 flex items-center gap-3 bg-gray-50/50 rounded-2xl mb-2">
                                      <div className="w-10 h-10 bg-[#10B981] text-white rounded-xl flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <p className="text-[12px] font-black text-slate-900 leading-none mb-1">{user.fullName}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
                                      </div>
                                    </div>

                                    <div className="px-2 pb-2 space-y-1">
                                      {/* Simplified Location Link */}


                                      {[
                                        { label: 'Profile & Settings', icon: User, onClick: () => setView('profile') },
                                        { label: 'Notifications', icon: Bell, onClick: () => { setShowNotifications(true); setShowProfileMenu(false); } },
                                        { label: 'Privacy Policy', icon: ShieldCheck, onClick: () => setView('privacy') },
                                        { label: 'Terms & Conditions', icon: FileText, onClick: () => setView('terms') },
                                      ].map((item, i) => (
                                        <button
                                          key={i}
                                          onClick={() => { item.onClick(); setShowProfileMenu(false); }}
                                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F9F4] hover:text-[#0b6b4f] rounded-2xl text-gray-500 transition-all text-left"
                                        >
                                          <item.icon className="w-4 h-4" />
                                          <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                                        </button>
                                      ))}
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-gray-50">
                                      <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest"
                                      >
                                        <ArrowRight className="w-4 h-4" /> Logout
                                      </button>
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="max-w-7xl mx-auto w-full px-2 sm:px-6 pb-[120px]">
                          {view === 'symptom-checker' ? (
                            <div className="flex-1 flex flex-col"><SymptomChecker user={user} onBack={() => setView('dashboard')} onCaseCreated={() => { }} userCases={userCases} t={t} /></div>
                          ) : view === 'book-doctor' ? (
                            <div className="flex-1 flex flex-col"><ErrorBoundary><BookDoctor user={user} userCases={userCases} preSelectedCaseId={preSelectedCaseId} initialTab={initialBookDoctorTab} onBack={() => { setView('dashboard'); setShouldScrollToJourney(true); setPreSelectedCaseId(null); }} t={t} /></ErrorBoundary></div>
                          ) : view === 'book-lab' ? (
                            <div className="flex-1 flex flex-col"><ErrorBoundary><BookLab user={user} userCases={userCases} onBack={() => { setView('dashboard'); setShouldScrollToJourney(true); }} t={t} /></ErrorBoundary></div>
                          ) : view === 'pharmacy' ? (
                            <div className="flex-1 flex flex-col"><ErrorBoundary><Pharmacy user={user} userCases={userCases} onBack={() => { setView('dashboard'); setShouldScrollToJourney(true); }} t={t} /></ErrorBoundary></div>
                          ) : view === 'profile' ? (
                            <div className="py-2 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                              <div className="flex items-center justify-between px-2">
                                <button onClick={() => setView('dashboard')} className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-[#0b6b4f] rounded-full transition-all shadow-sm hover:bg-emerald-100">
                                  <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                                </button>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Account</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-20">
                                <div className="lg:col-span-4 space-y-4">
                                  <div className="bg-white rounded-[32px] p-8 border border-[#0b6b4f]/10 shadow-sm text-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0b6b4f]/10 to-transparent rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                    <div className="relative z-10">
                                      <div className="w-24 h-24 bg-gradient-to-br from-[#0b6b4f] to-[#10B981] rounded-[28px] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl transform group-hover:rotate-3 transition-transform">
                                        <User className="w-12 h-12" />
                                      </div>
                                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1 truncate px-2">{user.fullName}</h2>
                                      <div className="flex flex-col items-center gap-2">
                                        <span className="text-[#0b6b4f] font-black text-[9px] uppercase tracking-[0.2em] bg-[#F0F9F4] px-4 py-1 rounded-full border border-[#0b6b4f]/10">{t.verifiedPatient}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {user.arogyadathaId}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="lg:col-span-8">
                                  <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-[#0b6b4f]/10 shadow-sm min-h-full">
                                    <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-8">
                                      <div className="w-12 h-12 rounded-[18px] bg-emerald-50 text-[#0b6b4f] flex items-center justify-center shadow-inner"><Settings className="w-6 h-6" /></div>
                                      <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{t.accountSettings}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update your profile information</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input type="text" defaultValue={user.fullName} className="w-full h-14 bg-gray-50/50 border border-transparent rounded-[20px] px-6 text-sm font-black text-slate-800 outline-none" />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <input type="text" defaultValue={user.phoneNumber} className="w-full h-14 bg-gray-50/50 border border-transparent rounded-[20px] px-6 text-sm font-black text-slate-800 outline-none" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : view === 'privacy' ? (
                            <div className="py-2 animate-in fade-in slide-in-from-bottom-4">
                              <button onClick={() => setView('dashboard')} className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-[#0b6b4f] rounded-full transition-all shadow-sm hover:bg-emerald-100 mb-4">
                                <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                              </button>
                              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Privacy Policy</h2>
                                <p className="text-sm text-slate-500 leading-relaxed">Your privacy is important to us. We collect data only to provide and improve our clinical services.</p>
                              </div>
                            </div>
                          ) : view === 'terms' ? (
                            <div className="py-2 animate-in fade-in slide-in-from-bottom-4">
                              <button onClick={() => setView('dashboard')} className="flex items-center justify-center w-9 h-9 bg-emerald-50 text-[#0b6b4f] rounded-full transition-all shadow-sm hover:bg-emerald-100 mb-4">
                                <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                              </button>

                              {/* Hero Header Card */}
                              <div className="bg-[#0b6b4f] rounded-[24px] p-6 sm:p-12 text-white relative overflow-hidden mb-6">
                                <div className="relative z-10">
                                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6"><FileText className="w-6 h-6 text-emerald-300" /></div>
                                  <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-2">Terms & Conditions</h1>
                                  <p className="text-emerald-100/60 font-bold uppercase tracking-widest text-[10px] sm:text-[12px]">Legal Compliance V2.4</p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
                                  {/* Sidebar Navigation */}
                                  <div className="lg:col-span-3 space-y-4">
                                    <div className="p-4 border-b border-gray-50 mb-2">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">On This Page</p>
                                    </div>
                                    <div className="space-y-1">
                                      {[
                                        'Patient Responsibility', 'Use of Our Services', 'Appointments & Payments',
                                        'Privacy & Data Protection', 'Intellectual Property', 'Limitation of Liability',
                                        'Termination', 'Governing Law', 'Changes to Terms'
                                      ].map((item, i) => (
                                        <button
                                          key={i}
                                          onClick={() => document.getElementById(`terms-section-${i}`)?.scrollIntoView({ behavior: 'smooth' })}
                                          className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-tight transition-all ${i === 0 ? 'bg-[#F0F9F4] text-[#0b6b4f]' : 'text-gray-400 hover:text-slate-600 hover:bg-gray-50'}`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${i === 0 ? 'bg-[#0b6b4f] text-white' : 'bg-gray-100 text-gray-400'}`}>{String(i + 1).padStart(2, '0')}</span>
                                            {item}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Content Area */}
                                <div className="lg:col-span-9 space-y-6">
                                  {[
                                    { title: 'PATIENT RESPONSIBILITY', desc: 'You agree to provide accurate, complete, and current information about your health condition and medical history. You are responsible for maintaining the confidentiality of your account and for all activities under your account.', num: '01', icon: User },
                                    { title: 'USE OF OUR SERVICES', desc: 'Arogyadatha provides access to healthcare professionals and related services. You agree to use the platform only for lawful purposes and in accordance with these terms. Eligibility is restricted to residents of operating regions.', num: '02', icon: Activity },
                                    { title: 'APPOINTMENTS & PAYMENTS', desc: 'All appointments are subject to availability. Payments made on our platform are non-refundable except as required by law or as specifically stated in our refund policy. Cancellation fees may apply.', num: '03', icon: Calendar },
                                    { title: 'PRIVACY & DATA PROTECTION', desc: 'Our use of your personal data is governed by our Privacy Policy. By agreeing to these terms, you acknowledge and consent to the collection and use of your data as outlined therein.', num: '04', icon: ShieldCheck },
                                    { title: 'INTELLECTUAL PROPERTY', desc: 'All content, trademarks, and data on the platform are the property of Arogyadatha or its licensors. Unauthorized reproduction or distribution is strictly prohibited.', num: '05', icon: Sparkles },
                                    { title: 'LIMITATION OF LIABILITY', desc: 'Arogyadatha is a facilitator between users and healthcare providers. We are not liable for medical advice, treatment outcomes, or service interruptions beyond our direct control.', num: '06', icon: AlertCircle },
                                    { title: 'TERMINATION', desc: 'We reserve the right to suspend or terminate your access to the platform for violations of these terms, fraudulent activity, or at our sole discretion with reasonable notice.', num: '07', icon: X },
                                    { title: 'GOVERNING LAW', desc: 'These terms are governed by and construed in accordance with the laws of the jurisdiction in which Arogyadatha operates. Any disputes will be subject to local arbitration.', num: '08', icon: Gavel },
                                    { title: 'CHANGES TO TERMS', desc: 'Terms may be updated to reflect changes in service or regulation. Users will be notified of major updates. Continued usage of the platform constitutes agreement to revised terms.', num: '09', icon: History }
                                  ].map((section, i) => (
                                    <div key={i} className="bg-white rounded-[24px] p-8 sm:p-10 border border-gray-100 shadow-sm hover:border-[#0b6b4f]/20 transition-all group">
                                      <div className="flex gap-8">
                                        <div className="w-14 h-14 bg-emerald-50 text-[#0b6b4f] rounded-[18px] flex items-center justify-center shrink-0 font-extrabold text-xl group-hover:bg-[#0b6b4f] group-hover:text-white transition-all">{section.num}</div>
                                        <div className="flex-1">
                                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight mb-4">{section.title}</h3>
                                          <p className="text-sm sm:text-base font-medium text-slate-500 leading-relaxed">{section.desc}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 space-y-3">
                              <div className="bg-[#0b6b4f]  rounded-[24px] p-4 sm:p-5 shadow-xl border border-white/10 relative overflow-hidden group">
                                {/* Animated Glow */}
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

                                <div className="flex items-center justify-between mb-4 px-1">
                                  <h3 className="text-[11px] font-black text-white capitalize tracking-widest">Quick Access</h3>
                                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(110,231,183,0.8)]" />
                                </div>

                                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 px-1">
                                  {[
                                    { title: 'AI Symptoms', id: 'SYMPTOM CHECKER', icon: Stethoscope, color: "from-[#10B981] via-[#059669] to-[#047857]", shadow: "shadow-emerald-500/30" },
                                    { title: 'Find Doctors', id: 'BOOK DOCTOR', icon: User, color: "from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]", shadow: "shadow-blue-500/30" },
                                    { title: 'All Hospitals', id: 'HOSPITALS', icon: Building2, color: "from-[#0F9D58] via-[#059669] to-[#0b6b4f]", shadow: "shadow-emerald-500/30" },
                                    { title: 'Lab Tests', id: 'BOOK LAB', icon: FlaskConical, color: "from-[#A855F7] via-[#9333EA] to-[#7E22CE]", shadow: "shadow-purple-500/30" },
                                    { title: 'Pharmacy', id: 'PHARMACY', icon: Pill, color: "from-[#F97316] via-[#EA580C] to-[#C2410C]", shadow: "shadow-orange-500/30" },
                                    { title: 'Appointment History', id: 'CASE HISTORY', icon: FileText, color: "from-[#64748b] via-[#475569] to-[#334155]", shadow: "shadow-slate-500/30" }
                                  ].map((item, i) => (
                                    <div key={i} className="cursor-pointer active:scale-95 transition-all" onClick={() => { 
                                      if (item.id === 'SYMPTOM CHECKER') setView('symptom-checker'); 
                                      if (item.id === 'BOOK DOCTOR') { setInitialBookDoctorTab('find'); setView('book-doctor'); }
                                      if (item.id === 'HOSPITALS') { setInitialBookDoctorTab('hospitals'); setView('book-doctor'); }
                                      if (item.id === 'BOOK LAB') setView('book-lab'); 
                                      if (item.id === 'PHARMACY') setView('pharmacy');
                                      if (item.id === 'CASE HISTORY') { setInitialBookDoctorTab('history'); setView('book-doctor'); }
                                    }}>
                                      <div className="bg-white/15 backdrop-blur-xl h-[105px] sm:h-[120px] w-full hover:bg-white/25 transition-all duration-300 rounded-[24px] p-2 flex flex-col items-center justify-between py-4 border border-white/20 shadow-xl overflow-hidden">
                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg ${item.shadow} group-hover:scale-110 transition-transform`}>
                                          <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
                                        </div>
                                        <h3 className="text-[10px] sm:text-[11px] font-black text-white text-center leading-none capitalize tracking-wider w-full px-0.5 mt-1">
                                          {item.title}
                                        </h3>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-6" ref={journeyRef}>
                                <React.Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-[24px]" />}><HealthJourney user={user} onNavigate={(v, caseId) => { setView(v as any); if (caseId) setPreSelectedCaseId(caseId); }} t={t} /></React.Suspense>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-white rounded-[32px] shadow-xl border border-gray-100 max-w-lg mx-auto mt-20">
                      <Heart className="w-16 h-16 text-[#10B981] mx-auto mb-6" />
                      <h1 className="text-3xl font-black text-[#1F2937] tracking-tight mb-2">{t.welcomeMsg}</h1>
                      <p className="text-[#6B7280] font-bold uppercase tracking-widest text-xs">{t.premiumPortal}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </React.Suspense>

        {user && user.role === 'patient' && (
          <div className="fixed bottom-0 left-0 right-0 z-[250] bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
            <nav className="w-full h-[60px] sm:h-[75px] flex items-center justify-around px-2 sm:px-20 lg:px-40 max-w-5xl mx-auto">
              {[
                { id: 'dashboard', label: t.home || 'Home', icon: Home },
                { id: 'symptom-checker', label: t.symptom || 'Symptom', icon: Stethoscope },
                { id: 'book-doctor', label: t.doctor || 'Doctor', icon: UserCircle },
                { id: 'book-lab', label: t.lab || 'Lab', icon: FlaskConical },
                { id: 'pharmacy', label: t.pharmacyNav || 'Pharmacy', icon: Pill }
              ].map((item) => {
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id as any);
                    }}
                    className="flex-1 flex flex-col items-center justify-center transition-all duration-300"
                  >
                    <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'w-8 h-8 sm:w-10 sm:h-10 bg-[#0b6b4f] rounded-full shadow-lg shadow-emerald-900/20' : 'w-6 h-6'}`}>
                      <item.icon className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 ${isActive ? "text-white" : "text-slate-400 hover:text-[#0b6b4f]"}`} strokeWidth={isActive ? 3 : 2} />
                    </div>
                    <span className={`text-[10px] sm:text-[12px] font-medium mt-1.5 tracking-tight text-black`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="flex justify-center items-center pb-1.5 bg-white">

            </div>
          </div>
        )}
        {showLocationPrompt && user && user.role === 'patient' && (
          <React.Suspense fallback={null}>
            <LocationPrompt user={user} onClose={() => setShowLocationPrompt(false)} />
          </React.Suspense>
        )}

        {/* ── AROGYADATHA CHATBOT FAB ───────────────────────────────────── */}
        {user && user.role === 'patient' && !showChatbot && (
          <button
            onClick={() => setShowChatbot(true)}
            className="fixed bottom-24 right-4 z-[550] w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-full shadow-xl shadow-emerald-500/40 flex items-center justify-center transition-all active:scale-90 hover:scale-105"
            style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.45)' }}
            title="Chat with Arogyadatha"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </button>
        )}

        {/* ── AROGYADATHA CHATBOT OVERLAY ───────────────────────────────── */}
        <AnimatePresence>
          {showChatbot && user && (
            <React.Suspense fallback={null}>
              <ArogyaChatbot
                onClose={() => setShowChatbot(false)}
                onNavigate={(v) => { setShowChatbot(false); setView(v as any); }}
                userCases={userCases}
                isTelugu={isLanguageTelugu}
                userName={user.displayName || 'Friend'}
              />
            </React.Suspense>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
