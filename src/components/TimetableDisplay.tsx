import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Calendar, Clock, CheckCircle2, RefreshCw, Sparkles, Edit3, Save, X, Plus, Bell, BellOff, BookOpen } from 'lucide-react';
import { generateTimetable } from '../lib/gemini';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType, auth, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDocs } from '../firebase';
import { translations } from '../lib/translations';
import { toast } from 'sonner';

interface TimetableDisplayProps {
  userId: string;
  mood: string;
  subjects: string[];
  weakSubjects?: string[];
  strongSubjects?: string[];
  duration?: string;
  pattern: string;
  language?: string;
  syllabus?: Record<string, string>;
  distractionLogs?: any[];
}

export default function TimetableDisplay({ 
  userId, 
  mood, 
  subjects, 
  weakSubjects = [], 
  strongSubjects = [], 
  duration = 'daily',
  pattern, 
  language = 'English',
  syllabus = {},
  distractionLogs = []
}: TimetableDisplayProps) {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [focusSubject, setFocusSubject] = useState<string>('');
  const [reminders, setReminders] = useState<any[]>([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState<{ subject: string; time: string; topic: string; days: string[] }>({ 
    subject: '', 
    time: '09:00', 
    topic: '', 
    days: [] 
  });
  const [studyMode, setStudyMode] = useState<'exam' | 'mastery'>('exam');
  const [syllabusText, setSyllabusText] = useState<string>('');
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);

  const t = translations[language] || translations.English;

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (mood && subjects.length > 0 && schedule.length === 0) {
      fetchTimetable();
    }
  }, [mood, subjects, language, syllabus]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const data = await generateTimetable(
        mood, 
        subjects, 
        weakSubjects, 
        strongSubjects, 
        pattern, 
        duration, 
        focusSubject, 
        language,
        { ...syllabus, manual: syllabusText },
        distractionLogs,
        studyMode
      );
      setSchedule(data);
      // Save to Firestore
      await addDoc(collection(db, 'timetables'), {
        userId,
        schedule: data,
        moodContext: mood,
        focusSubject,
        duration,
        studyMode,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast.error('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const saveTimetable = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'timetables'), {
        userId,
        schedule,
        moodContext: mood,
        timestamp: Timestamp.now(),
        isManualEdit: true
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'timetables');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (idx: number, field: string, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[idx] = { ...newSchedule[idx], [field]: value };
    setSchedule(newSchedule);
  };

  const addRow = () => {
    setSchedule([...schedule, { time: '00:00', activity: 'New Activity', tip: 'Focus tip...', moodAlign: false }]);
  };

  const removeRow = (idx: number) => {
    setSchedule(schedule.filter((_, i) => i !== idx));
  };

  const reorderRows = (newOrder: any[]) => {
    setSchedule(newOrder);
  };

  const completeSession = async (activity: string) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'studySessions'), {
        userId,
        subject: activity,
        duration: 45, // Defaulting to 45 mins for a session
        timestamp: Timestamp.now(),
      });
      // Increment goal progress for sessions
      incrementGoalProgress('sessions');
      
      // Check for "Focus Master" achievement (10 sessions)
      const q = query(
        collection(db, 'studySessions'),
        where('userId', '==', auth.currentUser?.uid)
      );
      const snapshot = await getDocs(q);
      if (snapshot.size >= 10) {
        checkAchievements('sessions_10');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'studySessions');
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async (badgeId: string) => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'achievements'),
        where('userId', '==', auth.currentUser.uid),
        where('badgeId', '==', badgeId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await addDoc(collection(db, 'achievements'), {
          userId: auth.currentUser.uid,
          badgeId,
          earnedAt: Timestamp.now()
        });
        toast.success('New Achievement Unlocked! 🏆');
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const incrementGoalProgress = async (type: string) => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'studyGoals'),
        where('userId', '==', auth.currentUser.uid),
        where('type', '==', type)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach(async (goalDoc) => {
          const data = goalDoc.data();
          await updateDoc(doc(db, 'studyGoals', goalDoc.id), {
            current: data.current + 1
          });
        });
        unsubscribe();
      });
    } catch (error) {
      console.error('Error incrementing goal progress:', error);
    }
  };

  const handleAddReminder = async () => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'reminders'), {
        userId: auth.currentUser.uid,
        ...newReminder,
        active: true,
        timestamp: Timestamp.now()
      });
      setShowAddReminder(false);
      toast.success(t.setReminder || 'Reminder set!');
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Failed to set reminder');
    }
  };

  const toggleReminder = async (id: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'reminders', id), { active: !active });
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
      toast.success('Reminder removed');
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  return (
    <div className="space-y-10">
      <div className="glass-surface-vibrant rounded-[50px] p-12 relative overflow-hidden group border border-white/10 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/5 via-transparent to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#ff4e00] to-[#f27d26] rounded-2xl shadow-2xl glow-orange">
              <Calendar size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[10px] uppercase tracking-[0.4em] font-sans font-black text-white/40">{t.timetable}</h3>
              <span className="text-xs uppercase tracking-widest font-black text-[#ff4e00] drop-shadow-lg">{t[duration] || duration}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mr-2">
              <button 
                onClick={() => setStudyMode('exam')}
                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${studyMode === 'exam' ? 'bg-[#ff4e00] text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
              >
                Exam
              </button>
              <button 
                onClick={() => setStudyMode('mastery')}
                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${studyMode === 'mastery' ? 'bg-purple-500 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
              >
                Mastery
              </button>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSyllabusModal(true)}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <BookOpen size={14} className="text-[#ff4e00]" />
              {t.uploadSyllabus}
            </motion.button>
            {!isEditing && subjects.length > 0 && (
              <div className="relative group/select">
                <select
                  value={focusSubject}
                  onChange={(e) => setFocusSubject(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-black outline-none focus:ring-2 focus:ring-[#ff4e00]/50 appearance-none cursor-pointer transition-all hover:bg-white/10 pr-10"
                >
                  <option value="" className="bg-[#0a0502]">Focus Subject...</option>
                  {subjects.map(s => (
                    <option key={s} value={s} className="bg-[#0a0502]">{s}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <Sparkles size={12} />
                </div>
              </div>
            )}
            {isEditing && (
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={addRow}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all border border-white/10 text-[#ff4e00]"
                title="Add Row"
              >
                <Plus size={20} />
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => isEditing ? saveTimetable() : setIsEditing(true)}
              disabled={loading}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all border border-white/10"
              title={isEditing ? t.save : t.edit}
            >
              {isEditing ? <Save size={20} className="text-[#ff4e00]" /> : <Edit3 size={20} className="opacity-40" />}
            </motion.button>
            {!isEditing && (
              <motion.button 
                whileHover={{ rotate: 180, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={fetchTimetable}
                disabled={loading}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all border border-white/10"
                title={t.generateNew}
              >
                <RefreshCw size={20} className={loading ? 'animate-spin text-[#ff4e00]' : 'opacity-40'} />
              </motion.button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading && !isEditing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="relative w-20 h-20 mb-10">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-[#ff4e00] rounded-full animate-spin shadow-[0_0_20px_rgba(255,78,0,0.4)]" />
                <Sparkles size={24} className="absolute inset-0 m-auto text-[#ff4e00] animate-pulse" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.5em] font-black text-transparent bg-clip-text bg-gradient-to-r from-white/40 to-white/10 animate-pulse">Architecting Schedule</p>
            </motion.div>
          ) : schedule.length > 0 ? (
            <Reorder.Group
              axis="y"
              values={schedule}
              onReorder={setSchedule}
              className="space-y-6"
            >
              {schedule.map((item, idx) => (
                <Reorder.Item
                  key={item.id || idx}
                  value={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  dragListener={isEditing}
                  className={`group flex items-center gap-8 p-8 rounded-[40px] transition-all border relative overflow-hidden ${
                    isEditing ? 'cursor-grab active:cursor-grabbing' : ''
                  } ${
                    item.moodAlign 
                      ? 'bg-gradient-to-r from-[#ff4e00]/20 to-purple-500/10 border-[#ff4e00]/40 shadow-2xl' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {isEditing && (
                    <motion.button 
                      whileHover={{ scale: 1.2, rotate: 90 }}
                      onClick={() => removeRow(idx)}
                      className="absolute top-4 right-4 w-8 h-8 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center transition-all border border-red-500/20 z-20"
                    >
                      <X size={14} />
                    </motion.button>
                  )}

                  <div className="w-28 flex flex-col items-center justify-center py-5 bg-black/60 rounded-3xl border border-white/10 shadow-2xl relative z-10">
                    <Clock size={14} className="text-[#ff4e00] mb-2 opacity-60" />
                    {isEditing ? (
                      <input 
                        type="text"
                        value={item.time}
                        onChange={(e) => handleEditChange(idx, 'time', e.target.value)}
                        className="w-full bg-transparent text-center text-xs font-black tracking-tight tabular-nums outline-none border-b border-white/10 focus:border-[#ff4e00] text-white"
                      />
                    ) : (
                      <span className="text-xs font-black tracking-tight tabular-nums text-white/90">{item.time}</span>
                    )}
                  </div>

                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={item.activity}
                          onChange={(e) => handleEditChange(idx, 'activity', e.target.value)}
                          className="w-full bg-transparent text-xl font-black tracking-tight outline-none border-b border-white/10 focus:border-[#ff4e00] text-white"
                        />
                      ) : (
                        <h4 className="text-xl font-black tracking-tight text-white group-hover:text-[#ff4e00] transition-colors">{item.activity}</h4>
                      )}
                      {item.moodAlign && !isEditing && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#ff4e00] to-[#f27d26] text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl glow-orange"
                        >
                          <Sparkles size={12} />
                          Mood Match
                        </motion.div>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea 
                        value={item.tip}
                        onChange={(e) => handleEditChange(idx, 'tip', e.target.value)}
                        className="w-full bg-transparent text-xs text-white/40 leading-relaxed italic font-medium outline-none border-b border-white/10 focus:border-[#ff4e00] resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-xs text-white/40 leading-relaxed italic font-medium group-hover:text-white/60 transition-colors">
                        {item.tip}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <motion.button 
                      whileHover={{ scale: 1.1, x: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => completeSession(item.activity)}
                      disabled={loading}
                      className="w-14 h-14 bg-white/5 hover:bg-[#ff4e00] text-white/20 hover:text-white rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-[#ff4e00] shadow-2xl relative z-10"
                      title={t.completeSession}
                    >
                      <CheckCircle2 size={24} />
                    </motion.button>
                  )}
                </Reorder.Item>
              ))}
              {isEditing && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={addRow}
                  className="w-full py-8 border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center gap-4 hover:border-[#ff4e00]/40 hover:bg-[#ff4e00]/5 transition-all group"
                >
                  <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-[#ff4e00]/20 transition-all">
                    <Plus size={24} className="text-white/20 group-hover:text-[#ff4e00]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-white/60">{t.addBlock}</span>
                </motion.button>
              )}
            </Reorder.Group>
          ) : (
            <div className="text-center py-32 opacity-20 italic">
              <p className="text-sm tracking-[0.5em] uppercase font-black">Awaiting Configuration</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>

    <AnimatePresence>
      {showSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-surface w-full max-w-2xl rounded-[40px] p-10 space-y-8 border border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-display uppercase tracking-tighter text-[#ff4e00]">{t.uploadSyllabus}</h3>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Tailor your focus path</p>
              </div>
              <button onClick={() => setShowSyllabusModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">{t.studyMode}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setStudyMode('exam')}
                    className={`p-6 rounded-3xl border transition-all text-left group ${studyMode === 'exam' ? 'bg-[#ff4e00]/20 border-[#ff4e00] shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <h4 className="font-bold text-sm mb-2 group-hover:text-[#ff4e00] transition-colors">Exam Focus</h4>
                    <p className="text-[10px] opacity-50 leading-relaxed">{t.examFocus}</p>
                  </button>
                  <button 
                    onClick={() => setStudyMode('mastery')}
                    className={`p-6 rounded-3xl border transition-all text-left group ${studyMode === 'mastery' ? 'bg-purple-500/20 border-purple-500 shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <h4 className="font-bold text-sm mb-2 group-hover:text-purple-400 transition-colors">Mastery Mode</h4>
                    <p className="text-[10px] opacity-50 leading-relaxed">{t.masteryMode}</p>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">{t.syllabusText}</label>
                <textarea 
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste your syllabus here for AI analysis..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white outline-none focus:border-[#ff4e00] transition-all min-h-[200px] resize-none"
                />
              </div>
            </div>

            <button 
              onClick={() => {
                fetchTimetable();
                setShowSyllabusModal(false);
              }}
              className="w-full py-5 bg-gradient-to-r from-[#ff4e00] to-[#f27d26] text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl glow-orange hover:scale-[1.02] transition-all"
            >
              {t.saveAndRegenerate}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Reminders Section */}
    <div className="glass-surface rounded-[40px] p-10 border border-white/10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-2xl">
            <Bell className="text-blue-500" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{t.reminders}</h3>
            <p className="text-xs opacity-40">{t.upcomingReminders}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddReminder(true)}
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reminders.map((reminder) => (
          <motion.div 
            key={reminder.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${
              reminder.active ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-40'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${reminder.active ? 'bg-blue-500/20 text-blue-500' : 'bg-white/5 text-gray-500'}`}>
                {reminder.active ? <Bell size={18} /> : <BellOff size={18} />}
              </div>
              <div>
                <h4 className="font-bold text-sm">{reminder.subject}</h4>
                {reminder.topic && <p className="text-[10px] text-[#ff4e00] font-bold uppercase tracking-widest mb-1">{reminder.topic}</p>}
                <div className="flex items-center gap-2">
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{reminder.time}</p>
                  {reminder.days && reminder.days.length > 0 && (
                    <span className="text-[10px] opacity-20 uppercase tracking-widest">• {reminder.days.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleReminder(reminder.id, reminder.active)}
                className="p-2 hover:bg-white/5 rounded-lg transition-all"
              >
                <RefreshCw size={14} className={reminder.active ? 'text-blue-400' : 'opacity-40'} />
              </button>
              <button 
                onClick={() => deleteReminder(reminder.id)}
                className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
        {reminders.length === 0 && (
          <div className="col-span-full py-8 text-center opacity-20 italic text-xs">
            {t.noData}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-surface w-full max-w-md rounded-[40px] p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">{t.setReminder}</h3>
                <button onClick={() => setShowAddReminder(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">
                    {t.addSubject}
                  </label>
                  <select 
                    value={newReminder.subject}
                    onChange={(e) => setNewReminder({ ...newReminder, subject: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-[#ff4e00]"
                  >
                    <option value="" className="bg-[#0a0502]">Select Subject...</option>
                    {subjects.map(s => (
                      <option key={s} value={s} className="bg-[#0a0502]">{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">
                    Topic / Specific Concept
                  </label>
                  <input 
                    type="text"
                    value={newReminder.topic}
                    onChange={(e) => setNewReminder({ ...newReminder, topic: e.target.value })}
                    placeholder="e.g. Calculus Integration"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-[#ff4e00] text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">
                    Time
                  </label>
                  <input 
                    type="time"
                    value={newReminder.time}
                    onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-[#ff4e00]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2 block">
                    Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <button
                        key={day}
                        onClick={() => {
                          const days = newReminder.days.includes(day)
                            ? newReminder.days.filter(d => d !== day)
                            : [...newReminder.days, day];
                          setNewReminder({ ...newReminder, days });
                        }}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          newReminder.days.includes(day)
                            ? 'bg-[#ff4e00] border-[#ff4e00] text-white'
                            : 'bg-white/5 border-white/10 opacity-40 hover:opacity-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAddReminder}
                disabled={!newReminder.subject}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-[#ff4e00] hover:text-white transition-all disabled:opacity-10"
              >
                {t.save}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

