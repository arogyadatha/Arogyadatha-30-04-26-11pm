import React from "react";
import { ShieldCheck, Activity, Stethoscope, Search, Zap, Link } from "lucide-react";

export function WhatWeDo({ config }: { config?: any }) {
  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

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
    <section id="what-we-do" className="py-8 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="w-full space-y-4 text-left">
          <div className="space-y-1">
            <h2 className="text-[#064e3b] font-black text-lg tracking-[0.2em] border-l-4 border-[#064e3b] pl-4">
              {toTitleCase(config?.headings?.whatWeDo || "What We Do")}
            </h2>
            <p className="text-base md:text-xl font-bold text-[#111111]/80 leading-tight pl-4">
              {config?.contentBlocks?.whatWeDoDesc || "We help people manage their complete health in one place."}
            </p>
          </div>
 
          <div className="flex flex-col gap-3 pl-4">
            {points.map((point, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded bg-[#064e3b]/5 flex items-center justify-center shrink-0 border border-[#064e3b]/10 group-hover:bg-[#064e3b] group-hover:border-[#064e3b] transition-all duration-300">
                  <point.icon className="w-3.5 h-3.5 text-[#064e3b] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-lg text-[#111111] font-bold leading-tight tracking-tight">
                    {point.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
 
          </div>
        </div>
    </section>
  );
}
