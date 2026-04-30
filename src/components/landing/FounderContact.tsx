import React, { useState } from "react";
import { 
  Linkedin, 
  Twitter, 
  MessageCircle, 
  Send, 
  Youtube,
  Facebook,
  Instagram,
  ShieldCheck,
  Phone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FounderContact() {
  const ADMIN_PHONE = "918008334948";
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

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
    { name: "WhatsApp", icon: MessageCircle, color: "bg-[#25D366]", href: `https://wa.me/${ADMIN_PHONE}` },
  ];

  return (
    <section id="team" className="py-20 bg-white overflow-hidden border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Team Members */}
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-[#111111] uppercase tracking-tighter">Our Team Members</h2>
              <div className="w-20 h-1.5 bg-[#1FD73D] rounded-full" />
            </div>

            {/* Founder Profile */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <div className="relative shrink-0">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-[#1FD73D] shadow-2xl z-10 relative">
                    <img 
                      src="/assets/images/founder.png" 
                      alt="Chinta Lokesh Babu" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-40 h-40 bg-[#1FD73D]/10 rounded-full blur-2xl -z-10" />
                </div>

                <div className="text-center sm:text-left pt-4">
                  <h3 className="text-4xl md:text-5xl font-black text-[#111111] uppercase tracking-tighter leading-none mb-3">
                    Chinta Lokesh B
                  </h3>
                  <p className="text-[#059669] font-black text-xs md:text-sm uppercase tracking-[0.2em]">
                    Founder, Arogyadatha
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-gray-50 border-l-8 border-[#1FD73D] shadow-sm">
                <p className="text-gray-500 italic font-bold leading-relaxed text-lg">
                  "I faced real problems in healthcare. This idea comes from real life. This is not just a startup. This is a solution for people."
                </p>
              </div>
            </div>

            {/* Rishi Profile */}
            <div className="pt-10 border-t border-gray-100 space-y-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1FD73D] shadow-xl">
                  <img 
                    src="https://picsum.photos/seed/rishi/400/400" 
                    alt="V.V.Vijaya Bhaskar (Rishi)" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center sm:text-left pt-2">
                  <h3 className="text-3xl font-black text-[#111111] uppercase tracking-tighter leading-none mb-2">
                    V.V.Vijaya Bhaskar (Rishi)
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-[#059669] font-black text-[10px] uppercase tracking-[0.2em]">
                      Developer
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 font-bold text-xs">
                      <Phone className="w-3 h-3 text-[#1FD73D]" />
                      <span>7993611399</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-[24px] bg-gray-50 border-l-4 border-[#1FD73D] shadow-sm">
                <p className="text-gray-500 italic font-bold text-sm leading-relaxed">
                  "I like the vision and project goals from the beginning which made me inspired to come hands with the project."
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Social */}
          <div className="space-y-16 lg:pl-8">
            <div className="space-y-8">
              <h2 className="text-4xl font-black text-[#111111] uppercase tracking-tighter">Contact Us</h2>
              
              <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-2xl shadow-[#1FD73D]/5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                    <Input 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#1FD73D]/20 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="h-14 bg-gray-50 border-gray-100 rounded-2xl focus:ring-[#1FD73D]/20 font-bold"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message</label>
                  <textarea 
                    placeholder="How can we help you?" 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full min-h-[120px] p-4 rounded-2xl bg-gray-50 border border-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-[#1FD73D]/20 font-bold text-gray-700 shadow-inner"
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-16 bg-[#059669] hover:bg-[#047857] text-white font-black uppercase tracking-widest text-xs md:text-sm rounded-2xl shadow-[0_10px_30px_-10px_rgba(5,150,105,0.5)] transition-all hover:scale-[1.01] active:scale-95 border-none flex items-center justify-center gap-3">
                  <Send className="w-5 h-5" /> Submit Collaboration Request
                </Button>
              </form>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-[#111111] uppercase tracking-tighter">We Are Social</h2>
                <div className="w-20 h-1.5 bg-[#1FD73D] rounded-full" />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center justify-center gap-3 py-6 rounded-[24px] ${social.color} text-white transition-all hover:scale-105 active:scale-95 shadow-xl group border-b-4 border-black/10`}
                  >
                    <social.icon className="w-8 h-8 group-hover:rotate-6 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{social.name}</span>
                  </a>
                ))}
              </div>

              {/* Admin Support Link */}
              <div className="p-6 rounded-3xl bg-[#0B1221] text-white flex items-center justify-between gap-4 border-b-4 border-[#1FD73D]">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="w-8 h-8 text-[#1FD73D]" />
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest">Admin Support</p>
                    <p className="text-[10px] text-white/50 font-bold uppercase">Direct Access</p>
                  </div>
                </div>
                <a 
                  href={`https://wa.me/${ADMIN_PHONE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#25D366] rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-transform"
                >
                  Message Admin
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
