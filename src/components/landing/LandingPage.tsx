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
        
        {/* Master CTA Box - Relocated to Top */}
        <div className="container mx-auto px-4 md:px-6 mb-4">
          <div className="p-5 md:p-6 rounded-[24px] bg-[#064e3b] text-white shadow-xl border-b-4 border-black/20 flex flex-col items-center text-center space-y-3">
            {/* Taglines in single line - Optimized for Mobile */}
            <div className="flex items-center justify-between w-full opacity-100 py-1 px-1">
              {["NO CONFUSION.", "NO LOST REPORTS.", "NO REPEATED TESTS."].map((text, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1FD73D] animate-pulse shadow-[0_0_8px_rgba(31,215,61,0.5)]" />
                  <span className="text-[clamp(9px,2.6vw,13px)] font-black tracking-tight whitespace-nowrap">
                    {toTitleCase(text)}
                  </span>
                </div>
              ))}
            </div>

            {/* Main Messaging */}
            <div className="space-y-0.5">
              <h4 className="text-lg md:text-2xl font-black tracking-tighter leading-tight">
                {toTitleCase("Ready to take control?")}
              </h4>
              <p className="text-[10px] md:text-sm text-white/70 font-bold italic leading-tight">
                Join Arogyadatha today and experience the future of healthcare.
              </p>
            </div>

            {/* Action Button - Enlarged & Autofit */}
            <button 
              onClick={onSignUpClick}
              className="w-full max-w-sm flex items-center justify-center py-3.5 bg-white text-[#064e3b] font-black tracking-widest text-[clamp(11px,3.5vw,15px)] rounded-xl shadow-lg hover:bg-gray-50 transition-all active:scale-95 border-none whitespace-nowrap px-4"
            >
              {toTitleCase(config?.buttons?.signUpCta || "Create Your Health Id")}
            </button>
          </div>
        </div>

        <WhatWeDo config={config} />
        <ProblemSolution onSignUpClick={onSignUpClick} config={config} />
        <FeaturesSection config={config} />
        <AISection config={config} />
        <ImpactSection config={config} />
        <FounderContact config={config} />
      </main>

      <footer className="w-full">
        <div className="bg-[#064e3b] text-white py-8 md:py-10">
          <div className="container mx-auto px-6 space-y-8">
            <div className="space-y-6">
              <h3 className="text-white font-black text-sm tracking-[0.2em] border-l-4 border-white/30 pl-3">
                {toTitleCase("Contact")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 group">
                  <Phone className="w-4 h-4 text-white/70" />
                  <span className="text-white/90 text-sm font-bold">
                    {config?.contactInfo?.phoneNumbers?.[0] || "8008334948"}
                  </span>
                </div>
                <div className="flex items-center gap-3 group">
                  <Mail className="w-4 h-4 text-white/70" />
                  <span className="text-white/90 text-sm font-bold">
                    {config?.contactInfo?.emails?.[0] || "Arogyadatha24@gmail.com"}
                  </span>
                </div>
                <div className="flex items-start gap-3 group">
                  <MapPin className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                  <span className="text-white/90 text-sm font-bold leading-tight">
                    {config?.contactInfo?.address || "Guntur, Andhra Pradesh, India"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col gap-4 items-start">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase">
                  © {new Date().getFullYear()} Arogyadatha. All rights reserved. 
                </p>
                
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                >
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span className="text-[8px] font-black text-white/60 tracking-widest">
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
