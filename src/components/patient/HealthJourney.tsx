import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Plus,
  CheckCircle2,
  Stethoscope,
  UserCircle,
  FlaskConical,
  Pill,
  Activity,
  Trash2,
  Edit2,
  Sparkles,
  FileText,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  Info,
  Calendar,
  Microscope,
  MapPin,
  Bell,
  Upload,
  PlusCircle,
  Download,
  History,
  Eye,
  X
} from 'lucide-react';
import {
  subscribeToPatientCases,
  subscribeToCompletedCases,
  markCaseAsCompleted,
  deleteCase,
  updateCaseData,
  updateSessionHistory,
  deleteSessionHistory,
  CaseData
} from '../../services/caseService';
import { UserProfile } from '../../types';
import CreateCaseModal from './CreateCaseModal';
import JourneyTimeline from './JourneyTimeline';
import { toast } from 'sonner';

interface HealthJourneyProps {
  user: UserProfile;
  onNavigate: (view: string) => void;
  t: any;
}

export default function HealthJourney({ user, onNavigate, t }: HealthJourneyProps) {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [completedCases, setCompletedCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalInitialView, setModalInitialView] = useState<'options' | 'form' | 'all-cases'>('options');
  const [preSelectedCaseForModal, setPreSelectedCaseForModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [confirmingAction, setConfirmingAction] = useState<{ type: 'complete' | 'delete' | 'deleteSession', caseId: string, followUpNum?: number, missing?: string[], sessionIndex?: number } | null>(null);
  const [viewingSession, setViewingSession] = useState<{ caseItem: CaseData, session: any, index: number } | null>(null);

  useEffect(() => {
    const unsubActive = subscribeToPatientCases(user.uid, (data) => {
      setCases(data);
      setLoading(false);
    });
    const unsubCompleted = subscribeToCompletedCases(user.uid, (data) => {
      setCompletedCases(data);
    });
    return () => {
      unsubActive();
      unsubCompleted();
    };
  }, [user.uid]);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-white/50 rounded-[32px] animate-pulse border-2 border-emerald-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* COMPACT MAIN HEADER */}
      <div className="flex items-center justify-between px-1 gap-2 mb-1">
        <h2 className="text-[14px] sm:text-xl font-black text-[#064e3b] tracking-tight flex-1 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-600" />
          {t.healthJourneyTitle || "Health Journey"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowCreateModal(true); setModalInitialView('options'); }}
            className="flex items-center justify-center px-4 py-2 bg-[#0b6b4f] text-white rounded-full font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-500/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={4} />
            <span>{t.addFollowUp || "Add Follow-up"}</span>
          </button>
        </div>
      </div>

      {/* Compact Horizon Tabs */}
      <div className="flex bg-emerald-50/80 p-0.5 rounded-lg border border-emerald-100 shadow-sm mx-1 mb-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-1.5 rounded-[6px] text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700/60 hover:text-emerald-700'}`}
        >
          {t.activeTab || "ACTIVE"}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 rounded-[6px] text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700/60 hover:text-emerald-700'}`}
        >
          {t.appointmentHistory || "Appointment History"}
        </button>
      </div>

      {/* Horizontal Case Cards List */}
      <div className="space-y-3 pb-2">
        {activeTab === 'active' ? (
          cases.length === 0 ? (
            <EmptyJourneyState onStart={() => setShowCreateModal(true)} t={t} />
          ) : (
            cases.map((caseItem) => (
              <HorizontalCaseCard
                key={caseItem.id}
                caseItem={caseItem}
                patientId={user.uid}
                onNavigate={onNavigate}
                t={t}
                onAddFollowUp={(caseId) => {
                  setPreSelectedCaseForModal(caseId);
                  setModalInitialView('all-cases');
                  setShowCreateModal(true);
                }}
                onConfirmAction={(action) => setConfirmingAction(action)}
              />
            ))
          )
        ) : (
          completedCases.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
                <History className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Appointment History Found</h4>
            </div>
          ) : (
            completedCases.map((caseItem) => (
              <div key={caseItem.id} className="mb-8">
                <HorizontalCaseCard
                  caseItem={caseItem}
                  patientId={user.uid}
                  onNavigate={onNavigate}
                  t={t}
                  isHistory
                  onAddFollowUp={(caseId) => {
                    setPreSelectedCaseForModal(caseId);
                    setModalInitialView('all-cases');
                    setShowCreateModal(true);
                  }}
                  onConfirmAction={(action) => setConfirmingAction(action)}
                  onViewSession={(caseItem, session, index) => setViewingSession({ caseItem, session, index })}
                />

                {caseItem.sessionHistory && caseItem.sessionHistory.length > 0 && (
                  <div className="px-6 pb-6 -mt-4 bg-white/30 rounded-b-[32px] border-x-2 border-b-2 border-emerald-50/30 shadow-inner">
                    <p className="text-[10px] font-black text-gray-400 tracking-widest mb-4 pt-4 border-t border-emerald-50">Clinical Session History</p>
                    <div className="flex flex-col gap-3">
                      {caseItem.sessionHistory.map((session, si) => (
                        <div key={si} className="bg-white rounded-[24px] p-5 border-2 border-slate-100 flex items-center justify-between shadow-sm hover:border-emerald-500/20 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                              {si + 1}
                            </div>
                            <div>
                              <h5 className="text-[14px] font-black text-slate-900 uppercase tracking-tighter">
                                {session.followUpNum}{getOrdinalSuffix(session.followUpNum)} Follow-up
                              </h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {formatDate(session.completedAt)} • Dr. {session.doctorName || 'General Physician'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setViewingSession({ caseItem, session, index: si })}
                              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </button>
                            <button 
                              onClick={() => toast.success("Preparing PDF...")}
                              className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:text-emerald-600 transition-all active:scale-90"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateCaseModal
            patientId={user.uid}
            existingCases={[...cases, ...completedCases]}
            onClose={() => { setShowCreateModal(false); setModalInitialView('options'); setPreSelectedCaseForModal(null); }}
            onCaseCreated={(id) => { setShowCreateModal(false); setModalInitialView('options'); setPreSelectedCaseForModal(null); }}
            initialView={modalInitialView}
            preSelectedCase={preSelectedCaseForModal}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmingAction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setConfirmingAction(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-white rounded-[32px] p-8 border-4 border-black shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 ${confirmingAction.type === 'delete' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {confirmingAction.type === 'delete' ? <Trash2 className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>

              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                {confirmingAction.type === 'delete' ? 'Delete Case?' : 'Complete Session?'}
              </h3>

              <p className="text-sm font-bold text-slate-500 uppercase tracking-tight mb-6 leading-relaxed">
                {confirmingAction.type === 'delete'
                  ? 'Are you sure you want to delete this health journey? This action cannot be undone.'
                  : confirmingAction.missing && confirmingAction.missing.length > 0
                    ? `Warning: Some steps are still PENDING:\n${confirmingAction.missing.map(m => `• ${m}`).join('\n')}\n\nMark as completed anyway?`
                    : 'Are you sure you want to complete this health journey session and save it to history?'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingAction(null)}
                  className="flex-1 py-4 bg-gray-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (confirmingAction.type === 'delete') {
                        await deleteCase(user.uid, confirmingAction.caseId);
                        toast.success('Case Deleted');
                      } else if (confirmingAction.type === 'deleteSession') {
                        await deleteSessionHistory(user.uid, confirmingAction.caseId, confirmingAction.sessionIndex!);
                        toast.success('Session Deleted');
                        setViewingSession(null);
                      } else {
                        await markCaseAsCompleted(user.uid, confirmingAction.caseId, confirmingAction.followUpNum || 0);
                        toast.success('Session Saved to History!');
                      }
                    } catch (err: any) {
                      console.error('Action failed:', err);
                      toast.error('Action failed: ' + (err.message || 'Unknown error'));
                    } finally {
                      setConfirmingAction(null);
                    }
                  }}
                  className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg ${confirmingAction.type.startsWith('delete') ? 'bg-red-500 shadow-red-200' : 'bg-emerald-500 shadow-emerald-200'}`}
                >
                  {confirmingAction.type === 'delete' ? 'Delete' : confirmingAction.type === 'deleteSession' ? 'Delete Session' : 'Complete'}
                </button>
              </div>
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
            onDelete={() => setConfirmingAction({ type: 'deleteSession', caseId: viewingSession.caseItem.id, sessionIndex: viewingSession.index })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Horizontal Case Card ───────────────────────────────────────────────── */
interface HorizontalCaseCardProps {
  caseItem: CaseData;
  patientId: string;
  onNavigate: (view: string, caseId?: string) => void;
  t: any;
  isHistory?: boolean;
  onAddFollowUp: (caseId: string) => void;
  onConfirmAction: (action: { type: 'complete' | 'delete' | 'deleteSession', caseId: string, followUpNum?: number, missing?: string[], sessionIndex?: number }) => void;
  onViewSession?: (caseItem: CaseData, session: any, index: number) => void;
}

function HorizontalCaseCard({ caseItem, patientId, onNavigate, t, isHistory, onAddFollowUp, onConfirmAction, onViewSession }: HorizontalCaseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(caseItem.caseName);
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const handleRename = async () => {
    if (editedName.trim() && editedName !== caseItem.caseName) {
      await updateCaseData(patientId, caseItem.id, { caseName: editedName });
      toast.success("Case Renamed");
    }
    setIsEditing(false);
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Logic for Next Appointment & Follow-ups
  const appts = caseItem.appointments || [];
  const now = new Date();
  const nextAppt = [...appts]
    .filter(a => a.dateTime?.seconds && new Date(a.dateTime.seconds * 1000) >= now)
    .sort((a, b) => a.dateTime.seconds - b.dateTime.seconds)[0];

  const lastResetTime = caseItem.lastFollowUpStartedAt?.seconds || 0;

  // A "Session" is active if lastResetTime is more recent than any existing appointment or the creation time
  const latestApptTime = appts.length > 0
    ? Math.max(...appts.map(a => a.dateTime?.seconds || 0))
    : (caseItem.createdAt?.seconds || 0);

  const isNewFollowUpSession = lastResetTime > latestApptTime;
  const followUpNum = Math.max(1, appts.length + (isNewFollowUpSession ? 1 : 0));

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = new Date(ts.seconds * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    const mm = m < 10 ? '0' + m : m;
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} | ${hh}:${mm} ${ampm}`;
  };

  const steps = [
    {
      id: 'Symptom',
      icon: Stethoscope,
      label: t.symptoms || 'Symptoms',
      done: isHistory || (!!(caseItem.symptoms && caseItem.symptoms.trim().length > 3) && (caseItem.symptomsUpdatedAt?.seconds > lastResetTime)) || (caseItem.healthJourney?.symptomChecker && (caseItem.updatedAt?.seconds > lastResetTime)),
      active: !isHistory && !caseItem.symptoms,
      color: 'bg-[#4A72FF]',
      shadow: 'shadow-blue-500/20'
    },
    {
      id: 'Vitals',
      icon: Activity,
      label: 'Vitals',
      done: isHistory || (!!(caseItem.vitals?.bp && caseItem.vitals?.weight)),
      active: !isHistory && !!(caseItem.symptoms && (!caseItem.vitals?.bp || !caseItem.vitals?.weight)),
      color: 'bg-rose-500',
      shadow: 'shadow-rose-500/20'
    },
    {
      id: 'Doctor',
      icon: UserCircle,
      label: t.doctorNav || 'Doctor',
      subLabel: nextAppt ? `${formatDate(nextAppt.dateTime)}` : (followUpNum > 0 || !!caseItem.healthJourney?.bookDoctor) ? `${t.consulted || 'Consulted'} (${appts.length})` : t.pending || 'Pending',
      done: isHistory || (!!(caseItem.appointments && caseItem.appointments.some(a => a.dateTime?.seconds > lastResetTime))) || (caseItem.healthJourney?.bookDoctor && (caseItem.updatedAt?.seconds > lastResetTime)),
      active: !isHistory && !!(caseItem.vitals?.bp && caseItem.appointments?.length === 0),
      color: 'bg-[#0F9D58]',
      shadow: 'shadow-emerald-500/20'
    },
    {
      id: 'Lab',
      icon: Microscope,
      label: t.labNav || 'Lab',
      subLabel: (caseItem.labRequests?.some(r => r.createdAt?.seconds > lastResetTime) || (caseItem.healthJourney?.bookLab && caseItem.updatedAt?.seconds > lastResetTime)) ? (t.requested || 'Requested') : (t.pending || 'Pending'),
      done: isHistory || !!(caseItem.labRequests && caseItem.labRequests.some(r => r.createdAt?.seconds > lastResetTime)) || (caseItem.healthJourney?.bookLab && caseItem.updatedAt?.seconds > lastResetTime) || (caseItem.healthJourney?.manualLab && caseItem.updatedAt?.seconds > lastResetTime),
      active: !isHistory && !!(caseItem.appointments?.length > 0 && !caseItem.labRequests?.length),
      color: 'bg-[#9C27B0]',
      shadow: 'shadow-purple-500/20'
    },
    {
      id: 'Pharmacy',
      icon: Pill,
      label: t.pharmacyNav || 'Pharmacy',
      subLabel: (caseItem.medicines?.some(m => m.createdAt?.seconds > lastResetTime) || (caseItem.healthJourney?.pharmacy && caseItem.updatedAt?.seconds > lastResetTime)) ? (t.ordered || 'Ordered') : (t.pending || 'Pending'),
      done: isHistory || !!(caseItem.medicines && caseItem.medicines.some(m => m.createdAt?.seconds > lastResetTime)) || (caseItem.healthJourney?.pharmacy && caseItem.updatedAt?.seconds > lastResetTime) || (caseItem.healthJourney?.manualPharmacy && caseItem.updatedAt?.seconds > lastResetTime),
      active: !isHistory && !!(caseItem.labRequests?.some(r => r.reportUrl) && !caseItem.medicines?.length),
      color: 'bg-[#FF9800]',
      shadow: 'shadow-orange-500/20'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[20px] sm:rounded-[28px] p-3 sm:p-4 border ${isHistory ? 'border-gray-200 bg-gray-50/30' : 'border-emerald-500/30 shadow-lg shadow-emerald-500/5'} relative overflow-hidden group mb-2 transition-all hover:border-emerald-500/50`}
    >
      {/* CARD HEADER */}
      <div className="flex flex-row items-center justify-between mb-2 relative z-10 gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="bg-gray-50 border border-emerald-500/30 rounded-lg px-2 py-1 text-xs font-black text-slate-900 outline-none w-full max-w-[150px]"
              />
              <button onClick={handleRename} className="p-1 bg-[#0F9D58] text-white rounded-lg shadow-sm active:scale-90 transition-all"><CheckCircle2 className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <h3 className="text-[17px] sm:text-[20px] font-black text-slate-900 uppercase tracking-tighter leading-tight truncate mb-0.5" onClick={() => !isHistory && setIsEditing(true)}>
              {caseItem.caseName}
            </h3>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isHistory ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-emerald-50 text-[#0F9D58] border-emerald-100'}`}>
              ID: {caseItem.caseId || caseItem.id?.slice(-6).toUpperCase()}
            </span>
            <span className="bg-blue-50 text-blue-600 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tight">
              {followUpNum}{getOrdinalSuffix(followUpNum)} Follow-up
            </span>
          </div>
        </div>

        {!isHistory && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                const missing = [];
                if (!steps[0].done) missing.push('Symptoms Entry');
                if (!steps[1].done) missing.push('Doctor Consultation');
                if (!steps[2].done) missing.push('Lab Request');
                if (!steps[3].done) missing.push('Pharmacy Order');

                onConfirmAction({
                  type: 'complete',
                  caseId: caseItem.id,
                  followUpNum,
                  missing
                });
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#0b6b4f] to-emerald-700 text-white rounded-lg text-[9px] sm:text-[11px] font-black uppercase tracking-widest shadow-md shadow-emerald-200 active:scale-95 transition-all"
            >
              {t.finishBtn || "COMPLETE"}
            </button>
          </div>
        )}
      </div>

      {/* ICON PIPELINE */}
      <div className="flex items-center justify-between px-0.5 pt-1 relative">
        <div className="absolute top-[32%] left-5 right-5 h-[1.5px] bg-slate-50 z-0" />
        {steps.map((step, idx) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5 flex-1 group">
            <button
              onClick={() => !isHistory && setActivePopup(step.id)}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all relative ${step.done
                ? `${step.color} shadow-md ${step.shadow} scale-105 active:scale-95`
                : `bg-white border border-slate-100 shadow-sm ${step.active && !isHistory ? 'animate-pulse border-emerald-500/30' : 'hover:border-emerald-500/20'} active:scale-95`
                }`}
            >
              <step.icon className={`w-3.5 h-3.5 sm:w-4 h-4 ${step.done ? 'text-white' : 'text-slate-300'}`} strokeWidth={2.5} />
              {step.done && (
                <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-0 border border-emerald-50 shadow-sm">
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#0F9D58]" strokeWidth={3} />
                </div>
              )}
            </button>
            <div className="flex flex-col items-center mt-1.5 max-w-[70px] sm:max-w-none">
              <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-center truncate w-full px-0.5 ${step.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                {step.label}
              </span>
              {!step.done && (
                <span className="text-[7px] sm:text-[9px] font-black text-rose-400 uppercase tracking-widest mt-0.5 text-center truncate w-full px-0.5 animate-pulse">
                  WAITING
                </span>
              )}
              {step.subLabel && step.done && (
                <span className="text-[7px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5 text-center truncate w-full px-0.5">
                  {step.subLabel}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* STAGE POPUPS */}
      <AnimatePresence>
        {activePopup && (
          <StageModal
            type={activePopup}
            caseItem={caseItem}
            patientId={patientId}
            onClose={() => setActivePopup(null)}
            onNavigate={onNavigate}
            t={t}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Stage Specific Modals ───────────────────────────────────────── */

function StageModal({ type, caseItem, patientId, onClose, onNavigate, t }: { type: string, caseItem: any, patientId: string, onClose: () => void, onNavigate: (v: string) => void, t: any }) {
  const lastResetTime = caseItem.lastFollowUpStartedAt?.seconds || 0;
  const symptomDone = !!(caseItem.symptoms && caseItem.symptomsUpdatedAt?.seconds > lastResetTime);
  const [symptoms, setSymptoms] = useState(symptomDone ? caseItem.symptoms : '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSymptoms = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter symptoms');
      return;
    }
    setIsSaving(true);
    try {
      await updateCaseData(patientId, caseItem.id, { symptoms });
      toast.success('Symptoms Saved Successfully');
      onClose(); // Auto close on success
    } catch (e) {
      toast.error('Failed to save symptoms');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-[2.5rem] border-4 border-black overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-black text-black uppercase tracking-tight">{type} {t.action || "Action"}</h4>
            <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><X className="w-5 h-5" strokeWidth={3} /></button>
          </div>

          {type === 'Symptom' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/80 rounded-[2rem] border-2 border-blue-100 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-black text-blue-700 uppercase tracking-wider">Symptoms</p>
                </div>
                <textarea
                  className="w-full h-24 bg-white border-2 border-blue-100/50 focus:border-blue-500/40 rounded-2xl p-4 text-[13px] font-bold outline-none transition-all placeholder:text-blue-200"
                  placeholder={t.describeFeeling || "Describe symptoms..."}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <button
                onClick={handleSaveSymptoms}
                disabled={isSaving}
                className="w-full py-4 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Update Health Journey'}
                {!isSaving && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <div className="relative py-1 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <span className="relative px-3 bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest">OR</span>
              </div>
              
              <button onClick={() => onNavigate('symptom-checker')} className="w-full py-4 bg-blue-500 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Sparkles className="w-4 h-4" /> {t.startAiCheck || "Use AI Symptom Check"}
              </button>
            </div>
          )}

          {type === 'Vitals' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/80 rounded-[2rem] border-2 border-rose-100 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-black text-rose-700 uppercase tracking-wider">Patient Vitals</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest text-center">BP</p>
                    <input 
                      placeholder="120/80"
                      className="w-full bg-white border-2 border-rose-100/50 rounded-xl p-2 text-center text-xs font-black outline-none"
                      value={caseItem.vitals?.bp || ''}
                      onChange={async (e) => await updateCaseData(patientId, caseItem.id, { vitals: { ...(caseItem.vitals || { bp: '', weight: '', height: '' }), bp: e.target.value } } as any)}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest text-center">Weight</p>
                    <input 
                      placeholder="70 kg"
                      className="w-full bg-white border-2 border-rose-100/50 rounded-xl p-2 text-center text-xs font-black outline-none"
                      value={caseItem.vitals?.weight || ''}
                      onChange={async (e) => await updateCaseData(patientId, caseItem.id, { vitals: { ...(caseItem.vitals || { bp: '', weight: '', height: '' }), weight: e.target.value } } as any)}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest text-center">Height</p>
                    <input 
                      placeholder="175 cm"
                      className="w-full bg-white border-2 border-rose-100/50 rounded-xl p-2 text-center text-xs font-black outline-none"
                      value={caseItem.vitals?.height || ''}
                      onChange={async (e) => await updateCaseData(patientId, caseItem.id, { vitals: { ...(caseItem.vitals || { bp: '', weight: '', height: '' }), height: e.target.value } } as any)}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-emerald-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95"
              >
                Save Vitals & Continue
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {type === 'Doctor' && (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100/50 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
                      <UserCircle className="w-4 h-4" />
                    </div>
                    <h5 className="font-black text-[11px] uppercase tracking-wider text-emerald-800">History</h5>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-800 rounded-full text-[9px] font-black">
                    {caseItem.appointments?.length || 0} Total
                  </span>
                </div>

                {caseItem.appointments?.length > 0 ? (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1 mb-4">
                    {caseItem.appointments.map((app: any, i: number) => {
                      const num = i + 1;
                      const ordinal = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
                      return (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl border-2 border-emerald-50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center font-black text-[9px] text-slate-400">{num}{ordinal}</div>
                            <div className="min-w-0">
                              <p className="font-black text-[11px] uppercase text-slate-800 truncate">Dr. {app.doctorName}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Consulted</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-emerald-600 uppercase">{app.type}</p>
                            <p className="text-[8px] font-bold text-slate-300">{new Date(app.dateTime.seconds * 1000).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/60 rounded-2xl border-2 border-dashed border-emerald-100 mb-4">
                    <Calendar className="w-6 h-6 text-emerald-200 mx-auto mb-1.5" />
                    <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">No History</p>
                  </div>
                )}

                <div className="space-y-3 pt-1 border-t border-emerald-100">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-emerald-700/60 uppercase tracking-widest ml-3">Diagnosis</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-emerald-50 focus:border-emerald-500/20 rounded-2xl px-5 py-3 text-[12px] font-black outline-none shadow-sm"
                      placeholder="e.g. Common Cold"
                      value={caseItem.diagnosis || ''}
                      onChange={async (e) => await updateCaseData(patientId, caseItem.id, { diagnosis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-emerald-700/60 uppercase tracking-widest ml-3">Doctor Name</label>
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-emerald-50 focus:border-emerald-500/20 rounded-2xl px-5 py-3 text-[12px] font-black outline-none shadow-sm"
                      placeholder="Dr. Rajesh Kumar"
                      value={caseItem.doctorName || ''}
                      onChange={async (e) => await updateCaseData(patientId, caseItem.id, { doctorName: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onAddFollowUp(caseItem.caseId)}
                  className="w-full mt-4 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all border-b-4 border-emerald-800"
                >
                  <Calendar className="w-4 h-4" /> {t.bookAppointment || "Book Follow-up"}
                </button>
              </div>
            </div>
          )}

          {type === 'Lab' && (
            <div className="space-y-3">
              <div className="p-4 bg-violet-50/80 rounded-[2rem] border-2 border-violet-100/50 shadow-inner">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => onNavigate('book-lab')} className="p-4 bg-white text-violet-700 rounded-2xl border-2 border-violet-50 flex flex-col items-center gap-2 hover:bg-violet-50 transition-all shadow-sm active:scale-95">
                    <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-100">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-center leading-tight">Prescription</span>
                  </button>
                  <button onClick={() => onNavigate('book-lab')} className="p-4 bg-white text-emerald-700 rounded-2xl border-2 border-emerald-50 flex flex-col items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm active:scale-95">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-center leading-tight">Lab Report</span>
                  </button>
                </div>
                <button onClick={() => onNavigate('book-lab')} className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-violet-100 flex items-center justify-center gap-2 active:scale-95 transition-all border-b-4 border-violet-800 mb-3">
                  <Microscope className="w-4 h-4" /> {t.bookLab || "Book Lab Test"}
                </button>
                <button
                  onClick={async () => {
                    await updateCaseData(patientId, caseItem.id, { 'healthJourney.manualLab': true } as any);
                    toast.success("Completed!"); onClose();
                  }}
                  className="w-full py-2 bg-white text-violet-600 border-2 border-violet-50 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Mark Done Manually
                </button>
                <div className="relative py-1 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <span className="relative px-3 bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest">OR</span>
                </div>
                <button className="w-full mt-3 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all border-b-4 border-emerald-700">
                  <Sparkles className="w-4 h-4" /> Smart Report
                </button>
              </div>
            </div>
          )}

          {type === 'Pharmacy' && (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50/80 rounded-[2rem] border-2 border-amber-100/50 shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Pill className="w-4 h-4" />
                  </div>
                  <h5 className="font-black text-[11px] uppercase tracking-wider text-amber-800">Medicines</h5>
                </div>

                {caseItem.medicines?.length > 0 ? (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar mb-4">
                    {caseItem.medicines.map((med: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl border-2 border-amber-50 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center font-black text-[9px] text-amber-500">{i + 1}</div>
                          <span className="text-[11px] font-black uppercase text-slate-800">{med.name}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase">{med.dosage}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/60 rounded-2xl border-2 border-dashed border-amber-100 mb-4">
                    <Pill className="w-6 h-6 text-amber-200 mx-auto mb-1.5" />
                    <p className="text-[9px] font-black text-amber-300 uppercase tracking-widest">No Meds</p>
                  </div>
                )}

                <button onClick={() => onNavigate('pharmacy')} className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amber-100 flex items-center justify-center gap-2 active:scale-95 transition-all border-b-4 border-amber-700 mb-3">
                  <ShoppingBag className="w-4 h-4" /> Order Online
                </button>
                <button
                  onClick={async () => {
                    await updateCaseData(patientId, caseItem.id, { 'healthJourney.manualPharmacy': true } as any);
                    toast.success("Completed!"); onClose();
                  }}
                  className="w-full py-2.5 bg-white text-amber-600 border-2 border-amber-50 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Mark Done Manually
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Session Details Modal ─────────────────────────────────────── */
function SessionDetailsModal({ caseItem, session, index, patientId, onClose, onDelete }: { caseItem: CaseData, session: any, index: number, patientId: string, onClose: () => void, onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSession, setEditedSession] = useState({ ...session });

  const handleUpdate = async () => {
    try {
      await updateSessionHistory(patientId, caseItem.id, index, editedSession);
      toast.success('Prescription Updated');
      setIsEditing(false);
    } catch (err) {
      toast.error('Update failed');
    }
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
                 Report <span className="w-0.5 h-0.5 bg-emerald-300 rounded-full" /> {formatDate(session.completedAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition-all hover:bg-emerald-50 hover:text-emerald-600">
              <Edit2 className="w-4 h-4" />
            </button>
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
                 <div className="bg-blue-50/20 rounded-xl p-3 border border-blue-50 min-h-[60px]">
                   {isEditing ? (
                     <textarea
                       className="w-full h-full bg-transparent border-none rounded-lg p-0 text-[11px] font-bold text-slate-700 outline-none resize-none"
                       value={editedSession.symptoms}
                       onChange={(e) => setEditedSession({ ...editedSession, symptoms: e.target.value })}
                       placeholder="Enter symptoms..."
                     />
                   ) : (
                     <p className="text-[12px] font-bold text-slate-700 leading-snug italic">
                       "{session.symptoms || 'None recorded'}"
                     </p>
                   )}
                 </div>
              </MiniCard>
            </div>

            {/* VITALS (COMPACT) */}
            <MiniCard title="2. Vitals" icon={Activity} color="bg-rose-600">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'BP', value: session.vitals?.bp, key: 'bp' },
                  { label: 'SpO2', value: session.vitals?.oxygen, key: 'oxygen' },
                  { label: 'Wt', value: session.vitals?.weight, key: 'weight' },
                  { label: 'Ht', value: session.vitals?.height, key: 'height' }
                ].map((vital) => (
                  <div key={vital.label} className="bg-slate-50/50 rounded-xl p-2 border border-slate-50 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">{vital.label}</p>
                    {isEditing ? (
                      <input 
                        className="w-full bg-white border border-slate-200 rounded-md text-[10px] font-black p-1 text-center"
                        value={(editedSession.vitals || {})[vital.key as keyof typeof editedSession.vitals] || ''}
                        onChange={(e) => setEditedSession({ 
                          ...editedSession, 
                          vitals: { ...(editedSession.vitals || {}), [vital.key]: e.target.value } 
                        })}
                      />
                    ) : (
                      <p className="text-[11px] font-black text-slate-900">{vital.value || '--'}</p>
                    )}
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
                  <p className="text-[9px] font-bold text-slate-500 truncate">{formatDate(session.completedAt) || '--'}</p>
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
          {isEditing ? (
            <button
              onClick={handleUpdate}
              className="w-full h-12 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" /> Update Prescription
            </button>
          ) : (
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
          )}
          <p className="text-center text-[7px] font-black text-slate-300 uppercase tracking-[0.4em] opacity-60">National Health Registry • v4.0</p>
        </div>
      </motion.div>
    </div>
  );
}

function getOrdinalSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatDate(ts: any) {
  if (!ts) return '';
  const date = new Date(ts.seconds * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function EmptyJourneyState({ onStart, t }: { onStart: () => void, t: any }) {
  return (
    <div className="py-12 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-emerald-100 text-center px-10 shadow-inner">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-sm">
        <Sparkles className="w-10 h-10" />
      </div>
      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Active Journeys</h3>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">Start your clinical session to track your health progress.</p>
      <button onClick={onStart} className="px-12 py-4 bg-emerald-600 text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-200 active:scale-95 transition-all">Start My Journey</button>
    </div>
  );
}
