import React, { useState } from "react";
import { Leaf, Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#064e3b] border-t border-white/10 md:hidden animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
          <nav className="flex flex-col p-6 gap-1 bg-[#064e3b]/95 backdrop-blur-md">
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
                className="text-xs font-bold tracking-[0.2em] text-white/90 py-4 border-b border-white/5 hover:text-white transition-colors"
              >
                {toTitleCase(item.name)}
              </a>
            ))}
            
            <div className="flex flex-col gap-4 pt-4">
              <Button 
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                className="bg-[#064e3b] text-white font-black w-full py-6 text-sm tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 border border-white/20"
              >
                <MessageCircle className="w-5 h-5" />
                {toTitleCase(config?.buttons?.heroCta || "Join Community")}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
