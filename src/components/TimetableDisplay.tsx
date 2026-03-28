import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { generateTimetable } from '../lib/gemini';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';

interface TimetableDisplayProps {
  userId: string;
  mood: string;
  subjects: string[];
  pattern: string;
}

export default function TimetableDisplay({ userId, mood, subjects, pattern }: TimetableDisplayProps) {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mood && subjects.length > 0) {
      fetchTimetable();
    }
  }, [mood, subjects]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const data = await generateTimetable(mood, subjects, pattern);
      setSchedule(data);
      // Save to Firestore
      await addDoc(collection(db, 'timetables'), {
        userId,
        schedule: data,
        moodContext: mood,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#1a1a1a]/5">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-[#5A5A40]" />
          <h3 className="text-xs uppercase tracking-[0.2em] opacity-50 font-sans font-bold">AI Study Timetable</h3>
        </div>
        <button 
          onClick={fetchTimetable}
          disabled={loading}
          className="p-2 hover:bg-[#1a1a1a]/5 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="w-12 h-12 border-4 border-[#5A5A40]/20 border-t-[#5A5A40] rounded-full animate-spin mb-4" />
            <p className="text-sm italic opacity-50">Generating your optimal schedule...</p>
          </motion.div>
        ) : schedule.length > 0 ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {schedule.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-[#f5f5f0]/50 border border-[#1a1a1a]/5 hover:bg-[#f5f5f0] transition-colors"
              >
                <div className="w-20 flex flex-col items-center justify-center py-2 bg-white rounded-xl shadow-sm border border-[#1a1a1a]/5">
                  <Clock size={14} className="opacity-30 mb-1" />
                  <span className="text-xs font-bold tracking-tight">{item.time}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold tracking-tight mb-1">{item.activity}</h4>
                  <p className="text-xs opacity-60 leading-relaxed italic">
                    <span className="font-bold uppercase tracking-widest text-[10px] mr-2">Tip:</span>
                    {item.tip}
                  </p>
                </div>
                <CheckCircle2 size={18} className="opacity-10" />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 opacity-40 italic">
            <p>Select your mood and subjects to generate a schedule.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
