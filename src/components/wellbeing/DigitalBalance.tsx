import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Smartphone,
  BookOpen,
  Award,
  TrendingDown,
  Info,
  CheckCircle2,
  Zap,
  RefreshCw,
  Save,
} from "lucide-react";
import {
  db,
  doc,
  setDoc,
  Timestamp,
  handleFirestoreError,
  OperationType,
} from "@/firebase";
import { translations } from "@/lib/translations";
import Skeleton from "@/components/shared/Skeleton";

interface DigitalBalanceProps {
  userId: string;
  studyMinutes: number;
  loggedScreenTime?: number;
  language?: string;
  onUpdate: (screenTime: number) => void;
  loading?: boolean;
}

export default function DigitalBalance({
  userId,
  studyMinutes,
  loggedScreenTime = 0,
  language = "English",
  onUpdate,
  loading = false,
}: DigitalBalanceProps) {
  const [screenTime, setScreenTime] = useState<string>(
    loggedScreenTime > 0 ? loggedScreenTime.toString() : "",
  );
  const [activeAppMinutes, setActiveAppMinutes] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const t = translations[language] || translations.English;

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate fetching from Digital Wellbeing API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const randomSyncTime = Math.floor(Math.random() * 120) + 60; // Simulate 1-3 hours
    setScreenTime(randomSyncTime.toString());
    setIsSyncing(false);

    // Save the synced time
    const today = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "screenTimeLogs", `${userId}_${today}`), {
      userId,
      screenTime: randomSyncTime,
      date: today,
      timestamp: Timestamp.now(),
      isSynced: true,
    });
    onUpdate(randomSyncTime);
  };

  // Track active time on the app
  useEffect(() => {
    let startTime = Date.now();
    let interval: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const elapsed = Math.floor((Date.now() - startTime) / 60000);
        setActiveAppMinutes((prev) => prev + elapsed);
        clearInterval(interval);
      } else {
        startTime = Date.now();
        startInterval();
      }
    };

    const startInterval = () => {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 60000);
        if (elapsed >= 1) {
          setActiveAppMinutes((prev) => prev + 1);
          startTime = Date.now();
        }
      }, 60000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startInterval();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const totalScreenTime = (parseInt(screenTime) || 0) + activeAppMinutes;
  const productivityRatio =
    studyMinutes > 0
      ? (studyMinutes / (totalScreenTime || 1)).toFixed(2)
      : "0.00";
  const isBetterYouMaster =
    studyMinutes > totalScreenTime && totalScreenTime > 0;

  const handleSave = async () => {
    const time = parseInt(screenTime);
    if (isNaN(time) || time < 0) return;

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await setDoc(doc(db, "screenTimeLogs", `${userId}_${today}`), {
        userId,
        screenTime: time,
        date: today,
        timestamp: Timestamp.now(),
      });
      onUpdate(time);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "screenTimeLogs");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-surface-vibrant rounded-[40px] p-10 relative overflow-hidden group border border-white/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/10 via-transparent to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#ff4e00]/20 rounded-[24px] border border-[#ff4e00]/30 glow-orange">
              <Smartphone size={24} className="text-[#ff4e00]" />
            </div>
            <div>
              <h3 className="text-xl font-display uppercase tracking-tighter">
                {t.digitalBalance}
              </h3>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                {t.transcendNoise}
              </p>
            </div>
          </div>
          {isBetterYouMaster && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-[8px] font-bold uppercase tracking-widest text-green-500 glow-green"
            >
              <Award size={12} />
              {t.betterYouMaster}
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group/card hover:bg-white/10 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">
                  {t.studyTime}
                </span>
                <BookOpen size={14} className="text-blue-400 opacity-40" />
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                {loading ? (
                  <Skeleton className="w-20 h-10" />
                ) : (
                  <>
                    <span className="text-4xl font-display uppercase tracking-tighter text-blue-400">
                      {studyMinutes}
                    </span>
                    <span className="text-[10px] font-bold opacity-30 uppercase">
                      {t.minutes}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group/card hover:bg-white/10 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">
                  External Screen Time
                </span>
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSync}
                  disabled={isSyncing || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ff4e00]/10 hover:bg-[#ff4e00]/20 border border-[#ff4e00]/20 rounded-xl text-[8px] font-bold uppercase tracking-widest text-[#ff4e00] transition-all"
                >
                  <RefreshCw
                    size={12}
                    className={isSyncing ? "animate-spin" : ""}
                  />
                  {isSyncing ? "Syncing..." : "Sync with Device"}
                </motion.button>
              </div>
              <div className="flex gap-4 relative z-10">
                {loading ? (
                  <Skeleton className="w-full h-12 rounded-2xl" />
                ) : (
                  <>
                    <input
                      type="number"
                      value={screenTime}
                      onChange={(e) => setScreenTime(e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-transparent text-4xl font-display uppercase tracking-tighter outline-none border-b border-white/10 focus:border-[#ff4e00] transition-colors text-white"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSave}
                      disabled={isSaving || !screenTime}
                      className="px-8 bg-[#ff4e00] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg glow-orange transition-all disabled:opacity-20"
                    >
                      {isSaving ? "..." : t.save}
                    </motion.button>
                  </>
                )}
              </div>
              <p className="text-[8px] opacity-20 mt-3 italic relative z-10">
                Sync manually from your phone's Digital Wellbeing
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#ff4e00]/20 to-purple-500/10 p-8 rounded-[32px] border border-[#ff4e00]/30 glow-orange relative overflow-hidden group/card">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Zap size={80} />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#ff4e00]">
                  Active App Usage
                </span>
                <Zap size={16} className="text-[#ff4e00] animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                {loading ? (
                  <Skeleton className="w-20 h-10" />
                ) : (
                  <>
                    <span className="text-4xl font-display uppercase tracking-tighter text-[#ff4e00]">
                      {activeAppMinutes}
                    </span>
                    <span className="text-[10px] font-bold opacity-30 uppercase text-[#ff4e00]">
                      {t.minutes}
                    </span>
                  </>
                )}
              </div>
              <p className="text-[8px] opacity-40 mt-3 italic relative z-10">
                Real-time tracking of your focus on BetterYou
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center text-center p-10 bg-white/5 rounded-[50px] border border-white/10 relative overflow-hidden group/card">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/2 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="relative mb-8 group/circle">
              <div className="absolute inset-0 bg-[#ff4e00]/20 blur-[60px] rounded-full opacity-0 group-hover/circle:opacity-100 transition-opacity" />
              {loading ? (
                <Skeleton className="w-56 h-56 rounded-full" />
              ) : (
                <>
                  <svg className="w-56 h-56 transform -rotate-90 relative z-10">
                    <defs>
                      <linearGradient
                        id="productivityGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#ff4e00" />
                        <stop offset="100%" stopColor="#f27d26" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="currentColor"
                      strokeWidth="14"
                      fill="transparent"
                      className="text-white/5"
                    />
                    <motion.circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="url(#productivityGradient)"
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray={628.3}
                      initial={{ strokeDashoffset: 628.3 }}
                      animate={{
                        strokeDashoffset:
                          628.3 -
                          (Math.min(parseFloat(productivityRatio), 2) / 2) *
                            628.3,
                      }}
                      className="drop-shadow-[0_0_15px_rgba(255,78,0,0.5)]"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-6xl font-display uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-2xl"
                    >
                      {productivityRatio}
                    </motion.span>
                    <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mt-3">
                      {t.productivityRatio}
                    </span>
                  </div>
                </>
              )}
            </div>
            {loading ? (
              <Skeleton className="w-48 h-4" />
            ) : (
              <p className="text-xs opacity-60 italic leading-relaxed max-w-[240px] relative z-10">
                {isBetterYouMaster
                  ? t.appreciation
                  : "Strive to keep your study time higher than your screen time for maximum growth."}
              </p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isBetterYouMaster && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mt-8 p-10 bg-gradient-to-r from-green-500/20 to-blue-500/10 border border-green-500/30 rounded-[40px] flex items-center gap-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Award size={100} />
              </div>
              <div className="w-20 h-20 bg-green-500 rounded-[28px] flex items-center justify-center text-white shadow-xl glow-green relative z-10">
                <Zap size={32} />
              </div>
              <div className="relative z-10">
                <h4 className="text-lg font-display uppercase tracking-tighter text-green-400 mb-2">
                  {t.rewardUnlocked}
                </h4>
                <p className="text-sm opacity-60 italic">
                  {t.betterYouMasterDesc}
                </p>
              </div>
              <div className="ml-auto relative z-10">
                <div className="w-16 h-16 rounded-full border-4 border-green-500/30 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-12 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div className="flex items-start gap-4 group/tip">
            <div className="mt-1 p-3 bg-white/5 rounded-2xl border border-white/10 group-hover/tip:bg-[#ff4e00]/10 group-hover/tip:border-[#ff4e00]/20 transition-all">
              <TrendingDown size={18} className="text-[#ff4e00]" />
            </div>
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-widest mb-2">
                Reduce Noise
              </h5>
              <p className="text-[10px] opacity-40 leading-relaxed">
                Turn off non-essential notifications during focus blocks.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 group/tip">
            <div className="mt-1 p-3 bg-white/5 rounded-2xl border border-white/10 group-hover/tip:bg-[#ff4e00]/10 group-hover/tip:border-[#ff4e00]/20 transition-all">
              <Info size={18} className="text-[#ff4e00]" />
            </div>
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-widest mb-2">
                Grey Scale
              </h5>
              <p className="text-[10px] opacity-40 leading-relaxed">
                Set your phone to grayscale to make it less addictive.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 group/tip">
            <div className="mt-1 p-3 bg-white/5 rounded-2xl border border-white/10 group-hover/tip:bg-[#ff4e00]/10 group-hover/tip:border-[#ff4e00]/20 transition-all">
              <Zap size={18} className="text-[#ff4e00]" />
            </div>
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-widest mb-2">
                Physical Distance
              </h5>
              <p className="text-[10px] opacity-40 leading-relaxed">
                Keep your phone in another room while studying.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
