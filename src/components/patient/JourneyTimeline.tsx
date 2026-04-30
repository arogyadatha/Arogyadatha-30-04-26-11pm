import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Stethoscope,
  UserCircle,
  FlaskConical,
  FileText,
  Pill,
  Salad,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Loader2,
  ExternalLink,
  Share2,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CaseData } from '../../services/caseService';
import { toast } from 'sonner';
import MedicineSchedule from './MedicineSchedule';
import SmartReportViewer from './SmartReportViewer';
import DietPlan from './DietPlan';

interface JourneyTimelineProps {
  caseId: string;
  patientId: string;
  caseData: CaseData;
  onNavigate: (view: string) => void;
}

interface JourneyData {
  appointment: any | null;
  labRequest: any | null;
  reports: any[];
  medicines: any[];
  dietPlan: any | null;
}

export default function JourneyTimeline({ caseId, patientId, caseData, onNavigate }: JourneyTimelineProps) {
  const [data, setData] = useState<JourneyData>({
    appointment: null,
    labRequest: null,
    reports: [],
    medicines: [],
    dietPlan: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeViewer, setActiveViewer] = useState<'report' | 'medicines' | 'diet' | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    fetchJourneyData();
  }, [caseId, patientId]);

  async function fetchJourneyData() {
    setLoading(true);
    try {
      // Parallel fetches
      const [labSnap, reportsSnap, medsSnap, dietSnap] = await Promise.all([
        getDocs(collection(db, 'patients', patientId, 'cases', caseId, 'labRequests')),
        getDocs(collection(db, 'patients', patientId, 'cases', caseId, 'reports')),
        getDocs(collection(db, 'patients', patientId, 'cases', caseId, 'medicines')),
        getDoc(doc(db, 'patients', patientId, 'cases', caseId, 'extra', 'dietPlan')),
      ]);

      // Fetch appointment from top-level appointments collection
      const apptSnap = await getDocs(collection(db, 'appointments', patientId, 'cases'));
      const appt = apptSnap.docs.find((d) => d.data().caseId === caseId)?.data() || null;

      setData({
        appointment: appt,
        labRequest: labSnap.empty ? null : labSnap.docs[0].data(),
        reports: reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        medicines: medsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        dietPlan: dietSnap.exists() ? dietSnap.data() : null,
      });
    } catch (err) {
      console.error('Journey data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
        <span className="text-xs text-gray-400 font-medium ml-2">Loading journey...</span>
      </div>
    );
  }

  const stages = [
    {
      id: 'symptoms',
      step: 1,
      icon: Stethoscope,
      label: 'Symptoms',
      color: { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      done: !!caseData.symptoms,
      content: caseData.symptoms,
      emptyAction: { label: 'Check Symptoms', view: 'symptom-checker' },
    },
    {
      id: 'doctor',
      step: 2,
      icon: UserCircle,
      label: 'Doctor',
      color: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
      done: !!data.appointment,
      content: data.appointment,
      emptyAction: { label: 'Book Doctor', view: 'book-doctor' },
    },
    {
      id: 'lab',
      step: 3,
      icon: FlaskConical,
      label: 'Lab Tests',
      color: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      done: !!data.labRequest,
      content: data.labRequest,
      emptyAction: { label: 'Book Lab Test', view: 'book-lab' },
    },
    {
      id: 'reports',
      step: 4,
      icon: FileText,
      label: 'Reports',
      color: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      done: data.reports.length > 0,
      content: data.reports,
      emptyAction: { label: 'Upload Report', view: null },
    },
    {
      id: 'medicines',
      step: 5,
      icon: Pill,
      label: 'Medicines',
      color: { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
      done: data.medicines.length > 0,
      content: data.medicines,
      emptyAction: { label: 'No prescription yet', view: null },
    },
    {
      id: 'diet',
      step: 6,
      icon: Salad,
      label: 'Diet Plan',
      color: { bg: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
      done: !!data.dietPlan,
      content: data.dietPlan,
      emptyAction: { label: 'Generate Diet Plan', view: null },
    },
  ];

  return (
    <div>
      {/* Horizontal scroll timeline */}
      <div className="overflow-x-auto no-scrollbar py-4 px-4">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {stages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              isLast={index === stages.length - 1}
              onNavigate={onNavigate}
              onOpenReport={(report) => {
                setSelectedReport(report);
                setActiveViewer('report');
              }}
              onOpenMedicines={() => setActiveViewer('medicines')}
              onOpenDiet={() => setActiveViewer('diet')}
              onRefresh={fetchJourneyData}
              caseId={caseId}
              patientId={patientId}
            />
          ))}
        </div>
      </div>

      {/* Viewers */}
      {activeViewer === 'medicines' && (
        <div className="px-4 pb-4">
          <MedicineSchedule
            caseId={caseId}
            patientId={patientId}
            medicines={data.medicines}
            onClose={() => setActiveViewer(null)}
          />
        </div>
      )}

      {activeViewer === 'diet' && (
        <div className="px-4 pb-4">
          <DietPlan
            caseId={caseId}
            patientId={patientId}
            caseData={caseData}
            existingPlan={data.dietPlan}
            onClose={() => setActiveViewer(null)}
            onPlanGenerated={fetchJourneyData}
          />
        </div>
      )}

      {activeViewer === 'report' && selectedReport && (
        <div className="px-4 pb-4">
          <SmartReportViewer
            report={selectedReport}
            caseId={caseId}
            patientId={patientId}
            onClose={() => { setActiveViewer(null); setSelectedReport(null); }}
            onShared={fetchJourneyData}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Stage Card ─────────────────────────────────────────────────── */

interface StageCardProps {
  stage: any;
  isLast: boolean;
  onNavigate: (view: string) => void;
  onOpenReport: (report: any) => void;
  onOpenMedicines: () => void;
  onOpenDiet: () => void;
  onRefresh: () => void;
  caseId: string;
  patientId: string;
}

function StageCard({
  stage, isLast, onNavigate, onOpenReport, onOpenMedicines, onOpenDiet, onRefresh, caseId, patientId
}: StageCardProps) {
  const c = stage.color;

  return (
    <div className="flex items-start gap-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: stage.step * 0.07 }}
        className={`w-[220px] rounded-2xl border-2 ${stage.done ? c.border : 'border-gray-100'} ${stage.done ? c.light : 'bg-white'} p-3.5 shrink-0 relative`}
      >
        {/* Step number + Icon */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-xl ${stage.done ? c.bg : 'bg-gray-100'} flex items-center justify-center relative`}>
            <stage.icon className={`w-4 h-4 ${stage.done ? 'text-white' : 'text-gray-400'}`} />
            {stage.done && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Step {stage.step}</p>
            <p className={`text-xs font-black ${stage.done ? c.text : 'text-gray-500'} leading-tight`}>{stage.label}</p>
          </div>
        </div>

        {/* Content */}
        <StageContent stage={stage} onNavigate={onNavigate} onOpenReport={onOpenReport} onOpenMedicines={onOpenMedicines} onOpenDiet={onOpenDiet} />
      </motion.div>

      {/* Connector */}
      {!isLast && (
        <div className="flex items-center h-[60px] mx-1 mt-4">
          <div className={`w-6 h-0.5 ${stage.done ? c.bg : 'bg-gray-200'} rounded-full`} />
          <ChevronRight className={`w-3 h-3 ${stage.done ? c.text : 'text-gray-300'}`} />
        </div>
      )}
    </div>
  );
}

/* ─── Stage Content ──────────────────────────────────────────────── */

function StageContent({ stage, onNavigate, onOpenReport, onOpenMedicines, onOpenDiet }: any) {
  const c = stage.color;

  if (!stage.done) {
    if (!stage.emptyAction.view && stage.id !== 'diet' && stage.id !== 'reports') {
      return (
        <p className="text-[11px] text-gray-400 font-medium">Not yet completed</p>
      );
    }

    if (stage.id === 'diet') {
      return (
        <button onClick={onOpenDiet}
          className={`w-full py-2 ${c.bg} text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all`}>
          <Sparkles className="w-3 h-3" /> Generate Diet Plan
        </button>
      );
    }

    return (
      <button
        onClick={() => stage.emptyAction.view && onNavigate(stage.emptyAction.view)}
        className={`w-full py-2 ${c.bg} text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 active:scale-95 transition-all`}
      >
        {stage.emptyAction.label} →
      </button>
    );
  }

  /* ── SYMPTOMS ── */
  if (stage.id === 'symptoms') {
    return (
      <p className="text-[11px] text-gray-600 font-medium line-clamp-4 leading-relaxed">
        {stage.content}
      </p>
    );
  }

  /* ── DOCTOR ── */
  if (stage.id === 'doctor') {
    const a = stage.content;
    return (
      <div className="space-y-1">
        <p className="text-xs font-black text-gray-800">{a.doctorName || 'Doctor'}</p>
        <p className="text-[10px] text-gray-500">{a.doctorSpecialty || ''}</p>
        <div className={`inline-flex items-center px-2 py-0.5 rounded-full ${c.light} ${c.text} text-[9px] font-black uppercase border ${c.border}`}>
          {a.status || 'Pending'}
        </div>
      </div>
    );
  }

  /* ── LAB ── */
  if (stage.id === 'lab') {
    const l = stage.content;
    return (
      <div className="space-y-1">
        <p className="text-xs font-black text-gray-800">{l.labName || 'Lab Booked'}</p>
        {l.tests && l.tests.length > 0 && (
          <p className="text-[10px] text-gray-500 line-clamp-2">
            {l.tests.map((t: any) => t.testName || t).join(', ')}
          </p>
        )}
        <div className={`inline-flex items-center px-2 py-0.5 rounded-full ${c.light} ${c.text} text-[9px] font-black uppercase border ${c.border}`}>
          {l.status || 'Pending'}
        </div>
      </div>
    );
  }

  /* ── REPORTS ── */
  if (stage.id === 'reports') {
    const reports: any[] = stage.content;
    return (
      <div className="space-y-1.5">
        {reports.slice(0, 2).map((r: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-1">
            <button
              onClick={() => onOpenReport(r)}
              className="text-[10px] font-black text-orange-600 hover:underline flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              {r.reportName || `Report ${i + 1}`}
            </button>
            <button
              onClick={() => onOpenReport(r)}
              className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"
            >
              Smart ✨
            </button>
          </div>
        ))}
        {reports.length > 2 && (
          <p className="text-[9px] text-gray-400 font-medium">+{reports.length - 2} more</p>
        )}
      </div>
    );
  }

  /* ── MEDICINES ── */
  if (stage.id === 'medicines') {
    const meds: any[] = stage.content;
    return (
      <div className="space-y-1">
        {meds.slice(0, 2).map((m: any, i: number) => (
          <div key={i}>
            <p className="text-[10px] font-black text-gray-800">{m.name || m.medicineName}</p>
            <p className="text-[9px] text-gray-400">{m.timing || m.dosage}</p>
          </div>
        ))}
        {meds.length > 2 && (
          <p className="text-[9px] text-gray-400 font-medium">+{meds.length - 2} more</p>
        )}
        <button onClick={onOpenMedicines}
          className={`w-full py-1.5 mt-1 ${c.bg} text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 active:scale-95`}>
          View Schedule
        </button>
      </div>
    );
  }

  /* ── DIET ── */
  if (stage.id === 'diet') {
    const d = stage.content;
    return (
      <div className="space-y-1">
        {d.breakfast && (
          <p className="text-[10px] text-gray-600 font-medium line-clamp-2">🌅 {d.breakfast}</p>
        )}
        <button onClick={onOpenDiet}
          className={`w-full py-1.5 mt-1 ${c.bg} text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 active:scale-95`}>
          View Full Plan
        </button>
      </div>
    );
  }

  return null;
}
