import React from "react";
import { Star, MessageCircle } from "lucide-react";

export function ImpactSection() {
  const WHATSAPP_LINK = "https://chat.whatsapp.com/CsvbKgcYB3qE2dMpSxNoAR?mode=gi_t";
  
  const coreTeamRoles = [
    "Lawyer",
    "Software Developer",
    "CA / Finance expert",
    "Business Strategist",
    "Social Media / Marketing team"
  ];

  return (
    <section id="collaboration" className="py-12 bg-white border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="space-y-7">
          
          {/* Header Title Section */}
          <div className="space-y-2">
            <h2 className="text-[#059669] font-black text-[clamp(8.5px,2.8vw,18px)] uppercase tracking-[0.15em] border-l-4 border-[#1FD73D] pl-4 whitespace-nowrap">Open for Partnership & Collaboration</h2>
            <p className="text-[clamp(16px,5vw,30px)] font-black italic text-[#111111] leading-tight uppercase whitespace-nowrap">
              Looking for a Best Team
            </p>
            <p className="text-sm md:text-base font-bold italic text-black leading-relaxed">
              "We are open to equity partnership for the right people who believe in this mission."
            </p>
          </div>

          {/* Core Team Section */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Partnership Card */}
              <div className="p-8 rounded-[32px] bg-[#059669] text-white border-b-8 border-[#1FD73D] shadow-2xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coreTeamRoles.map((role, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-4 rounded-xl bg-white/10 border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1FD73D] animate-pulse" />
                      <span className="text-[10px] md:text-xs font-black tracking-tight uppercase">{role}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-white/10 space-y-6">
                  <p className="text-sm md:text-lg font-black uppercase tracking-tight flex items-start gap-2 leading-tight">
                    <Star className="w-4 h-4 text-[#1FD73D] fill-[#1FD73D] shrink-0 mt-0.5" />
                    Let’s build something meaningful for healthcare.
                  </p>
                  <button 
                    onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-[#25D366] text-white font-black rounded-xl shadow-lg hover:scale-[1.01] transition-all uppercase tracking-widest text-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" /> WHATSAPP SUPPORT
                  </button>
                </div>
              </div>

              {/* Business & Growth Card */}
              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "GOVERNMENT ALIGNMENT", desc: "Working towards Digital Health Capital vision for Andhra Pradesh.", icon: "🏛️" },
                  { title: "REVENUE MODEL", desc: "Sustainable ecosystem connecting Labs, Pharmacies, and Hospitals.", icon: "💰" },
                  { title: "INVESTOR RELATIONS", desc: "Open for equity partnership for mission-aligned individuals.", icon: "🤝" }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4 hover:border-[#1FD73D]/30 transition-all group">
                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-[#059669] uppercase tracking-widest mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 font-bold leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
