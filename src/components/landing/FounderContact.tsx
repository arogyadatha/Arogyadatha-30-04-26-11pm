import React, { useState } from "react";
import { 
  Linkedin, 
  Twitter, 
  Send, 
  Youtube,
  Facebook,
  Instagram,
  ShieldCheck,
  Phone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function FounderContact({ config }: { config?: any }) {
  const ADMIN_PHONE = "918008334948";
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `*New Collaboration Request*%0A%0A*Name:* ${formData.name}%0A*Email:* ${formData.email}%0A*Message:* ${formData.message}`;
    window.open(`https://wa.me/${ADMIN_PHONE}?text=${text}`, "_blank");
  };

  const socialLinks = [
    { name: "LinkedIn", icon: Linkedin, color: "bg-[#0077B5]", href: "https://www.linkedin.com/in/chinta-lokesh-babu-28bb96239?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
    { name: "Twitter", icon: Twitter, color: "bg-[#1DA1F2]", href: "https://x.com/Chinta_lokesh24" },
    { name: "YouTube", icon: Youtube, color: "bg-[#FF0000]", href: "https://youtube.com/@arogyadatha" },
    { name: "Facebook", icon: Facebook, color: "bg-[#1877F2]", href: "https://www.facebook.com/share/18Gsxdcvdp/" },
    { name: "Instagram", icon: Instagram, color: "bg-[#E4405F]", href: "https://www.instagram.com/arogyadatha" },
    { name: "WhatsApp", icon: WhatsAppIcon, color: "bg-[#064e3b]", href: config?.buttons?.heroCtaLink || `https://wa.me/${ADMIN_PHONE}` },
  ];

  return (
    <section id="team" className="py-4 bg-white overflow-hidden border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Team Members */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-[#064e3b] font-black text-lg tracking-[0.2em] border-l-4 border-[#064e3b] pl-4 whitespace-nowrap">
                {toTitleCase("Our Team Members")}
              </h2>
            </div>

            {/* Founder Profile */}
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#064e3b] shadow-xl z-10 relative">
                    <img 
                      src="/assets/images/founder.png" 
                      alt="Chinta Lokesh Babu" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl md:text-4xl font-black text-[#111111] tracking-tighter leading-none mb-1">
                    {toTitleCase("Chinta Lokesh Babu")}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-[#064e3b] font-black text-xs tracking-[0.1em]">
                      {toTitleCase("Founder, Arogyadatha")}
                    </p>
                    <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                      <Phone className="w-3.5 h-3.5 text-[#064e3b]" />
                      <span>8008334948</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border-l-4 border-[#064e3b] shadow-sm">
                <p className="text-gray-500 italic font-bold leading-tight text-sm">
                  "I faced real problems in healthcare. This idea comes from real life. This is not just a startup. This is a solution for people."
                </p>
              </div>
            </div>

            {/* Rishi Profile */}
            <div className="pt-8 border-t border-gray-100 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#064e3b] shrink-0">
                  <img 
                    src="https://picsum.photos/seed/rishi/400/400" 
                    alt="V.V.Vijaya Bhaskar (Rishi)" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-[#111111] tracking-tighter leading-none mb-1 truncate">
                    {toTitleCase("V.V.Vijaya Bhaskar (Rishi)")}
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[#064e3b] font-black text-[9px] tracking-[0.1em]">
                      {toTitleCase("Developer")}
                    </p>
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px]">
                      <Phone className="w-2.5 h-2.5 text-[#064e3b]" />
                      <span>7993611399</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border-l-4 border-[#064e3b] shadow-sm">
                <p className="text-gray-500 italic font-bold text-xs leading-tight">
                  "I like the vision and project goals from the beginning which made me inspired to come hands with the project."
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Social */}
          <div className="space-y-4 lg:pl-8">
            <div className="space-y-3">
              <h2 className="text-[#064e3b] font-black text-lg tracking-[0.2em] border-l-4 border-[#064e3b] pl-4 whitespace-nowrap">
                {toTitleCase("Contact Us")}
              </h2>
              
              <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-2xl shadow-[#064e3b]/5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black tracking-widest text-gray-400 ml-1">Full Name</label>
                    <Input 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-12 bg-gray-50 border-gray-100 rounded-xl focus:ring-[#064e3b]/20 font-bold text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black tracking-widest text-gray-400 ml-1">Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="h-12 bg-gray-50 border-gray-100 rounded-xl focus:ring-[#064e3b]/20 font-bold text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black tracking-widest text-gray-400 ml-1">Message</label>
                  <textarea 
                    placeholder="How can we help you?" 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full min-h-[100px] p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#064e3b]/20 font-bold text-gray-700 shadow-inner"
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-14 bg-[#064e3b] hover:bg-[#14532d] text-white font-black tracking-widest text-[10px] md:text-xs rounded-xl shadow-[0_10px_30px_-10px_rgba(6,78,59,0.5)] transition-all hover:scale-[1.01] active:scale-95 border-none flex items-center justify-center gap-3">
                  <Send className="w-4 h-4" /> {toTitleCase(config?.buttons?.collabCta || "Submit Collaboration Request")}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-[#064e3b] font-black text-lg tracking-[0.2em] border-l-4 border-[#064e3b] pl-4 whitespace-nowrap">
                  {toTitleCase("We Are Social")}
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-11 h-11 flex items-center justify-center rounded-xl ${social.color} text-white transition-all hover:scale-110 active:scale-95 shadow-md group border-b-2 border-black/10`}
                    title={social.name}
                  >
                    <social.icon className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                  </a>
                ))}
              </div>

              {/* Admin Support Link */}
              <div className="p-5 rounded-2xl bg-[#0B1221] text-white flex items-center justify-between gap-4 border-b-4 border-[#064e3b]">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#064e3b]" />
                  <div className="text-left">
                    <p className="text-[10px] font-black tracking-widest">{toTitleCase("Admin Support")}</p>
                    <p className="text-[9px] text-white/50 font-bold">{toTitleCase("Direct Access")}</p>
                  </div>
                </div>
                <a 
                  href={config?.buttons?.heroCtaLink || `https://wa.me/${ADMIN_PHONE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#064e3b] text-white rounded-lg font-black tracking-widest text-[8px] hover:scale-105 transition-transform"
                >
                  {toTitleCase(config?.buttons?.messageAdminCta || "Message Admin")}
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
