import React, { useState } from "react";
import { Leaf, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "./WhatsAppIcon";

interface NavbarProps {
  onLoginClick: () => void;
  config?: any;
}

export function Navbar({ onLoginClick, config }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const WHATSAPP_LINK = "https://chat.whatsapp.com/CsvbKgcYB3qE2dMpSxNoAR?mode=gi_t";

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#064e3b] py-3 px-4 sm:px-8 shadow-xl border-b border-white/10 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between gap-2">
        <a href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0 transition-transform hover:scale-105 active:scale-95">
          <div className="bg-white/10 p-1 rounded-lg">
            <Leaf className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="font-black text-[clamp(14px,5vw,24px)] tracking-tighter text-white whitespace-nowrap">
            {toTitleCase("Arogyadatha")}
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {[
            { name: "Home", id: "home" },
            { name: "What We Do", id: "what-we-do" },
            { name: "Solutions", id: "solutions" },
            { name: "Services", id: "services" },
            { name: "AI", id: "ai" },
            { name: "Team", id: "team" },
            { name: "Careers", id: "collaboration" }
          ].map((item) => (
            <a 
              key={item.id} 
              href={`#${item.id}`}
              className="text-[10px] font-bold tracking-[0.15em] text-white/70 hover:text-white transition-all duration-200"
            >
              {toTitleCase(item.name)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button 
            onClick={onLoginClick}
            size="sm" 
            className="bg-white hover:bg-white/90 text-[#064e3b] font-black h-8 sm:h-9 px-3 sm:px-5 rounded-lg text-[10px] sm:text-xs shadow-lg tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 border-none"
          >
            {toTitleCase(config?.buttons?.navbarLogin || "Login")}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white h-8 w-8 hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Click-away overlay - closes menu when clicking anywhere else */}
          <div 
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] md:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="absolute top-[85%] right-4 w-60 bg-[#064e3b] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right md:hidden">
            <nav className="flex flex-col p-2">
              {[
                { name: "Home", id: "home" },
                { name: "What We Do", id: "what-we-do" },
                { name: "Solutions", id: "solutions" },
                { name: "Services", id: "services" },
                { name: "AI", id: "ai" },
                { name: "Team", id: "team" },
                { name: "Careers", id: "collaboration" }
              ].map((item) => (
                <a 
                  key={item.id} 
                  href={`#${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-[10px] font-black tracking-widest text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  {toTitleCase(item.name)}
                </a>
              ))}
              
              <div className="mt-1 pt-2 border-t border-white/10 px-2 pb-2">
                <button 
                  onClick={() => {
                    window.open(WHATSAPP_LINK, "_blank");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-white text-[#064e3b] font-black py-3 rounded-xl text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  {toTitleCase(config?.buttons?.heroCta || "Join Community")}
                </button>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
