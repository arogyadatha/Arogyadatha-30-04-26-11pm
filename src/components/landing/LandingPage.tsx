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
}

export function LandingPage({ onLoginClick, onSignUpClick }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onLoginClick={onLoginClick} />
      
      <main className="flex-grow pt-[64px] md:pt-[72px]">
        <Hero />
        <WhatWeDo />
        <ProblemSolution onSignUpClick={onSignUpClick} />
        <FeaturesSection />
        <AISection />
        <ImpactSection />
        <FounderContact />
      </main>

      <footer className="w-full">
        <div className="bg-[#0B1221] text-white py-12">
          <div className="container mx-auto px-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-b border-white/10 pb-12">
              <div className="space-y-6">
                <h3 className="text-[#1FD73D] font-black text-xl uppercase tracking-[0.2em] border-l-4 border-[#1FD73D] pl-4">CONTACT</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#1FD73D]/20 transition-colors">
                      <Phone className="w-5 h-5 text-[#1FD73D]" />
                    </div>
                    <span className="text-white text-base font-bold">8008334948</span>
                  </div>
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#1FD73D]/20 transition-colors">
                      <Mail className="w-5 h-5 text-[#1FD73D]" />
                    </div>
                    <span className="text-white text-base font-bold italic">Arogyadatha24@gmail.com</span>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#1FD73D]/20 transition-colors shrink-0">
                      <MapPin className="w-5 h-5 text-[#1FD73D]" />
                    </div>
                    <span className="text-white text-base font-bold leading-tight">Guntur, Andhra Pradesh, India</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[#1FD73D] font-black text-xl uppercase tracking-[0.2em] border-l-4 border-[#1FD73D] pl-4">VISION</h3>
                <ul className="space-y-3 text-white/90 text-base font-bold">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1FD73D]" />
                    Digital Health Capital: AP
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1FD73D]" />
                    Universal Health ID for Everyone
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1FD73D]" />
                    AI Native Healthcare Integration
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1FD73D]" />
                    Scaling from Guntur to all of India
                  </li>
                </ul>
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
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Admin Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
