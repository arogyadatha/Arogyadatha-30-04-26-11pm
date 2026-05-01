import React from "react";
import { Star, MessageCircle } from "lucide-react";

export function ImpactSection({ config }: { config?: any }) {
  const WHATSAPP_LINK = "https://chat.whatsapp.com/CsvbKgcYB3qE2dMpSxNoAR?mode=gi_t";

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };
  
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
            <h2 className="text-[#064e3b] font-black text-[clamp(8.5px,2.8vw,18px)] tracking-[0.15em] border-l-4 border-[#064e3b] pl-4 whitespace-nowrap">
              {toTitleCase("Open for Partnership & Collaboration")}
            </h2>
            <p className="text-sm md:text-base font-bold italic text-black leading-relaxed">
              "We are open to equity partnership for the right people who believe in this mission."
            </p>
          </div>

          {/* Core Team Section */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Partnership Card */}
              <div className="p-5 md:p-8 rounded-[32px] bg-[#064e3b] text-white border-b-4 border-black/10 shadow-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {coreTeamRoles.map((role, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                      <div className="w-1 h-1 rounded-full bg-[#1FD73D] shrink-0" />
                      <span className="text-xs md:text-sm font-bold tracking-tight whitespace-nowrap">{toTitleCase(role)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <p className="text-sm md:text-lg font-bold tracking-tight flex items-start gap-2 leading-tight">
                    <Star className="w-4 h-4 text-[#1FD73D] fill-[#1FD73D] shrink-0 mt-0.5" />
                    {toTitleCase("Let’s build something meaningful for healthcare.")}
                  </p>
                  <button 
                    onClick={() => window.open(config?.buttons?.heroCtaLink || WHATSAPP_LINK, "_blank")}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-[#064e3b] font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all tracking-widest text-[10px] border-none"
                  >
                    <MessageCircle className="w-4 h-4 fill-[#064e3b]" /> {toTitleCase(config?.buttons?.whatsappSupport || "Whatsapp Support")}
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
                  <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-4 hover:border-[#064e3b]/30 transition-all group">
                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</div>
                    <div className="text-left">
                      <h4 className="text-xs font-black text-[#064e3b] tracking-widest mb-1">{toTitleCase(item.title)}</h4>
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
