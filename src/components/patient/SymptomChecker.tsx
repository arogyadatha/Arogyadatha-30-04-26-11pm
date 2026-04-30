import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  FlaskConical,
  User,
  CheckCircle,
  ArrowRight,
  Brain,
  Stethoscope,
  Pill,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';
import { toast } from 'sonner';
import { createCase } from '../../services/caseService';

interface SymptomCheckerProps {
  user: UserProfile;
  onBack: () => void;
  onCaseCreated: () => void;
  userCases: any[];
  t: any;
}

export default function SymptomChecker({ user, onBack, onCaseCreated, userCases, t }: SymptomCheckerProps) {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);

  const getAi = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    setSavedCaseId(null);

    try {
      const ai = getAi();
      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Analyze these symptoms: "${symptoms}". 
        The user's preferred language is ${t.languageLabel === "భాష" ? "Telugu" : "English"}.
        Provide a JSON response with all string values translated to this language:
        1. possibleConditions: array of strings.
        2. recommendedTests: array of strings.
        3. recommendedDoctor: array of strings.
        4. mainSymptom: string.
        5. urgency: "low" | "medium" | "high".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              possibleConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedTests: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedDoctor: { type: Type.ARRAY, items: { type: Type.STRING } },
              mainSymptom: { type: Type.STRING },
              urgency: { type: Type.STRING }
            },
            required: ["possibleConditions", "recommendedTests", "recommendedDoctor", "mainSymptom", "urgency"]
          }
        }
      });

      const data = JSON.parse(res.text);
      setResult(data);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAsNewCase = async () => {
    if (!result || !user) return;
    setIsSaving(true);
    try {
      const { caseId } = await createCase(user.uid, result.mainSymptom, symptoms);
      setSavedCaseId(caseId);
      toast.success(`Case ${caseId} created!`);
      onCaseCreated();
    } catch (error) {
      toast.error("Failed to save case.");
    } finally {
      setIsSaving(false);
    }
  };

  const urgencyColors: Record<string, { bg: string, text: string, border: string, label: string, icon: any }> = {
    low: { bg: 'bg-emerald-50/50', text: 'text-emerald-600', border: 'border-emerald-100', label: t.lowUrgency, icon: CheckCircle },
    medium: { bg: 'bg-amber-50/50', text: 'text-amber-600', border: 'border-amber-100', label: t.moderateUrgency, icon: AlertCircle },
    high: { bg: 'bg-rose-50/50', text: 'text-rose-600', border: 'border-rose-100', label: t.immediateCare, icon: AlertCircle },
  };

  const urgency = result?.urgency || 'low';
  const uc = urgencyColors[urgency] || urgencyColors.low;

  const exampleSymptoms = t.commonExamples === "Common examples:"
    ? ["Headache & Fever", "Cold & Cough", "Stomach Pain", "Body Ache", "Fatigue", "Dizziness", "Nausea"]
    : ["తలనొప్పి & జ్వరం", "జలుబు & దగ్గు", "కడుపు నొప్పి", "ఒళ్లు నొప్పులు", "అలసట", "తల తిరగడం", "వికారం"];

  return (
    <div className="flex flex-col max-w-6xl mx-auto px-2 sm:px-4 pb-32 relative">

      {/* Decorative background elements */}
      <div className="fixed top-20 -left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
      <div className="fixed bottom-40 -right-20 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />



      {/* Stepper Navigation (Image Match) */}
      <div className="max-w-3xl mx-auto w-full mb-4 sm:mb-6 mt-2">
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-100 -translate-y-1/2 z-0 mx-8" />
          {[
            { step: 1, label: t.step1, active: true },
            { step: 2, label: t.step2, active: false },
            { step: 3, label: t.step3, active: false },
            { step: 4, label: t.step4, active: false }
          ].map((item, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black transition-all ${item.active ? 'bg-[#0b6b4f] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                {item.step}
              </div>
              <span className={`text-[7px] sm:text-[9px] font-bold uppercase tracking-tight whitespace-nowrap ${item.active ? 'text-[#0b6b4f]' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-gray-100 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
          <div className="p-4 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/50">
                <Pill className="w-5 h-5 text-[#0b6b4f]" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-black text-slate-800 leading-none">{t.howAreYouFeeling}</h3>
                <p className="text-[10px] sm:text-xs font-medium text-gray-400 mt-1">{t.describeSymptomsDetail}</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={t.symptomPlaceholder}
                className="w-full min-h-[140px] sm:min-h-[180px] p-5 bg-white border border-gray-100 rounded-xl text-slate-700 placeholder:text-gray-300 font-medium text-xs sm:text-sm focus:outline-none focus:border-[#0b6b4f] transition-all resize-none leading-relaxed shadow-inner"
              />
              <div className="absolute bottom-3 right-5 text-[8px] font-bold text-gray-300 bg-white/80 px-2 py-0.5 rounded-full">
                {symptoms.length} / 1000
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.commonExamples}</p>
              <div className="flex flex-wrap gap-1.5">
                {exampleSymptoms.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => setSymptoms(prev => prev ? `${prev}, ${tag}` : tag)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-[#F0F9F4] hover:text-[#0b6b4f] border border-gray-100 hover:border-[#0b6b4f]/20 rounded-lg text-[8px] sm:text-[9px] font-bold text-gray-500 transition-all active:scale-95"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-emerald-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#0b6b4f]/30" />
                  </div>
                ))}
              </div>
              <div className="leading-tight">
                <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight">{t.diagnosedCount}</p>
                <p className="text-[8px] font-bold text-[#0b6b4f]/60 uppercase tracking-widest">{t.accuracyRate}</p>
              </div>
            </div>

            <button
              onClick={analyzeSymptoms}
              disabled={isAnalyzing || !symptoms.trim()}
              className="w-full sm:w-auto px-10 py-4 bg-[#0b6b4f] hover:bg-[#08523c] text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 shadow-lg shadow-[#0b6b4f]/10"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isAnalyzing ? t.analyzing : t.analyzeSymptomsBtn}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 space-y-10"
          >
            <div className={`relative overflow-hidden ${uc.bg} border-2 ${uc.border} rounded-[40px] p-8 flex flex-col sm:flex-row items-center gap-6 group`}>
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <uc.icon className="w-40 h-40" />
              </div>
              <div className={`w-16 h-16 ${uc.bg} rounded-[24px] flex items-center justify-center shadow-lg border-2 border-white/50 shrink-0`}>
                <uc.icon className={`w-8 h-8 ${uc.text}`} />
              </div>
              <div className="text-center sm:text-left">
                <p className={`text-[11px] font-black uppercase tracking-[0.3em] ${uc.text} opacity-50 mb-2`}>{t.medicalIntelligenceReport}</p>
                <h4 className={`text-3xl font-black ${uc.text} uppercase tracking-tighter leading-tight`}>{uc.label}</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: t.conditions, data: result.possibleConditions, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
                { title: t.nextSteps, data: result.recommendedTests, icon: FlaskConical, color: "text-emerald-500", bg: "bg-emerald-50" },
                { title: t.specialists, data: result.recommendedDoctor, icon: User, color: "text-blue-500", bg: "bg-blue-50" }
              ].map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white border-2 border-slate-50 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/10 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 ${section.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <section.icon className={`w-5 h-5 ${section.color}`} />
                    </div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.title}</h5>
                  </div>
                  <div className="space-y-3">
                    {section.data.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl text-[11px] font-black text-slate-700 uppercase tracking-tight group-hover:bg-white group-hover:shadow-sm transition-all">
                        <div className={`w-1.5 h-1.5 rounded-full ${section.color} shrink-0`} />
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-6">
              {savedCaseId ? (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-emerald-500 rounded-[32px] p-8 text-center text-white shadow-2xl">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h4 className="text-2xl font-black uppercase tracking-tighter mb-2">{t.journeyStarted}</h4>
                  <p className="text-emerald-100 font-black text-[10px] uppercase tracking-[0.3em]">Case ID: {savedCaseId}</p>
                </motion.div>
              ) : (
                <button
                  onClick={saveAsNewCase}
                  disabled={isSaving}
                  className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 shadow-xl flex items-center justify-center gap-4 border-none"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {isSaving ? t.initializing : t.createCaseBtn}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
