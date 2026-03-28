import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Quote } from 'lucide-react';
import { generateMotivation } from '../lib/gemini';

interface MotivationDisplayProps {
  mood: string;
  studyHistory: any[];
}

export default function MotivationDisplay({ mood, studyHistory }: MotivationDisplayProps) {
  const [motivation, setMotivation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mood) {
      fetchMotivation();
    }
  }, [mood]);

  const fetchMotivation = async () => {
    setLoading(true);
    try {
      const msg = await generateMotivation(mood, studyHistory);
      setMotivation(msg);
    } catch (error) {
      console.error('Error fetching motivation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#5A5A40] text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-white/20 rounded-full">
            <Quote size={18} />
          </div>
          <h3 className="text-xs uppercase tracking-[0.2em] font-sans font-bold">Daily Motivation</h3>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-sm italic opacity-70">Crafting your inspiration...</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-2xl font-light leading-relaxed italic">
                "{motivation || 'Select your mood to get personalized motivation.'}"
              </p>
              
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/20" />
                <button 
                  onClick={fetchMotivation}
                  className="text-xs uppercase tracking-widest font-bold hover:underline"
                >
                  Refresh
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
