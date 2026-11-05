export type EnglishLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type PersonaId = 'elena' | 'marcus' | 'sam' | 'arthur' | 'aarav';

export interface Persona {
  id: PersonaId;
  name: string;
  title: string;
  avatar: string;
  badge: string;
  accent: 'US' | 'UK' | 'AU';
  description: string;
  personality: string;
  isHinglish?: boolean;
}

export interface Flashcard {
  id: string;
  phrase: string;
  ipa?: string;
  meaning: string;
  hinglishMeaning: string;
  example: string;
  category?: string;
}

export interface ChatFeedback {
  grammarCorrection?: {
    hasIssue: boolean;
    originalPhrase?: string;
    correctedPhrase?: string;
    explanation?: string;
    hinglishExplanation?: string;
  };
  vocabularyUpgrade?: {
    originalWord?: string;
    upgrade?: string;
    exampleSentence?: string;
    hinglishTip?: string;
  };
  keyPronunciationWords?: string[];
  followUpSuggestions?: string[];
  fluencyScore?: number;
  hinglishTip?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: ChatFeedback;
}

export interface SyllableFeedback {
  syllable: string;
  phonetic: string;
  stressed: boolean;
  accuracy: number;
  feedback?: string;
}

export interface PhonemeTip {
  sound: string;
  status: 'good' | 'needs_work' | 'excellent';
  mouthPosition: string;
  advice?: string;
}

export interface PronunciationResult {
  overallScore: number;
  ipa: string;
  stressPattern: string;
  syllables: SyllableFeedback[];
  phonemeTips: PhonemeTip[];
  mistakeAnalysis?: string;
  tonguePlacementTip: string;
  encouragement: string;
}

export interface SimulationGoal {
  id: string;
  text: string;
  completed: boolean;
}

export interface SimulationScenario {
  id: string;
  title: string;
  category: 'daily' | 'work' | 'travel' | 'social';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  roleAi: string;
  roleUser: string;
  avatar: string;
  icon: string;
  initialGreeting: string;
  goals: SimulationGoal[];
  samplePrompts: string[];
}

export interface SimulationEvaluation {
  overallScore: number;
  grade: string;
  fluencyRating: number;
  vocabularyRating: number;
  politenessRating: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  nativePhrasesToRemember: Array<{
    phrase: string;
    meaning: string;
  }>;
}

export interface UserStats {
  streakDays: number;
  totalWordsSpoken: number;
  practiceMinutes: number;
  averagePronunciation: number;
  sessionsCompleted: number;
  savedPhrases: string[];
}
