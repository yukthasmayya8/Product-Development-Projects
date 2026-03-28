import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smile, Frown, Meh, Zap, Coffee, Moon } from 'lucide-react';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';

interface MoodTrackerProps {
  userId: string;
  onMoodSelected: (mood: string) => void;
}

const moods = [
  { icon: <Zap size={24} />, label: 'Energetic', color: 'bg-yellow-100 text-yellow-700' },
  { icon: <Smile size={24} />, label: 'Happy', color: 'bg-green-100 text-green-700' },
  { icon: <Meh size={24} />, label: 'Neutral', color: 'bg-gray-100 text-gray-700' },
  { icon: <Coffee size={24} />, label: 'Focused', color: 'bg-blue-100 text-blue-700' },
  { icon: <Frown size={24} />, label: 'Tired', color: 'bg-orange-100 text-orange-700' },
  { icon: <Moon size={24} />, label: 'Sleepy', color: 'bg-indigo-100 text-indigo-700' },
];

export default function MoodTracker({ userId, onMoodSelected }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodClick = async (mood: string) => {
    setSelectedMood(mood);
    try {
      await addDoc(collection(db, 'moodLogs'), {
        userId,
        mood,
        timestamp: Timestamp.now(),
      });
      onMoodSelected(mood);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'moodLogs');
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#1a1a1a]/5">
      <h3 className="text-xs uppercase tracking-[0.2em] opacity-50 mb-6 font-sans font-bold">How are you feeling?</h3>
      
      <div className="grid grid-cols-3 gap-4">
        {moods.map((m) => (
          <motion.button
            key={m.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMoodClick(m.label)}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border-2 ${
              selectedMood === m.label 
                ? 'border-[#5A5A40] bg-[#5A5A40]/5' 
                : 'border-transparent bg-[#f5f5f0]/50 hover:bg-[#f5f5f0]'
            }`}
          >
            <div className={`p-3 rounded-full mb-2 ${m.color}`}>
              {m.icon}
            </div>
            <span className="text-xs font-medium uppercase tracking-wider">{m.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
