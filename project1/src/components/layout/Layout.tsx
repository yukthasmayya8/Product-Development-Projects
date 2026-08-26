import React from "react";
import { motion } from "motion/react";
import {
  LogOut,
  User as UserIcon,
  BookOpen,
  Clock,
  Calendar,
  Heart,
} from "lucide-react";
import { auth, signOut } from "@/firebase";
import { translations } from "@/lib/translations";

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  language?: string;
}

export default function Layout({
  children,
  user,
  language = "English",
}: LayoutProps) {
  const handleSignOut = () => signOut(auth);
  const t = translations[language] || translations.English;

  return (
    <div className="min-h-screen text-white font-sans selection:bg-[#ff4e00]/30 selection:text-white overflow-x-hidden bg-[#0a0502]">
      <div className="atmosphere" />

      {/* Animated Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#ff4e00]/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.15, 0.05],
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[200px]"
        />
      </div>

      <nav className="border-b border-white/5 bg-[#0a0502]/40 backdrop-blur-3xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between h-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-5 group cursor-pointer"
              role="banner"
              aria-label="For The BetterYou Home"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#ff4e00] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="w-12 h-12 bg-gradient-to-br from-[#ff4e00] to-[#9333ea] rounded-2xl flex items-center justify-center text-white shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <BookOpen size={24} className="drop-shadow-lg" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">
                  BETTER<span className="text-[#ff4e00]">YOU</span>
                </span>
                <span className="text-[8px] uppercase tracking-[0.5em] font-black text-white/20 group-hover:text-[#ff4e00] transition-colors duration-500">
                  Master Your Mind
                </span>
              </div>
            </motion.div>

            {user && (
              <div className="flex items-center gap-10">
                <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                  <motion.span
                    whileHover={{ scale: 1.05, color: "#fff" }}
                    className="flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Clock size={14} className="text-[#ff4e00]" /> {t.focus}
                  </motion.span>
                  <motion.span
                    whileHover={{ scale: 1.05, color: "#fff" }}
                    className="flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Calendar size={14} className="text-[#ff4e00]" />{" "}
                    {t.schedule}
                  </motion.span>
                  <motion.span
                    whileHover={{ scale: 1.05, color: "#fff" }}
                    className="flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Heart size={14} className="text-[#ff4e00]" /> {t.mood}
                  </motion.span>
                </div>
                <div className="flex items-center gap-6 pl-10 border-l border-white/10">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ff4e00] drop-shadow-lg">
                      {t.pioneer}
                    </span>
                    <span className="text-sm font-black tracking-tight text-white/90">
                      {user.displayName}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSignOut}
                    className="w-12 h-12 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all border border-white/10 hover:border-red-500/20 shadow-2xl"
                    aria-label={t.signOut}
                  >
                    <LogOut size={20} />
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="border-t border-white/5 py-16 mt-auto bg-[#0a0502]/80 backdrop-blur-3xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:text-[#ff4e00] transition-colors border border-white/5">
              <BookOpen size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 group-hover:text-white/40 transition-colors">
              {t.forTheBetterYou}
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.6em] text-white/10 font-black">
            {t.transcendNoise} • 2026
          </p>
          <div className="flex gap-10 text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
            <a href="#" className="hover:text-[#ff4e00] transition-colors">
              {t.privacy}
            </a>
            <a href="#" className="hover:text-[#ff4e00] transition-colors">
              {t.terms}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
