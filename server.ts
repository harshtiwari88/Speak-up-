import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini Client with required User-Agent
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(geminiApiKey),
    timestamp: new Date().toISOString(),
  });
});

// Chatbot Persona Definitions
const PERSONA_PROMPTS: Record<string, string> = {
  elena: `You are Elena, a warm, energetic, and talkative English conversation partner and language coach.
You love engaging in vibrant conversations, asking curious open-ended follow-up questions, sharing relatable anecdotes, and using natural conversational English (including casual idioms, friendly humor, and expressions).
Always keep the conversation moving enthusiastically.`,
  marcus: `You are Marcus, an experienced, sharp, and encouraging executive communications and career coach.
You specialize in business English, technical discussions, job interview readiness, and professional articulateness.
You speak clearly, offer professional phrasing upgrades, and help the user sound confident and polished.`,
  sam: `You are Sam, an upbeat, talkative friend from California.
You talk like an energetic native English speaker full of real-world colloquialisms, modern slang, pop-culture humor, and lively stories.
You encourage the user to speak naturally without overthinking grammar.`,
  arthur: `You are Dr. Arthur, a courteous, articulate British English tutor with a passion for literature, storytelling, and elegant vocabulary.
You speak in a warm, refined British tone and love introducing delightful idioms, nuanced adjectives, and pronunciation etiquette.`,
  aarav: `You are Aarav, a super friendly, encouraging, and talkative Hinglish English coach from India.
You speak in a natural, vibrant blend of conversational Hindi and English (Hinglish written in Latin script, like: "Arre waah! Don't worry at all, English bolna bohot simple hai once you build the habit.").
You help users master English with relatable Hinglish explanations, witty analogies, and warm encouragement so they never feel nervous.
Always keep the conversation moving enthusiastically with a curious follow-up question.`,
};

// 1. Talkative Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, persona = 'elena', userLevel = 'Intermediate', userMessage, hinglishMode = false } = req.body;

    const basePrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.elena;
    const isHinglish = persona === 'aarav' || Boolean(hinglishMode);

    const systemInstruction = `${basePrompt}
The user is learning English at the "${userLevel}" level.
${isHinglish ? 'Hinglish Mode is ACTIVE: In your response and explanations, use a friendly blend of Hindi and English (Hinglish written in Latin script, e.g. "Aapne kaafi accha try kiya! Bas is word me thoda sa polish chahiye."). Include a helpful "hinglishTip" explaining the concept.' : ''}
Your goal is twofold:
1. Respond naturally as your persona in a friendly, conversational, and talkative manner (2-4 sentences max, ending with an interesting question to keep them talking).
2. Act as a discreet language coach: inspect the user's latest message for grammar mistakes, vocabulary improvement opportunities, and identify tricky words to practice pronunciation.

You MUST respond strictly in valid JSON adhering to this schema:
{
  "replyText": "your friendly in-character conversational response",
  "grammarCorrection": {
    "hasIssue": boolean,
    "originalPhrase": "incorrect phrase if any",
    "correctedPhrase": "better phrasing",
    "explanation": "quick friendly tip why",
    "hinglishExplanation": "friendly explanation in Hinglish (Hindi in Latin script)"
  },
  "vocabularyUpgrade": {
    "originalWord": "word they used that can be upgraded",
    "upgrade": "more expressive or natural alternative",
    "exampleSentence": "example using the upgrade",
    "hinglishTip": "Hinglish explanation of when to use this word"
  },
  "keyPronunciationWords": ["word1", "word2"],
  "followUpSuggestions": ["Quick suggested reply 1", "Quick suggested reply 2", "Quick suggested reply 3"],
  "hinglishTip": "Helpful motivational tip or cultural context in Hinglish",
  "fluencyScore": number (1 to 100 based on naturalness and grammar)
}`;

    if (ai) {
      const formattedHistory = (messages || []).slice(-8).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const promptContent = `Conversation History:
${formattedHistory}

User's Latest Spoken/Written Message:
"${userMessage || ''}"

Analyze and generate the response JSON:`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: { type: Type.STRING },
              grammarCorrection: {
                type: Type.OBJECT,
                properties: {
                  hasIssue: { type: Type.BOOLEAN },
                  originalPhrase: { type: Type.STRING },
                  correctedPhrase: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  hinglishExplanation: { type: Type.STRING },
                },
                required: ['hasIssue'],
              },
              vocabularyUpgrade: {
                type: Type.OBJECT,
                properties: {
                  originalWord: { type: Type.STRING },
                  upgrade: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                  hinglishTip: { type: Type.STRING },
                },
              },
              keyPronunciationWords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              followUpSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              hinglishTip: { type: Type.STRING },
              fluencyScore: { type: Type.NUMBER },
            },
            required: ['replyText', 'fluencyScore', 'followUpSuggestions'],
          },
        },
      });

      const parsed = JSON.parse(geminiResponse.text ?? '{}');
      return res.json(parsed);
    }

    // Fallback if no API key is provided
    return res.json({
      replyText: `That's really interesting! I love hearing your perspective on that. Could you tell me a little bit more about what inspired you today?`,
      grammarCorrection: {
        hasIssue: false,
        originalPhrase: '',
        correctedPhrase: '',
        explanation: 'Your sentence structure was clear and easy to understand!',
      },
      vocabularyUpgrade: {
        originalWord: 'good',
        upgrade: 'splendid',
        exampleSentence: 'You did a splendid job expressing your thought!',
      },
      keyPronunciationWords: ['perspective', 'inspired', 'today'],
      followUpSuggestions: [
        'Sure, let me tell you more!',
        'What would you recommend in this situation?',
        'Can we practice a different topic?',
      ],
      fluencyScore: 88,
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({
      error: 'Failed to process chat response',
      message: error?.message || 'Server error',
      replyText: "I heard you clearly! Let's keep chatting—what are your thoughts on travel and discovering new places?",
      followUpSuggestions: ["I love traveling!", "I prefer staying close to home.", "Where have you traveled?"],
      fluencyScore: 85,
    });
  }
});

// 2. Real-Time Pronunciation Feedback Endpoint
app.post('/api/pronunciation-feedback', async (req, res) => {
  try {
    const { targetText, spokenText, userLevel = 'Intermediate' } = req.body;

    if (!targetText) {
      return res.status(400).json({ error: 'targetText is required' });
    }

    const systemInstruction = `You are an expert English Phonetics and Pronunciation Coach.
Analyze the user's spoken English attempt against the target phrase.
Provide deep, real-time articulatory feedback, phonetic IPA breakdown, syllable stress indication, and physical mouth/tongue positioning tips.

Target Phrase: "${targetText}"
User Transcribed Speech: "${spokenText || ''}"

Return STRICT JSON adhering to this schema:
{
  "overallScore": number (0-100),
  "ipa": "IPA phonetic transcription of the target phrase, e.g. /kəmˈpjuːtər/",
  "stressPattern": "e.g. Primary stress on the 2nd syllable (com-PU-ter)",
  "syllables": [
    {
      "syllable": "com",
      "phonetic": "kəm",
      "stressed": false,
      "accuracy": 95,
      "feedback": "Clean reduced schwa sound"
    }
  ],
  "phonemeTips": [
    {
      "sound": "th [θ]",
      "status": "needs_work" | "good" | "excellent",
      "mouthPosition": "Place the tip of your tongue lightly between your upper and lower teeth.",
      "advice": "Gently exhale without vibrating vocal cords."
    }
  ],
  "mistakeAnalysis": "Detailed breakdown comparing what was said to what was intended",
  "tonguePlacementTip": "Key physical tip for the most difficult sound in this phrase",
  "encouragement": "Empowering, motivating comment"
}`;

    if (ai) {
      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Evaluate pronunciation accuracy for target: "${targetText}" with user spoken transcript: "${spokenText}".`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              ipa: { type: Type.STRING },
              stressPattern: { type: Type.STRING },
              syllables: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    syllable: { type: Type.STRING },
                    phonetic: { type: Type.STRING },
                    stressed: { type: Type.BOOLEAN },
                    accuracy: { type: Type.NUMBER },
                    feedback: { type: Type.STRING },
                  },
                  required: ['syllable', 'stressed', 'accuracy'],
                },
              },
              phonemeTips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sound: { type: Type.STRING },
                    status: { type: Type.STRING },
                    mouthPosition: { type: Type.STRING },
                    advice: { type: Type.STRING },
                  },
                  required: ['sound', 'status', 'mouthPosition'],
                },
              },
              mistakeAnalysis: { type: Type.STRING },
              tonguePlacementTip: { type: Type.STRING },
              encouragement: { type: Type.STRING },
            },
            required: ['overallScore', 'ipa', 'stressPattern', 'syllables', 'tonguePlacementTip', 'encouragement'],
          },
        },
      });

      const parsed = JSON.parse(geminiResponse.text ?? '{}');
      return res.json(parsed);
    }

    // Smart algorithmic fallback
    const targetWords = targetText.toLowerCase().trim().split(/\s+/);
    const spokenWords = (spokenText || '').toLowerCase().trim().split(/\s+/);
    let matches = 0;
    targetWords.forEach((tw: string) => {
      if (spokenWords.includes(tw)) matches++;
    });
    const calculatedScore = Math.min(100, Math.max(50, Math.round((matches / (targetWords.length || 1)) * 95) + 5));

    return res.json({
      overallScore: calculatedScore,
      ipa: `/ˈpræktɪs/`,
      stressPattern: 'Focus on clear vowel length and steady rhythm',
      syllables: targetWords.map((w: string) => ({
        syllable: w,
        phonetic: w,
        stressed: w.length > 5,
        accuracy: calculatedScore,
        feedback: 'Good voicing and vocal energy',
      })),
      phonemeTips: [
        {
          sound: 'Vowel Clarity',
          status: calculatedScore > 80 ? 'good' : 'needs_work',
          mouthPosition: 'Keep your jaw relaxed and open your mouth slightly wider on stressed syllables.',
          advice: 'Lengthen the vowel sound slightly before voiced consonants.',
        },
      ],
      mistakeAnalysis: spokenText
        ? `You articulated "${spokenText}", matching ${matches} out of ${targetWords.length} target words.`
        : 'Microphone detected audio. Make sure to project clearly into your mic.',
      tonguePlacementTip: 'Ensure your tongue tip taps lightly behind your upper front teeth for T, D, and L sounds.',
      encouragement: calculatedScore >= 80 ? 'Outstanding pronunciation! You sound very natural.' : 'Great effort! Repeat once more focusing on smooth linking between words.',
    });
  } catch (error: any) {
    console.error('Pronunciation feedback error:', error);
    return res.status(500).json({
      error: 'Failed to analyze pronunciation',
      message: error?.message || 'Server error',
      overallScore: 82,
      ipa: `/ˈɪŋ.ɡlɪʃ/`,
      stressPattern: 'Natural conversational stress',
      syllables: [{ syllable: 'English', phonetic: 'ɪŋ.ɡlɪʃ', stressed: true, accuracy: 85, feedback: 'Well spoken' }],
      phonemeTips: [],
      tonguePlacementTip: 'Keep your jaw relaxed and articulate the consonants clearly.',
      encouragement: 'Good attempt! Keep up the daily practice.',
    });
  }
});

// 3. Conversation Simulation Roleplay Turn Endpoint
app.post('/api/simulation/turn', async (req, res) => {
  try {
    const { scenario, conversationHistory, userInput } = req.body;

    const systemInstruction = `You are a real-time conversational actor in an interactive English Simulation.
Scenario: ${scenario.title}
Context: ${scenario.description}
Your Role: ${scenario.roleAi}
User's Role: ${scenario.roleUser}
Active Goals for the user to achieve:
${JSON.stringify(scenario.goals, null, 2)}

Instructions:
1. Stay strictly in character as ${scenario.roleAi}. Be conversational, realistic, engaging, and reactive.
2. In your response, address what the user said naturally.
3. Evaluate whether the user's latest message has successfully completed any of the active goals.
4. Provide a quick coaching tip or idiomatic phrase the user could use next.

Return STRICT JSON adhering to this schema:
{
  "characterReply": "In-character reply from your role",
  "completedGoalIds": ["goal_id_if_achieved"],
  "goalProgressComment": "Brief observation on their progress",
  "coachingHint": "Helpful phrase or vocabulary tip for the user in this situation",
  "suggestedReplies": ["Suggested response 1", "Suggested response 2"],
  "isScenarioFinished": boolean (true if all critical goals are met or natural conclusion reached)
}`;

    if (ai) {
      const historyText = (conversationHistory || [])
        .map((m: any) => `${m.role === 'user' ? scenario.roleUser : scenario.roleAi}: ${m.content}`)
        .join('\n');

      const promptContent = `Scenario: ${scenario.title}
Dialogue History:
${historyText}

User (${scenario.roleUser}) just said:
"${userInput}"

Generate response in character and check goal accomplishments:`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              characterReply: { type: Type.STRING },
              completedGoalIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              goalProgressComment: { type: Type.STRING },
              coachingHint: { type: Type.STRING },
              suggestedReplies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              isScenarioFinished: { type: Type.BOOLEAN },
            },
            required: ['characterReply', 'completedGoalIds', 'suggestedReplies', 'isScenarioFinished'],
          },
        },
      });

      const parsed = JSON.parse(geminiResponse.text ?? '{}');
      return res.json(parsed);
    }

    // Fallback simulation response
    const firstIncompleteGoal = scenario.goals.find((g: any) => !g.completed);
    return res.json({
      characterReply: `Welcome! That sounds great. How can I assist you further with that?`,
      completedGoalIds: firstIncompleteGoal ? [firstIncompleteGoal.id] : [],
      goalProgressComment: 'Nice natural response!',
      coachingHint: 'Use courteous expressions like "Could you please..." or "I would appreciate..."',
      suggestedReplies: ['Could you tell me more about the options?', 'That sounds perfect, thank you!'],
      isScenarioFinished: false,
    });
  } catch (error: any) {
    console.error('Simulation turn error:', error);
    return res.status(500).json({
      error: 'Simulation turn failed',
      characterReply: 'I understand! Please go ahead with your request.',
      completedGoalIds: [],
      suggestedReplies: ['Can you repeat that?', 'Thank you for your help.'],
      isScenarioFinished: false,
    });
  }
});

// 4. Conversation Simulation Final Evaluation Endpoint
app.post('/api/simulation/evaluate', async (req, res) => {
  try {
    const { scenario, conversationHistory } = req.body;

    const systemInstruction = `You are an expert English Language Assessor and Speech Evaluator.
Review this completed conversation simulation:
Scenario: ${scenario.title}
User Role: ${scenario.roleUser}
Conversation Dialogue:
${JSON.stringify(conversationHistory, null, 2)}

Provide a comprehensive, constructive, and motivating evaluation.
Return STRICT JSON adhering to this schema:
{
  "overallScore": number (0-100),
  "grade": "A+" | "A" | "B+" | "B" | "C",
  "fluencyRating": number (0-100),
  "vocabularyRating": number (0-100),
  "politenessRating": number (0-100),
  "summary": "2-3 sentences summarizing performance",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Area to polish 1", "Area to polish 2"],
  "nativePhrasesToRemember": [
    { "phrase": "e.g. Could I get that to go?", "meaning": "When taking food with you" },
    { "phrase": "e.g. I appreciate your flexibility", "meaning": "Polite business acknowledgment" }
  ]
}`;

    if (ai) {
      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Evaluate the English conversation performance.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              grade: { type: Type.STRING },
              fluencyRating: { type: Type.NUMBER },
              vocabularyRating: { type: Type.NUMBER },
              politenessRating: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              nativePhrasesToRemember: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phrase: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                  },
                  required: ['phrase', 'meaning'],
                },
              },
            },
            required: ['overallScore', 'grade', 'fluencyRating', 'summary', 'strengths', 'improvements', 'nativePhrasesToRemember'],
          },
        },
      });

      const parsed = JSON.parse(geminiResponse.text ?? '{}');
      return res.json(parsed);
    }

    return res.json({
      overallScore: 92,
      grade: 'A',
      fluencyRating: 90,
      vocabularyRating: 88,
      politenessRating: 95,
      summary: 'You handled the simulation with high confidence, clear expression, and polite tone throughout!',
      strengths: ['Clear and direct responses', 'Polite greetings and courteous closing', 'Good contextual comprehension'],
      improvements: ['Incorporate more transitional connectors like "actually", "furthermore", "as a matter of fact"'],
      nativePhrasesToRemember: [
        { phrase: 'Could I trouble you for...', meaning: 'Super polite way to ask for assistance or a small favor' },
        { phrase: 'Sounds like a plan!', meaning: 'Friendly confirmation when agreeing to a suggestion' },
      ],
    });
  } catch (error: any) {
    console.error('Evaluation endpoint error:', error);
    return res.status(500).json({
      error: 'Evaluation failed',
      overallScore: 88,
      grade: 'A-',
      fluencyRating: 86,
      vocabularyRating: 85,
      politenessRating: 90,
      summary: 'Great job completing this simulation! Your English was clear and effective.',
      strengths: ['Kept the conversation flowing', 'Understood the scenario roles'],
      improvements: ['Practice speaking with slightly more varied intonation'],
      nativePhrasesToRemember: [
        { phrase: 'I would like to...', meaning: 'Polite standard request' },
      ],
    });
  }
});

// Vite Middleware integration for development vs static serve for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`TalkFlow server running on http://localhost:${PORT}`);
  });
}

// Only start the standalone listener if not running as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}

export default app;
