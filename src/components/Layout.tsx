import React from 'react';
import { motion } from 'motion/react';
import { LogOut, User as UserIcon, BookOpen, Clock, Calendar, Heart } from 'lucide-react';
import { auth, signOut } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function Layout({ children, user }: LayoutProps) {
  const handleSignOut = () => signOut(auth);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-serif">
      <nav className="border-b border-[#1a1a1a]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
                <BookOpen size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight">For The BetterYou</span>
            </div>
            
            {user && (
              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-4 text-sm font-medium opacity-70">
                  <span className="flex items-center gap-1"><Clock size={14} /> Focus</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> Schedule</span>
                  <span className="flex items-center gap-1"><Heart size={14} /> Mood</span>
                </div>
                <div className="flex items-center gap-3 pl-6 border-l border-[#1a1a1a]/10">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">Student</span>
                    <span className="text-sm font-medium">{user.displayName}</span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="p-2 hover:bg-[#1a1a1a]/5 rounded-full transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="border-t border-[#1a1a1a]/10 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.2em] opacity-40 font-sans">
            Designed for focus & self-growth • 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
