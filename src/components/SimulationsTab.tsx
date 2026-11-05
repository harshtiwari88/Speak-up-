import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Theater,
  CheckCircle2,
  Circle,
  Volume2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  ArrowLeft,
  Award,
  BookOpen,
  RotateCcw,
  Check,
} from 'lucide-react';
import { SCENARIOS } from '../data/scenarios';
import { SimulationScenario, SimulationGoal, SimulationEvaluation, UserStats } from '../types';
import { speakText, stopSpeaking, playChime } from '../utils/audio';
import { speechEngine } from '../utils/speech';
import { WaveformVisualizer } from './WaveformVisualizer';

interface SimulationsTabProps {
  stats: UserStats;
  onUpdateStats: (updater: (prev: UserStats) => UserStats) => void;
  accent: 'US' | 'UK' | 'AU';
  speechRate: number;
}

interface DialogueTurn {
  id: string;
  role: 'user' | 'ai';
  speaker: string;
  content: string;
  timestamp: string;
}

export const SimulationsTab: React.FC<SimulationsTabProps> = ({
  stats,
  onUpdateStats,
  accent,
  speechRate,
}) => {
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);
  const [goals, setGoals] = useState<SimulationGoal[]>([]);
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [visualLevels, setVisualLevels] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [coachingHint, setCoachingHint] = useState<string>('');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<SimulationEvaluation | null>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const dialogueEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dialogue, isLoading]);

  const handleStartScenario = (scenario: SimulationScenario) => {
    stopSpeaking();
    playChime('tap');
    setActiveScenario(scenario);
    setGoals(scenario.goals.map((g) => ({ ...g, completed: false })));
    setEvaluation(null);
    setShowEvalModal(false);
    setCoachingHint(`Welcome! Introduce yourself politely to begin.`);
    setSuggestedReplies(scenario.samplePrompts.slice(0, 2));

    const initialAiTurn: DialogueTurn = {
      id: 'init-scen',
      role: 'ai',
      speaker: scenario.roleAi,
      content: scenario.initialGreeting,
      timestamp: 'Just now',
    };
    setDialogue([initialAiTurn]);

    // Speak initial greeting
    speakText(scenario.initialGreeting, {
      accent,
      rate: speechRate,
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend ?? inputMessage;
    const trimmed = rawText.trim();
    if (!trimmed || !activeScenario || isLoading) return;

    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
    }
    stopSpeaking();

    const userTurn: DialogueTurn = {
      id: 'turn-user-' + Date.now(),
      role: 'user',
      speaker: activeScenario.roleUser,
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDialogue((prev) => [...prev, userTurn]);
    setInputMessage('');
    setIsLoading(true);
    playChime('tap');

    // Update words stats
    const wordsCount = trimmed.split(/\s+/).length;
    onUpdateStats((prev) => ({
      ...prev,
      totalWordsSpoken: prev.totalWordsSpoken + wordsCount,
      practiceMinutes: prev.practiceMinutes + 1,
    }));

    try {
      const response = await fetch('/api/simulation/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: {
            ...activeScenario,
            goals,
          },
          conversationHistory: [...dialogue, userTurn],
          userInput: trimmed,
        }),
      });

      const data = await response.json();

      // Check newly completed goals
      if (data.completedGoalIds && data.completedGoalIds.length > 0) {
        setGoals((prev) =>
          prev.map((g) => (data.completedGoalIds.includes(g.id) ? { ...g, completed: true } : g))
        );
        playChime('streak');
      }

      if (data.coachingHint) {
        setCoachingHint(data.coachingHint);
      }

      if (data.suggestedReplies) {
        setSuggestedReplies(data.suggestedReplies);
      }

      const aiReply = data.characterReply || "Understood! Let's proceed.";
      const aiTurn: DialogueTurn = {
        id: 'turn-ai-' + Date.now(),
        role: 'ai',
        speaker: activeScenario.roleAi,
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setDialogue((prev) => [...prev, aiTurn]);

      // Speak response
      speakText(aiReply, {
        accent,
        rate: speechRate,
      });

      if (data.isScenarioFinished) {
        handleEndScenario();
      }
    } catch (err) {
      console.error('Simulation turn error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndScenario = async () => {
    if (!activeScenario || dialogue.length === 0) return;
    setIsLoading(true);
    stopSpeaking();

    try {
      const response = await fetch('/api/simulation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: activeScenario,
          conversationHistory: dialogue,
        }),
      });

      const evalData: SimulationEvaluation = await response.json();
      setEvaluation(evalData);
      setShowEvalModal(true);

      playChime('streak');
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.5 },
      });

      onUpdateStats((prev) => ({
        ...prev,
        sessionsCompleted: prev.sessionsCompleted + 1,
      }));
    } catch (err) {
      console.error('Failed to evaluate simulation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMicListening = () => {
    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
      setVisualLevels([]);
      return;
    }

    stopSpeaking();
    playChime('tap');

    const started = speechEngine.startListening(
      {
        continuous: false,
        lang: 'en-US',
        onResult: (transcript, isFinal) => {
          setInputMessage(transcript);
          if (isFinal && transcript.trim()) {
            handleSendMessage(transcript);
          }
        },
        onError: (err) => {
          console.warn('Speech error:', err);
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

  const completedCount = goals.filter((g) => g.completed).length;

  // If in active simulation
  if (activeScenario) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
        {/* Simulation Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopSpeaking();
                setActiveScenario(null);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Back to Scenarios Catalog"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{activeScenario.title}</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 rounded">
                  {activeScenario.difficulty}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Playing as: <strong className="text-slate-200">{activeScenario.roleUser}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={handleEndScenario}
            disabled={dialogue.length < 2 || isLoading}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
              dialogue.length >= 2
                ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            End & Grade
          </button>
        </div>

        {/* Real-time Goals Progress Banner */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Goals:</span>
            <span className="font-bold text-emerald-400">
              {completedCount} / {goals.length} Achieved
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {goals.map((g) => (
              <div
                key={g.id}
                title={g.text}
                className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                  g.completed ? 'bg-emerald-500 text-slate-950 scale-110 shadow-sm' : 'bg-slate-700'
                }`}
              >
                {g.completed && <Check size={8} className="stroke-[3]" />}
              </div>
            ))}
          </div>
        </div>

        {/* Dialogue Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {dialogue.map((turn) => {
            const isUser = turn.role === 'user';
            return (
              <div
                key={turn.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[10px] font-semibold text-slate-400 px-1">
                  {isUser ? 'You' : turn.speaker}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-md text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-xs'
                  }`}
                >
                  <p>{turn.content}</p>
                </div>
                {!isUser && (
                  <button
                    onClick={() => speakText(turn.content, { accent, rate: speechRate })}
                    className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 px-1 transition-colors"
                  >
                    <Volume2 size={11} /> Replay voice
                  </button>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 w-fit px-3 py-2 rounded-full border border-slate-700 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {activeScenario.roleAi} is responding...
            </div>
          )}

          <div ref={dialogueEndRef} />
        </div>

        {/* In-Context Coaching Hint */}
        {coachingHint && !isLoading && (
          <div className="bg-indigo-950/40 border-t border-indigo-800/40 px-4 py-2 flex items-center gap-2 text-xs text-indigo-200">
            <Sparkles size={13} className="text-indigo-400 shrink-0" />
            <span className="line-clamp-1">{coachingHint}</span>
          </div>
        )}

        {/* Suggested Replies */}
        {suggestedReplies.length > 0 && !isLoading && (
          <div className="px-3 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-950/70 border-t border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Suggestions:</span>
            {suggestedReplies.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="bg-slate-800/90 hover:bg-indigo-600/30 border border-slate-700 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-full shrink-0 transition-all active:scale-95"
              >
                "{sug}"
              </button>
            ))}
          </div>
        )}

        {/* Audio Waveform Meter while listening */}
        {isListening && (
          <div className="bg-indigo-950/70 border-t border-indigo-800/50 px-4 py-1.5 flex items-center justify-between">
            <span className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Listening to your roleplay response...
            </span>
            <WaveformVisualizer levels={visualLevels} isActive={isListening} />
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={toggleMicListening}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-600 text-white mic-active'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
            title="Speak into microphone"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type or tap mic to answer in role..."
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 text-sm text-white placeholder-slate-500 rounded-2xl px-3.5 py-2.5 outline-none"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              inputMessage.trim() && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Evaluation Report Modal */}
        {showEvalModal && evaluation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="text-center border-b border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/40">
                  🎉 Simulation Report Card
                </span>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className="text-4xl font-black text-white">{evaluation.grade}</span>
                  <div className="text-left">
                    <div className="text-xl font-bold text-emerald-400">{evaluation.overallScore}%</div>
                    <div className="text-xs text-slate-400">Overall Mastery</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2 italic px-2">{evaluation.summary}</p>
              </div>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/80 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Fluency</span>
                  <span className="text-sm font-bold text-white">{evaluation.fluencyRating}%</span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Vocabulary</span>
                  <span className="text-sm font-bold text-white">{evaluation.vocabularyRating}%</span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Politeness</span>
                  <span className="text-sm font-bold text-white">{evaluation.politenessRating}%</span>
                </div>
              </div>

              {/* Strengths */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-3 text-xs space-y-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Highlights & Strengths:
                  </span>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                    {evaluation.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Native Phrases to Remember */}
              {evaluation.nativePhrasesToRemember && evaluation.nativePhrasesToRemember.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Native Phrases to Adopt:
                  </span>
                  {evaluation.nativePhrasesToRemember.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-xs">
                      <div className="font-semibold text-indigo-300">"{item.phrase}"</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.meaning}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowEvalModal(false);
                    handleStartScenario(activeScenario);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all"
                >
                  Retry Scenario
                </button>
                <button
                  onClick={() => {
                    setShowEvalModal(false);
                    setActiveScenario(null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all"
                >
                  Choose Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Catalog View
  const filteredScenarios = SCENARIOS.filter(
    (s) => categoryFilter === 'all' || s.category === categoryFilter
  );

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-6 overflow-y-auto">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/70 border border-amber-800/50 px-2 py-0.5 rounded-full">
          🎭 Real-World Roleplays
        </span>
        <h1 className="text-xl font-extrabold text-white mt-1">Conversation Simulations</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Immerse yourself in authentic situations with real-time objective tracking.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: 'All Scenarios' },
          { id: 'daily', label: '☕ Daily Life' },
          { id: 'work', label: '💼 Work & Interviews' },
          { id: 'travel', label: '✈️ Travel & Customs' },
          { id: 'social', label: '🥂 Social Mixers' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              playChime('tap');
              setCategoryFilter(cat.id);
            }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium shrink-0 transition-all ${
              categoryFilter === cat.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-3">
        {filteredScenarios.map((scenario) => (
          <div
            key={scenario.id}
            onClick={() => handleStartScenario(scenario)}
            className="bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 rounded-3xl p-4 transition-all cursor-pointer shadow-md group hover:bg-slate-800 active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                {scenario.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                    {scenario.title}
                  </h3>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      scenario.difficulty === 'Beginner'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {scenario.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {scenario.description}
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/60 pt-2">
                  <span>Role: <strong>{scenario.roleUser}</strong></span>
                  <span className="text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Start Simulation →
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
