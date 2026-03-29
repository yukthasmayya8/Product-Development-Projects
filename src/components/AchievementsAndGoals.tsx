import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Target, 
  Plus, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Zap, 
  Award,
  TrendingUp,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { translations } from '../lib/translations';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  badgeId: string;
  earnedAt: any;
}

interface StudyGoal {
  id: string;
  type: 'flashcards' | 'quiz' | 'focusTime' | 'sessions';
  target: number;
  current: number;
  period: 'daily' | 'weekly';
  timestamp: any;
}

const BADGES = [
  { id: 'streak_3', name: '3 Day Streak', icon: Zap, color: 'text-yellow-400', description: 'Maintained focus for 3 consecutive days.' },
  { id: 'streak_7', name: 'Week Warrior', icon: Zap, color: 'text-orange-500', description: 'Maintained focus for 7 consecutive days.' },
  { id: 'sessions_10', name: 'Focus Master', icon: Clock, color: 'text-blue-400', description: 'Completed 10 focus sessions.' },
  { id: 'quiz_ace', name: 'Quiz Ace', icon: Award, color: 'text-purple-400', description: 'Scored 100% on a quiz.' },
  { id: 'subject_master', name: 'Subject Explorer', icon: BookOpen, color: 'text-green-400', description: 'Generated flashcards for 5 different subjects.' },
];

export const AchievementsAndGoals: React.FC<{ language: string }> = ({ language }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'focusTime' as StudyGoal['type'],
    target: 60,
    period: 'daily' as StudyGoal['period']
  });

  const t = translations[language] || translations.English;

  useEffect(() => {
    if (!auth.currentUser) return;

    const achievementsQuery = query(
      collection(db, 'achievements'),
      where('userId', '==', auth.currentUser.uid)
    );

    const goalsQuery = query(
      collection(db, 'studyGoals'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribeAchievements = onSnapshot(achievementsQuery, (snapshot) => {
      setAchievements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement)));
    });

    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGoal)));
    });

    return () => {
      unsubscribeAchievements();
      unsubscribeGoals();
    };
  }, []);

  const handleAddGoal = async () => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'studyGoals'), {
        userId: auth.currentUser.uid,
        ...newGoal,
        current: 0,
        timestamp: Timestamp.now()
      });
      setShowAddGoal(false);
      toast.success(t.goalSet || 'Goal set successfully!');
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to set goal');
    }
  };

  return (
    <div className="space-y-8">
      {/* Achievements Section */}
      <section className="glass-surface rounded-[40px] p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-yellow-500/20 rounded-2xl">
            <Trophy className="text-yellow-500" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{t.achievements}</h3>
            <p className="text-sm opacity-60">{t.badges}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {BADGES.map((badge) => {
            const isEarned = achievements.some(a => a.badgeId === badge.id);
            const Icon = badge.icon;

            return (
              <motion.div
                key={badge.id}
                whileHover={{ y: -5 }}
                className={`relative flex flex-col items-center p-6 rounded-[32px] border transition-all ${
                  isEarned 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-black/20 border-white/5 opacity-40 grayscale'
                }`}
              >
                <div className={`p-4 rounded-full bg-white/5 mb-4 ${isEarned ? badge.color : 'text-gray-500'}`}>
                  <Icon size={32} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                  {badge.name}
                </span>
                {isEarned && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                  >
                    <CheckCircle2 size={12} className="text-white" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Study Goals Section */}
      <section className="glass-surface rounded-[40px] p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <Target className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">{t.studyGoals}</h3>
              <p className="text-sm opacity-60">{t.goalProgress}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddGoal(true)}
            className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xl">
                    {goal.type === 'focusTime' && <Clock size={18} className="text-blue-400" />}
                    {goal.type === 'flashcards' && <BookOpen size={18} className="text-green-400" />}
                    {goal.type === 'quiz' && <Award size={18} className="text-purple-400" />}
                    {goal.type === 'sessions' && <Zap size={18} className="text-yellow-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold capitalize">{goal.type.replace(/([A-Z])/g, ' $1')}</h4>
                    <p className="text-[10px] uppercase tracking-widest opacity-40">{goal.period}</p>
                  </div>
                </div>
                <span className="text-sm font-mono">
                  {goal.current} / {goal.target}
                </span>
              </div>

              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                  className={`h-full bg-gradient-to-r ${
                    goal.current >= goal.target ? 'from-green-500 to-emerald-400' : 'from-blue-500 to-indigo-400'
                  }`}
                />
              </div>
            </div>
          ))}

          {goals.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-40">
              <Target size={48} className="mb-4" />
              <p>{t.noData}</p>
            </div>
          )}
        </div>
      </section>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-surface w-full max-w-md rounded-[40px] p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">{t.setGoal}</h3>
                <button onClick={() => setShowAddGoal(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">
                    {t.goalType}
                  </label>
                  <select 
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as any })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-[#ff4e00] transition-all"
                  >
                    <option value="focusTime">Focus Time (min)</option>
                    <option value="flashcards">Flashcards Mastered</option>
                    <option value="quiz">Quizzes Completed</option>
                    <option value="sessions">Study Sessions</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">
                    {t.timetableDuration}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {['daily', 'weekly'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewGoal({ ...newGoal, period: p as any })}
                        className={`p-4 rounded-2xl border transition-all capitalize ${
                          newGoal.period === p 
                            ? 'bg-[#ff4e00] border-[#ff4e00] text-white' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {t[p + 'Goal'] || p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">
                    {t.targetValue}
                  </label>
                  <input 
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-[#ff4e00] transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleAddGoal}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-[#ff4e00] hover:text-white transition-all"
              >
                {t.save}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
