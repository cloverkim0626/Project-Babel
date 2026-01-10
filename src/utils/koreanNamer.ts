/**
 * Korean Namer Utility
 * Paraphrases raw academic titles into "Trendy/Cute" High-Teen fantasy names.
 */

const KEYWORD_MAP: Record<string, string[]> = {
    'Mock': ['결전', '시련', '그림자'], // Exam/Mock
    'Exam': ['전쟁', '정복', '심판'],
    'Sep': ['가을의', '9월의', '단풍의'],
    'Mar': ['시작의', '봄의', '새싹의'],
    'Voca': ['언어의', '마법의', '룬문자'],
    'Grammar': ['규칙의', '질서의', '설계도'],
    'Day': ['걸음', '조각', '페이지'],
};

const ADJECTIVES = [
    '신비한', '잃어버린', '빛나는', '오래된', '전설의', '숨겨진', '끝없는'
];

const NOUNS = [
    '던전', '탑', '미로', '정원', '도서관', '유적', '신전', '들판', '바다'
];

export const paraphraseTitle = (rawTitle: string): { display: string; sub: string } => {
    // 1. Check for specific keywords in map
    for (const [key, values] of Object.entries(KEYWORD_MAP)) {
        if (rawTitle.toLowerCase().includes(key.toLowerCase())) {
            // Pick deterministic random based on string length
            const idx = rawTitle.length % values.length;
            const noun = values[idx];
            // Get random adjective based on hash
            let hash = 0;
            for (let i = 0; i < rawTitle.length; i++) hash = rawTitle.charCodeAt(i) + ((hash << 5) - hash);
            const adj = ADJECTIVES[Math.abs(hash) % ADJECTIVES.length];

            return {
                display: `${adj} ${noun} (The ${key})`,
                sub: `Origin: ${rawTitle}`
            };
        }
    }

    // 2. Random Generation fallback
    // Simple hash to make it consistent for the same string
    let hash = 0;
    for (let i = 0; i < rawTitle.length; i++) {
        hash = rawTitle.charCodeAt(i) + ((hash << 5) - hash);
    }

    const adjIndex = Math.abs(hash) % ADJECTIVES.length;
    const nounIndex = Math.abs(hash >> 1) % NOUNS.length;

    const randomName = `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`;

    return {
        display: `${randomName} (The Unknown)`,
        sub: `Origin: ${rawTitle}`
    };
};
