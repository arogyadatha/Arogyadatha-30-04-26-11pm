import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sparkles,
  Loader2,
  Share2,
  CheckCircle,
  AlertTriangle,
  Info,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

interface SmartReportViewerProps {
  report: any;
  caseId: string;
  patientId: string;
  onClose: () => void;
  onShared?: () => void;
}

interface SmartReport {
  patientExplanation: string;
  organSummary: string;
  abnormalValues: Array<{ name: string; value: string; normal: string; concern: string }>;
  recommendations: string[];
  urgency: 'normal' | 'monitor' | 'urgent';
}

export default function SmartReportViewer({ report, caseId, patientId, onClose, onShared }: SmartReportViewerProps) {
  const [smartReport, setSmartReport] = useState<SmartReport | null>(
    report.smartReport || null
  );
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(report.visibleToDoctor || false);

  const generateSmartReport = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Gemini API key not configured');
      return;
    }

    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `You are a medical report interpreter. Analyze this medical report and provide a patient-friendly explanation.
Report Name: ${report.reportName || 'Medical Report'}
Test Type: ${report.testType || 'General'}
Report URL: ${report.reportUrl || 'N/A'}

Generate a clear, simple explanation for the patient. Do not be alarmist.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patientExplanation: { type: Type.STRING },
              organSummary: { type: Type.STRING },
              abnormalValues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    normal: { type: Type.STRING },
                    concern: { type: Type.STRING },
                  },
                  required: ['name', 'value', 'normal', 'concern']
                }
              },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              urgency: { type: Type.STRING }
            },
            required: ['patientExplanation', 'organSummary', 'abnormalValues', 'recommendations', 'urgency']
          }
        }
      });

      const result = JSON.parse(res.text) as SmartReport;
      setSmartReport(result);

      // Save smart report back to Firestore
      const reportRef = doc(db, 'patients', patientId, 'cases', caseId, 'reports', report.id);
      await updateDoc(reportRef, { smartReport: result, smartReportGeneratedAt: serverTimestamp() });

      toast.success('Smart report generated!');
    } catch (error) {
      console.error('Smart report error:', error);
      toast.error('Failed to generate smart report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const shareWithDoctor = async () => {
    setSharing(true);
    try {
      const reportRef = doc(db, 'patients', patientId, 'cases', caseId, 'reports', report.id);
      await updateDoc(reportRef, {
        visibleToDoctor: true,
        sharedAt: serverTimestamp(),
        smartReport: smartReport || null,
      });
      setShared(true);
      toast.success('✅ Report shared with your doctor!');
      onShared?.();
    } catch (error) {
      toast.error('Failed to share report. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const urgencyConfig = {
    normal: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle, label: 'Normal – No Immediate Concern' },
    monitor: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle, label: 'Monitor – Follow Up Recommended' },
    urgent: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle, label: 'Urgent – Consult Doctor Soon' },
  };

  const ue = smartReport ? (urgencyConfig[smartReport.urgency] || urgencyConfig.normal) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-[24px] border-2 border-orange-100 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm leading-none">Smart Report</h3>
              <p className="text-orange-100 text-[10px] font-medium mt-0.5">{report.reportName || 'Medical Report'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* View Original Report Link */}
        {report.reportUrl && (
          <a
            href={report.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100 w-fit"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Original Report
          </a>
        )}

        {/* Generate Button */}
        {!smartReport ? (
          <button
            onClick={generateSmartReport}
            disabled={generating}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-sm transition-all disabled:opacity-60 active:scale-95 shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Report...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Smart Analysis
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            {/* Urgency Banner */}
            {ue && (
              <div className={`flex items-center gap-2 p-3 rounded-2xl border-2 ${ue.bg} ${ue.border}`}>
                <ue.icon className={`w-4 h-4 ${ue.text} shrink-0`} />
                <p className={`text-xs font-black ${ue.text}`}>{ue.label}</p>
              </div>
            )}

            {/* Patient Explanation */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-black text-emerald-800 uppercase tracking-wide">What Does This Mean?</p>
              </div>
              <p className="text-sm text-gray-700 font-medium leading-relaxed">{smartReport.patientExplanation}</p>
            </div>

            {/* Organ Summary */}
            {smartReport.organSummary && (
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">System Summary</p>
                <p className="text-xs text-gray-700 font-medium">{smartReport.organSummary}</p>
              </div>
            )}

            {/* Abnormal Values */}
            {smartReport.abnormalValues?.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Values to Watch</p>
                <div className="space-y-2">
                  {smartReport.abnormalValues.map((v, i) => (
                    <div key={i} className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-gray-800">{v.name}</p>
                        <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{v.value}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">Normal: {v.normal}</p>
                      <p className="text-[10px] text-amber-700 font-medium mt-0.5">{v.concern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {smartReport.recommendations?.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Recommendations</p>
                <div className="space-y-1.5">
                  {smartReport.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share with Doctor */}
        {shared ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs font-black text-emerald-700">Shared with your doctor</p>
          </div>
        ) : (
          <button
            onClick={shareWithDoctor}
            disabled={sharing}
            className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black text-sm transition-all disabled:opacity-60 active:scale-95 flex items-center justify-center gap-2"
          >
            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            {sharing ? 'Sharing...' : 'Share with Doctor'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
