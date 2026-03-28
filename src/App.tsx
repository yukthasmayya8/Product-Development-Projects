import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, LogIn, Plus, X, Sparkles, Brain, Clock, Calendar, Heart } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, onAuthStateChanged, db, doc, getDoc, setDoc, collection, query, where, orderBy, limit, onSnapshot, handleFirestoreError, OperationType, Timestamp } from './firebase';
import Layout from './components/Layout';
import Timer from './components/Timer';
import MoodTracker from './components/MoodTracker';
import MotivationDisplay from './components/MotivationDisplay';
import TimetableDisplay from './components/TimetableDisplay';
import HistoryChart from './components/HistoryChart';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [studyHistory, setStudyHistory] = useState<any[]>([]);
  const [currentMood, setCurrentMood] = useState<string>('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await fetchUserData(u.uid);
        subscribeToStudyHistory(u.uid);
      } else {
        setUser(null);
        setUserData(null);
        setStudyHistory([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setCurrentMood(userDoc.data().currentMood || '');
      } else {
        setIsSettingUp(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  const subscribeToStudyHistory = (uid: string) => {
    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudyHistory(history);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'studySessions');
    });
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSetupComplete = async (subjects: string[], pattern: string) => {
    if (!user) return;
    const data = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      subjects,
      studyPattern: pattern,
      currentMood: '',
      lastActive: Timestamp.now(),
    };
    try {
      await setDoc(doc(db, 'users', user.uid), data);
      setUserData(data);
      setIsSettingUp(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleMoodSelected = async (mood: string) => {
    if (!user) return;
    setCurrentMood(mood);
    try {
      await setDoc(doc(db, 'users', user.uid), { currentMood: mood }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
        <div className="w-12 h-12 border-4 border-[#5A5A40]/20 border-t-[#5A5A40] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4 font-serif">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl text-center border border-[#1a1a1a]/5"
        >
          <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl">
            <BookOpen size={40} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-[#1a1a1a]">For The BetterYou</h1>
          <p className="text-lg opacity-60 mb-12 leading-relaxed italic">
            Reclaim your focus. Escape digital noise. Build a better version of yourself through intentional study.
          </p>
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-[#1a1a1a] text-white py-4 rounded-2xl font-bold hover:bg-[#333] transition-all shadow-lg group"
          >
            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            Continue with Google
          </button>
          <p className="mt-8 text-xs uppercase tracking-[0.2em] opacity-30 font-sans font-bold">
            Secure • Private • AI-Powered
          </p>
        </motion.div>
      </div>
    );
  }

  if (isSettingUp) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  return (
    <Layout user={user}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Focus & Mood */}
        <div className="lg:col-span-4 space-y-8">
          <Timer 
            userId={user.uid} 
            subject={userData?.subjects?.[0] || 'General'} 
            onSessionComplete={() => {}} 
          />
          <MoodTracker userId={user.uid} onMoodSelected={handleMoodSelected} />
        </div>

        {/* Middle Column: Motivation & Timetable */}
        <div className="lg:col-span-5 space-y-8">
          <MotivationDisplay mood={currentMood} studyHistory={studyHistory} />
          <TimetableDisplay 
            userId={user.uid} 
            mood={currentMood} 
            subjects={userData?.subjects || []} 
            pattern={userData?.studyPattern || 'Balanced'} 
          />
        </div>

        {/* Right Column: Progress */}
        <div className="lg:col-span-3 space-y-8">
          <HistoryChart data={studyHistory} />
          
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#1a1a1a]/5">
            <h3 className="text-xs uppercase tracking-[0.2em] opacity-50 mb-4 font-sans font-bold">Focus Tips</h3>
            <ul className="space-y-4 text-sm italic opacity-70">
              <li className="flex gap-2">
                <Sparkles size={16} className="shrink-0 text-[#5A5A40]" />
                Leave your phone in another room.
              </li>
              <li className="flex gap-2">
                <Brain size={16} className="shrink-0 text-[#5A5A40]" />
                Take deep breaths before starting.
              </li>
              <li className="flex gap-2">
                <Clock size={16} className="shrink-0 text-[#5A5A40]" />
                Respect your breaks as much as your study time.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SetupScreen({ onComplete }: { onComplete: (subjects: string[], pattern: string) => void }) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [pattern, setPattern] = useState('Balanced');

  const addSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setNewSubject('');
    }
  };

  const removeSubject = (s: string) => {
    setSubjects(subjects.filter(item => item !== s));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4 font-serif">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[40px] p-12 shadow-2xl border border-[#1a1a1a]/5"
      >
        <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome to your new journey.</h2>
        <p className="text-lg opacity-50 mb-12 italic">Let's personalize your focus experience.</p>

        <div className="space-y-10">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] font-sans font-bold opacity-40 block mb-4">
              What are you studying?
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Mathematics, History..."
                className="flex-1 bg-[#f5f5f0] border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-[#5A5A40] outline-none"
              />
              <button 
                onClick={addSubject}
                className="bg-[#5A5A40] text-white px-6 rounded-2xl hover:scale-105 transition-transform"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <span key={s} className="bg-[#f5f5f0] px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  {s}
                  <button onClick={() => removeSubject(s)} className="opacity-40 hover:opacity-100"><X size={14} /></button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.2em] font-sans font-bold opacity-40 block mb-4">
              Preferred Study Pattern
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['Deep Work', 'Balanced', 'Light Study'].map(p => (
                <button
                  key={p}
                  onClick={() => setPattern(p)}
                  className={`py-4 rounded-2xl border-2 transition-all ${
                    pattern === p 
                      ? 'border-[#5A5A40] bg-[#5A5A40]/5 font-bold' 
                      : 'border-transparent bg-[#f5f5f0] opacity-60'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onComplete(subjects, pattern)}
            disabled={subjects.length === 0}
            className="w-full bg-[#1a1a1a] text-white py-5 rounded-2xl font-bold hover:bg-[#333] transition-all shadow-lg disabled:opacity-30"
          >
            Begin My Journey
          </button>
        </div>
      </motion.div>
    </div>
  );
}
