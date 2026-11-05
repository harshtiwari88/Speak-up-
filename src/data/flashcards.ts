import { Flashcard } from '../types';

export const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    phrase: 'Articulate',
    ipa: '/ɑːrˈtɪk.jə.lət/',
    meaning: 'Able to express ideas clearly, fluently, and effectively in speech or writing.',
    hinglishMeaning: 'Apni baat ko bohot saaf aur acche tareeqe se explain kar paana.',
    example: 'She gave an articulate speech that impressed everyone in the boardroom.',
    category: 'Advanced Vocab',
  },
  {
    id: 'fc-2',
    phrase: 'Bite the bullet',
    ipa: '/baɪt ðə ˈbʊl.ɪt/',
    meaning: 'To face a painful or difficult situation with courage and determination.',
    hinglishMeaning: 'Kisi mushkil ya unpleasant kaam ko himmat karke face karna aur khatam karna.',
    example: 'I decided to bite the bullet and have the tough conversation with my manager.',
    category: 'Everyday Idiom',
  },
  {
    id: 'fc-3',
    phrase: 'Hit the nail on the head',
    ipa: '/hɪt ðə neɪl ɑːn ðə hɛd/',
    meaning: 'To describe exactly what is causing a situation or say something completely true.',
    hinglishMeaning: 'Bilkul sahi baat bolna ya problem ki exact root cause pe ungli rakhna.',
    example: 'Your analysis of the sales drop hit the nail right on the head.',
    category: 'Workplace Idiom',
  },
  {
    id: 'fc-4',
    phrase: 'Could I trouble you for...',
    ipa: '/kʊd aɪ ˈtrʌb.əl juː fɔːr/',
    meaning: 'An extremely polite and courteous way to ask for assistance or a small favor.',
    hinglishMeaning: 'Bohot hi respectful tareeqa kisi se help ya request karne ka (polite request).',
    example: 'Could I trouble you for a glass of water, please?',
    category: 'Polite Speech',
  },
  {
    id: 'fc-5',
    phrase: 'Break the ice',
    ipa: '/breɪk ðə aɪs/',
    meaning: 'To make people feel more relaxed and comfortable in a social setting or meeting.',
    hinglishMeaning: 'Shuruwaat ki jhijhak (hesitation) todna taaki log aasaani se baat kar sakein.',
    example: 'He told a lighthearted joke at the start of the meeting to break the ice.',
    category: 'Social Conversations',
  },
  {
    id: 'fc-6',
    phrase: 'Through thick and thin',
    ipa: '/θruː θɪk ænd θɪn/',
    meaning: 'Under all conditions, no matter how difficult or challenging circumstances become.',
    hinglishMeaning: 'Har acche aur bure waqt mein saath nibhana (every situation).',
    example: 'True friends support each other through thick and thin.',
    category: 'Relationships',
  },
  {
    id: 'fc-7',
    phrase: 'Catch-22',
    ipa: '/kætʃ ˈtwɛn.ti.tuː/',
    meaning: 'A contradictory, dilemma situation from which an individual cannot escape.',
    hinglishMeaning: 'Aisi uljhan jahan dono shartein ek doosre ko rok rahi hon (e.g. job ke bina experience nahi, experience ke bina job nahi).',
    example: 'You need job experience to get hired, but need a job to get experience—a true catch-22.',
    category: 'Nuanced English',
  },
  {
    id: 'fc-8',
    phrase: 'Piece of cake',
    ipa: '/piːs əv keɪk/',
    meaning: 'Something very easy or simple to accomplish.',
    hinglishMeaning: 'Bohot hi aasaan kaam ("ye toh baayein haath ka khel hai").',
    example: 'Don’t worry about the speaking test; with practice, it’ll be a piece of cake!',
    category: 'Casual Slang',
  },
];

export function resolveFlashcards(savedPhrases: string[] = []): Flashcard[] {
  // If savedPhrases has items, check if they match our database or create custom cards
  if (!savedPhrases || savedPhrases.length === 0) {
    return DEFAULT_FLASHCARDS;
  }

  const result: Flashcard[] = [];
  savedPhrases.forEach((phrase, idx) => {
    const clean = phrase.toLowerCase().trim();
    const match = DEFAULT_FLASHCARDS.find(
      (df) => df.phrase.toLowerCase().trim() === clean || clean.includes(df.phrase.toLowerCase().trim())
    );

    if (match) {
      result.push(match);
    } else {
      result.push({
        id: `user-fc-${idx}`,
        phrase: phrase,
        ipa: '/ˈpræktɪs/',
        meaning: `Review and master the phrase: "${phrase}". Practice saying it fluently.`,
        hinglishMeaning: `Is phrase ko naturally bolne ki practice karein. Daily conversation me use karein!`,
        example: `I often say "${phrase}" when communicating clearly.`,
        category: 'My Saved Vocabulary',
      });
    }
  });

  // Also include the remaining defaults so the user always has a rich deck
  DEFAULT_FLASHCARDS.forEach((df) => {
    if (!result.some((r) => r.phrase.toLowerCase() === df.phrase.toLowerCase())) {
      result.push(df);
    }
  });

  return result;
}
