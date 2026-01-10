export interface QuestSet {
    id: string; // generated
    index: number; // 1, 2, 3
    wordCount: number; // 20
    status: 'locked' | 'open' | 'passed';
}

/**
 * Automatically splits a master quest into 20-word sets.
 * @param totalWords Total number of words in the mission (e.g., 60)
 * @returns Array of QuestSet objects
 */
export const splitQuest = (totalWords: number): QuestSet[] => {
    const SET_SIZE = 20;
    const totalSets = Math.ceil(totalWords / SET_SIZE);

    return Array.from({ length: totalSets }, (_, i) => ({
        id: `auto-set-${Date.now()}-${i}`,
        index: i + 1,
        wordCount: Math.min(SET_SIZE, totalWords - (i * SET_SIZE)), // Handle remainder
        status: i === 0 ? 'open' : 'locked' // First set unlocked by default
    }));
};
