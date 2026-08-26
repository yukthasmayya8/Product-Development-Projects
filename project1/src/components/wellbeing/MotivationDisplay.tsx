import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Quote } from "lucide-react";
import { generateMotivation } from "@/lib/gemini";
import { translations } from "@/lib/translations";

interface MotivationDisplayProps {
  mood: string;
  studyHistory: any[];
  language?: string;
}

export default function MotivationDisplay({
  mood,
  studyHistory,
  language = "English",
}: MotivationDisplayProps) {
  const [motivation, setMotivation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = translations[language] || translations.English;

  useEffect(() => {
    if (mood) {
      fetchMotivation();
    }
  }, [mood, language]);

  const fetchMotivation = async () => {
    setLoading(true);
    try {
      const msg = await generateMotivation(mood, studyHistory, language);
      setMotivation(msg);
    } catch (error) {
      console.error("Error fetching motivation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Split quote and source if possible
  const parts = motivation?.split("—") || [motivation, ""];
  const quote = parts[0]?.replace(/"/g, "").trim();
  const source = parts[1]?.trim();

  return (
    <div className="glass-surface-vibrant rounded-[60px] p-12 relative overflow-hidden group min-h-[360px] flex flex-col justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/15 via-[#4f46e5]/5 to-[#9333ea]/15 opacity-60" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#ff4e00]/15 rounded-full blur-[80px] animate-pulse" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl text-white glow-orange">
              <Quote size={16} />
            </div>
            <div>
              <h3 className="text-[9px] uppercase tracking-[0.4em] font-sans font-black text-white/40">
                {t.eternalWisdom}
              </h3>
              <p className="text-[7px] uppercase tracking-[0.2em] text-[#ff4e00] font-bold">
                {t.ancientInsights}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ rotate: 180, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={fetchMotivation}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10"
          >
            <Sparkles size={14} className="text-[#ff4e00]" />
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full"
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 animate-pulse">
                {t.consultingSages}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -left-4 -top-4 text-white/5 select-none">
                <Quote size={60} />
              </div>

              <div className="space-y-4 relative z-10">
                <p className="text-xl md:text-2xl font-light leading-snug italic tracking-tight text-white/90 drop-shadow-lg">
                  {quote ||
                    (language === "English"
                      ? "Select your state of mind to receive guidance from the rishis."
                      : t.moodPrompt)}
                </p>
                {source && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[9px] uppercase tracking-[0.4em] font-bold text-[#ff4e00] opacity-60"
                  >
                    — {source}
                  </motion.p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#9333ea] p-[1px]">
                    <div className="w-full h-full rounded-full bg-[#0a0502] flex items-center justify-center">
                      <Sparkles size={10} className="text-[#ff4e00]" />
                    </div>
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/40">
                    {t.pathOfFocus}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
