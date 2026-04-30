import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Mic, MicOff, Volume2, VolumeX, Send, Plus,
  Stethoscope, FlaskConical, Pill, Activity, FileText,
  ChevronRight, Phone, MapPin, Calendar, ArrowLeft,
  MessageCircle, Sparkles, Heart
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  chips?: Chip[];
  timestamp: Date;
}
interface Chip {
  label: string;
  action: string;
  icon?: React.ElementType;
  color?: string;
}

// ─── Bilingual Content — Krishna District Telugu Slang ────────────────────────
// Simple, colloquial Andhra slang for illiterate patients from Krishna district
const LANG = {
  greeting: {
    en: (name: string) => `Hello ${name || 'Lokesh'} Garu, I am Arogyadatha. Please tell your symptoms.`,
    te: (name: string) => `నమస్తే ${name || 'లోకేష్'} గారు, నేను ఆరోగ్యదాతని. మీ సమస్య చెప్పండి.`
  },
  tapToSpeak: {
    en: (name: string) => `Type or tap mic to speak...`,
    te: (name: string) => `టైప్ చేయి లేదా మాట్లాడు...`
  },
  // ── Journey Flow ──
  j1: {
    en: (name: string) => `Hello ${name || 'Lokesh'} Garu, please tell me your problem first.`,
    te: (name: string) => `నమస్తే ${name || 'లోకేష్'} గారు, ముందుగా మీకు ఏ సమస్య ఉందో చెప్పండి.`
  },
  j2: {
    en: (name: string) => `Tell your symptoms slowly, I am listening and writing.`,
    te: (name: string) => `మీ సింటమ్స్ మెల్లగా చెప్పండి, నేను వింటూ ఇక్కడ రాస్తున్నాను.`
  },
  j3: {
    en: (name: string) => `Select which case to save your symptoms.`,
    te: (name: string) => `ఈ సింటమ్స్ ఏ కేసులో సేవ్ చేయాలనుకుంటున్నారు?`
  },
  j4: {
    en: (name: string) => `Your symptoms are saved. Now we move to next step.`,
    te: (name: string) => `మీ సింటమ్స్ సేవ్ అయ్యాయి. ఇప్పుడు నెక్స్ట్ స్టెప్కి వెళ్దాం.`
  },
  j5: {
    en: (name: string) => `Based on your symptoms, these doctors are suitable.`,
    te: (name: string) => `మీ సింటమ్స్ ఆధారంగా ఈ డాక్టర్లు మీకు సరిపోతారు.`
  },
  j6: {
    en: (name: string) => `Select the doctor you want.`,
    te: (name: string) => `మీకు కావలసిన డాక్టర్ని సెలెక్ట్ చేయండి.`
  },
  j7: {
    en: (name: string) => `${name || 'Lokesh'} Garu, tell your BP, Weight and Height slowly.`,
    te: (name: string) => `${name || 'లోకేష్'} గారు, మీ BP, వెయిట్, హైట్ మెల్లగా చెప్పండి.`
  },
  j8: {
    en: (name: string) => `Doctor suggested tests. Select nearby lab.`,
    te: (name: string) => `డాక్టర్ కొన్ని టెస్టులు సూచించారు. దగ్గరలో ఉన్న ల్యాబ్ సెలెక్ట్ చేయండి.`
  },
  j9: {
    en: (name: string) => `Upload your prescription for lab tests.`,
    te: (name: string) => `ల్యాబ్ టెస్టుల కోసం మీ ప్రిస్క్రిప్షన్ అప్లోడ్ చేయండి.`
  },
  j10: {
    en: (name: string) => `You can call lab or request home sample collection.`,
    te: (name: string) => `మీరు ల్యాబ్కి కాల్ చేయవచ్చు లేదా హోమ్ సాంపిల్ కలెక్షన్ అడగవచ్చు.`
  },
  j11: {
    en: (name: string) => `Upload your test reports.`,
    te: (name: string) => `మీ టెస్ట్ రిపోర్ట్స్ అప్లోడ్ చేయండి.`
  },
  j12: {
    en: (name: string) => `Enter your diagnosed disease.`,
    te: (name: string) => `మీకు వచ్చిన రోగం పేరు ఎంటర్ చేయండి.`
  },
  j13: {
    en: (name: string) => `Enter medicines and timings.`,
    te: (name: string) => `మీ మందులు మరియు టైమింగ్స్ ఎంటర్ చేయండి.`
  },
  j14: {
    en: (name: string) => `You are in this step now. Next step is shown below.`,
    te: (name: string) => `మీరు ఇప్పుడు ఈ స్టెప్లో ఉన్నారు. నెక్స్ట్ స్టెప్ కింద చూపించబడింది.`
  },
  j15: {
    en: (name: string) => `Your health journey is saved.`,
    te: (name: string) => `మీ హెల్త్ జర్నీ సేవ్ అయింది.`
  },
  // ── Medicine Flow ──
  m1: {
    en: (name: string) => `${name || 'Lokesh'} Garu, please tell your diagnosis given by doctor.`,
    te: (name: string) => `${name || 'లోకేష్'} గారు, డాక్టర్ చెప్పిన మీ రోగం పేరు చెప్పండి.`
  },
  m2: {
    en: (val: string) => `You have entered: ${val}. Do you want to save?`,
    te: (val: string) => `మీరు ఇచ్చింది: ${val}. సేవ్ చేయాలా?`
  },
  m3: {
    en: (name: string) => `How do you want to add medicines?`,
    te: (name: string) => `మీ మందులు ఎలా యాడ్ చేయాలనుకుంటున్నారు?`
  },
  m4: {
    en: (name: string) => `Speak medicine details slowly.`,
    te: (name: string) => `మందుల వివరాలు మెల్లగా చెప్పండి, నేను రాస్తున్నాను.`
  },
  m5: {
    en: (name: string) => `Enter medicine in this format:\nName – Dose – Time – Before/After Food`,
    te: (name: string) => `ఈ ఫార్మాట్లో ఎంటర్ చేయండి:\nమందు పేరు – డోస్ – టైమ్ – భోజనం ముందు/తర్వాత`
  },
  m6: {
    en: (name: string) => `Example:\nDolo 650 – 1 Tablet – Morning & Night – After Food`,
    te: (name: string) => `ఉదాహరణ:\nడోలో 650 – 1 టాబ్లెట్ – ఉదయం & రాత్రి – భోజనం తర్వాత`
  },
  m7: {
    en: (name: string) => `Do you want to save these medicines?`,
    te: (name: string) => `ఈ మందులు సేవ్ చేయాలా?`
  },
  m8: {
    en: (name: string) => `Set reminder timings for medicines.`,
    te: (name: string) => `మందులకి రిమైండర్ టైమింగ్స్ సెట్ చేయండి.`
  },
  m9: {
    en: (name: string) => `Your medicine reminders are set.`,
    te: (name: string) => `మీ మందుల రిమైండర్స్ సెట్ అయ్యాయి.`
  },
  m10: {
    en: (name: string) => `Medicines saved successfully.`,
    te: (name: string) => `మందులు సక్సెస్ఫుల్గా సేవ్ అయ్యాయి.`
  },
  caseTrack: {
    en: (name: string) => `${name}, here are your health records:`,
    te: (name: string) => `${name}, ఇవి నీ పాత కేసులు చూడు:`
  },
  pharmacy: {
    en: (name: string) => `Tell me ${name}, which medicine you need?`,
    te: (name: string) => `చెప్పు ${name}, ఏ మందు కావాలి నీకు?`
  },
};

const SPECIALTIES = [
  { label: 'Cardiology', te: 'కార్డియాలజీ', icon: '❤️' },
  { label: 'Neurology', te: 'న్యూరాలజీ', icon: '🧠' },
  { label: 'Gastroenterology', te: 'గ్యాస్ట్రో', icon: '🫃' },
  { label: 'Orthopedic', te: 'ఆర్థో', icon: '🦴' },
  { label: 'Dermatology', te: 'డర్మటాలజీ', icon: '🧴' },
  { label: 'Pediatrics', te: 'పీడియాట్రిక్స్', icon: '👶' },
  { label: 'General', te: 'జనరల్', icon: '🏥' },
  { label: 'ENT', te: 'ఇఎన్‌టి', icon: '👂' },
];

const LAB_TESTS = [
  { label: 'Thyroid Profile', te: 'థైరాయిడ్ ప్రొఫైల్', price: '₹350' },
  { label: 'CBC (Complete Blood Count)', te: 'సంపూర్ణ రక్త లెక్క', price: '₹180' },
  { label: 'LFT (Liver Function)', te: 'కాలేయ క్రియ పరీక్ష', price: '₹450' },
  { label: 'Blood Sugar (Fasting)', te: 'రక్త చక్కెర పరీక్ష', price: '₹80' },
  { label: 'Lipid Profile', te: 'లిపిడ్ ప్రొఫైల్', price: '₹500' },
  { label: 'Urine Routine', te: 'మూత్ర పరీక్ష', price: '₹120' },
  { label: 'HbA1c (Diabetes)', te: 'డయాబెటిస్ పరీక్ష', price: '₹250' },
  { label: 'COVID RT-PCR', te: 'కోవిడ్ పరీక్ష', price: '₹400' },
];

// ─── Keyword Maps (Voice + Text) ─────────────────────────────────────────────
const KEYWORD_MAP: Record<string, string> = {
  // English
  doctor: 'find-doctor', physician: 'find-doctor', specialist: 'find-doctor',
  'book doctor': 'find-doctor', appointment: 'find-doctor', surgeon: 'find-doctor',
  lab: 'find-labs', test: 'find-labs', blood: 'find-labs', thyroid: 'find-labs',
  scans: 'find-labs', xray: 'find-labs', sugar: 'find-labs', diabetes: 'find-labs',
  report: 'upload-reports', upload: 'upload-reports', scan: 'upload-reports',
  symptom: 'symptoms', pain: 'symptoms', fever: 'symptoms', headache: 'symptoms',
  sick: 'symptoms', illness: 'symptoms', cough: 'symptoms', cold: 'symptoms',
  medicine: 'pharmacy', pharmacy: 'pharmacy', tablet: 'pharmacy', drug: 'pharmacy',
  syrup: 'pharmacy', medical: 'pharmacy',
  case: 'track-case', track: 'track-case', history: 'track-case', record: 'track-case',
  // Telugu keywords (Krishna Slang & Common)
  'డాక్టర్': 'find-doctor', 'వైద్యుడు': 'find-doctor', 'హాస్పిటల్': 'find-doctor',
  'అపాయింట్మెంట్': 'find-doctor', 'చూపించు': 'find-doctor',
  'రక్త': 'find-labs', 'పరీక్ష': 'find-labs', 'లాబ్': 'find-labs', 'షుగర్': 'find-labs',
  'టెస్ట్': 'find-labs', 'రిపోర్ట్': 'upload-reports', 'పంపాలి': 'upload-reports',
  'లక్షణం': 'symptoms', 'జ్వరం': 'symptoms', 'నొప్పి': 'symptoms', 'తలనొప్పి': 'symptoms',
  'దగ్గు': 'symptoms', 'జలుబు': 'symptoms', 'బాధ': 'symptoms', 'తకలీఫ్': 'symptoms',
  'మందు': 'pharmacy', 'బిళ్ళలు': 'pharmacy', 'టాబ్లెట్': 'pharmacy', 'ఫార్మసీ': 'pharmacy',
  'మందుల': 'pharmacy', 'షాపు': 'pharmacy',
  'కేసు': 'track-case', 'చరిత్ర': 'track-case', 'పాతది': 'track-case', 'రికార్డు': 'track-case',
};

// ─── Utility ─────────────────────────────────────────────────────────────────
let msgId = 0;
const makeId = () => `msg_${++msgId}_${Date.now()}`;

const makeMsg = (role: 'bot' | 'user', text: string, chips?: Chip[]): Message => ({
  id: makeId(), role, text, chips, timestamp: new Date()
});

// ─── Main Component ───────────────────────────────────────────────────────────
interface ArogyaChatbotProps {
  onClose: () => void;
  onNavigate: (view: string) => void;
  userCases?: any[];
  isTelugu?: boolean;
  userName?: string;
}

export default function ArogyaChatbot({ onClose, onNavigate, userCases = [], isTelugu = false, userName = '' }: ArogyaChatbotProps) {
  const [selectedLang, setSelectedLang] = useState<'en' | 'te' | null>(null);
  const lang = selectedLang ?? (isTelugu ? 'te' : 'en');
  const isTE = lang === 'te';
  
  const t = (key: keyof typeof LANG) => {
    const val = LANG[key][lang];
    return typeof val === 'function' ? val(userName) : val;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  
  // Flow state
  const [flowType, setFlowType] = useState<'journey' | 'medicine' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [tempData, setTempData] = useState<any>({});

   const bottomRef = useRef<HTMLDivElement>(null);
   const recognitionRef = useRef<any>(null);
   const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, forceLang?: 'en' | 'te') => {
    const activeLang = forceLang || lang;
    if (!voiceOn || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = activeLang === 'te' ? 'te-IN' : 'en-IN';
    utt.rate = 0.88; // Slightly slower for clarity
    utt.pitch = 1.0;
    utt.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const target = activeLang === 'te' ? 'te' : 'en';
    
    // Very aggressive voice searching for Female Telugu/Indian voice
    let voice = voices.find(v => (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google')) && v.lang.toLowerCase().includes(target) && v.lang.toLowerCase().includes('in'));
    if (!voice) voice = voices.find(v => v.lang.toLowerCase().includes(target) && v.lang.toLowerCase().includes('in'));
    if (!voice) voice = voices.find(v => v.lang.toLowerCase().startsWith(target));
    if (!voice) voice = voices.find(v => v.name.toLowerCase().includes(activeLang === 'te' ? 'telugu' : 'english'));
    
    // Fallback for Telugu to Hindi if still missing (often works better than English fallback for Indian context)
    if (!voice && activeLang === 'te') voice = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
    
    if (voice) utt.voice = voice;
    
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [voiceOn, lang]);

  // ── Bot response helper ────────────────────────────────────────────────────
  const addBot = useCallback((text: string, chips?: Chip[]) => {
    setMessages(prev => [...prev, makeMsg('bot', text, chips)]);
    
    // Accessibility: Speak the text AND the options
    let fullSpeech = text;
    if (chips && chips.length > 0) {
      const optionsText = isTE ? '... మీకు ఉన్న ఆప్షన్స్: ' : '... Your options are: ';
      // Clean labels for reading (remove emojis)
      const chipsText = chips.map(c => c.label.replace(/[^\w\s\u0C00-\u0C7F]/g, '').trim()).join(', ');
      fullSpeech += optionsText + chipsText;
    }
    
    setTimeout(() => speak(fullSpeech), 150);
  }, [speak, isTE]);

  // ── Start chat after language selected ────────────────────────────────────
  const startChat = (l: 'en' | 'te') => {
    setSelectedLang(l);
    const chips = MAIN_CHIPS(l === 'te');
    const text = LANG.greeting[l](userName);
    
    // Use addBot instead of manual state set to trigger the options reading logic
    setMessages([]); // Clear previous
    addBot(text, chips);
  };

  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // ── Scroll ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Voice Input ────────────────────────────────────────────────────────────
  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { addBot("Voice input not supported on this browser."); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = isTE ? 'te-IN' : 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript;
      setInput(spoken);
      handleSend(spoken);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  // ── Keyword detection ──────────────────────────────────────────────────────
  const detectIntent = (text: string): string | null => {
    const lower = text.toLowerCase();
    for (const [kw, action] of Object.entries(KEYWORD_MAP)) {
      if (lower.includes(kw.toLowerCase())) return action;
    }
    return null;
  };

  // ── Handle chip / send ─────────────────────────────────────────────────────
  const handleAction = useCallback((action: string, label?: string) => {
    if (label) setMessages(prev => [...prev, makeMsg('user', label)]);

    // Helper for skipping
    if (action === 'skip') {
      if (flowType === 'journey' && currentStep < 15) {
        const next = currentStep + 1;
        setCurrentStep(next);
        addBot(t(`j${next}` as any), JOURNEY_CHIPS(isTE, next));
      } else if (flowType === 'medicine' && currentStep < 10) {
        const next = currentStep + 1;
        setCurrentStep(next);
        addBot(t(`m${next}` as any), MEDICINE_CHIPS(isTE, next));
      } else {
        addBot(isTE ? 'సరే అన్నా, మెయిన్ మెనూకి వెళ్దాం.' : "Okay, let's go to main menu.", MAIN_CHIPS(isTE));
        setFlowType(null);
        setCurrentStep(1);
      }
      return;
    }

    // --- JOURNEY FLOW HANDLERS ---
    if (flowType === 'journey') {
      const nextStep = currentStep + 1;
      switch (currentStep) {
        case 1: // Start -> Capture Symptoms
        case 2: // Capture -> Case Selection
        case 3: // Case -> Confirmation
        case 4: // Confirmation -> Doctor Suggestion
        case 5: // Suggestion -> Selection
        case 6: // Selection -> Health Info
        case 7: // Health Info -> Lab Suggestion
        case 8: // Lab -> Prescription
        case 9: // Prescription -> Contact
        case 10: // Contact -> Reports
        case 11: // Reports -> Diagnosis
        case 12: // Diagnosis -> Medicines
        case 13: // Medicines -> Progress
        case 14: // Progress -> End
          setCurrentStep(nextStep);
          addBot(t(`j${nextStep}` as any), JOURNEY_CHIPS(isTE, nextStep));
          if (action === 'go-book-doctor') onNavigate('book-doctor');
          if (action === 'go-book-lab') onNavigate('book-lab');
          break;
        case 15:
          addBot(isTE ? 'సరే అన్నా! అంతా సేవ్ అయింది.' : "Okay! Everything is saved.", MAIN_CHIPS(isTE));
          setFlowType(null);
          setCurrentStep(1);
          break;
      }
      return;
    }

    // --- MEDICINE FLOW HANDLERS ---
    if (flowType === 'medicine') {
      const nextStep = currentStep + 1;
      switch (currentStep) {
        case 1: // Diagnosis entry -> Confirmation
          setCurrentStep(nextStep);
          const diag = label || input || 'Unknown';
          setTempData({ ...tempData, diagnosis: diag });
          addBot(isTE ? `మీరు ఇచ్చింది: ${diag}. సేవ్ చేయాలా?` : `You entered: ${diag}. Save it?`, MEDICINE_CHIPS(isTE, nextStep));
          break;
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
          setCurrentStep(nextStep);
          addBot(t(`m${nextStep}` as any), MEDICINE_CHIPS(isTE, nextStep));
          break;
        case 10:
          addBot(isTE ? 'మందులు సేవ్ అయ్యాయి!' : "Medicines saved!", MAIN_CHIPS(isTE));
          setFlowType(null);
          setCurrentStep(1);
          break;
      }
      return;
    }

    // --- MAIN MENU ACTIONS ---
    switch (action) {
      case 'find-doctor':
      case 'symptoms':
        setFlowType('journey');
        setCurrentStep(1);
        addBot(t('j1'), JOURNEY_CHIPS(isTE, 1));
        break;
      case 'pharmacy':
        setFlowType('medicine');
        setCurrentStep(1);
        addBot(t('m1'), MEDICINE_CHIPS(isTE, 1));
        break;
      case 'find-labs':
        setFlowType('journey');
        setCurrentStep(8); // Jump to Lab Suggesstion
        addBot(t('j8'), JOURNEY_CHIPS(isTE, 8));
        break;
      case 'track-case':
        handleTrackCase();
        break;
      case 'upload-reports':
        setFlowType('journey');
        setCurrentStep(11); // Jump to Reports
        addBot(t('j11'), JOURNEY_CHIPS(isTE, 11));
        break;
      case 'go-book-doctor': onNavigate('book-doctor'); break;
      case 'go-book-lab': onNavigate('book-lab'); break;
      case 'go-pharmacy': onNavigate('pharmacy'); break;
      case 'exit': onClose(); break;
    }
  }, [addBot, isTE, onNavigate, userCases, lang, flowType, currentStep, tempData]);

  const handleTrackCase = () => {
    if (userCases.length === 0) {
      addBot(isTE ? 'అన్నా, ఏ కేసూ లేదు. డాక్టర్ దగ్గరికి వెళ్ళాలా?' : 'No active cases found. Want to see a doctor?', [{
        label: isTE ? 'డాక్టర్ చూపించు' : 'Find Doctor',
        action: 'find-doctor', color: 'emerald', icon: Plus
      }]);
    } else {
      addBot(t('caseTrack'), userCases.slice(0, 3).map(c => ({
        label: `${c.caseId || 'CASE'} — ${c.caseName}`,
        action: 'go-book-doctor', color: 'blue', icon: Activity
      })));
    }
  };

  const handleSend = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, makeMsg('user', trimmed)]);
    setInput('');
    const intent = detectIntent(trimmed);
    if (intent) {
      setTimeout(() => handleAction(intent), 400);
    } else {
      setTimeout(() => addBot(
        isTE
          ? 'సరే అన్నా! ఇవి చూడు, ఏది కావాలో నొక్కు:'
          : "Got it! Tap what you need below:",
        MAIN_CHIPS(isTE)
      ), 400);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.95 }}
      className="fixed inset-0 z-[600] flex flex-col"
      style={{ maxHeight: '100dvh', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 border-2 border-white/30">
          <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-black text-white tracking-tight">ఆరోగ్యదాత</p>
          <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest">
            {isTE ? 'ఆరోగ్య సహాయకుడు' : 'Health Assistant'} • {isTE ? 'సజీవంగా' : 'Live'}
          </p>
        </div>
        <button onClick={() => setVoiceOn(v => !v)}
          className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center border border-white/20 active:scale-90">
          {voiceOn ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white" />}
        </button>
        {selectedLang && (
          <button onClick={() => { setSelectedLang(null); setMessages([]); }}
            className="text-[9px] font-black text-white/70 uppercase bg-white/10 px-2 py-1 rounded-full border border-white/20">
            {isTE ? 'EN' : 'తె'}
          </button>
        )}
        <button onClick={onClose}
          className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center border border-white/20 active:scale-90">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* ── LANGUAGE SELECTION SCREEN ───────────────────────────────────────── */}
      <AnimatePresence>
        {!selectedLang && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center px-6 gap-8"
          >
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[32px] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/30">
                <Heart className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-[22px] font-black text-emerald-900 tracking-tight">ఆరోగ్యదాత</h2>
              <p className="text-[13px] text-emerald-700 font-semibold mt-1">Arogyadatha Health Assistant</p>
            </div>
            <div className="w-full space-y-4">
              <p className="text-center text-[12px] font-black text-slate-500 uppercase tracking-widest">మీ భాష ఎంచుకోండి / Choose Language</p>
              <button onClick={() => startChat('te')}
                className="w-full flex items-center justify-between px-6 py-5 bg-white rounded-[24px] border-2 border-emerald-200 shadow-lg shadow-emerald-100 active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🇮🇳</span>
                  <div className="text-left">
                    <p className="text-[16px] font-black text-slate-900">తెలుగు</p>
                    <p className="text-[10px] text-emerald-600 font-bold">ఆంధ్రప్రదేశ్ స్థానిక భాష</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-500" />
              </button>
              <button onClick={() => startChat('en')}
                className="w-full flex items-center justify-between px-6 py-5 bg-white rounded-[24px] border-2 border-blue-200 shadow-lg shadow-blue-100 active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🔤</span>
                  <div className="text-left">
                    <p className="text-[16px] font-black text-slate-900">English</p>
                    <p className="text-[10px] text-blue-600 font-bold">Simple Indian English</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-500" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">🔊 Voice support • 100% Free • No charge</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MESSAGES + INPUT (only after language selected) ─────────────── */}
      {selectedLang && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-slate-50" style={{ overscrollBehavior: 'contain' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                <div className={`max-w-[82%] px-4 py-3 rounded-[20px] text-[13px] font-semibold leading-relaxed shadow-sm ${
                  msg.role === 'bot'
                    ? 'bg-white text-slate-800 rounded-tl-[4px] border border-slate-100'
                    : 'bg-emerald-600 text-white rounded-tr-[4px]'
                }`}>
                  {msg.text}
                </div>
                {msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-w-full pb-1 overflow-x-auto no-scrollbar">
                    {msg.chips.map((chip, i) => {
                      const Icon = chip.icon;
                      return (
                        <button key={i} onClick={() => handleAction(chip.action, chip.label)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-wide border-2 transition-all active:scale-95 shadow-sm shrink-0 ${CHIP_COLOR[chip.color || 'emerald']}`}>
                          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                          <span className="whitespace-nowrap">{chip.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* ── INPUT BAR ─────────────────────────────────────────────────── */}
          <div className="shrink-0 bg-white border-t border-slate-100 px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <AnimatePresence>
              {showQuickMenu && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="grid grid-cols-4 gap-2 mb-3">
                  {QUICK_ACTIONS(isTE).map((qa, i) => {
                    const Icon = qa.icon;
                    return (
                      <button key={i} onClick={() => { setShowQuickMenu(false); handleAction(qa.action, qa.label); }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl ${qa.bg} border active:scale-95 transition-all`}>
                        <Icon className={`w-5 h-5 ${qa.iconColor}`} />
                        <span className={`text-[8px] font-black uppercase ${qa.textColor} text-center leading-tight`}>{qa.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowQuickMenu(v => !v)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 ${showQuickMenu ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Plus className="w-5 h-5" />
              </button>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={t('tapToSpeak')}
                className="flex-1 bg-slate-50 border-2 border-slate-100 focus:border-emerald-400 rounded-full px-4 py-2.5 text-[13px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300" />
              <button onClick={toggleMic}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button onClick={() => handleSend()} disabled={!input.trim()}
                className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md shrink-0 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Chip color map ───────────────────────────────────────────────────────────
const CHIP_COLOR: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
};

// ─── Chip factories ───────────────────────────────────────────────────────────
const JOURNEY_CHIPS = (te: boolean, step: number): Chip[] => {
  const skip = { label: te ? '⏭️ స్కిప్' : '⏭️ Skip', action: 'skip', color: 'slate' };
  switch (step) {
    case 1: return [{ label: te ? '🎤 సింప్టమ్స్ చెప్పు' : '🎤 Speak Symptoms', action: 'mic', color: 'emerald', icon: Mic }, { label: te ? '⌨️ టైప్ చేయి' : '⌨️ Type Symptoms', action: 'type', color: 'blue', icon: Send }, skip];
    case 2: return [{ label: te ? '✅ సేవ్ చేయి' : '✅ Save Symptoms', action: 'save', color: 'emerald' }, { label: te ? '✏️ ఎడిట్' : '✏️ Edit', action: 'edit', color: 'amber' }, skip];
    case 3: return [{ label: te ? '📂 పాత కేసు 1' : '📂 Existing Case 1', action: 'case1', color: 'blue' }, { label: te ? '➕ కొత్త కేసు' : '➕ New Case', action: 'new', color: 'emerald' }, skip];
    case 4: return [{ label: te ? '➡️ కొనసాగించు' : '➡️ Continue', action: 'next', color: 'emerald' }, skip];
    case 5: return [{ label: te ? '👨‍⚕️ డాక్టర్ 1' : '👨‍⚕️ Doctor 1', action: 'doc1', color: 'emerald' }, { label: te ? '👨‍⚕️ డాక్టర్ 2' : '👨‍⚕️ Doctor 2', action: 'doc2', color: 'emerald' }, skip];
    case 6: return [{ label: te ? '✅ కన్ఫర్మ్ డాక్టర్' : '✅ Confirm Doctor', action: 'confirm', color: 'emerald' }, { label: te ? '🔄 మార్చు' : '🔄 Change Doctor', action: 'change', color: 'amber' }, skip];
    case 7: return [{ label: te ? '🎤 వివరాలు చెప్పు' : '🎤 Speak Details', action: 'mic', color: 'emerald', icon: Mic }, { label: te ? '⌨️ ఎంటర్ చేయి' : '⌨️ Enter Manually', action: 'type', color: 'blue' }, skip];
    case 8: return [{ label: te ? '🧪 ల్యాబ్ 1' : '🧪 Lab 1', action: 'lab1', color: 'violet' }, { label: te ? '🧪 ల్యాబ్ 2' : '🧪 Lab 2', action: 'lab2', color: 'violet' }, skip];
    case 9: return [{ label: te ? '📤 అప్‌లోడ్' : '📤 Upload', action: 'upload', color: 'blue', icon: FileText }, { label: te ? '📷 ఫోటో తీయి' : '📷 Take Photo', action: 'photo', color: 'rose' }, skip];
    case 10: return [{ label: te ? '📞 కాల్ ల్యాబ్' : '📞 Call Lab', action: 'call', color: 'emerald', icon: Phone }, { label: te ? '🚑 హోమ్ కలెక్షన్' : '🚑 Home Collection', action: 'home', color: 'rose' }, skip];
    case 11: return [{ label: te ? '📄 అప్‌లోడ్ రిపోర్ట్' : '📄 Upload Report', action: 'upload', color: 'blue' }, { label: te ? '👀 రిపోర్ట్స్ చూడు' : '👀 View Reports', action: 'view', color: 'slate' }, skip];
    case 12: return [{ label: te ? '✏️ ఎంటర్ రోగం' : '✏️ Enter Disease', action: 'type', color: 'blue' }, skip];
    case 13: return [{ label: te ? '💊 మందులు యాడ్ చేయి' : '💊 Add Medicine', action: 'med', color: 'amber', icon: Pill }, { label: te ? '⏰ రిమైండర్' : '⏰ Set Reminder', action: 'rem', color: 'blue' }, skip];
    case 14: return [{ label: te ? '➡️ నెక్స్ట్ స్టెప్' : '➡️ Next Step', action: 'next', color: 'emerald' }, { label: te ? '📊 ప్రోగ్రెస్ చూడు' : '📊 View Progress', action: 'view', color: 'slate' }, skip];
    case 15: return [{ label: te ? '📂 కేసు చూడు' : '📂 View Case', action: 'view', color: 'blue' }, { label: te ? '🔄 కొత్తది మొదలుపెట్టు' : '🔄 Start New', action: 'new', color: 'emerald' }, { label: te ? '❌ ఎగ్జిట్' : '❌ Exit', action: 'exit', color: 'rose' }];
    default: return [skip];
  }
};

const MEDICINE_CHIPS = (te: boolean, step: number): Chip[] => {
  const skip = { label: te ? '⏭️ స్కిప్' : '⏭️ Skip', action: 'skip', color: 'slate' };
  switch (step) {
    case 1: return [{ label: te ? '🎤 రోగం చెప్పు' : '🎤 Speak Diagnosis', action: 'mic', color: 'emerald', icon: Mic }, { label: te ? '⌨️ టైప్ చేయి' : '⌨️ Type Diagnosis', action: 'type', color: 'blue' }, skip];
    case 2: return [{ label: te ? '✅ సేవ్' : '✅ Save', action: 'save', color: 'emerald' }, { label: te ? '✏️ ఎడిట్' : '✏️ Edit', action: 'edit', color: 'amber' }, skip];
    case 3: return [{ label: te ? '🎤 మందులు చెప్పు' : '🎤 Speak Medicines', action: 'mic', color: 'emerald' }, { label: te ? '📷 ప్రిస్క్రిప్షన్ అప్‌లోడ్' : '📷 Upload Prescription', action: 'photo', color: 'rose' }, { label: te ? '⌨️ మాన్యువల్' : '⌨️ Enter Manually', action: 'type', color: 'blue' }, skip];
    case 4: return [{ label: te ? '🎤 మాట్లాడటం మొదలుపెట్టు' : '🎤 Start Speaking', action: 'mic', color: 'emerald' }, skip];
    case 5: return [{ label: te ? '➕ మందు యాడ్ చేయి' : '➕ Add Medicine', action: 'type', color: 'emerald' }, skip];
    case 6: return [{ label: te ? '➕ ఇంకా యాడ్ చేయి' : '➕ Add More', action: 'type', color: 'emerald' }, skip];
    case 7: return [{ label: te ? '✅ సేవ్' : '✅ Save', action: 'save', color: 'emerald' }, { label: te ? '✏️ ఎడిట్' : '✏️ Edit', action: 'edit', color: 'amber' }, skip];
    case 8: return [{ label: te ? '⏰ ఉదయం' : '⏰ Morning', action: 'morn', color: 'blue' }, { label: te ? '⏰ మధ్యాహ్నం' : '⏰ Afternoon', action: 'aft', color: 'blue' }, { label: te ? '⏰ రాత్రి' : '⏰ Night', action: 'night', color: 'blue' }, skip];
    case 9: return [{ label: te ? '🔔 రిమైండర్స్ చూడు' : '🔔 View Reminders', action: 'view', color: 'blue' }, { label: te ? '✏️ ఎడిట్ రిమైండర్' : '✏️ Edit Reminder', action: 'edit', color: 'amber' }, { label: te ? '❌ క్యాన్సల్' : '❌ Cancel', action: 'cancel', color: 'rose' }];
    case 10: return [{ label: te ? '📂 మందులు చూడు' : '📂 View Medicines', action: 'view', color: 'blue' }, { label: te ? '➕ ఇంకా యాడ్ చేయి' : '➕ Add More', action: 'new', color: 'emerald' }, { label: te ? '❌ ఎగ్జిట్' : '❌ Exit', action: 'exit', color: 'rose' }];
    default: return [skip];
  }
};

const MAIN_CHIPS = (te: boolean): Chip[] => [
  { label: te ? '🩺 డాక్టర్ కావాలి' : '🩺 Find Doctor', action: 'find-doctor', color: 'emerald', icon: Stethoscope },
  { label: te ? '🧪 రక్త పరీక్ష' : '🧪 Lab Test', action: 'find-labs', color: 'violet', icon: FlaskConical },
  { label: te ? '🤒 సింటమ్స్ చెప్పు' : '🤒 Tell Symptoms', action: 'symptoms', color: 'blue', icon: Activity },
  { label: te ? '📅 అపాయింట్మెంట్' : '📅 Appointment', action: 'find-doctor', color: 'emerald', icon: Calendar },
  { label: te ? '📄 రిపోర్ట్స్' : '📄 Reports', action: 'upload-reports', color: 'slate', icon: FileText },
  { label: te ? '📊 నా కేసులు' : '📊 My Records', action: 'track-case', color: 'blue', icon: Activity },
  { label: te ? '💊 మందులు కావాలి' : '💊 Medicines', action: 'pharmacy', color: 'amber', icon: Pill },
];

const SPECIALTY_CHIPS = (te: boolean): Chip[] =>
  SPECIALTIES.map(s => ({ label: te ? `${s.icon} ${s.te} డాక్టర్` : `${s.icon} ${s.label}`, action: s.label, color: 'emerald', icon: Stethoscope }));

const LAB_CHIPS = (te: boolean): Chip[] =>
  LAB_TESTS.map(l => ({ label: te ? `🔬 ${l.te}` : l.label, action: l.label, color: 'violet', icon: FlaskConical }));

const QUICK_ACTIONS = (te: boolean) => [
  { label: te ? 'డాక్టర్' : 'Doctor', action: 'find-doctor', icon: Stethoscope, bg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-600', textColor: 'text-emerald-700' },
  { label: te ? 'టెస్ట్' : 'Lab Test', action: 'find-labs', icon: FlaskConical, bg: 'bg-violet-50 border-violet-100', iconColor: 'text-violet-600', textColor: 'text-violet-700' },
  { label: te ? 'మందు' : 'Medicine', action: 'pharmacy', icon: Pill, bg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-600', textColor: 'text-amber-700' },
  { label: te ? 'కేసు' : 'Records', action: 'track-case', icon: Activity, bg: 'bg-blue-50 border-blue-100', iconColor: 'text-blue-600', textColor: 'text-blue-700' },
];
