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
    // 1. Check for hardcoded overrides or specific patterns
    if (rawTitle.includes('Sep') && rawTitle.includes('Mock')) {
        return { display: '9월의 결전 (Sep Battle)', sub: '가을의 전설이 시작된다.' };
    }

    if (rawTitle.toLowerCase().includes('voca')) {
        return { display: '시작의 들판 (Field of Beginnings)', sub: '언어의 마력이 깃든 곳' };
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
