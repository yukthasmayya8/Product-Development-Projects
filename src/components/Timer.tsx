import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';

interface TimerProps {
  userId: string;
  subject: string;
  onSessionComplete: (duration: number) => void;
}

export default function Timer({ userId, subject, onSessionComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        await addDoc(collection(db, 'studySessions'), {
          userId,
          subject,
          durationMinutes,
          timestamp: Timestamp.now(),
        });
        onSessionComplete(durationMinutes);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'studySessions');
      }
    }
    handleReset();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#1a1a1a]/5 flex flex-col items-center">
      <h3 className="text-xs uppercase tracking-[0.2em] opacity-50 mb-6 font-sans font-bold">Focus Timer</h3>
      
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeDasharray="753.98"
            strokeDashoffset={753.98 * (1 - timeLeft / (25 * 60))}
            className="transition-all duration-1000 ease-linear opacity-10"
          />
        </svg>
        
        <div className="text-7xl font-light tracking-tighter tabular-nums">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="w-14 h-14 bg-[#5A5A40] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
          >
            <Play size={24} fill="currentColor" />
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="w-14 h-14 bg-white border border-[#1a1a1a]/10 rounded-full flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors"
            >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
            </button>
            <button
              onClick={handleReset}
              className="w-14 h-14 bg-white border border-[#1a1a1a]/10 rounded-full flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors"
            >
              <RotateCcw size={24} />
            </button>
            <button
              onClick={handleComplete}
              className="w-14 h-14 bg-[#5A5A40] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
            >
              <CheckCircle size={24} />
            </button>
          </>
        )}
      </div>
      
      <p className="mt-6 text-sm opacity-40 italic">
        {isActive ? `Studying ${subject}...` : 'Ready to focus?'}
      </p>
    </div>
  );
}
