import React, { useState } from 'react';
import {
  Volume2,
  ArrowRight,
  Zap,
  Target,
  Award,
  Mic,
  Sparkles,
  BookOpen,
  Plus,
  Bookmark,
} from 'lucide-react';
import { speakText, playChime } from '../utils/audio';
import { TabType } from './AndroidBottomNav';
import { UserStats } from '../types';
import { FlashcardDeck } from './FlashcardDeck';
import { PWAInstallBanner } from './PWAInstallBanner';
import { resolveFlashcards } from '../data/flashcards';

interface HomeTabProps {
  stats: UserStats;
  onNavigate: (tab: TabType, extraState?: any) => void;
  accent: 'US' | 'UK' | 'AU';
  onToggleSavePhrase: (phrase: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  stats,
  onNavigate,
  accent,
  onToggleSavePhrase,
}) => {
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newPhraseInput, setNewPhraseInput] = useState('');

  // Daily featured word
  const dailyWord = {
    word: 'Articulate',
    ipa: '/ɑːrˈtɪk.jə.lət/',
    type: 'adjective / verb',
    meaning: 'Having or showing the ability to speak fluently and coherently.',
    hinglish: 'Apni baat ko bohot saaf aur confident tareeqe se samjha paana.',
    sentence: 'She gave a very articulate explanation during the conference.',
  };

  const flashcards = resolveFlashcards(stats.savedPhrases);

  const handlePlayDailyWord = () => {
    setIsPlayingWord(true);
    playChime('tap');
    speakText(dailyWord.word, {
      accent,
      rate: 0.85,
      onEnd: () => setIsPlayingWord(false),
    });
  };

  const handlePracticeDailyWord = () => {
    playChime('tap');
    onNavigate('pronounce', { customText: dailyWord.sentence, focusWord: dailyWord.word });
  };

  const handleAddCustomPhrase = () => {
    const trimmed = newPhraseInput.trim();
    if (!trimmed) return;
    onToggleSavePhrase(trimmed);
    setNewPhraseInput('');
    setShowAddCardModal(false);
    playChime('streak');
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-6 overflow-y-auto">
      {/* 1. Welcome & Speaking Streak Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/60 via-indigo-950 to-slate-900 border border-indigo-700/40 rounded-3xl p-5 shadow-lg">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={12} /> TalkFlow Speaking Coach
            </span>
            <h1 className="text-xl font-extrabold text-white mt-1">Ready to practice English?</h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-amber-400">🔥 {stats.streakDays}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Day Streak</span>
          </div>
        </div>

        {/* Daily Speaking Progress Bar */}
        <div className="mt-4 pt-3 border-t border-indigo-800/40">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Daily Speaking Goal</span>
            <span className="text-indigo-300 font-bold">12 / 15 sentences</span>
          </div>
          <div className="w-full bg-slate-950/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-indigo-900/50">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: '80%' }}
            />
          </div>
        </div>
      </div>

      {/* 2. Direct PWA Download Banner in Dashboard */}
      <PWAInstallBanner />

      {/* 3. Quick Analytics Metrics */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
          <span className="text-indigo-400 mb-1"><Target size={16} /></span>
          <span className="text-lg font-bold text-white">{stats.averagePronunciation}%</span>
          <span className="text-[10px] text-slate-400">Avg Pronunciation</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
          <span className="text-emerald-400 mb-1"><Zap size={16} /></span>
          <span className="text-lg font-bold text-white">{stats.totalWordsSpoken}</span>
          <span className="text-[10px] text-slate-400">Words Spoken</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
          <span className="text-amber-400 mb-1"><Award size={16} /></span>
          <span className="text-lg font-bold text-white">{stats.practiceMinutes}m</span>
          <span className="text-[10px] text-slate-400">Speaking Time</span>
        </div>
      </div>

      {/* 4. Vocabulary Flashcards (Flip-to-Reveal Animation) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BookOpen size={13} className="text-indigo-400" />
            Saved Vocabulary Flashcards ({stats.savedPhrases?.length || 0} Saved)
          </h2>
          <button
            onClick={() => setShowAddCardModal(true)}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-slate-800 transition-all"
          >
            <Plus size={12} /> Add Phrase
          </button>
        </div>

        {/* 3D Flip Card Deck */}
        <FlashcardDeck
          cards={flashcards}
          savedPhrases={stats.savedPhrases || []}
          onToggleSavePhrase={onToggleSavePhrase}
          onNavigateToPronounce={(phrase) => onNavigate('pronounce', { customText: phrase })}
          accent={accent}
        />
      </div>

      {/* 5. Word of the Day Card */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-3xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            Word of the Day
          </span>
          <button
            onClick={handlePlayDailyWord}
            className={`p-2 rounded-full transition-all ${
              isPlayingWord
                ? 'bg-emerald-500 text-slate-950 scale-105'
                : 'bg-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Listen to native pronunciation"
          >
            <Volume2 size={16} />
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-bold text-white">{dailyWord.word}</h3>
          <span className="text-xs font-mono text-indigo-300">{dailyWord.ipa}</span>
        </div>
        <p className="text-xs text-slate-400 italic mb-2">{dailyWord.type}</p>
        <p className="text-xs text-slate-300 mb-1 leading-relaxed">{dailyWord.meaning}</p>
        <p className="text-xs text-amber-300/90 mb-2 italic">🇮🇳 Hinglish: {dailyWord.hinglish}</p>

        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 text-xs text-slate-300">
          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Example:</span>
          "{dailyWord.sentence}"
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handlePracticeDailyWord}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Mic size={14} /> Practice Pronunciation
          </button>
          <button
            onClick={() => {
              playChime('streak');
              onToggleSavePhrase(dailyWord.word);
            }}
            className="p-2 bg-slate-700/80 hover:bg-slate-700 text-amber-400 rounded-xl transition-all"
            title="Save to flashcards"
          >
            <Bookmark size={16} />
          </button>
        </div>
      </div>

      {/* 6. Recommended Speaking Modes */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Recommended Speaking Modes
        </h2>

        {/* 1. Hinglish Coach (Aarav Sharma) */}
        <div
          onClick={() => onNavigate('chat', { persona: 'aarav' })}
          className="bg-gradient-to-r from-slate-800/90 via-amber-950/40 to-slate-900 border border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer group transition-all active:scale-[0.98] shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl text-amber-400">
              🇮🇳
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Aarav Sharma (Hinglish Coach)
                </h4>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                  Hinglish 🇮🇳
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Bilingual English+Hindi practice — no hesitation, pure confidence!
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-all" />
        </div>

        {/* 2. Talkative AI Companion */}
        <div
          onClick={() => onNavigate('chat')}
          className="bg-gradient-to-r from-slate-800/90 to-indigo-950/60 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer group transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xl text-indigo-400">
              💬
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Talkative AI Companion
                </h4>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.2 rounded-full">
                  Elena
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time vocal conversation & immediate grammar coaching
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>

        {/* 3. Real-Time Pronunciation Lab */}
        <div
          onClick={() => onNavigate('pronounce')}
          className="bg-gradient-to-r from-slate-800/90 to-emerald-950/60 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer group transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-xl text-emerald-400">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Phonetics & Voice Lab
                </h4>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full">
                  IPA & Audio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Syllable stress, tongue positioning, and minimal pairs
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Add Custom Phrase Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Save Phrase to Flashcards</h3>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter any new English word, idiom, or sentence you want to review and practice.
            </p>

            <input
              type="text"
              value={newPhraseInput}
              onChange={(e) => setNewPhraseInput(e.target.value)}
              placeholder="e.g. Break a leg, Serendipity..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustomPhrase();
              }}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-sm text-white rounded-xl px-3.5 py-2.5 outline-none"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddCardModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomPhrase}
                disabled={!newPhraseInput.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow"
              >
                Save Flashcard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
