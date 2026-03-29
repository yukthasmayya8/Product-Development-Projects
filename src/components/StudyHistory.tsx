import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, Filter, Search, ChevronDown, ChevronUp, BookOpen, Trash2 } from 'lucide-react';
import { db, collection, query, where, orderBy, onSnapshot, handleFirestoreError, OperationType, deleteDoc, doc } from '../firebase';
import { translations } from '../lib/translations';
import { toast } from 'sonner';

interface StudyHistoryProps {
  userId: string;
  language?: string;
}

export default function StudyHistory({ userId, language = 'English' }: StudyHistoryProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const t = translations[language] || translations.English;

  useEffect(() => {
    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setSessions(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'studySessions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const subjects = Array.from(new Set(sessions.map(s => s.subject)));

  const filteredSessions = sessions.filter(s => {
    const matchesSubject = filterSubject === 'all' || s.subject === filterSubject;
    const sessionDate = s.timestamp;
    const matchesStart = !startDate || sessionDate >= new Date(startDate);
    const matchesEnd = !endDate || sessionDate <= new Date(new Date(endDate).setHours(23, 59, 59));
    return matchesSubject && matchesStart && matchesEnd;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'studySessions', id));
      toast.success('Session removed from history');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `studySessions/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#ff4e00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#ff4e00] to-purple-500">
            {t.detailedHistory}
          </h2>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Chronicle of Your Academic Journey</p>
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
        >
          <Filter size={16} className="text-[#ff4e00]" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-surface rounded-[32px] p-8 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-[9px] uppercase tracking-widest font-black opacity-30 ml-2">{t.filterBySubject}</label>
                <select 
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#ff4e00] transition-all"
                >
                  <option value="all">{t.allSubjects}</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] uppercase tracking-widest font-black opacity-30 ml-2">{t.startDate}</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#ff4e00] transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] uppercase tracking-widest font-black opacity-30 ml-2">{t.endDate}</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#ff4e00] transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <Search size={48} className="mx-auto mb-4" />
            <p className="text-xs uppercase tracking-widest font-bold">{t.noData}</p>
          </div>
        ) : (
          filteredSessions.map((session, index) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-surface rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-[#ff4e00]/10 rounded-2xl flex items-center justify-center text-[#ff4e00] border border-[#ff4e00]/20">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{session.subject}</h4>
                    <div className="flex items-center gap-4 opacity-40">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">
                          {session.timestamp?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">
                          {session.timestamp?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest font-black opacity-30 mb-1">{t.durationMinutes}</p>
                    <p className="text-xl font-display font-black text-[#ff4e00]">{session.durationMinutes} <span className="text-[10px] opacity-40 lowercase italic font-serif">{t.minutes}</span></p>
                  </div>
                  <button 
                    onClick={() => handleDelete(session.id)}
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                    aria-label="Delete session"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
