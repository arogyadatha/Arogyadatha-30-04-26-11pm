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

export function AISection() {
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
    <section id="ai" className="py-12 bg-white border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl space-y-8 text-left mb-10">
          <div className="space-y-2">
            <h2 className="text-[#059669] font-black text-lg uppercase tracking-[0.2em] border-l-4 border-[#1FD73D] pl-4">Personalized AI</h2>
            <p className="text-2xl md:text-3xl font-black text-[#111111] leading-tight">
              AI Native integration for a smarter health journey.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {points.map((point, i) => (
              <div key={i} className="flex items-start gap-4 py-2 group">
                <div className="w-10 h-10 rounded-xl bg-[#059669]/5 flex items-center justify-center shrink-0 border border-[#059669]/10 group-hover:bg-[#059669] group-hover:border-[#059669] transition-all duration-300">
                  <point.icon className="w-5 h-5 text-[#059669] group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg md:text-xl font-black text-[#111111] uppercase tracking-tight">
                    {point.title}
                  </h4>
                  <p className="text-base md:text-lg text-gray-500 font-bold leading-snug">
                    {point.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full p-8 rounded-2xl bg-emerald-50 text-[#059669] space-y-4 border border-[#059669]/10 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#1FD73D]" />
            <p className="text-[clamp(14px,2.7vw,22px)] font-black uppercase tracking-tight">
              One AI. One history. Full control of your health.
            </p>
          </div>
          <p className="text-sm md:text-base font-bold italic leading-relaxed text-gray-600">
            Simple, clear health support — made for every person. We leverage advanced GenAI to ensure every patient understands their health status.
          </p>
        </div>
      </div>
    </section>
  );
}

