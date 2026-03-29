import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, LogIn, Plus, X, Sparkles, Brain, Clock, Calendar, Heart, Zap, Gamepad2, Smartphone, Award } from 'lucide-react';
import { auth, db, signInWithPopup, googleProvider, signOut, onAuthStateChanged, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, onSnapshot, Timestamp, addDoc } from 'firebase/firestore';
import { translations } from './lib/translations';
import Layout from './components/Layout';
import Timer from './components/Timer';
import MoodTracker from './components/MoodTracker';
import MotivationDisplay from './components/MotivationDisplay';
import TimetableDisplay from './components/TimetableDisplay';
import HistoryChart from './components/HistoryChart';
import StudyTools from './components/StudyTools';
import GeminiAssistant from './components/GeminiAssistant';
import DigitalBalance from './components/DigitalBalance';
import FocusAnalytics from './components/FocusAnalytics';
import DistractionLogger from './components/DistractionLogger';
import ProfileSettings from './components/ProfileSettings';
import MindGym from './components/MindGym';
import StudyHistory from './components/StudyHistory';
import { AchievementsAndGoals } from './components/AchievementsAndGoals';
import ErrorBoundary from './components/ErrorBoundary';
import Skeleton from './components/Skeleton';

import { ABTest } from './lib/abTesting';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [studyHistory, setStudyHistory] = useState<any[]>([]);
  const [screenTimeHistory, setScreenTimeHistory] = useState<any[]>([]);
  const [distractionLogs, setDistractionLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentScreenTime, setCurrentScreenTime] = useState<number>(0);
  const [currentMood, setCurrentMood] = useState<string>('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'history' | 'mindgym' | 'tools' | 'achievements'>('dashboard');

  const t = translations[userData?.preferredLanguage || 'English'] || translations.English;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      if (user) {
        fetchUserData(user.uid);
        subscribeToHistory(user.uid);
        subscribeToScreenTime(user.uid);
        subscribeToScreenTimeHistory(user.uid);
        subscribeToDistractionLogs(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        setIsSettingUp(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  const subscribeToHistory = (uid: string) => {
    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudyHistory(history);
      setIsLoadingHistory(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'studySessions');
      setIsLoadingHistory(false);
    });
  };

  const subscribeToScreenTime = (uid: string) => {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'screenTimeLogs', `${uid}_${today}`);
    
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentScreenTime(snapshot.data().screenTime);
      }
    }, (error) => {
      // It's fine if the doc doesn't exist yet
      if (error.message.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.GET, `screenTimeLogs/${uid}_${today}`);
      }
    });
  };

  const subscribeToScreenTimeHistory = (uid: string) => {
    const q = query(
      collection(db, 'screenTimeLogs'),
      where('userId', '==', uid),
      orderBy('date', 'desc'),
      limit(7)
    );

    return onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScreenTimeHistory(history);
    });
  };

  const subscribeToDistractionLogs = (uid: string) => {
    const q = query(
      collection(db, 'distractionLogs'),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDistractionLogs(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'distractionLogs');
    });
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleMoodSelected = async (mood: string) => {
    setCurrentMood(mood);
    if (user) {
      try {
        await addDoc(collection(db, 'moodLogs'), {
          userId: user.uid,
          mood,
          timestamp: Timestamp.now()
        });
        updateStreak();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'moodLogs');
      }
    }
  };

  const updateStreak = async () => {
    if (!user || !userData) return;
    const now = new Date();
    const lastStudy = userData.lastStudyDate ? new Date(userData.lastStudyDate.seconds * 1000) : null;
    
    let newStreak = userData.streak || 0;
    const isSameDay = lastStudy && 
      lastStudy.getDate() === now.getDate() && 
      lastStudy.getMonth() === now.getMonth() && 
      lastStudy.getFullYear() === now.getFullYear();

    if (isSameDay) return;

    const isYesterday = lastStudy && 
      new Date(now.getTime() - 86400000).getDate() === lastStudy.getDate();

    if (isYesterday || !lastStudy) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        streak: newStreak,
        lastStudyDate: Timestamp.now()
      });
      setUserData({ ...userData, streak: newStreak, lastStudyDate: Timestamp.now() });
      
      if (newStreak % 5 === 0) {
        sendNotification("Streak Milestone!", `You've reached a ${newStreak} day study streak! Keep it up!`);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, { body, icon: "/favicon.ico" });
        }
      });
    }
  };

  const handleSetupComplete = async (
    subjects: string[], 
    weakSubjects: string[], 
    strongSubjects: string[], 
    pattern: string, 
    duration: string,
    language: string
  ) => {
    if (!user) return;
    const data = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      subjects,
      weakSubjects,
      strongSubjects,
      studyPattern: pattern,
      timetableDuration: duration,
      preferredLanguage: language,
      currentMood: currentMood || '',
      streak: userData?.streak || 0,
      lastStudyDate: userData?.lastStudyDate || null,
      lastActive: Timestamp.now(),
    };
    try {
      await setDoc(doc(db, 'users', user.uid), data);
      setUserData(data);
      setIsSettingUp(false);
      setShowSettings(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // ... (rest of the component logic)

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0502] flex flex-col items-center justify-center p-4 font-serif overflow-hidden">
        <div className="atmosphere" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full glass-surface rounded-[60px] p-16 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff4e00]/10 to-transparent opacity-50" />
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 bg-[#ff4e00] rounded-full flex items-center justify-center text-white mx-auto mb-10 shadow-[0_0_50px_rgba(255,78,0,0.5)] relative z-10"
          >
            <BookOpen size={44} />
          </motion.div>
          
          <h1 className="text-6xl font-display uppercase tracking-tighter mb-6 text-white relative z-10">{translations.English.betterYou}</h1>
          <ABTest 
            experimentId="hero_quote"
            variants={{
              A: (
                <p className="text-xl font-light opacity-60 mb-16 leading-relaxed italic relative z-10 px-4">
                  "The secret of getting ahead is getting started."
                  <span className="block mt-4 text-[10px] uppercase tracking-[0.4em] font-bold not-italic opacity-40">— Mark Twain</span>
                </p>
              ),
              B: (
                <p className="text-xl font-light opacity-60 mb-16 leading-relaxed italic relative z-10 px-4">
                  "Focus on being productive instead of busy."
                  <span className="block mt-4 text-[10px] uppercase tracking-[0.4em] font-bold not-italic opacity-40">— Tim Ferriss</span>
                </p>
              )
            }}
          />
          
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-4 bg-white text-black py-5 rounded-3xl font-bold hover:bg-[#ff4e00] hover:text-white transition-all shadow-2xl group relative z-10"
          >
            <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
            <span className="text-lg uppercase tracking-widest">{translations.English.enterSanctuary}</span>
          </button>
          
          <div className="mt-12 flex justify-center gap-8 opacity-20 relative z-10">
            <Brain size={20} />
            <Sparkles size={20} />
            <Zap size={20} />
          </div>
        </motion.div>
      </div>
    );
  }

  if (isSettingUp) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  const todayStudyMinutes = studyHistory
    .filter(session => {
      const sessionDate = session.timestamp?.toDate().toISOString().split('T')[0];
      const todayDate = new Date().toISOString().split('T')[0];
      return sessionDate === todayDate;
    })
    .reduce((total, session) => total + (session.duration || 0), 0);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors closeButton />
      <Layout user={user} language={userData?.language}>
      <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-20 relative z-10">
        <div className="flex items-center gap-6 order-2 md:order-1">
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-[#ff4e00]/20 to-purple-500/10 rounded-[30px] border border-[#ff4e00]/30 text-[10px] uppercase tracking-[0.4em] font-black text-[#ff4e00] shadow-2xl glow-orange"
          >
            <Zap size={20} className="fill-[#ff4e00] animate-pulse" />
            <span className="text-white text-lg">{userData?.streak || 0}</span> {t.streak}
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfileSettings(true)}
            className="flex items-center gap-4 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-[30px] border border-white/10 text-[10px] uppercase tracking-[0.4em] font-black text-white/40 hover:text-white transition-all backdrop-blur-3xl shadow-2xl"
          >
            <BookOpen size={20} className="text-[#ff4e00]" />
            {t.editProfile}
          </motion.button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/5 p-2 rounded-[40px] border border-white/10 order-1 md:order-2 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
          {[
            { id: 'dashboard', label: t.frontPage, icon: Sparkles, color: 'from-[#ff4e00] to-[#f27d26]' },
            { id: 'analytics', label: t.analytics, icon: Clock, color: 'from-blue-600 to-blue-400' },
            { id: 'history', label: t.studyHistory, icon: Calendar, color: 'from-orange-600 to-orange-400' },
            { id: 'mindgym', label: t.mindGym, icon: Gamepad2, color: 'from-purple-600 to-purple-400' },
            { id: 'tools', label: t.tools, icon: Brain, color: 'from-green-600 to-green-400' },
            { id: 'achievements', label: t.achievements, icon: Award, color: 'from-yellow-600 to-yellow-400' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              aria-label={tab.label}
              aria-pressed={activeTab === tab.id}
              className={`flex items-center gap-3 px-8 py-4 rounded-[32px] text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group z-10
                ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'}
              `}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'opacity-40'} />
              <span className="hidden lg:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-tab-bg"
                  className={`absolute inset-0 rounded-[32px] bg-gradient-to-r ${tab.color} shadow-2xl glow-orange`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-4 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-[30px] border border-white/10 text-[10px] uppercase tracking-[0.4em] font-black text-white/40 hover:text-white transition-all order-3 backdrop-blur-3xl shadow-2xl"
        >
          <Plus size={20} className="text-[#ff4e00]" />
          {t.settings}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            <div className="lg:col-span-4 space-y-12">
              <Timer 
                userId={user.uid} 
                subject={userData?.subjects?.[0] || 'General'} 
                onSessionComplete={() => {}} 
                language={userData?.preferredLanguage}
              />
              <MoodTracker 
                userId={user.uid} 
                onMoodSelected={handleMoodSelected} 
                language={userData?.preferredLanguage}
              />
              <DistractionLogger 
                userId={user.uid} 
                language={userData?.preferredLanguage} 
              />
            </div>
            <div className="lg:col-span-8 space-y-10">
              <MotivationDisplay 
                mood={currentMood} 
                studyHistory={studyHistory} 
                language={userData?.preferredLanguage}
              />
              <TimetableDisplay 
                userId={user.uid} 
                mood={currentMood} 
                subjects={userData?.subjects || []} 
                weakSubjects={userData?.weakSubjects || []}
                strongSubjects={userData?.strongSubjects || []}
                duration={userData?.timetableDuration || 'daily'}
                pattern={userData?.studyPattern || 'Balanced'} 
                language={userData?.preferredLanguage}
                syllabus={userData?.syllabus || {}}
                distractionLogs={distractionLogs}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <DigitalBalance 
                userId={user.uid}
                studyMinutes={todayStudyMinutes}
                loggedScreenTime={currentScreenTime}
                language={userData?.preferredLanguage}
                onUpdate={setCurrentScreenTime}
                loading={isLoadingHistory}
              />
              <FocusAnalytics 
                studyData={studyHistory} 
                screenTimeData={screenTimeHistory} 
                distractionData={distractionLogs}
                language={userData?.preferredLanguage} 
                loading={isLoadingHistory}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StudyHistory userId={user.uid} language={userData?.preferredLanguage} />
          </motion.div>
        )}

        {activeTab === 'mindgym' && (
          <motion.div
            key="mindgym"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <MindGym userId={user.uid} language={userData?.preferredLanguage} />
          </motion.div>
        )}

        {activeTab === 'tools' && (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StudyTools 
              userId={user.uid} 
              subjects={userData?.subjects || []} 
              language={userData?.preferredLanguage} 
            />
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AchievementsAndGoals language={userData?.preferredLanguage} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileSettings && (
          <ProfileSettings 
            userId={user.uid}
            userData={userData}
            onClose={() => setShowProfileSettings(false)}
            onUpdate={(newData) => setUserData(newData)}
            language={userData?.preferredLanguage}
          />
        )}
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <SetupScreen 
                onComplete={handleSetupComplete} 
                initialData={{
                  subjects: userData?.subjects || [],
                  weakSubjects: userData?.weakSubjects || [],
                  strongSubjects: userData?.strongSubjects || [],
                  pattern: userData?.studyPattern || 'Balanced',
                  duration: userData?.timetableDuration || 'daily',
                  language: userData?.preferredLanguage || 'English'
                }}
                onCancel={() => setShowSettings(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GeminiAssistant language={userData?.preferredLanguage} />
    </Layout>
    </ErrorBoundary>
  );
}

function SetupScreen({ onComplete, initialData, onCancel }: { 
  onComplete: (subjects: string[], weak: string[], strong: string[], pattern: string, duration: string, language: string) => void,
  initialData?: { subjects: string[], weakSubjects: string[], strongSubjects: string[], pattern: string, duration: string, language: string },
  onCancel?: () => void
}) {
  const [subjects, setSubjects] = useState<string[]>(initialData?.subjects || []);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(initialData?.weakSubjects || []);
  const [strongSubjects, setStrongSubjects] = useState<string[]>(initialData?.strongSubjects || []);
  const [newSubject, setNewSubject] = useState('');
  const [pattern, setPattern] = useState(initialData?.pattern || 'Balanced');
  const [duration, setDuration] = useState(initialData?.duration || 'daily');
  const [language, setLanguage] = useState(initialData?.language || 'English');
  
  const t = translations[language] || translations.English;

  const addSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setNewSubject('');
    }
  };

  const removeSubject = (s: string) => {
    setSubjects(subjects.filter(item => item !== s));
    setWeakSubjects(weakSubjects.filter(item => item !== s));
    setStrongSubjects(strongSubjects.filter(item => item !== s));
  };

  const toggleWeak = (s: string) => {
    if (weakSubjects.includes(s)) {
      setWeakSubjects(weakSubjects.filter(item => item !== s));
    } else {
      setWeakSubjects([...weakSubjects, s]);
      setStrongSubjects(strongSubjects.filter(item => item !== s));
    }
  };

  const toggleStrong = (s: string) => {
    if (strongSubjects.includes(s)) {
      setStrongSubjects(strongSubjects.filter(item => item !== s));
    } else {
      setStrongSubjects([...strongSubjects, s]);
      setWeakSubjects(weakSubjects.filter(item => item !== s));
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a0502] flex items-center justify-center p-4 font-serif ${onCancel ? 'bg-transparent min-h-0 p-0' : ''}`}>
      {!onCancel && <div className="atmosphere" />}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full glass-surface rounded-[60px] p-12 relative overflow-hidden border border-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/5 to-transparent" />
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full transition-colors opacity-40 hover:opacity-100"
          >
            <X size={24} />
          </button>
        )}

        <h2 className="text-4xl font-display uppercase tracking-tighter mb-4">{t.initialisation}</h2>
        <p className="text-lg opacity-40 mb-12 italic">{t.configureParameters}</p>

        <div className="space-y-10 relative z-10">
          <div>
            <label className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold opacity-30 block mb-6">
              {t.academicDomains}
            </label>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder={t.domainName}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-[#ff4e00] outline-none text-white placeholder:opacity-20"
              />
              <button 
                onClick={addSubject}
                className="bg-[#ff4e00] text-white px-8 rounded-2xl hover:scale-105 transition-transform shadow-lg"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map(s => (
                <motion.div 
                  key={s} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest">{s}</span>
                    <button onClick={() => removeSubject(s)} className="opacity-30 hover:opacity-100 transition-opacity"><X size={14} /></button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleWeak(s)}
                      className={`flex-1 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all ${
                        weakSubjects.includes(s) ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 opacity-40 border border-transparent'
                      }`}
                    >
                      {t.weakSubjects}
                    </button>
                    <button 
                      onClick={() => toggleStrong(s)}
                      className={`flex-1 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all ${
                        strongSubjects.includes(s) ? 'bg-green-500/20 text-green-500 border border-green-500/50' : 'bg-white/5 opacity-40 border border-transparent'
                      }`}
                    >
                      {t.strongSubjects}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold opacity-30 block mb-6">
                {t.focusProtocol}
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'Deep Work', label: t.patterns.deep },
                  { id: 'Balanced', label: t.patterns.balanced },
                  { id: 'Light Study', label: t.patterns.light }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPattern(p.id)}
                    className={`py-3 px-4 rounded-xl border transition-all text-left text-[10px] font-bold uppercase tracking-widest ${
                      pattern === p.id 
                        ? 'border-[#ff4e00] bg-[#ff4e00]/10 text-[#ff4e00]' 
                        : 'border-white/5 bg-white/5 opacity-40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold opacity-30 block mb-6">
                {t.timetableDuration}
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'daily', label: t.daily },
                  { id: 'weekly', label: t.weekly },
                  { id: 'monthly', label: t.monthly }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDuration(d.id)}
                    className={`py-3 px-4 rounded-xl border transition-all text-left text-[10px] font-bold uppercase tracking-widest ${
                      duration === d.id 
                        ? 'border-[#ff4e00] bg-[#ff4e00]/10 text-[#ff4e00]' 
                        : 'border-white/5 bg-white/5 opacity-40'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold opacity-30 block mb-6">
                {t.preferredLanguage}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none text-white text-[10px] font-bold uppercase tracking-widest appearance-none cursor-pointer"
              >
                {[
                  { name: 'English', native: 'English' },
                  { name: 'Kannada', native: 'ಕನ್ನಡ' },
                  { name: 'Hindi', native: 'हिन्दी' }
                ].map(l => (
                  <option key={l.name} value={l.name} className="bg-[#0a0502]">
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => onComplete(subjects, weakSubjects, strongSubjects, pattern, duration, language)}
            disabled={subjects.length === 0}
            className="w-full bg-white text-black py-6 rounded-3xl font-bold uppercase tracking-[0.2em] hover:bg-[#ff4e00] hover:text-white transition-all shadow-2xl disabled:opacity-10 mt-4"
          >
            {t.synchronise}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

