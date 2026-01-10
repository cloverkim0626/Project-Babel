
// Mock AI Service for Word Extraction
// In production, this would call OpenAI/Gemini API

export interface RichWord {
    id: string;
    word: string;
    original_text: string;
    meaning_context: string;     // Contextual meaning
    definition_en: string;       // English definition
    phonetic: string;            // IPA
    synonyms: string[];          // Top 3
    antonyms: string[];          // Top 3
    similar_examples: string[];  // 3 examples
    source_question_ref?: string;
    source_sentence?: string;
    difficulty_level: 1 | 2 | 3 | 4 | 5;
    part_of_speech: string;
}

export const extractWordsFromText = async (text: string): Promise<RichWord[]> => {
    // 1. Simulate API Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Mock Logic: Identify likely words
    const words = text.split(/\s+/)
        .map(w => w.replace(/[.,!?()"']/g, ''))
        .filter(w => /^[a-zA-Z]+$/.test(w))
        .filter(w => w.length > 4);

    const uniqueWords = [...new Set(words)];

    // Mock Dictionary for prototype
    const mockDict: Record<string, any> = {
        'environment': { m: '환경', p: '/inˈvīrənmənt/', syn: ['surroundings', 'setting'], ant: ['vacuum'] },
        'sustainable': { m: '지속 가능한', p: '/səˈstānəb(ə)l/', syn: ['maintainable', 'viable'], ant: ['unsustainable'] },
        'development': { m: '발전, 개발', p: '/dəˈveləpmənt/', syn: ['growth', 'evolution'], ant: ['decline'] },
        'challenging': { m: '도전적인, 힘든', p: '/ˈCHalənjiNG/', syn: ['demanding', 'testing'], ant: ['easy'] },
        'experience': { m: '경험', p: '/ikˈspirēəns/', syn: ['encounter', 'practice'], ant: ['inexperience'] },
        'education': { m: '교육', p: '/ˌejəˈkāSH(ə)n/', syn: ['schooling', 'learning'], ant: ['ignorance'] },
        'necessary': { m: '필수적인', p: '/ˈnesəˌserē/', syn: ['required', 'essential'], ant: ['optional'] },
        'provide': { m: '제공하다', p: '/prəˈvīd/', syn: ['supply', 'give'], ant: ['withhold'] },
        'consider': { m: '고려하다', p: '/kənˈsidər/', syn: ['think about', 'contemplate'], ant: ['ignore'] },
        'usually': { m: '보통, 대개', p: '/ˈyo͞oZH(o͞o)əlē/', syn: ['normally', 'generally'], ant: ['rarely'] }
    };

    return uniqueWords.slice(0, 20).map(w => {
        const info = mockDict[w.toLowerCase()] || { m: '의미 검색 필요', p: '', syn: [], ant: [] };

        return {
            id: crypto.randomUUID(),
            word: w,
            original_text: w,
            meaning_context: info.m,
            definition_en: `The definition of ${w} goes here.`,
            phonetic: info.p || `/${w}/`,
            synonyms: info.syn.length ? info.syn : ['syn1', 'syn2', 'syn3'],
            antonyms: info.ant.length ? info.ant : ['ant1', 'ant2', 'ant3'],
            similar_examples: [
                `This is an example sentence for ${w}.`,
                `Another context using ${w} correctly.`,
                `A third sample sentence regarding ${w}.`
            ],
            source_sentence: findContext(text, w),
            difficulty_level: 3, // Default to Medium
            part_of_speech: 'noun/verb'
        };
    });
};

const findContext = (text: string, word: string) => {
    const sentences = text.split(/[.!?]/);
    return sentences.find(s => s.includes(word))?.trim() || '';
};
