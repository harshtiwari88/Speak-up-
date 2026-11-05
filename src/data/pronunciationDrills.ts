export interface PronunciationDrill {
  id: string;
  category: 'minimal_pairs' | 'tricky_sounds' | 'tongue_twisters' | 'connected_speech' | 'idioms';
  title: string;
  focusSound: string;
  targetPhrase: string;
  ipa: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
  tip: string;
  contrastingWord?: string;
  contrastingIpa?: string;
}

export const PRONUNCIATION_DRILLS: PronunciationDrill[] = [
  // 1. Tricky Sounds (/θ/ and /ð/)
  {
    id: 'th_unvoiced',
    category: 'tricky_sounds',
    title: 'Unvoiced "TH" [θ]',
    focusSound: '/θ/',
    targetPhrase: 'I think three thousand things through thick and thin.',
    ipa: '/aɪ θɪŋk θriː ˈθaʊ.zənd θɪŋz θruː θɪk ænd θɪn/',
    difficulty: 'Medium',
    tip: 'Put your tongue tip gently between your upper and lower teeth. Blow soft air with NO vocal cord vibration.',
  },
  {
    id: 'th_voiced',
    category: 'tricky_sounds',
    title: 'Voiced "TH" [ð]',
    focusSound: '/ð/',
    targetPhrase: 'They gather together with their brother and mother.',
    ipa: '/ðeɪ ˈɡæð.ər təˈɡɛð.ər wɪð ðɛər ˈbrʌð.ər ænd ˈmʌð.ər/',
    difficulty: 'Medium',
    tip: 'Same tongue position as /θ/ (between front teeth), but turn your vocal cords ON to feel the buzz in your throat.',
  },
  {
    id: 'r_vs_l',
    category: 'minimal_pairs',
    title: 'R vs L Contrast',
    focusSound: '/r/ vs /l/',
    targetPhrase: 'Red lorry, yellow lorry, rolling really rapidly.',
    ipa: '/rɛd ˈlɒr.i ˈjɛl.oʊ ˈlɒr.i ˈroʊ.lɪŋ ˈrɪə.li ˈræp.ɪd.li/',
    difficulty: 'Challenging',
    tip: 'For /r/, your tongue curls back without touching the roof of the mouth. For /l/, the tongue tip firmly presses behind your upper front teeth.',
  },
  {
    id: 'v_vs_w',
    category: 'minimal_pairs',
    title: 'V vs W Contrast',
    focusSound: '/v/ vs /w/',
    targetPhrase: 'Very wary visitors viewed wonderful vast views.',
    ipa: '/ˈvɛr.i ˈwɛər.i ˈvɪz.ɪ.tərz vjuːd ˈwʌn.dər.fəl væst vjuːz/',
    difficulty: 'Medium',
    tip: 'For /v/, upper teeth touch your bottom lip. For /w/, round your lips into an "O" shape without teeth touching.',
  },
  {
    id: 'ship_vs_sheep',
    category: 'minimal_pairs',
    title: 'Short [ɪ] vs Long [iː]',
    focusSound: '/ɪ/ vs /iː/',
    targetPhrase: 'The big ship carried sixteen sleeping sheep.',
    ipa: '/ðə bɪɡ ʃɪp ˈkær.id ˈsɪks.tiːn ˈsliː.pɪŋ ʃiːp/',
    difficulty: 'Easy',
    tip: 'Ship has a relaxed, quick /ɪ/ (jaw slightly dropped). Sheep has a smiling, tense, elongated /iː/.',
  },
  {
    id: 'thought_vs_taught',
    category: 'minimal_pairs',
    title: 'Thought [θ] vs Taught [t]',
    focusSound: '/θ/ vs /t/',
    targetPhrase: 'I thought the teacher taught three tough topics.',
    ipa: '/aɪ θɔːt ðə ˈtiː.tʃər tɔːt θriː tʌf ˈtɒp.ɪks/',
    difficulty: 'Medium',
    tip: 'Do not substitute /t/ for /θ/. Ensure tongue protrudes between teeth for "thought".',
  },
  {
    id: 'twister_peter',
    category: 'tongue_twisters',
    title: 'Peter Piper Plosives [p]',
    focusSound: '/p/ aspiration',
    targetPhrase: 'Peter Piper picked a peck of pickled peppers.',
    ipa: '/ˈpiː.tər ˈpaɪ.pər pɪkt ə pɛk əv ˈpɪk.əld ˈpɛp.ərz/',
    difficulty: 'Challenging',
    tip: 'Release a crisp puff of air with both lips popping for every single "P".',
  },
  {
    id: 'twister_seashells',
    category: 'tongue_twisters',
    title: 'S vs SH Sibilants [/s/ vs /ʃ/]',
    focusSound: '/s/ vs /ʃ/',
    targetPhrase: 'She sells seashells by the seashore.',
    ipa: '/ʃiː sɛlz ˈsiː.ʃɛlz baɪ ðə ˈsiː.ʃɔːr/',
    difficulty: 'Challenging',
    tip: 'Switch tongue posture smoothly between the flat hissing /s/ and the rounded shushing /ʃ/.',
  },
  {
    id: 'connected_speech_1',
    category: 'connected_speech',
    title: 'Native Linking & Flap T',
    focusSound: 'Flap T [ɾ]',
    targetPhrase: 'What a beautiful bottle of water in the city.',
    ipa: '/wʌt ə ˈbjuː.tɪ.fəl ˈbɑː.t̬əl əv ˈwɑː.t̬ər ɪn ðə ˈsɪt̬.i/',
    difficulty: 'Medium',
    tip: 'In American English, the "t" between vowels turns into a soft quick tap against the roof of the mouth, sounding like a light "d".',
  },
  {
    id: 'connected_speech_2',
    category: 'connected_speech',
    title: 'Reduced Auxiliary & Elision',
    focusSound: 'Reductions',
    targetPhrase: 'What do you want to do tonight? Could you tell me?',
    ipa: '/ˈwʌ.də.jə ˈwɑː.nə duː təˈnaɪt? kʊ.dʒə tɛl miː?/',
    difficulty: 'Medium',
    tip: 'Native speakers glide "what do you" into /wʌ.də.jə/ and "want to" into "wanna" /wɑː.nə/.',
  },
  {
    id: 'idiom_nail',
    category: 'idioms',
    title: 'Everyday Idiom: Accurate & Clear',
    focusSound: 'Rhythm & Cadence',
    targetPhrase: 'You hit the nail right on the head with that presentation.',
    ipa: '/juː hɪt ðə neɪl raɪt ɑːn ðə hɛd wɪð ðæt ˌprɛz.ənˈteɪ.ʃən/',
    difficulty: 'Easy',
    tip: 'Stress content words: "hit", "nail", "head", "presentation". Keep function words ("the", "on") unstressed.',
  },
  {
    id: 'idiom_bullet',
    category: 'idioms',
    title: 'Everyday Idiom: Facing Challenges',
    focusSound: 'Consonant Clusters',
    targetPhrase: 'We need to bite the bullet and finish the project today.',
    ipa: '/wiː niːd tuː baɪt ðə ˈbʊl.ɪt ænd ˈfɪn.ɪʃ ðə ˈprɒdʒ.ɛkt təˈdeɪ/',
    difficulty: 'Easy',
    tip: 'Crisp ending on "bullet" with a glottal or light /t/ stop.',
  },
];
