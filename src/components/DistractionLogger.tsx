import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Plus, X, Instagram, Youtube, MessageCircle, Gamepad2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';
import { translations } from '../lib/translations';
import { toast } from 'sonner';

interface DistractionLoggerProps {
  userId: string;
  language?: string;
}

const COMMON_DISTRACTIONS = [
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
  { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'text-red-500' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'text-green-500' },
  { id: 'gaming', icon: Gamepad2, label: 'Gaming', color: 'text-blue-500' },
];

export default function DistractionLogger({ userId, language = 'English' }: DistractionLoggerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [duration, setDuration] = useState('15');
  const [isSaving, setIsSaving] = useState(false);
  const t = translations[language] || translations.English;

  const logDistraction = async (source: string) => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'distractionLogs'), {
        userId,
        source,
        duration: parseInt(duration) || 0,
        timestamp: Timestamp.now()
      });
      toast.success(`Logged distraction: ${source}`);
      setIsExpanded(false);
      setCustomSource('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'distractionLogs');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        layoutId="distraction-btn"
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
      >
        <Smartphone size={16} className="text-[#ff4e00] group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Log Distraction</span>
        <Plus size={14} className="opacity-20" />
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              layoutId="distraction-btn"
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0a0502] border border-white/10 rounded-[40px] p-10 z-[60] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#ff4e00]/10 rounded-2xl border border-[#ff4e00]/20">
                    <Smartphone size={20} className="text-[#ff4e00]" />
                  </div>
                  <h3 className="text-lg font-display uppercase tracking-tighter">Identify the Noise</h3>
                </div>
                <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="opacity-20" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {COMMON_DISTRACTIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => logDistraction(d.label)}
                    disabled={isSaving}
                    className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[32px] transition-all group disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={24} className="animate-spin opacity-40" /> : <d.icon size={24} className={`${d.color} group-hover:scale-110 transition-transform`} />}
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{d.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Estimated Duration (min)</span>
                <input 
                  type="number" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-20 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#ff4e00]"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="Other distraction..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-[#ff4e00] transition-colors"
                />
                {customSource && (
                  <button
                    onClick={() => logDistraction(customSource)}
                    disabled={isSaving}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#ff4e00] text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>

              <p className="mt-8 text-[10px] text-center opacity-40 italic leading-relaxed">
                "Awareness is the first step towards mastery. By logging your distractions, you strip them of their power."
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
