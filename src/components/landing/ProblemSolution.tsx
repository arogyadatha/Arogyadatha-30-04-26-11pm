import React, { useState } from "react";
import { XCircle, CheckCircle2 } from "lucide-react";

interface ProblemSolutionProps {
  onSignUpClick?: () => void;
  config?: any;
}

export function ProblemSolution({ onSignUpClick, config }: ProblemSolutionProps) {
  const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const problems = [
    "Long waiting time in hospitals",
    "Patients don't understand disease clearly",
    "Doctors don't get full history",
    "Reports are scattered everywhere",
    "No clear diet or lifestyle guidance",
    "No proper follow-up system"
  ];

  const solutions = [
    { title: "Smart Health Record", desc: "All reports in one single, secure place." },
    { title: "AI Summary", desc: "Simple explanation in Telugu & English." },
    { title: "Appointment Tracking", desc: "Live OP status and reminders." },
    { title: "Lab & Pharmacy", desc: "Direct connection for seamless orders." },
    { title: "Medicine Tracking", desc: "Timely alerts for your dosage." },
    { title: "Personal Guidance", desc: "Right Disease + Right Doctor + Right Diet." }
  ];

  return (
    <section id="solutions" className="py-6 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-5xl mx-auto mb-3 space-y-1">
          <h2 className="text-[clamp(12px,4.5vw,32px)] font-black text-[#111111] tracking-tighter whitespace-nowrap">
            {toTitleCase("Bridging the Gap in")} <span className="text-[#064e3b]">{toTitleCase("Indian Healthcare")}</span>
          </h2>
          <div className="space-y-0.5">
            <p className="text-[clamp(9px,3vw,16px)] text-[#111111]/90 font-black tracking-tight whitespace-nowrap">
              {toTitleCase("Lack Of Clarity + Lack Of Continuity = Bad Treatment.")}
            </p>
            <p className="text-[clamp(10px,3.2vw,18px)] text-[#064e3b] font-black tracking-tight whitespace-nowrap">
              {toTitleCase("We Are Changing That Equation.")}
            </p>
          </div>
        </div>

        {/* Simple Tab Bar - Colored & Condensed */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="flex p-1 bg-gray-100/50 rounded-2xl border border-gray-100">
            <button 
              onClick={() => setActiveTab('problem')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black tracking-widest text-[10px] transition-all ${
                activeTab === 'problem' 
                ? 'bg-red-600 text-white shadow-lg' 
                : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" /> {toTitleCase("The Problem")}
            </button>
            <button 
              onClick={() => setActiveTab('solution')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black tracking-widest text-[10px] transition-all ${
                activeTab === 'solution' 
                ? 'bg-emerald-900 text-white shadow-lg' 
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> {toTitleCase("Our Solution")}
            </button>
          </div>
        </div>

        {/* Content Section - Colored Container & Low Height */}
        <div className="max-w-2xl mx-auto">
          <div className={`p-4 sm:p-6 rounded-[32px] border transition-all duration-500 animate-in fade-in zoom-in-95 ${
            activeTab === 'problem' 
            ? 'bg-red-50/50 border-red-100' 
            : 'bg-emerald-50/50 border-emerald-100'
          }`}>
            {activeTab === 'problem' ? (
              <div className="space-y-1.5">
                {problems.map((problem, i) => (
                  <div key={i} className="flex items-center gap-3 py-1 border-b border-red-100/30 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                    <span className="text-xs md:text-sm font-bold text-red-900 tracking-tight">{problem}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {solutions.map((sol, i) => (
                  <div key={i} className="flex items-start gap-4 py-1 border-b border-emerald-100/30 last:border-0">
                    <div className="mt-1 w-3.5 h-3.5 rounded bg-emerald-900/10 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-900" />
                    </div>
                    <div className="space-y-0">
                      <h4 className="text-xs md:text-sm font-black text-emerald-900 tracking-tight leading-none">{toTitleCase(sol.title)}</h4>
                      <p className="text-[10px] md:text-[11px] text-emerald-800/70 font-bold italic">{sol.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
