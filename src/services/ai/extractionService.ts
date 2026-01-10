
// Mock AI Service for Word Extraction
// In production, this would call OpenAI/Gemini API

export interface RichWord {
    id: string;
    word: string;
    original_text: string;
    phonetic: string;            // IPA
    part_of_speech: string;      // noun, verb, adj...

    // Detailed Analysis
    meanings_kr: string[];       // Top 3 meanings closest to context
    synonyms: string[];          // Top 3
    antonyms: string[];          // Top 3

    example_variations: string[]; // Variations of usage

    difficulty_level: 1 | 2 | 3 | 4 | 5;
}

export const extractWordsFromText = async (text: string): Promise<RichWord[]> => {
    // 1. Simulate API Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Mock Logic: Identify likely words
    const words = text.split(/\s+/)
        .map(w => w.replace(/[.,!?()"']/g, ''))
        .filter(w => /^[a-zA-Z]+$/.test(w))
        .filter(w => w.length > 3);

    const uniqueWords = [...new Set(words)];

    // Mock Dictionary for prototype
    const mockDict: Record<string, any> = {
        'environment': { m: ['환경', '주위 상황', '자연'], p: '/inˈvīrənmənt/', syn: ['surroundings', 'setting', 'context'], ant: ['vacuum', 'void', 'emptiness'] },
        'sustainable': { m: ['지속 가능한', '견딜 수 있는', '유지할 수 있는'], p: '/səˈstānəb(ə)l/', syn: ['maintainable', 'viable', 'feasible'], ant: ['unsustainable', 'fleeting', 'temporary'] },
        'development': { m: ['발전', '개발', '성장'], p: '/dəˈveləpmənt/', syn: ['growth', 'evolution', 'expansion'], ant: ['decline', 'regression', 'stagnation'] },
        'challenging': { m: ['도전적인', '힘든', '엄어려운'], p: '/ˈCHalənjiNG/', syn: ['demanding', 'testing', 'arduous'], ant: ['easy', 'simple', 'effortless'] },
        'experience': { m: ['경험', '체험', '경력'], p: '/ikˈspirēəns/', syn: ['encounter', 'practice', 'exposure'], ant: ['inexperience', 'ignorance', 'naivety'] },
        'education': { m: ['교육', '훈련', '양성'], p: '/ˌejəˈkāSH(ə)n/', syn: ['schooling', 'learning', 'tuition'], ant: ['ignorance', 'illiteracy', 'darkness'] },
        'necessary': { m: ['필수적인', '필연적인', '불가피한'], p: '/ˈnesəˌserē/', syn: ['required', 'essential', 'indispensable'], ant: ['optional', 'unnecessary', 'extra'] },
        'provide': { m: ['제공하다', '공급하다', '지급하다'], p: '/prəˈvīd/', syn: ['supply', 'give', 'furnish'], ant: ['withhold', 'deny', 'refuse'] },
        'consider': { m: ['고려하다', '생각하다', '여기다'], p: '/kənˈsidər/', syn: ['think about', 'contemplate', 'examine'], ant: ['ignore', 'neglect', 'disregard'] },
        'usually': { m: ['보통', '대개', '평소에'], p: '/ˈyo͞oZH(o͞o)əlē/', syn: ['normally', 'generally', 'commonly'], ant: ['rarely', 'seldom', 'never'] }
    };

    return uniqueWords.slice(0, 20).map(w => {
        const info = mockDict[w.toLowerCase()] || {
            m: ['의미 검색 필요', '뜻2', '뜻3'],
            p: `/${w}/`,
            syn: ['syn1', 'syn2', 'syn3'],
            ant: ['ant1', 'ant2', 'ant3']
        };

        return {
            id: crypto.randomUUID(),
            word: w,
            original_text: w,
            phonetic: info.p,
            part_of_speech: 'noun/verb',

            meanings_kr: info.m,
            synonyms: info.syn,
            antonyms: info.ant,

            example_variations: [
                `In this context, ${w} implies...`,
                `Another usage: "The ${w} was very..."`,
                `Variation 3 using ${w}.`
            ],

            difficulty_level: 3 // Default to Medium
        };
    });
};
