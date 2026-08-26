import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  db,
  collection,
  addDoc,
  Timestamp,
  handleFirestoreError,
  OperationType,
} from "@/firebase";
import { translations } from "@/lib/translations";

interface TimerProps {
  userId: string;
  subject: string;
  onSessionComplete: (duration: number) => void;
  language?: string;
}

export default function Timer({
  userId,
  subject,
  onSessionComplete,
  language = "English",
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const t = translations[language] || translations.English;

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTotalSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    if (timeLeft === 0) {
      handleComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, timeLeft]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(25 * 60);
    setTotalSeconds(0);
  };

  const handleComplete = async () => {
    setIsActive(false);
    const durationMinutes = Math.floor(totalSeconds / 60);
    if (durationMinutes > 0) {
      try {
        await addDoc(collection(db, "studySessions"), {
          userId,
          subject,
          durationMinutes,
          timestamp: Timestamp.now(),
        });
        onSessionComplete(durationMinutes);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "studySessions");
      }
    }
    handleReset();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-surface-vibrant rounded-[50px] p-12 flex flex-col items-center relative overflow-hidden group border border-white/10 shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/10 via-transparent to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 text-center">
        <h3 className="text-[10px] uppercase tracking-[0.4em] opacity-40 mb-10 font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
          {t.focusEngine}
        </h3>

        <div className="relative w-80 h-80 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="160"
              cy="160"
              r="150"
              fill="none"
              stroke="white"
              strokeWidth="1"
              className="opacity-5"
            />
            <motion.circle
              cx="160"
              cy="160"
              r="150"
              fill="none"
              stroke="url(#timer-gradient)"
              strokeWidth="4"
              strokeDasharray="942.5"
              animate={{ strokeDashoffset: 942.5 * (1 - timeLeft / (25 * 60)) }}
              transition={{ duration: 1, ease: "linear" }}
              className="drop-shadow-[0_0_15px_rgba(255,78,0,0.4)]"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="timer-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ff4e00" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>
            </defs>
          </svg>

          <div className="text-9xl font-display tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 drop-shadow-2xl">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex gap-8 mt-14 relative z-10">
          {!isActive ? (
            <motion.button
              whileHover={{
                scale: 1.1,
                boxShadow: "0 0 40px rgba(255,78,0,0.6)",
              }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStart}
              aria-label={t.startTimer}
              className="w-20 h-20 bg-gradient-to-br from-[#ff4e00] to-[#f27d26] text-white rounded-full flex items-center justify-center shadow-2xl glow-orange transition-all"
            >
              <Play size={32} fill="currentColor" />
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePause}
                aria-label={isPaused ? t.resumeTimer : t.pauseTimer}
                className="w-20 h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center border border-white/10 transition-all backdrop-blur-xl"
              >
                {isPaused ? (
                  <Play size={32} className="text-green-400" />
                ) : (
                  <Pause size={32} className="text-yellow-400" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: -180 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleReset}
                aria-label={t.resetTimer}
                className="w-20 h-20 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center border border-white/10 transition-all backdrop-blur-xl"
              >
                <RotateCcw size={32} className="text-blue-400" />
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 0 40px rgba(34,197,94,0.4)",
                }}
                whileTap={{ scale: 0.9 }}
                onClick={handleComplete}
                aria-label={t.completeSession}
                className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-400 text-white rounded-full flex items-center justify-center shadow-2xl transition-all"
              >
                <CheckCircle size={32} />
              </motion.button>
            </>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">
            {isActive ? `${t.engaged}:` : t.awaitingCommand}
          </p>
          {isActive && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold uppercase tracking-widest text-[#ff4e00]"
            >
              {subject}
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
