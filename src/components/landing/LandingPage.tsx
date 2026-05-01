import React from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { WhatWeDo } from "./WhatWeDo";
import { FeaturesSection } from "./FeaturesSection";
import { AISection } from "./AISection";
import { ImpactSection } from "./ImpactSection";
import { FounderContact } from "./FounderContact";
import { ProblemSolution } from "./ProblemSolution";
import { Phone, MapPin, Mail, ShieldAlert } from "lucide-react";

interface LandingPageProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
  config?: any;
}

export function LandingPage({ onLoginClick, onSignUpClick, config }: LandingPageProps) {
  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onLoginClick={onLoginClick} config={config} />
      
      <main className="flex-grow pt-[64px] md:pt-[72px]">
        <Hero config={config} />
        <WhatWeDo config={config} />
        <ProblemSolution onSignUpClick={onSignUpClick} config={config} />
        <FeaturesSection config={config} />
        <AISection config={config} />
        <ImpactSection config={config} />
        <FounderContact config={config} />
      </main>

      <footer className="w-full">
        <div className="bg-[#0B1221] text-white py-12">
          <div className="container mx-auto px-8 space-y-12">
            <div className="grid grid-cols-1 gap-8 text-left border-b border-white/10 pb-12">
              <div className="space-y-6">
                <h3 className="text-[#064e3b] font-black text-xl tracking-[0.2em] border-l-4 border-[#064e3b] pl-4">
                  {toTitleCase("Contact")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#064e3b]/20 transition-colors">
                      <Phone className="w-5 h-5 text-[#064e3b]" />
                    </div>
                    <span className="text-white text-base font-bold">
                      {config?.contactInfo?.phoneNumbers?.[0] || "8008334948"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#064e3b]/20 transition-colors">
                      <Mail className="w-5 h-5 text-[#064e3b]" />
                    </div>
                    <span className="text-white text-base font-bold italic">
                      {config?.contactInfo?.emails?.[0] || "Arogyadatha24@gmail.com"}
                    </span>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#064e3b]/20 transition-colors shrink-0">
                      <MapPin className="w-5 h-5 text-[#064e3b]" />
                    </div>
                    <span className="text-white text-base font-bold leading-tight">
                      {config?.contactInfo?.address || "Guntur, Andhra Pradesh, India"}
                    </span>
                  </div>
                </div>
              </div>


            </div>

            <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-4">
                <p className="text-white/90 italic font-bold text-xl md:text-2xl leading-tight">
                  "Carry your health in your mobile"
                </p>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">
                  © {new Date().getFullYear()} Arogyadatha. All rights reserved. 
                </p>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={onLoginClick}
                  className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                >
                  <ShieldAlert className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-white/60 tracking-[0.2em]">
                    {toTitleCase("Admin Access")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
