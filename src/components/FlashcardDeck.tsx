import React, { useState } from 'react';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCw,
  Sparkles,
  Mic,
  Bookmark,
  BookmarkCheck,
  Plus,
} from 'lucide-react';
import { Flashcard } from '../types';
import { speakText, playChime } from '../utils/audio';

interface FlashcardDeckProps {
  cards: Flashcard[];
  savedPhrases: string[];
  onToggleSavePhrase: (phrase: string) => void;
  onNavigateToPronounce: (phrase: string) => void;
  accent: 'US' | 'UK' | 'AU';
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  cards,
  savedPhrases,
  onToggleSavePhrase,
  onNavigateToPronounce,
  accent,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex] || cards[0];
  const isSaved = savedPhrases.some(
    (p) => p.toLowerCase().trim() === currentCard.phrase.toLowerCase().trim()
  );

  const handleFlip = () => {
    playChime('tap');
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    playChime('tap');
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    playChime('tap');
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    playChime('tap');
    setIsFlipped(false);
    const randomIndex = Math.floor(Math.random() * cards.length);
    setCurrentIndex(randomIndex);
  };

  const handleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSpeaking(true);
    playChime('tap');
    speakText(currentCard.phrase, {
      accent,
      rate: 0.9,
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime('streak');
    onToggleSavePhrase(currentCard.phrase);
  };

  return (
    <div className="w-full bg-slate-850/80 border border-slate-700/80 rounded-3xl p-4 shadow-xl space-y-3">
      {/* Deck Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950/70 border border-indigo-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={11} /> Vocabulary Flashcards
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            ({currentIndex + 1} / {cards.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleShuffle}
            title="Shuffle flashcards"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <Shuffle size={13} />
          </button>
          <button
            onClick={handleToggleBookmark}
            title={isSaved ? 'Saved in your favorites' : 'Save to favorites'}
            className={`p-1.5 rounded-lg transition-all ${
              isSaved
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="w-full h-56 cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
      >
        <div
          className="relative w-full h-full transition-transform duration-500 rounded-2xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT OF CARD */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 via-slate-850 to-indigo-950/80 border border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800/40">
                {currentCard.category || 'Vocabulary'}
              </span>
              <button
                onClick={handleListen}
                className={`p-2 rounded-full transition-all ${
                  isSpeaking
                    ? 'bg-indigo-500 text-white animate-pulse'
                    : 'bg-slate-700/80 hover:bg-indigo-600 text-slate-200 hover:text-white'
                }`}
                title="Listen pronunciation"
              >
                <Volume2 size={16} />
              </button>
            </div>

            <div className="text-center my-auto px-2">
              <h3 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                "{currentCard.phrase}"
              </h3>
              {currentCard.ipa && (
                <div className="text-xs font-mono text-emerald-400 mt-1">
                  {currentCard.ipa}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 group-hover:text-indigo-300">
              <RotateCw size={12} className="animate-spin-slow text-indigo-400" />
              <span>Tap card to flip & reveal meaning / Hinglish</span>
            </div>
          </div>

          {/* BACK OF CARD (REVEALED) */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-850 border border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg overflow-y-auto"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  ✨ Meaning & Hinglish
                </span>
                <span className="text-[11px] font-mono text-slate-400">{currentCard.ipa}</span>
              </div>

              {/* English Meaning */}
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                <strong className="text-white">Definition:</strong> {currentCard.meaning}
              </p>

              {/* Hinglish Explanation */}
              {currentCard.hinglishMeaning && (
                <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl p-2 mt-2 text-xs text-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                    🇮🇳 Hinglish Explanation:
                  </span>
                  <span>{currentCard.hinglishMeaning}</span>
                </div>
              )}

              {/* Example */}
              {currentCard.example && (
                <div className="text-[11px] text-slate-300 italic mt-1.5">
                  <span className="text-slate-400 not-italic font-bold">Ex: </span>
                  "{currentCard.example}"
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-700/60 mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToPronounce(currentCard.phrase);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow"
              >
                <Mic size={11} /> Practice Pronouncing
              </button>

              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <RotateCw size={10} /> Flip back
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all active:scale-95 border border-slate-700/60"
        >
          <ChevronLeft size={14} /> Prev Card
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-1">
          {cards.slice(0, 8).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex % 8 ? 'w-4 bg-indigo-400' : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm"
        >
          Next Card <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
