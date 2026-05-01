import React from "react";
import { MessageCircle, ChevronRight } from "lucide-react";

export function Hero({ config }: { config?: any }) {
  const WHATSAPP_LINK = "https://chat.whatsapp.com/CsvbKgcYB3qE2dMpSxNoAR?mode=gi_t";

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  return (
    <section 
      id="home" 
      className="relative pt-1 sm:pt-2 pb-4 bg-white overflow-hidden flex sm:items-center min-h-[auto] sm:min-h-[40vh]"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-[#064e3b]/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-7xl mx-auto space-y-2 text-[#111111] text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">

          {/* Main Headline - SCALED SINGLE LINE */}
          <h1 className="font-black leading-none tracking-tighter text-center sm:text-left whitespace-nowrap animate-in fade-in duration-1000 delay-200 text-[clamp(10px,4.2vw,120px)] sm:text-[clamp(18px,4.5vw,120px)]">
            {toTitleCase(config?.headings?.hero || "One Health Id. One Place.")} <span className="text-[#064e3b]">{toTitleCase(config?.headings?.heroHighlight || "Full Journey.")}</span>
          </h1>

          {/* Description */}
          <div className="flex justify-center">
            <p className="text-sm sm:text-base md:text-lg text-[#666666] font-bold leading-snug max-w-2xl border-l-4 border-[#064e3b] pl-4 text-left animate-in fade-in slide-in-from-left-6 duration-1000 delay-300">
              {config?.contentBlocks?.heroDesc || "Don't leave your health data in hospitals. Carry your health data in your mobile."}
            </p>
          </div>



          {/* WhatsApp CTA */}
          <a 
            href={config?.buttons?.heroCtaLink || WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 px-6 sm:px-6 py-3 sm:py-2.5 bg-[#064e3b] text-white font-black text-xs sm:text-sm tracking-tight rounded-xl shadow-[0_10px_20px_-5px_rgba(6,78,59,0.4)] hover:scale-[1.01] active:scale-95 transition-all duration-300 w-full sm:w-fit mx-auto min-w-[240px] sm:min-w-0"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white group-hover:rotate-12 transition-transform" />
            {toTitleCase(config?.buttons?.heroCta || "Join Arogyadatha Community")}
            <ChevronRight className="w-4 h-4 sm:w-4 sm:h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </a>

        </div>
      </div>
    </section>
  );
}
