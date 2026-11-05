import React from 'react';
import {
  User,
  Award,
  Zap,
  Target,
  Clock,
  Volume2,
  Sliders,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Bookmark,
  Trash2,
  Download,
} from 'lucide-react';
import { UserStats, EnglishLevel } from '../types';
import { playChime } from '../utils/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ProfileTabProps {
  stats: UserStats;
  onUpdateStats: (updater: (prev: UserStats) => UserStats) => void;
  accent: 'US' | 'UK' | 'AU';
  onAccentChange: (accent: 'US' | 'UK' | 'AU') => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  userLevel: EnglishLevel;
  onUserLevelChange: (level: EnglishLevel) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  stats,
  onUpdateStats,
  accent,
  onAccentChange,
  speechRate,
  onSpeechRateChange,
  userLevel,
  onUserLevelChange,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleResetStats = () => {
    if (confirm('Are you sure you want to reset your practice stats?')) {
      playChime('tap');
      onUpdateStats(() => ({
        streakDays: 1,
        totalWordsSpoken: 0,
        practiceMinutes: 0,
        averagePronunciation: 85,
        sessionsCompleted: 0,
        savedPhrases: [],
      }));
    }
  };

  const handleRemovePhrase = (phraseToRemove: string) => {
    playChime('tap');
    onUpdateStats((prev) => ({
      ...prev,
      savedPhrases: prev.savedPhrases.filter((p) => p !== phraseToRemove),
    }));
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-6 overflow-y-auto">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-lg flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-md">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-3xl">
            🎓
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">English Learner</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
              {userLevel} Fluency
            </span>
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
              🔥 {stats.streakDays} Days
            </span>
          </div>
        </div>

        {/* PWA Direct install button if available */}
        {isInstallable && !isInstalled && (
          <button
            onClick={install}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1.5 shadow"
          >
            <Download size={13} /> Install PWA
          </button>
        )}
      </div>

      {/* Speaking Stats Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
          Your Speaking Analytics
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">{stats.totalWordsSpoken}</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Spoken Words</span>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Target size={20} />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">{stats.averagePronunciation}%</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Pronunciation</span>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">{stats.practiceMinutes} min</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Active Speaking</span>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award size={20} />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">{stats.sessionsCompleted}</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Scenarios Cleared</span>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Flashcard Vocabulary Bank */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Bookmark size={14} className="text-amber-400" />
            Saved Vocabulary Bank ({stats.savedPhrases?.length || 0})
          </h3>
          <span className="text-[10px] text-slate-400">Available in Flashcards</span>
        </div>

        {stats.savedPhrases && stats.savedPhrases.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
            {stats.savedPhrases.map((phrase, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200 flex items-center gap-2"
              >
                <span>{phrase}</span>
                <button
                  onClick={() => handleRemovePhrase(phrase)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                  title="Remove from saved phrases"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No saved phrases yet. Tap the bookmark icon on any flashcard or chat message to save!
          </p>
        )}
      </div>

      {/* Voice & App Settings */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-4 space-y-4 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Sliders size={14} className="text-indigo-400" /> Audio & Speech Preferences
        </h3>

        {/* Target Accent */}
        <div>
          <label className="text-xs text-slate-300 block mb-1.5 font-medium">Target English Accent</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'US' as const, label: '🇺🇸 American', desc: 'Standard General American' },
              { id: 'UK' as const, label: '🇬🇧 British', desc: 'Received Pronunciation (RP)' },
              { id: 'AU' as const, label: '🇦🇺 Australian', desc: 'Natural Strine / Sydney' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  playChime('tap');
                  onAccentChange(item.id);
                }}
                className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all ${
                  accent === item.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Playback Speed */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-300 font-medium">AI Voice Speed</span>
            <span className="font-bold text-indigo-400">{speechRate.toFixed(2)}x</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { rate: 0.8, label: 'Slow (0.8x)' },
              { rate: 1.0, label: 'Normal (1.0x)' },
              { rate: 1.2, label: 'Fast (1.2x)' },
            ].map((s) => (
              <button
                key={s.rate}
                onClick={() => {
                  playChime('tap');
                  onSpeechRateChange(s.rate);
                }}
                className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                  Math.abs(speechRate - s.rate) < 0.05
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Practice Level */}
        <div>
          <label className="text-xs text-slate-300 block mb-1.5 font-medium">Practice Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Beginner', 'Intermediate', 'Advanced'] as EnglishLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  playChime('tap');
                  onUserLevelChange(lvl);
                }}
                className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                  userLevel === lvl
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Stats */}
      <div className="pt-2">
        <button
          onClick={handleResetStats}
          className="w-full bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-800/50 text-xs text-slate-400 hover:text-rose-300 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all"
        >
          <RotateCcw size={13} /> Reset Practice Progress
        </button>
      </div>
    </div>
  );
};
