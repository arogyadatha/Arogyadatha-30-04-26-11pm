import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Sparkles, AlertCircle, ChevronRight, History, ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { createCase, CaseData, findSimilarCase } from '../../services/caseService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CreateCaseModalProps {
  patientId: string;
  existingCases: CaseData[];
  onClose: () => void;
  onCaseCreated: (caseId: string) => void;
  initialView?: 'options' | 'form' | 'all-cases';
  preSelectedCase?: string | null;
}

export default function CreateCaseModal({
  patientId,
  existingCases,
  onClose,
  onCaseCreated,
  initialView = 'options',
  preSelectedCase = null
}: CreateCaseModalProps) {
  const [caseName, setCaseName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'options' | 'form' | 'all-cases'>(initialView);
  const [selectedCase, setSelectedCase] = useState<string | null>(preSelectedCase);

  const handleCreate = async () => {
    if (!caseName.trim()) {
      toast.error('Enter health issue name');
      return;
    }

    setLoading(true);
    try {
      // Check for duplicates
      const similar = await findSimilarCase(patientId, caseName);
      if (similar) {
        toast.error(`Case "${similar.caseName}" already exists! Please use Follow-up.`);
        setLoading(false);
        return;
      }

      const result = await createCase(patientId, caseName, description);
      toast.success(`✅ Health Case Created!`);
      onCaseCreated(result.caseId);
      onClose();
    } catch (error: any) {
      toast.error('Error: ' + (error.message || 'Failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedCase) {
      toast.error('Please select a follow-up option');
      return;
    }
    
    const caseData = existingCases.find(c => c.caseId === selectedCase);
    if (caseData) {
      const nextNum = (caseData.appointments?.length || 0) + 1;
      const currentFollowUpNum = Math.max(1, (caseData.sessionHistory?.length || 0) + 1);
      const ordinal = getOrdinalSuffix(nextNum);
      
      try {
        const caseRef = doc(db, 'patients', patientId, 'cases', caseData.id);
        
        // ONLY archive if the current case is ACTIVE. 
        // If it's already completed, it's already been archived by the "Complete" button.
        const shouldArchive = caseData.status === 'active';
        
        if (shouldArchive) {
          toast.info(`Archiving current session and starting ${nextNum}${ordinal} Follow-up`);
          const sessionSnapshot = {
            followUpNum: currentFollowUpNum,
            completedAt: new Date(),
            symptoms: caseData.symptoms || '',
            vitals: caseData.vitals || { bp: '', weight: '', height: '' },
            medicines: caseData.medicines || [],
            labRequests: caseData.labRequests || [],
            healthJourney: caseData.healthJourney || {},
            diagnosis: caseData.diagnosis || '',
            doctorName: caseData.doctorName || '',
            followUpNote: caseData.followUpNote || ''
          };

          await updateDoc(caseRef, { 
            status: 'active', 
            updatedAt: serverTimestamp(),
            lastFollowUpStartedAt: serverTimestamp(),
            sessionHistory: arrayUnion(sessionSnapshot),
            // RESET FOR NEW SESSION
            symptoms: '',
            vitals: { bp: '', weight: '', height: '' },
            healthJourney: { symptomChecker: false, bookDoctor: false, bookLab: false, pharmacy: false, manualLab: false, manualPharmacy: false },
            medicines: [],
            labRequests: [],
            followUpNote: '',
            diagnosis: '',
            doctorName: ''
          });
        } else {
          toast.info(`Starting your ${nextNum}${ordinal} Follow-up`);
          await updateDoc(caseRef, { 
            status: 'active', 
            updatedAt: serverTimestamp(),
            lastFollowUpStartedAt: serverTimestamp(),
            // RESET FOR NEW SESSION
            symptoms: '',
            vitals: { bp: '', weight: '', height: '' },
            healthJourney: { symptomChecker: false, bookDoctor: false, bookLab: false, pharmacy: false, manualLab: false, manualPharmacy: false },
            medicines: [],
            labRequests: [],
            followUpNote: '',
            diagnosis: '',
            doctorName: ''
          });
        }
      } catch (e) { 
        console.error(e); 
        toast.error('Failed to start new follow-up');
        return;
      }
    }
    onCaseCreated(selectedCase);
    onClose();
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          key={view}
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          className="w-full max-w-[320px] bg-white rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100"
        >
          {view === 'options' && (
            <div className="p-6 space-y-4">
               <div className="text-center mb-6">
                 <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tighter">Health Journey</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select an option to start</p>
               </div>

               <button
                 onClick={() => setView('form')}
                 className="w-full flex items-center gap-4 p-5 bg-emerald-50 rounded-[24px] border-2 border-emerald-100/50 hover:bg-emerald-100 transition-all active:scale-95 group"
               >
                 <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                 </div>
                 <div className="flex flex-col items-start">
                    <span className="text-[13px] font-black text-emerald-900 uppercase">New Case</span>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Start journey</span>
                 </div>
               </button>

               <button
                 onClick={() => setView('all-cases')}
                 className="w-full flex items-center gap-4 p-5 bg-blue-50 rounded-[24px] border-2 border-blue-100/50 hover:bg-blue-100 transition-all active:scale-95 group"
               >
                 <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <History className="w-6 h-6 text-white" />
                 </div>
                 <div className="flex flex-col items-start">
                    <span className="text-[13px] font-black text-blue-900 uppercase">Follow-up</span>
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Existing Case</span>
                 </div>
               </button>

               <button onClick={onClose} className="w-full py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-400 transition-all">
                  Dismiss
               </button>
            </div>
          )}

          {view === 'form' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('options')} className="p-2 bg-slate-50 rounded-full"><ArrowLeft className="w-4 h-4 text-slate-600" /></button>
                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">New Case Details</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Health Issue</label>
                  <input
                    type="text"
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                    placeholder="e.g., Stomach Pain..."
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl px-5 py-4 text-[13px] font-bold text-slate-900 outline-none transition-all"
                  />
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe symptoms..."
                  rows={2}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl px-5 py-4 text-[13px] font-bold text-slate-700 outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !caseName.trim()}
                className="w-full h-14 bg-[#0b6b4f] text-white rounded-[20px] font-black text-[12px] uppercase tracking-widest active:scale-95 shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'STARTING...' : 'START JOURNEY'}
              </button>
            </div>
          )}

          {view === 'all-cases' && (
            <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <button onClick={() => setView('options')} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-all active:scale-90"><ArrowLeft className="w-4 h-4 text-slate-600" /></button>
                  <div className="text-right">
                    <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tighter">Select Case</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Existing journey</p>
                  </div>
               </div>
               
               <div className="p-4 overflow-y-auto no-scrollbar max-h-[350px] space-y-3">
                  {existingCases.map((c) => {
                    const appts = c.appointments || [];
                    const nextFollowup = appts.length + 1;
                    const isSelected = selectedCase === c.caseId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCase(c.caseId)}
                        className={`w-full flex items-center justify-between px-5 py-5 rounded-[24px] transition-all border-2 ${
                          isSelected ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-500/10' : 'bg-white border-slate-50 hover:border-slate-100'
                        }`}
                      >
                        <div className="flex flex-col items-start truncate pr-2">
                           <span className={`text-[12px] font-black tracking-tight uppercase truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                             Follow-up for {c.caseName}
                           </span>
                           <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                             {c.caseId} • {nextFollowup}{getOrdinalSuffix(nextFollowup)} Follow-up
                           </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-200 bg-white'
                        }`}>
                           {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
               </div>
               
               <div className="p-6 bg-white border-t border-slate-50">
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedCase}
                    className={`w-full h-15 rounded-[22px] font-black text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${
                      selectedCase 
                        ? 'bg-blue-600 text-white shadow-blue-500/20 active:scale-95' 
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Confirm Follow-up
                  </button>
               </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
