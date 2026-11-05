import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Settings2,
  RotateCcw,
  BookOpen,
  Bookmark,
  Languages,
} from 'lucide-react';
import { ChatMessage, Persona, PersonaId, UserStats } from '../types';
import { PERSONAS } from '../data/personas';
import { speakText, stopSpeaking, playChime } from '../utils/audio';
import { speechEngine } from '../utils/speech';
import { WaveformVisualizer } from './WaveformVisualizer';
import { TabType } from './AndroidBottomNav';

interface ChatTabProps {
  initialPersona?: PersonaId;
  stats: UserStats;
  onUpdateStats: (updater: (prev: UserStats) => UserStats) => void;
  onNavigateToPronounce: (phrase: string) => void;
  onToggleSavePhrase: (phrase: string) => void;
  accent: 'US' | 'UK' | 'AU';
  speechRate: number;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  initialPersona,
  stats,
  onUpdateStats,
  onNavigateToPronounce,
  onToggleSavePhrase,
  accent,
  speechRate,
}) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<PersonaId>(initialPersona || 'elena');
  const [hinglishMode, setHinglishMode] = useState<boolean>(initialPersona === 'aarav');

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialPersona === 'aarav') {
      return [
        {
          id: 'init-aarav',
          role: 'assistant',
          content:
            "Namaste! Main hoon Aarav, aapka Hinglish English coach. English bolna seekhna ab bohot natural aur easy hoga. Bilkul hesitate mat kijiye, batayein aaj ka din kaisa raha?",
          timestamp: 'Just now',
          feedback: {
            fluencyScore: 100,
            hinglishTip: "Bindaas reply karein! English bolne mein hesitation sabse pehle khatam karni hai.",
            followUpSuggestions: [
              'Aaj ka din kaafi busy raha!',
              'I want to practice for a job interview.',
              'Tell me some popular English idioms!',
            ],
          },
        },
      ];
    }
    return [
      {
        id: 'init-1',
        role: 'assistant',
        content:
          "Hey there! It's so lovely to meet you. I'm Elena, your talkative English conversation buddy! How has your day been so far? Tell me something fun you did or are planning to do!",
        timestamp: 'Just now',
        feedback: {
          fluencyScore: 100,
          followUpSuggestions: [
            'My day has been pretty busy with work.',
            'I went for a relaxing morning walk in the park.',
            'Not much, just learning English with you!',
          ],
        },
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [visualLevels, setVisualLevels] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentPersona = PERSONAS.find((p) => p.id === selectedPersonaId) || PERSONAS[0];

  useEffect(() => {
    if (initialPersona && initialPersona !== selectedPersonaId) {
      setSelectedPersonaId(initialPersona);
      if (initialPersona === 'aarav') {
        setHinglishMode(true);
      }
    }
  }, [initialPersona]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
      return;
    }
    stopSpeaking();
    setCurrentlySpeakingId(msgId);
    speakText(text, {
      accent: currentPersona.accent || accent,
      rate: speechRate,
      onEnd: () => setCurrentlySpeakingId(null),
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend ?? inputMessage;
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
    }
    stopSpeaking();

    const userMsgId = 'user-' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage('');
    setIsLoading(true);
    playChime('tap');

    // Update stats: words spoken
    const wordsCount = trimmed.split(/\s+/).length;
    onUpdateStats((prev) => ({
      ...prev,
      totalWordsSpoken: prev.totalWordsSpoken + wordsCount,
      practiceMinutes: prev.practiceMinutes + 1,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newUserMsg],
          persona: selectedPersonaId,
          userMessage: trimmed,
          userLevel: 'Intermediate',
          hinglishMode: hinglishMode || selectedPersonaId === 'aarav',
        }),
      });

      const data = await response.json();
      const aiReplyText =
        data.replyText || "I enjoyed hearing that! What else would you like to chat about today?";

      const aiMsgId = 'ai-' + Date.now();
      const newAiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feedback: {
          grammarCorrection: data.grammarCorrection,
          vocabularyUpgrade: data.vocabularyUpgrade,
          keyPronunciationWords: data.keyPronunciationWords,
          followUpSuggestions: data.followUpSuggestions,
          hinglishTip: data.hinglishTip,
          fluencyScore: data.fluencyScore ?? 90,
        },
      };

      setMessages((prev) => [...prev, newAiMsg]);

      // Play success audio
      if (data.fluencyScore && data.fluencyScore >= 85) {
        playChime('success');
      }

      // Auto speak response
      if (autoSpeak) {
        setCurrentlySpeakingId(aiMsgId);
        speakText(aiReplyText, {
          accent: currentPersona.accent || accent,
          rate: speechRate,
          onEnd: () => setCurrentlySpeakingId(null),
        });
      }
    } catch (err) {
      console.error('Failed to get AI response:', err);
      const fallbackAiMsg: ChatMessage = {
        id: 'ai-err-' + Date.now(),
        role: 'assistant',
        content:
          "That's a wonderful thought! Keeping regular English conversations going is the best way to develop effortless fluency. What's on your mind next?",
        timestamp: 'Just now',
        feedback: {
          fluencyScore: 88,
          hinglishTip: "Practice karte rahein, daily consistency se confidence double ho jata hai!",
          followUpSuggestions: ['Tell me an interesting story.', 'Can we talk about your hobbies?'],
        },
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
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

  const handleResetChat = () => {
    stopSpeaking();
    const isAarav = selectedPersonaId === 'aarav';
    setMessages([
      {
        id: 'init-reset',
        role: 'assistant',
        content: isAarav
          ? "Namaste! Fresh conversation shuru karte hain. Aap kis topic pe practice karna chahte hain?"
          : `Hi! I'm ${currentPersona.name}. Let's have a fresh, lively chat in English! What topic shall we explore?`,
        timestamp: 'Just now',
        feedback: {
          fluencyScore: 100,
          hinglishTip: isAarav ? "Koi bhi daily topic choose karein — jaise food, travel, ya job!" : undefined,
          followUpSuggestions: [
            "Let's talk about travel and vacations.",
            'Can you help me practice for a job interview?',
            'Tell me some popular English slang!',
          ],
        },
      },
    ]);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
      {/* Top Bar with Persona Selector & Audio Controls */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between z-10">
        <button
          onClick={() => setShowPersonaModal(true)}
          className="flex items-center gap-2 hover:bg-slate-800/80 px-2 py-1 rounded-2xl transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-lg shadow-sm">
            {currentPersona.avatar}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">{currentPersona.name}</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  currentPersona.isHinglish
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {currentPersona.badge}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {currentPersona.isHinglish ? 'Bilingual Coach' : 'Talkative Coach'}
            </span>
          </div>
        </button>

        {/* Controls: Hinglish Mode Toggle & Sound */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              playChime('tap');
              setHinglishMode(!hinglishMode);
            }}
            title={hinglishMode ? 'Hinglish Mode ON (Hindi+English)' : 'Hinglish Mode OFF'}
            className={`px-2 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
              hinglishMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages size={12} />
            <span>{hinglishMode ? '🇮🇳 Hinglish' : 'English'}</span>
          </button>

          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            title={autoSpeak ? 'Auto-Voice Enabled' : 'Auto-Voice Muted'}
            className={`p-2 rounded-xl transition-all ${
              autoSpeak ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={handleResetChat}
            title="Start New Conversation"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const feedback = msg.feedback;

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}>
              <div
                className={`max-w-[85%] rounded-3xl p-4 shadow-md leading-relaxed text-sm ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-xs'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-indigo-200/70">
                    {isUser ? 'You' : currentPersona.name}
                  </span>
                  {!isUser && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          playChime('streak');
                          onToggleSavePhrase(msg.content.slice(0, 60));
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-amber-400 transition-colors"
                        title="Save to flashcards"
                      >
                        <Bookmark size={13} />
                      </button>
                      <button
                        onClick={() => handleSpeakMessage(msg.id, msg.content)}
                        className="p-1 rounded-full text-slate-400 hover:text-indigo-300 transition-colors"
                        title="Listen again"
                      >
                        <Volume2
                          size={14}
                          className={currentlySpeakingId === msg.id ? 'text-indigo-400 animate-bounce' : ''}
                        />
                      </button>
                    </div>
                  )}
                </div>

                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* Coaching Feedback Pill on Assistant Message */}
              {!isUser && feedback && (
                <div className="max-w-[85%] w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
                  {/* Fluency Score */}
                  {feedback.fluencyScore !== undefined && (
                    <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-400" /> Your Speaking Fluency:
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          feedback.fluencyScore >= 90
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {feedback.fluencyScore} / 100
                      </span>
                    </div>
                  )}

                  {/* Hinglish Coach Tip */}
                  {(feedback.hinglishTip || currentPersona.isHinglish) && (
                    <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-2.5 text-amber-200">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 mb-0.5">
                        <span>🇮🇳</span> Hinglish Coach Tip:
                      </div>
                      <p className="text-[11px] text-amber-200/95 leading-relaxed">
                        {feedback.hinglishTip || "Bahut accha sentence structure hai! Aise hi practice karte rahein."}
                      </p>
                    </div>
                  )}

                  {/* Grammar Correction */}
                  {feedback.grammarCorrection?.hasIssue && (
                    <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-2.5 text-amber-200">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 mb-1">
                        <AlertCircle size={13} /> Grammar Polish:
                      </div>
                      <div className="space-y-1 text-[11px]">
                        {feedback.grammarCorrection.originalPhrase && (
                          <div className="line-through text-slate-400">
                            {feedback.grammarCorrection.originalPhrase}
                          </div>
                        )}
                        <div className="font-semibold text-emerald-300">
                          ➜ {feedback.grammarCorrection.correctedPhrase}
                        </div>
                        {feedback.grammarCorrection.explanation && (
                          <div className="text-[10px] text-amber-300/80 italic mt-0.5">
                            {feedback.grammarCorrection.explanation}
                          </div>
                        )}
                        {feedback.grammarCorrection.hinglishExplanation && (
                          <div className="text-[10px] text-amber-200/90 font-medium mt-0.5">
                            🇮🇳 {feedback.grammarCorrection.hinglishExplanation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vocabulary Upgrade */}
                  {feedback.vocabularyUpgrade?.upgrade && (
                    <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-2.5 text-indigo-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-300">
                          <Lightbulb size={13} /> Vocabulary Upgrade:
                        </div>
                        <button
                          onClick={() => {
                            playChime('streak');
                            onToggleSavePhrase(feedback.vocabularyUpgrade?.upgrade || '');
                          }}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                        >
                          <Bookmark size={10} /> Save Flashcard
                        </button>
                      </div>
                      <div className="text-[11px]">
                        Say <span className="font-bold text-white uppercase bg-indigo-600/50 px-1 rounded">"{feedback.vocabularyUpgrade.upgrade}"</span> instead of "{feedback.vocabularyUpgrade.originalWord || 'common word'}"
                        {feedback.vocabularyUpgrade.exampleSentence && (
                          <p className="text-[10px] text-slate-300 mt-1 italic">
                            Example: "{feedback.vocabularyUpgrade.exampleSentence}"
                          </p>
                        )}
                        {feedback.vocabularyUpgrade.hinglishTip && (
                          <p className="text-[10px] text-amber-200/90 mt-1">
                            🇮🇳 {feedback.vocabularyUpgrade.hinglishTip}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Key Pronunciation Words (interactive chips + save to flashcard) */}
                  {feedback.keyPronunciationWords && feedback.keyPronunciationWords.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Practice Pronouncing or Save to Flashcards:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {feedback.keyPronunciationWords.map((word, idx) => (
                          <div key={idx} className="flex items-center rounded-lg overflow-hidden border border-slate-700">
                            <button
                              onClick={() => onNavigateToPronounce(word)}
                              className="bg-slate-800 hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 px-2 py-0.5 text-[11px] flex items-center gap-1 transition-all active:scale-95"
                            >
                              <Mic size={10} /> {word}
                            </button>
                            <button
                              onClick={() => {
                                playChime('streak');
                                onToggleSavePhrase(word);
                              }}
                              title="Save to flashcards"
                              className="bg-slate-750 hover:bg-amber-950 px-1.5 py-0.5 text-slate-400 hover:text-amber-400 border-l border-slate-700"
                            >
                              <Bookmark size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/60 w-fit px-4 py-2.5 rounded-full border border-slate-700 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            {currentPersona.name} is thinking and replying...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-ups Chips */}
      {messages.length > 0 && messages[messages.length - 1].feedback?.followUpSuggestions && !isLoading && (
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-800/60 bg-slate-950/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Try saying:</span>
          {messages[messages.length - 1].feedback?.followUpSuggestions?.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(sug)}
              className="bg-slate-800/90 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/80 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-full shrink-0 transition-all active:scale-95 text-left"
            >
              💬 "{sug}"
            </button>
          ))}
        </div>
      )}

      {/* Audio Waveform Meter while listening */}
      {isListening && (
        <div className="bg-indigo-950/60 border-t border-indigo-800/50 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs font-semibold text-indigo-300">Listening to your voice... Speak naturally!</span>
          </div>
          <WaveformVisualizer levels={visualLevels} isActive={isListening} />
        </div>
      )}

      {/* Bottom Input Controls */}
      <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center gap-2">
        {/* Big Animated Mic Button */}
        <button
          onClick={toggleMicListening}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
            isListening
              ? 'bg-rose-600 text-white mic-active shadow-[0_0_20px_rgba(225,29,72,0.6)]'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Text Input Field */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={
              isListening
                ? 'Transcribing speech...'
                : hinglishMode
                ? 'English ya Hinglish mein type ya speak karein...'
                : 'Type or tap mic to speak in English...'
            }
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-700/80 focus:border-indigo-500 text-sm text-white placeholder-slate-500 rounded-2xl px-4 py-3 outline-none transition-all"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            inputMessage.trim() && !isLoading
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-md'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send size={18} />
        </button>
      </div>

      {/* Persona Selection Modal */}
      {showPersonaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Choose Your English Partner</h3>
                <p className="text-xs text-slate-400">Select a personality tailored to your practice goals</p>
              </div>
              <button
                onClick={() => setShowPersonaModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {PERSONAS.map((p) => {
                const isSelected = p.id === selectedPersonaId;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      playChime('tap');
                      setSelectedPersonaId(p.id);
                      if (p.isHinglish) {
                        setHinglishMode(true);
                      }
                      setShowPersonaModal(false);
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: 'switch-' + Date.now(),
                          role: 'assistant',
                          content: p.isHinglish
                            ? `Namaste! Main hoon ${p.name}. English bolna ab bohot fun hoga. Bindaas conversation start karein!`
                            : `Hello! I'm ${p.name}. ${p.description} What would you like to practice today?`,
                          timestamp: 'Just now',
                          feedback: {
                            fluencyScore: 100,
                            hinglishTip: p.isHinglish ? "Daily thodi baat karein, hesitation khatam ho jayegi!" : undefined,
                            followUpSuggestions: [
                              'Can you introduce yourself?',
                              "Let's practice a real conversation!",
                            ],
                          },
                        },
                      ]);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center text-2xl shrink-0">
                      {p.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{p.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            p.isHinglish
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-700 text-indigo-300'
                          }`}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{p.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
