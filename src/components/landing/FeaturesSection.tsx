import React from "react";
import { 
  HeartPulse, 
  CalendarCheck, 
  MessageSquare, 
  ShieldCheck, 
  FlaskConical, 
  Pill, 
  Leaf, 
  BookOpen, 
  Shield, 
  Droplets, 
  Activity, 
  Baby, 
  HeartHandshake, 
  Stethoscope,
  CircleDollarSign,
  Accessibility,
  User,
  Syringe,
  Siren
} from "lucide-react";

const features = [
  { icon: HeartPulse, title: "AI Symptom Checker", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: CalendarCheck, title: "Book appointment & History", color: "text-[#064e3b]", bg: "bg-[#064e3b]/5" },
  { icon: MessageSquare, title: "OP STATUS", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: ShieldCheck, title: "NTR Vaidyaseva", color: "text-red-600", bg: "bg-red-50" },
  { icon: FlaskConical, title: "Diagnostics", color: "text-orange-600", bg: "bg-orange-50" },
  { icon: Pill, title: "My Medicines", color: "text-cyan-600", bg: "bg-cyan-50" },
  { icon: Leaf, title: "Functional Nutrition", color: "text-[#064e3b]", bg: "bg-[#064e3b]/5" },
  { icon: BookOpen, title: "Health Knowledge", color: "text-indigo-600", bg: "bg-indigo-50" },
  { icon: Shield, title: "Insurances", color: "text-teal-600", bg: "bg-teal-50" },
  { icon: CircleDollarSign, title: "Crowd Funding", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Droplets, title: "Blood Bank", color: "text-red-500", bg: "bg-red-50" },
  { icon: HeartHandshake, title: "Jeevandan", color: "text-rose-600", bg: "bg-rose-50" },
  { icon: Activity, title: "Health Tracker", color: "text-pink-600", bg: "bg-pink-50" },
  { icon: Stethoscope, title: "24/7 Jr. Doctors", color: "text-[#064e3b]", bg: "bg-[#064e3b]/5" },
  { icon: Baby, title: "Pregnancy Care", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Accessibility, title: "Old Age Assistant", color: "text-indigo-700", bg: "bg-indigo-100" },
  { icon: User, title: "Profile", color: "text-slate-600", bg: "bg-slate-50" },
  { icon: Syringe, title: "Surgery Care", color: "text-teal-700", bg: "bg-teal-50" },
  { icon: Siren, title: "Emergency", color: "text-red-600", bg: "bg-red-100" },
];

export function FeaturesSection({ config }: { config?: any }) {
  return (
    <section id="services" className="py-12 bg-white border-t border-gray-100 overflow-hidden">
      <div className="container mx-auto px-2 md:px-4">
        <div className="text-left mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
          <h2 className="text-xl md:text-2xl font-black text-[#064e3b] uppercase tracking-[0.1em] border-l-4 border-[#064e3b] pl-3">Our Services</h2>
        </div>

        <div className="border-2 border-[#064e3b]/10 rounded-3xl p-2 md:p-10 bg-gray-50/30 shadow-inner backdrop-blur-sm">
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 md:gap-8">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="flex flex-col items-center text-center p-1.5 md:p-6 rounded-xl md:rounded-3xl bg-white border border-[#064e3b]/5 hover:border-[#064e3b]/40 hover:shadow-[0_20px_40px_-10px_rgba(6,78,59,0.15)] transition-all duration-300 cursor-pointer group hover:-translate-y-2 active:scale-95 animate-in fade-in zoom-in-95 duration-500"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`w-10 h-10 md:w-20 md:h-20 flex items-center justify-center mb-1.5 md:mb-4 ${feature.bg} rounded-lg md:rounded-2xl border-2 border-white group-hover:rotate-6 transition-transform shadow-sm md:shadow-md`}>
                  <feature.icon className={`w-5 h-5 md:w-11 md:h-11 ${feature.color}`} strokeWidth={2.5} />
                </div>
                <span className="text-[9px] md:text-xl font-bold text-[#111111] leading-tight uppercase tracking-tight h-8 md:h-16 flex items-center justify-center line-clamp-2 transition-colors group-hover:text-[#064e3b]">
                  {feature.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
