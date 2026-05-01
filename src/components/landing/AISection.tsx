import React from "react";
import { 
  Mic, 
  BrainCircuit, 
  Lightbulb, 
  FileText, 
  BellRing, 
  Sparkles, 
  HeartPulse, 
  ClipboardList, 
  Siren, 
  MessageSquare, 
  Activity 
} from "lucide-react";

export function AISection({ config }: { config?: any }) {
  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const points = [
    { 
      icon: FileText, 
      title: "SMART REPORT GENERATION", 
      text: "We convert all your reports into one simple page. Even if you have many follow-ups and papers, we show everything clearly in one place. Easy to understand for you and your doctors." 
    },
    { 
      icon: BrainCircuit, 
      title: "INTELLIGENT INSIGHTS", 
      text: "We study your health history and show what is important. We tell you what is normal and what needs attention — in simple words." 
    },
    { 
      icon: BellRing, 
      title: "ALWAYS WITH YOU", 
      text: "Your AI stays with you all the time. It reminds you about medicines, tests, diet, and follow-ups. You don’t forget anything." 
    },
    { 
      icon: Mic, 
      title: "TELUGU VOICE SUPPORT", 
      text: "We explain your reports in Telugu and English. You can also listen in Telugu voice — even if you can’t read." 
    },
    { 
      icon: HeartPulse, 
      title: "PERSONALIZED CARE", 
      text: "Your care is based on your health only. Whether it's diabetes, kidney issues, or specific recovery needs, you get the right doctor, medicines, and diet tailored for your condition." 
    },
    { 
      icon: ClipboardList, 
      title: "HISTORY MAPPING", 
      text: "Your full health history is stored and organized. Doctors can quickly understand your past and provide more effective treatment." 
    },
    { 
      icon: Siren, 
      title: "EMERGENCY SUPPORT", 
      text: "In emergencies or accidents, your health history is available instantly. Doctors can make fast and correct life-saving decisions." 
    },
    { 
      icon: MessageSquare, 
      title: "AI CHAT ASSISTANT (MAIN CONTROL)", 
      text: "Control the full app using chat. Just type or speak to book appointments, check reports, or ask doubts — everything managed in one place." 
    },
    { 
      icon: Activity, 
      title: "SYMPTOM CHECK (SIMPLE)", 
      text: "Enter your symptoms and our AI provides possible conditions while guiding you to the most appropriate doctor." 
    },
    { 
      icon: Lightbulb, 
      title: "SMART RECOMMENDATIONS", 
      text: "Based on your unique history, we suggest the best doctors, diagnostic tests, medicines, and personalized diet plans." 
    },
    { 
      icon: Sparkles, 
      title: "COMING NEXT (ADVANCED AI)", 
      text: "More powerful AI tools are coming soon: better predictions, deeper health tracking, and smarter step-by-step guidance for your health." 
    }
  ];

  return (
    <section id="ai" className="py-8 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="w-full space-y-4 text-left">
          <div className="space-y-1">
            <h2 className="text-[#064e3b] font-black text-lg tracking-[0.2em] border-l-4 border-[#064e3b] pl-4">
              {toTitleCase(config?.headings?.ai || "Personalized Ai")}
            </h2>
            <p className="text-base md:text-xl font-bold text-[#111111]/80 leading-tight pl-4">
              {config?.contentBlocks?.aiDesc || "AI Native integration for a smarter health journey."}
            </p>
          </div>
 
          <div className="flex flex-col gap-3 pl-4">
            {points.map((point, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="w-6 h-6 rounded bg-[#064e3b]/5 flex items-center justify-center shrink-0 border border-[#064e3b]/10 group-hover:bg-[#064e3b] group-hover:border-[#064e3b] transition-all duration-300 mt-1">
                  <point.icon className="w-3.5 h-3.5 text-[#064e3b] group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm md:text-lg font-black text-[#111111] tracking-tight leading-none">
                    {toTitleCase(point.title)}
                  </h4>
                  <p className="text-[11px] md:text-sm text-[#111111]/70 font-bold leading-tight">
                    {point.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
 
          <div className="mt-6 p-4 rounded-2xl bg-[#064e3b] text-white shadow-xl overflow-hidden ml-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-white animate-pulse shrink-0" />
              <p className="text-xs md:text-base font-black tracking-tight">
                {toTitleCase("One Ai. One History. Full Control Of Your Health.")}
              </p>
            </div>
            <p className="mt-1 text-[10px] md:text-xs font-bold italic leading-tight text-white/70">
              Simple, clear health support — made for every person. We leverage advanced GenAI to ensure every patient understands their health status.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

