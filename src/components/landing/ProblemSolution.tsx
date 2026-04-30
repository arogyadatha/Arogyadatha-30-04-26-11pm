import React from "react";
import { XCircle, CheckCircle2 } from "lucide-react";

interface ProblemSolutionProps {
  onSignUpClick?: () => void;
}

export function ProblemSolution({ onSignUpClick }: ProblemSolutionProps) {
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
    <section id="solutions" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">
            Bridging the Gap in <span className="text-[#059669]">Indian Healthcare</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Lack of clarity + lack of continuity = bad treatment. We are changing that equation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Problem Section */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <XCircle className="w-6 h-6" /> The Problem
            </h3>
            <div className="space-y-4">
              {problems.map((problem, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-red-50/50 border border-red-100">
                  <div className="mt-1 w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                  <span className="text-[#111111] font-medium">{problem}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Section */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-[#059669] flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" /> Our Solution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {solutions.map((sol, i) => (
                <div key={i} className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-[#059669] mb-1">{sol.title}</div>
                  <p className="text-sm text-gray-500">{sol.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 p-8 md:p-12 rounded-3xl bg-[#059669] text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h4 className="text-2xl md:text-3xl font-bold">Ready to take control?</h4>
            <p className="text-white/80">Join Arogyadatha today and experience the future of healthcare.</p>
          </div>
          <button 
            onClick={onSignUpClick}
            className="whitespace-nowrap px-8 py-4 bg-[#1FD73D] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:scale-105 transition-transform"
          >
            Create Your Health ID
          </button>
        </div>
      </div>
    </section>
  );
}
