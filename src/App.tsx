import React, { useState, useEffect } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { TabType } from './components/AndroidBottomNav';
import { HomeTab } from './components/HomeTab';
import { ChatTab } from './components/ChatTab';
import { PronunciationTab } from './components/PronunciationTab';
import { SimulationsTab } from './components/SimulationsTab';
import { ProfileTab } from './components/ProfileTab';
import { UserStats, EnglishLevel, PersonaId } from './types';
import { playChime } from './utils/audio';

const STATS_STORAGE_KEY = 'talkflow_user_stats_v2';

const INITIAL_SAVED_PHRASES = [
  'Articulate',
  'Bite the bullet',
  'Hit the nail on the head',
  'Could I trouble you for...',
  'Break the ice',
  'Through thick and thin',
  'Catch-22',
  'Piece of cake',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);
  const [accent, setAccent] = useState<'US' | 'UK' | 'AU'>('US');
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [userLevel, setUserLevel] = useState<EnglishLevel>('Intermediate');
  const [pronounceTargetPhrase, setPronounceTargetPhrase] = useState<string>('');
  const [activeChatPersona, setActiveChatPersona] = useState<PersonaId>('elena');

  // Persisted User Stats
  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STATS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            savedPhrases:
              parsed.savedPhrases && parsed.savedPhrases.length > 0
                ? parsed.savedPhrases
                : INITIAL_SAVED_PHRASES,
          };
        }
      } catch (e) {
        console.warn('Could not load stats from localStorage', e);
      }
    }
    return {
      streakDays: 4,
      totalWordsSpoken: 284,
      practiceMinutes: 38,
      averagePronunciation: 89,
      sessionsCompleted: 5,
      savedPhrases: INITIAL_SAVED_PHRASES,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore storage errors
    }
  }, [stats]);

  const handleToggleSavePhrase = (phrase: string) => {
    const clean = phrase.trim();
    if (!clean) return;

    setStats((prev) => {
      const exists = prev.savedPhrases.some(
        (p) => p.toLowerCase() === clean.toLowerCase()
      );
      const updated = exists
        ? prev.savedPhrases.filter((p) => p.toLowerCase() !== clean.toLowerCase())
        : [clean, ...prev.savedPhrases];

      return {
        ...prev,
        savedPhrases: updated,
      };
    });
  };

  // Handle navigation with optional params
  const handleNavigate = (
    tab: TabType,
    extraState?: { customText?: string; focusWord?: string; persona?: PersonaId }
  ) => {
    if (extraState?.customText) {
      setPronounceTargetPhrase(extraState.customText);
    } else if (extraState?.focusWord) {
      setPronounceTargetPhrase(extraState.focusWord);
    }

    if (extraState?.persona) {
      setActiveChatPersona(extraState.persona);
    }

    setActiveTab(tab);
  };

  const handleNavigateToPronounce = (phrase: string) => {
    setPronounceTargetPhrase(phrase);
    setActiveTab('pronounce');
  };

  return (
    <AndroidFrame
      activeTab={activeTab}
      onTabChange={setActiveTab}
      streakDays={stats.streakDays}
      isFrameMode={isFrameMode}
      onToggleFrameMode={() => setIsFrameMode(!isFrameMode)}
    >
      {activeTab === 'home' && (
        <HomeTab
          stats={stats}
          onNavigate={handleNavigate}
          accent={accent}
          onToggleSavePhrase={handleToggleSavePhrase}
        />
      )}

      {activeTab === 'chat' && (
        <ChatTab
          initialPersona={activeChatPersona}
          stats={stats}
          onUpdateStats={setStats}
          onNavigateToPronounce={handleNavigateToPronounce}
          onToggleSavePhrase={handleToggleSavePhrase}
          accent={accent}
          speechRate={speechRate}
        />
      )}

      {activeTab === 'pronounce' && (
        <PronunciationTab
          initialPhrase={pronounceTargetPhrase}
          stats={stats}
          onUpdateStats={setStats}
          accent={accent}
          speechRate={speechRate}
        />
      )}

      {activeTab === 'simulations' && (
        <SimulationsTab
          stats={stats}
          onUpdateStats={setStats}
          accent={accent}
          speechRate={speechRate}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileTab
          stats={stats}
          onUpdateStats={setStats}
          accent={accent}
          onAccentChange={setAccent}
          speechRate={speechRate}
          onSpeechRateChange={setSpeechRate}
          userLevel={userLevel}
          onUserLevelChange={setUserLevel}
        />
      )}
    </AndroidFrame>
  );
}
