import React from "react";
import { ShieldCheck, Activity, Stethoscope, Search, Zap, Link } from "lucide-react";

export function WhatWeDo() {
  const points = [
    { 
      icon: ShieldCheck, 
      text: "We store all your health records safely, so you never lose reports again." 
    },
    { 
      icon: Search, 
      text: "We organize your health history clearly, so both you and your doctor understand it easily." 
    },
    { 
      icon: Stethoscope, 
      text: "We help you choose the right doctor, right test, and right treatment." 
    },
    { 
      icon: Activity, 
      text: "We track your appointments, medicines, and follow-ups, so nothing is missed." 
    },
    { 
      icon: Zap, 
      text: "We reduce waiting time by showing real-time OP status and smart scheduling." 
    },
    { 
      icon: Search, 
      text: "We use AI to explain your reports in simple language (Telugu & English), and guide you with diet, care, and next steps based on your health." 
    },
    { 
      icon: Link, 
      text: "We connect everything — patient, lab, pharmacy, reports — into one system." 
    }
  ];

  return (
    <section id="what-we-do" className="py-12 bg-white border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl space-y-8 text-left">
          <div className="space-y-4">
            <h2 className="text-[#059669] font-black text-xl uppercase tracking-[0.2em] border-l-4 border-[#1FD73D] pl-4">WHAT WE DO</h2>
            <p className="text-3xl md:text-4xl font-black text-[#111111] leading-tight">
              We help people manage their complete health in one place.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {points.map((point, i) => (
              <div key={i} className="flex items-center gap-5 py-1 group">
                <div className="w-12 h-12 rounded-xl bg-[#059669]/5 flex items-center justify-center shrink-0 border border-[#059669]/10 group-hover:bg-[#059669] group-hover:border-[#059669] transition-all duration-300">
                  <point.icon className="w-6 h-6 text-[#059669] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-lg md:text-xl text-[#111111] font-bold leading-snug">
                    {point.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Simplified horizontal CTA box matching requested design */}
          <div className="mt-12 p-8 rounded-2xl bg-[#059669] text-white space-y-6 shadow-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {["NO CONFUSION.", "NO LOST REPORTS.", "NO REPEATED TESTS."].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1FD73D]" />
                  <span className="text-xs md:text-sm font-black uppercase tracking-widest">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
