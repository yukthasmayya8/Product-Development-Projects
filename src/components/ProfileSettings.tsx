import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, BookOpen, Save, Sparkles, Brain, Smartphone } from 'lucide-react';
import { db, doc, setDoc, handleFirestoreError, OperationType } from '../firebase';
import { translations } from '../lib/translations';

interface ProfileSettingsProps {
  userId: string;
  userData: any;
  onClose: () => void;
  onUpdate: (newData: any) => void;
  language?: string;
}

export default function ProfileSettings({ userId, userData, onClose, onUpdate, language = 'English' }: ProfileSettingsProps) {
  const [subjects, setSubjects] = useState<string[]>(userData?.subjects || []);
  const [syllabus, setSyllabus] = useState<Record<string, string>>(userData?.syllabus || {});
  const [newSubject, setNewSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const t = translations[language] || translations.English;

  const handleAddSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
    const newSyllabus = { ...syllabus };
    delete newSyllabus[subject];
    setSyllabus(newSyllabus);
  };

  const handleSyllabusChange = (subject: string, value: string) => {
    setSyllabus({ ...syllabus, [subject]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newData = {
        ...userData,
        subjects,
        syllabus,
        lastUpdated: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userId), newData, { merge: true });
      onUpdate(newData);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0a0502] border border-white/10 rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#ff4e00]/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ff4e00] rounded-2xl text-white shadow-[0_0_20px_rgba(255,78,0,0.3)]">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-display uppercase tracking-tighter">{t.refinePath}</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">{t.updateSyllabus}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} className="opacity-40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Subjects Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <BookOpen size={18} className="text-[#ff4e00]" />
              <h3 className="text-sm font-bold uppercase tracking-widest">{t.activeSubjects}</h3>
            </div>
            
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder={t.domainName}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-[#ff4e00] transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
              />
              <button
                onClick={handleAddSubject}
                className="px-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                {t.addSubject}
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {subjects.map(subject => (
                <div key={subject} className="flex items-center gap-3 px-5 py-3 bg-[#ff4e00]/10 border border-[#ff4e00]/20 rounded-2xl group">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#ff4e00]">{subject}</span>
                  <button onClick={() => handleRemoveSubject(subject)} className="opacity-40 hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Syllabus Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Brain size={18} className="text-[#ff4e00]" />
              <h3 className="text-sm font-bold uppercase tracking-widest">{t.detailedSyllabus}</h3>
            </div>
            
            <div className="space-y-6">
              {subjects.map(subject => (
                <div key={subject} className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">{subject}</label>
                  <textarea
                    value={syllabus[subject] || ''}
                    onChange={(e) => handleSyllabusChange(subject, e.target.value)}
                    placeholder={`Enter topics for ${subject}...`}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm outline-none focus:border-[#ff4e00] transition-colors resize-none"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Mindset Note */}
          <div className="p-8 bg-[#ff4e00]/5 border border-[#ff4e00]/10 rounded-[40px] flex items-start gap-6">
            <div className="p-3 bg-[#ff4e00]/10 rounded-2xl">
              <Smartphone size={20} className="text-[#ff4e00]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#ff4e00] mb-2">{t.realisticPlanning}</h4>
              <p className="text-[11px] leading-relaxed opacity-60 italic">
                "Your timetable will be automatically adjusted based on your recent screen usage and distraction patterns. 
                If you've been struggling with focus, we'll suggest shorter, more intense study blocks to prevent burnout."
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-white/2">
          <button
            onClick={onClose}
            className="px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-3 px-10 py-4 bg-[#ff4e00] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : (
              <>
                <Save size={16} />
                {t.saveAndRegenerate}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
