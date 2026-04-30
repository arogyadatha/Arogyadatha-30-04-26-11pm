import React from 'react';
import { motion } from 'motion/react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Arogyadatha",
  fullScreen = true
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center p-6 ${fullScreen ? 'fixed inset-0 z-[9999] bg-white/80 backdrop-blur-2xl' : 'w-full py-20 bg-transparent'
        }`}
    >
      <div className="relative flex items-center justify-center w-40 h-40 md:w-56 md:h-56 mb-12">
        {/* Animated outer ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-[48px] border-2 border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.05)]"
        />
        
        {/* Secondary ring */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-[40px] border-2 border-emerald-500/5"
        />

        {/* Glow behind the logo */}
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[60px] animate-pulse" />

        {/* HD Zoom out/in Logo */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-3/4 h-3/4"
        >
          <img
            src="/assets/images/logo.png"
            alt="Arogyadatha Logo"
            className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(16,185,129,0.2)]"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-center"
      >
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4">
          {message}
        </h2>
        
        <div className="flex items-center justify-center gap-3">
          <div className="h-1 w-12 bg-emerald-500/20 rounded-full overflow-hidden">
            <motion.div 
              animate={{ x: [-48, 48] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 bg-emerald-500 rounded-full"
            />
          </div>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] opacity-60">Initializing</span>
          <div className="h-1 w-12 bg-emerald-500/20 rounded-full overflow-hidden">
            <motion.div 
              animate={{ x: [-48, 48] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              className="h-full w-1/2 bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
