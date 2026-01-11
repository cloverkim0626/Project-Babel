export type ProblemType = 'BLANK' | 'ORDER' | 'INSERTION' | 'VOCAB' | 'SUMMARY';

export const SYSTEM_PROMPT = `You are an expert English teacher specialized in creating CSAT (College Scholastic Ability Test) style questions for Korean high school students. 
Your goal is to generate high-quality English reading comprehension questions based on the provided text.
The questions should test logical thinking, vocabulary, and understanding of context.
Output must be in JSON format.`;

export const PROMPTS = {
    BLANK: (passage: string) => `
        Task: Create a "Blank Completion" question based on the text below.
        1. Select a key sentence that contains the central idea or a crucial logical connection.
        2. Replace a key word or phrase in that sentence with a blank (________).
        3. Provide 5 options (1 correct, 4 distractors). The distractors should be plausible but incorrect.
        4. Provide the correct answer and a brief explanation in Korean.

        Text:
        """
        ${passage}
        """

        Response Format (JSON):
        {
            "question": "Choose the best word/phrase to fill in the blank.",
            "passage_with_blank": "Full text with ________ where the blank is.",
            "options": ["opt1", "opt2", "opt3", "opt4", "opt5"],
            "answer_index": 0, // 0-4
            "explanation": "Korean explanation here"
        }
    `,

    ORDER: (passage: string) => `
        Task: Create a "Paragraph Ordering" question.
        1. Split the text into a logical starting box (Box) and three shuffled segments (A, B, C).
        2. The correct order must be logically deduced from connection words, pronouns, etc.
        3. Provide the correct order and explanation.

        Text:
        """
        ${passage}
        """

        Response Format (JSON):
        {
            "question": "Which is the correct order of the paragraphs?",
            "box_text": "The starting paragraph...",
            "segments": {
                "A": "Segment A text...",
                "B": "Segment B text...",
                "C": "Segment C text..."
            },
            "correct_order": ["B", "A", "C"],
            "explanation": "Korean explanation"
        }
    `,

    VOCAB: (passage: string) => `
        Task: Create a "Vocabulary Context" question.
        1. Select 5 difficult words in the text and underline them (mark as (A), (B), (C), (D), (E)).
        2. Choose one word used incorrectly in context (create a modified version of the text where one word is swapped with an antonym or irrelevant word) OR ask for the meaning.
        3. Let's stick to "Select the word that is NOT appropriate in context".
        
        Text:
        """
        ${passage}
        """

        Response Format (JSON):
        {
            "question": "Which word is NOT used appropriately in context?",
            "passage_marked": "Text with (A)word1, (B)word2...",
            "options": [
                "(A) word1", "(B) word2", "(C) word3", "(D) word4", "(E) word5"
            ],
            "answer_index": 2,
            "explanation": "Korean explanation"
        }
    `,

    INSERTION: (passage: string) => `
        Task: Create a "Sentence Insertion" question.
        1. Select a key sentence to be removed from the text.
        2. Provide the text with a gap where the sentence was removed.
        3. Provide the removed sentence as the target.
        4. Ask where the target sentence fits best.

        Text:
        """
        ${passage}
        """

        Response Format (JSON):
        {
            "question": "Where does the given sentence best fit?",
            "target_sentence": "The removed sentence...",
            "passage_with_gaps": "Text with [1], [2], [3]...",
            "answer": 3,
            "explanation": "Korean explanation"
        }
    `,

    SUMMARY: (passage: string) => `
        Task: Create a "Summary" question.
        1. Summarize the text in one sentence.
        2. Provide 5 options for the summary.

        Text:
        """
        ${passage}
        """

        Response Format (JSON):
        {
            "question": "Choose the best summary of the passage.",
            "options": ["Summary A", "Summary B", ...],
            "answer_index": 0,
            "explanation": "Why this is the best summary"
        }
    `
};
