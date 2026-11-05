import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { PRONUNCIATION_DRILLS, PronunciationDrill } from '../data/pronunciationDrills';
import { PronunciationResult, UserStats } from '../types';
import { speakText, stopSpeaking, playChime } from '../utils/audio';
import { speechEngine } from '../utils/speech';
import { WaveformVisualizer } from './WaveformVisualizer';

interface PronunciationTabProps {
  initialPhrase?: string;
  stats: UserStats;
  onUpdateStats: (updater: (prev: UserStats) => UserStats) => void;
  accent: 'US' | 'UK' | 'AU';
  speechRate: number;
}

export const PronunciationTab: React.FC<PronunciationTabProps> = ({
  initialPhrase,
  stats,
  onUpdateStats,
  accent,
  speechRate,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedDrill, setSelectedDrill] = useState<PronunciationDrill>(PRONUNCIATION_DRILLS[0]);
  const [customText, setCustomText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [visualLevels, setVisualLevels] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);

  useEffect(() => {
    if (initialPhrase) {
      setCustomText(initialPhrase);
      setIsCustomMode(true);
      setResult(null);
      setTranscript('');
    }
  }, [initialPhrase]);

  const currentTargetText = isCustomMode ? customText || 'Practice makes perfect.' : selectedDrill.targetPhrase;

  const handleListenTarget = (slow = false) => {
    stopSpeaking();
    playChime('tap');
    speakText(currentTargetText, {
      accent,
      rate: slow ? 0.75 : speechRate,
    });
  };

  const startPronunciationCheck = () => {
    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
      setVisualLevels([]);
      return;
    }

    stopSpeaking();
    setResult(null);
    setTranscript('');
    playChime('tap');

    const started = speechEngine.startListening(
      {
        continuous: false,
        lang: 'en-US',
        onResult: (spoken, isFinal) => {
          setTranscript(spoken);
          if (isFinal && spoken.trim()) {
            submitForAnalysis(spoken);
          }
        },
        onError: (err) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
          setVisualLevels([]);
        },
        onEnd: () => {
          setIsListening(false);
          setVisualLevels([]);
        },
      },
      (levels) => {
        setVisualLevels(levels);
      }
    );

    if (started) {
      setIsListening(true);
    }
  };

  const submitForAnalysis = async (spokenTextToAnalyze: string) => {
    setIsListening(false);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/pronunciation-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetText: currentTargetText,
          spokenText: spokenTextToAnalyze,
          userLevel: 'Intermediate',
        }),
      });

      const data: PronunciationResult = await response.json();
      setResult(data);

      if (data.overallScore >= 85) {
        playChime('streak');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        playChime('success');
      }

      // Update user stats
      onUpdateStats((prev) => {
        const newTotalSpoken = prev.totalWordsSpoken + currentTargetText.split(/\s+/).length;
        const newAvg = Math.round((prev.averagePronunciation * 4 + data.overallScore) / 5);
        return {
          ...prev,
          totalWordsSpoken: newTotalSpoken,
          averagePronunciation: newAvg,
        };
      });
    } catch (err) {
      console.error('Failed to analyze pronunciation:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredDrills = PRONUNCIATION_DRILLS.filter(
    (d) => activeCategory === 'all' || d.category === activeCategory
  );

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded-full">
            🎙️ Real-Time Voice Lab
          </span>
          <h1 className="text-xl font-extrabold text-white mt-1">Pronunciation Studio</h1>
        </div>

        <button
          onClick={() => {
            setIsCustomMode(!isCustomMode);
            setResult(null);
            setTranscript('');
          }}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
            isCustomMode
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
          }`}
        >
          {isCustomMode ? '← Curated Drills' : '✏️ Custom Phrase'}
        </button>
      </div>

      {/* If Custom Mode: input box */}
      {isCustomMode ? (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 space-y-2 shadow-md">
          <label className="text-xs font-semibold text-slate-300 block">
            Enter ANY English phrase, sentence, or word to test:
          </label>
          <textarea
            rows={2}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g., Particularly comfortable with technology..."
            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-sm text-white placeholder-slate-500 rounded-xl p-3 outline-none resize-none"
          />
        </div>
      ) : (
        /* Category Pills */
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'All Drills' },
            { id: 'tricky_sounds', label: 'Tricky Sounds (/θ/, /ð/)' },
            { id: 'minimal_pairs', label: 'Minimal Pairs' },
            { id: 'tongue_twisters', label: 'Tongue Twisters' },
            { id: 'connected_speech', label: 'Connected Speech' },
            { id: 'idioms', label: 'Idioms' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                playChime('tap');
              }}
              className={`text-xs px-3 py-1.5 rounded-full font-medium shrink-0 transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Target Phrase Studio Card */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={13} />
            {isCustomMode ? 'Custom Challenge' : selectedDrill.title}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleListenTarget(true)}
              className="text-[11px] font-semibold bg-slate-700/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
              title="Listen in slow motion"
            >
              <Volume2 size={12} /> Slow (0.75x)
            </button>
            <button
              onClick={() => handleListenTarget(false)}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
              title="Listen native speed"
            >
              <Volume2 size={16} />
            </button>
          </div>
        </div>

        {/* Large Target Phrase */}
        <h2 className="text-xl font-bold text-white tracking-tight leading-snug my-2">
          "{currentTargetText}"
        </h2>

        {/* IPA Phonetics and Tip */}
        <div className="mt-2 space-y-2">
          {!isCustomMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
                {selectedDrill.ipa}
              </span>
              <span className="text-[11px] font-bold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md">
                Focus: {selectedDrill.focusSound}
              </span>
            </div>
          )}

          {!isCustomMode && selectedDrill.tip && (
            <div className="text-xs text-slate-300 bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 flex items-start gap-2">
              <Info size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{selectedDrill.tip}</span>
            </div>
          )}
        </div>

        {/* Real-time Waveform Area */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col items-center justify-center">
          <WaveformVisualizer levels={visualLevels} isActive={isListening} className="mb-2" />

          {/* Transcript feedback while speaking */}
          <div className="min-h-[28px] text-center px-4">
            {isListening ? (
              <span className="text-xs text-indigo-300 animate-pulse font-medium">
                {transcript ? `"${transcript}"` : 'Listening... Speak clearly now!'}
              </span>
            ) : transcript ? (
              <span className="text-xs text-slate-300 italic">
                Detected: <strong className="text-white">"{transcript}"</strong>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Tap the microphone below and read the phrase out loud
              </span>
            )}
          </div>

          {/* Action Mic Button */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={startPronunciationCheck}
              disabled={isAnalyzing}
              className={`px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white mic-active shadow-[0_0_25px_rgba(225,29,72,0.5)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{isListening ? 'Stop & Evaluate' : 'Tap to Record & Score'}</span>
            </button>

            {transcript && !isAnalyzing && (
              <button
                onClick={() => submitForAnalysis(transcript)}
                className="p-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all"
                title="Re-analyze this speech"
              >
                <RotateCcw size={18} />
              </button>
            )}
          </div>

          {isAnalyzing && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mt-3 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Phonetic AI is analyzing stress, IPA, and syllables...
            </div>
          )}
        </div>
      </div>

      {/* Pronunciation Feedback Diagnostic Results */}
      {result && (
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          {/* Top Score Banner */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Pronunciation Accuracy
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`text-3xl font-black ${
                    result.overallScore >= 85
                      ? 'text-emerald-400'
                      : result.overallScore >= 70
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {result.overallScore}%
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {result.overallScore >= 90
                    ? 'Native-like!'
                    : result.overallScore >= 75
                    ? 'Very Clear!'
                    : 'Good Effort!'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Stress & Rhythm</span>
              <span className="text-xs font-semibold text-indigo-300">{result.stressPattern}</span>
            </div>
          </div>

          {/* Syllable Breakdown */}
          {result.syllables && result.syllables.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Syllable & Stress Accuracy:
              </span>
              <div className="flex flex-wrap gap-2">
                {result.syllables.map((syl, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-3 py-2 border text-center transition-all ${
                      syl.accuracy >= 85
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : syl.accuracy >= 65
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 font-bold text-sm text-white">
                      <span>{syl.syllable}</span>
                      {syl.stressed && (
                        <span className="text-[9px] bg-indigo-500 text-white font-extrabold px-1 rounded">
                          STRESS
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono opacity-80">{syl.phonetic}</div>
                    <div className="text-[10px] font-semibold mt-0.5">{syl.accuracy}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tongue & Mouth Placement Physical Tip */}
          {result.tonguePlacementTip && (
            <div className="bg-indigo-950/40 border border-indigo-700/50 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Info size={14} /> Articulatory Placement Guide:
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{result.tonguePlacementTip}</p>
            </div>
          )}

          {/* Phoneme Specific Guidance */}
          {result.phonemeTips && result.phonemeTips.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Phoneme Tips:
              </span>
              {result.phonemeTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded">
                      {tip.sound}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tip.status === 'excellent' || tip.status === 'good'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {tip.status === 'excellent' ? 'Mastered' : 'Focus Area'}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">{tip.mouthPosition}</p>
                  {tip.advice && <p className="text-indigo-300/90 italic">{tip.advice}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Encouragement message */}
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle size={15} className="shrink-0 text-emerald-400" />
            <span>{result.encouragement}</span>
          </div>
        </div>
      )}

      {/* Drill Library Picker */}
      {!isCustomMode && (
        <div className="space-y-2.5 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Choose Another Drill ({filteredDrills.length})
          </h3>
          <div className="space-y-2">
            {filteredDrills.map((drill) => {
              const isCurrent = drill.id === selectedDrill.id;
              return (
                <div
                  key={drill.id}
                  onClick={() => {
                    playChime('tap');
                    setSelectedDrill(drill);
                    setResult(null);
                    setTranscript('');
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isCurrent
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{drill.title}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                        {drill.focusSound}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                      "{drill.targetPhrase}"
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={isCurrent ? 'text-emerald-400' : 'text-slate-500'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
