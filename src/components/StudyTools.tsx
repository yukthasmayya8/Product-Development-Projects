import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, CheckCircle2, X, ChevronRight, ChevronLeft, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { generateFlashcards, generateQuiz } from '../lib/gemini';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType, auth, query, where, getDocs, updateDoc, doc } from '../firebase';
import { translations } from '../lib/translations';
import { toast } from 'sonner';
import Skeleton from './Skeleton';

interface StudyToolsProps {
  userId: string;
  subjects: string[];
  language?: string;
}

export default function StudyTools({ userId, subjects, language = 'English' }: StudyToolsProps) {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz'>('flashcards');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; concept?: string }>({});
  
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [quiz, setQuiz] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [savedQuizzes, setSavedQuizzes] = useState<any[]>([]);
  const [reviewQuiz, setReviewQuiz] = useState<any | null>(null);

  const t = translations[language] || translations.English;

  useEffect(() => {
    fetchSavedQuizzes();
  }, [userId]);

  const fetchSavedQuizzes = async () => {
    try {
      const q = query(
        collection(db, 'quizzes'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      setSavedQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    } catch (error) {
      console.error('Error fetching saved quizzes:', error);
    }
  };

  const validateInputs = () => {
    const newErrors: { subject?: string; concept?: string } = {};
    if (!selectedSubject) newErrors.subject = 'Please select a subject';
    if (!concept.trim()) newErrors.concept = 'Please enter a concept';
    else if (concept.trim().length < 3) newErrors.concept = 'Concept must be at least 3 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateFlashcards = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    setFlashcards([]); // Clear previous results to show skeleton
    try {
      const cards = await generateFlashcards(selectedSubject, concept, language);
      setFlashcards(cards);
      setCurrentCardIdx(0);
      setIsFlipped(false);
      
      toast.success('Flashcards generated successfully!');

      // Save to Firestore
      for (const card of cards) {
        try {
          await addDoc(collection(db, 'flashcards'), {
            userId,
            subject: selectedSubject,
            concept: card.concept,
            explanation: card.explanation,
            timestamp: Timestamp.now()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'flashcards');
        }
      }
      
      // Increment goal progress for flashcards generated
      incrementGoalProgress('flashcards');

      // Check for "Subject Explorer" achievement (5 different subjects)
      const q = query(
        collection(db, 'flashcards'),
        where('userId', '==', auth.currentUser?.uid)
      );
      const snapshot = await getDocs(q);
      const uniqueSubjects = new Set(snapshot.docs.map(doc => doc.data().subject));
      if (uniqueSubjects.size >= 5) {
        checkAchievements('subject_master');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('Failed to generate flashcards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    setQuiz([]); // Clear previous results to show skeleton
    try {
      const questions = await generateQuiz(selectedSubject, concept, language);
      setQuiz(questions);
      setCurrentQuestionIdx(0);
      setScore(0);
      setQuizComplete(false);
      setSelectedOption(null);
      
      toast.success('Quiz generated successfully!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    setSelectedOption(option);
    const isCorrect = option === quiz[currentQuestionIdx].answer;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentQuestionIdx < quiz.length - 1) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
        setSelectedOption(null);
      } else {
        setQuizComplete(true);
        saveQuizResult();
        incrementGoalProgress('quiz');
        // Check for "Quiz Ace" achievement if perfect score
        if (score + (isCorrect ? 1 : 0) === quiz.length) {
          checkAchievements('quiz_ace');
        }
      }
    }, 1000);
  };

  const incrementGoalProgress = async (type: string) => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'studyGoals'),
        where('userId', '==', auth.currentUser.uid),
        where('type', '==', type)
      );
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(async (goalDoc) => {
        const data = goalDoc.data();
        await updateDoc(doc(db, 'studyGoals', goalDoc.id), {
          current: data.current + 1
        });
      });
    } catch (error) {
      console.error('Error incrementing goal progress:', error);
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

  const saveQuizResult = async () => {
    try {
      const newQuiz = {
        userId,
        subject: selectedSubject,
        concept,
        questions: quiz,
        score,
        timestamp: Timestamp.now()
      };
      await addDoc(collection(db, 'quizzes'), newQuiz);
      fetchSavedQuizzes(); // Refresh history
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quizzes');
    }
  };

  const handleShare = (type: 'flashcards' | 'quiz') => {
    const text = type === 'flashcards' 
      ? `I just mastered ${flashcards.length} flashcards on ${concept} in ${selectedSubject} using For The BetterYou! 🚀`
      : `I scored ${score}/${quiz.length} on a ${selectedSubject} quiz about ${concept}! Can you beat me? 🧠 #ForTheBetterYou`;
    
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Study Achievement',
        text: text,
        url: url,
      }).catch(console.error);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${text} ${url}`);
      toast.success('Achievement copied to clipboard!');
    }
  };

  return (
    <div className="glass-surface rounded-[40px] p-10">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
            <Brain size={20} className="text-[#ff4e00]" />
          </div>
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold opacity-40">{t.testKnowledge}</h3>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('flashcards')}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'flashcards' ? 'bg-[#ff4e00] text-white' : 'opacity-40 hover:opacity-100'}`}
          >
            {t.flashcards}
          </button>
          <button 
            onClick={() => setActiveTab('quiz')}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'quiz' ? 'bg-[#ff4e00] text-white' : 'opacity-40 hover:opacity-100'}`}
          >
            {t.quizzes}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <select 
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                if (errors.subject) setErrors({ ...errors, subject: undefined });
              }}
              className={`w-full bg-white/5 border ${errors.subject ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-[#ff4e00] appearance-none cursor-pointer`}
            >
              <option value="" className="bg-[#0a0502]">Select Subject</option>
              {subjects.map(s => <option key={s} value={s} className="bg-[#0a0502]">{s}</option>)}
            </select>
            {errors.subject && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} /> {errors.subject}</p>}
          </div>
          <div className="space-y-2">
            <input 
              type="text"
              value={concept}
              onChange={(e) => {
                setConcept(e.target.value);
                if (errors.concept) setErrors({ ...errors, concept: undefined });
              }}
              placeholder="Enter concept (e.g. Photosynthesis)"
              className={`w-full bg-white/5 border ${errors.concept ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:ring-1 focus:ring-[#ff4e00] text-white placeholder:opacity-20`}
            />
            {errors.concept && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} /> {errors.concept}</p>}
          </div>
        </div>

        <button 
          onClick={activeTab === 'flashcards' ? handleGenerateFlashcards : handleGenerateQuiz}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-20"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-[#ff4e00]" />}
          {activeTab === 'flashcards' ? t.memorize : t.testKnowledge}
        </button>

        <AnimatePresence mode="wait">
          {reviewQuiz ? (
            <motion.div
              key="review-quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setReviewQuiz(null)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                >
                  <ChevronLeft size={16} /> Back to History
                </button>
                <div className="text-right">
                  <h4 className="text-lg font-bold">{reviewQuiz.subject}</h4>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{reviewQuiz.concept}</p>
                </div>
              </div>

              <div className="glass-surface rounded-[32px] p-8 border border-white/10 space-y-8">
                <div className="flex justify-center">
                  <div className="px-6 py-2 bg-[#ff4e00]/10 border border-[#ff4e00]/20 rounded-full">
                    <span className="text-xs font-bold text-[#ff4e00]">Score: {reviewQuiz.score} / {reviewQuiz.questions.length}</span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {reviewQuiz.questions.map((q: any, idx: number) => (
                    <div key={idx} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-sm font-bold mb-4">{idx + 1}. {q.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string) => (
                          <div 
                            key={opt}
                            className={`p-3 rounded-xl text-xs ${opt === q.answer ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-white/5 opacity-40'}`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : loading && (
            <motion.div 
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <Skeleton className="h-64 w-full rounded-[32px]" />
              <div className="flex justify-between px-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </motion.div>
          )}

          {!loading && !reviewQuiz && activeTab === 'quiz' && quiz.length === 0 && savedQuizzes.length > 0 && (
            <motion.div
              key="quiz-history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 opacity-40">
                <Clock size={14} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Recent Quizzes</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {savedQuizzes.slice(0, 5).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setReviewQuiz(q)}
                    className="w-full glass-surface p-6 rounded-3xl border border-white/5 hover:border-[#ff4e00]/30 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <h5 className="text-sm font-bold mb-1 group-hover:text-[#ff4e00] transition-colors">{q.subject}</h5>
                      <p className="text-[10px] opacity-40 uppercase tracking-widest">{q.concept}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#ff4e00]">{q.score}/{q.questions.length}</p>
                      <p className="text-[8px] opacity-20 uppercase tracking-widest">{new Date(q.timestamp?.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {!loading && activeTab === 'flashcards' && flashcards.length > 0 && (
            <motion.div 
              key="flashcards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentCardIdx + 1) / flashcards.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-[#ff4e00] to-orange-400 shadow-[0_0_10px_rgba(255,78,0,0.5)]"
                />
              </div>

              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative h-64 w-full perspective-1000 cursor-pointer"
              >
                <motion.div 
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  className="w-full h-full relative preserve-3d"
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden glass-surface rounded-[32px] p-8 flex flex-col items-center justify-center text-center border border-white/10">
                    <span className="text-[8px] uppercase tracking-[0.4em] font-bold opacity-20 mb-4">Concept</span>
                    <h4 className="text-2xl font-bold tracking-tight">{flashcards[currentCardIdx].concept}</h4>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden glass-surface rounded-[32px] p-8 flex flex-col items-center justify-center text-center border border-[#ff4e00]/30 rotate-y-180 bg-[#ff4e00]/5">
                    <span className="text-[8px] uppercase tracking-[0.4em] font-bold opacity-20 mb-4">Explanation</span>
                    <p className="text-lg font-light leading-relaxed italic">{flashcards[currentCardIdx].explanation}</p>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center justify-between px-4">
                <button 
                  onClick={() => {
                    setCurrentCardIdx((prev) => (prev > 0 ? prev - 1 : prev));
                    setIsFlipped(false);
                  }}
                  disabled={currentCardIdx === 0}
                  className="p-3 bg-white/5 rounded-full disabled:opacity-10"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] font-bold opacity-40 tracking-widest">
                  {currentCardIdx + 1} / {flashcards.length}
                </span>
                <button 
                  onClick={() => {
                    const nextIdx = currentCardIdx + 1;
                    setCurrentCardIdx((prev) => (prev < flashcards.length - 1 ? prev + 1 : prev));
                    setIsFlipped(false);
                    if (nextIdx === flashcards.length) {
                      incrementGoalProgress('flashcards');
                    }
                  }}
                  disabled={currentCardIdx === flashcards.length - 1}
                  className="p-3 bg-white/5 rounded-full disabled:opacity-10"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {currentCardIdx === flashcards.length - 1 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center pt-4"
                >
                  <button 
                    onClick={() => handleShare('flashcards')}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-500/30 transition-all"
                  >
                    <Sparkles size={14} />
                    Share Progress
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {!loading && activeTab === 'quiz' && quiz.length > 0 && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIdx + (quizComplete ? 1 : 0)) / quiz.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                />
              </div>

              {!quizComplete ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold opacity-40 tracking-widest uppercase">Question {currentQuestionIdx + 1} / {quiz.length}</span>
                    <span className="text-[10px] font-bold text-[#ff4e00] tracking-widest uppercase">Score: {score}</span>
                  </div>
                  <div className="glass-surface rounded-[32px] p-8 border border-white/10">
                    <h4 className="text-xl font-bold tracking-tight mb-8">{quiz[currentQuestionIdx].question}</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {quiz[currentQuestionIdx].options.map((option: string) => (
                        <button
                          key={option}
                          onClick={() => !selectedOption && handleAnswer(option)}
                          className={`w-full p-4 rounded-2xl text-left text-sm font-medium transition-all border ${
                            selectedOption === option
                              ? option === quiz[currentQuestionIdx].answer
                                ? 'bg-green-500/20 border-green-500 text-green-500'
                                : 'bg-red-500/20 border-red-500 text-red-500'
                              : selectedOption && option === quiz[currentQuestionIdx].answer
                                ? 'bg-green-500/20 border-green-500 text-green-500'
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="glass-surface rounded-[32px] p-12 text-center border border-[#ff4e00]/30 bg-[#ff4e00]/5"
                >
                  <div className="w-20 h-20 bg-[#ff4e00] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-3xl font-bold tracking-tight mb-2">Quiz Complete!</h4>
                  <p className="text-lg opacity-60 mb-8">You scored {score} out of {quiz.length}</p>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={() => {
                        setQuiz([]);
                        setQuizComplete(false);
                      }}
                      className="px-8 py-3 bg-white text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-[#ff4e00] hover:text-white transition-all"
                    >
                      Try Another
                    </button>
                    <button 
                      onClick={() => handleShare('quiz')}
                      className="px-8 py-3 bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      Share Result
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
