import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smile, Frown, Meh, Zap, Coffee, Moon, Heart, RefreshCw } from 'lucide-react';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';
import { translations } from '../lib/translations';
import { toast } from 'sonner';

interface MoodTrackerProps {
  userId: string;
  onMoodSelected: (mood: string) => void;
  language?: string;
}

const moods = [
  { icon: <Zap size={24} />, label: 'Energetic', color: 'from-yellow-400 to-orange-500', glow: 'glow-orange' },
  { icon: <Smile size={24} />, label: 'Happy', color: 'from-green-400 to-emerald-600', glow: 'glow-blue' },
  { icon: <Meh size={24} />, label: 'Neutral', color: 'from-slate-400 to-slate-600', glow: '' },
  { icon: <Coffee size={24} />, label: 'Focused', color: 'from-blue-400 to-indigo-600', glow: 'glow-blue' },
  { icon: <Frown size={24} />, label: 'Tired', color: 'from-orange-400 to-red-600', glow: 'glow-orange' },
  { icon: <Moon size={24} />, label: 'Sleepy', color: 'from-indigo-400 to-purple-800', glow: 'glow-purple' },
];

export default function MoodTracker({ userId, onMoodSelected, language = 'English' }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const t = translations[language] || translations.English;

  const handleMoodClick = async (mood: string) => {
    if (isSaving) return;
    setSelectedMood(mood);
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'moodLogs'), {
        userId,
        mood,
        timestamp: Timestamp.now(),
      });
      toast.success(`Mood logged: ${mood}`);
      onMoodSelected(mood);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'moodLogs');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-surface-vibrant rounded-[50px] p-12 relative overflow-hidden group border border-white/10 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/5 via-transparent to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-all duration-700 rotate-12 group-hover:rotate-0">
        <Heart size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-[#ff4e00]/20 rounded-xl text-[#ff4e00] glow-orange">
            <Smile size={18} />
          </div>
          <h3 className="text-[10px] uppercase tracking-[0.4em] font-sans font-black text-white/40">{t.moodPrompt}</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          {moods.map((m) => (
            <motion.button
              key={m.label}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMoodClick(m.label)}
              disabled={isSaving}
              className={`flex flex-col items-center justify-center p-6 rounded-[40px] transition-all border-2 relative group/btn overflow-hidden disabled:opacity-50 ${
                selectedMood === m.label 
                  ? `border-white/30 bg-white/10 ${m.glow} shadow-2xl` 
                  : 'border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover/btn:opacity-10 transition-opacity`} />
              
              <div className={`p-5 rounded-3xl mb-4 shadow-2xl bg-gradient-to-br ${m.color} text-white relative z-10`}>
                {isSaving && selectedMood === m.label ? <RefreshCw size={24} className="animate-spin" /> : m.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover/btn:text-white transition-colors relative z-10">
                {t.moods[m.label]}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
