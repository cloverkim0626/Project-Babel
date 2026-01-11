import { PROMPTS, SYSTEM_PROMPT, type ProblemType } from './PromptTemplates';

export interface GeneratedProblem {
    question: string;
    passage?: string; // Modified passage if needed
    options?: string[];
    answer_index?: number;
    answer?: string; // For non-multiple choice
    explanation: string;
    raw_json?: any;
    box_text?: string; // For order
    segments?: Record<string, string>; // For order
    correct_order?: string[]; // For order
}

// Mock delay to simulate API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateProblem = async (passage: string, type: ProblemType, _apiKey?: string): Promise<GeneratedProblem> => {

    // 1. Construct Prompt
    const userPrompt = PROMPTS[type] ? PROMPTS[type](passage) : PROMPTS['BLANK'](passage);

    console.log(`[AI] Generating ${type} problem...`);
    console.log(`[AI] System Prompt: ${SYSTEM_PROMPT.substring(0, 50)}...`);
    console.log(`[AI] User Prompt: ${userPrompt.substring(0, 50)}...`);

    // 2. Real API Call (Commented out until API Key is provided)
    /*
    if (apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7
                })
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            return JSON.parse(content);
        } catch (error) {
            console.error('API Call Failed:', error);
            throw error;
        }
    }
    */

    // 3. Mock Response (Fallback)
    await delay(2000); // Simulate network detail

    if (type === 'BLANK') {
        return {
            question: "Choose the best word to fill in the blank.",
            passage: passage.replace(/important/i, "________"), // Simple mock replacement
            options: ["trivial", "significant", "minor", "hidden", "absent"],
            answer_index: 1,
            explanation: "The context suggests that the concept is crucial, so 'significant' is the correct synonym for 'important'."
        };
    }

    if (type === 'ORDER') {
        return {
            question: "Which is the correct order of the paragraphs?",
            box_text: passage.substring(0, 50) + "...",
            segments: {
                "A": passage.substring(50, 150) + "...",
                "B": passage.substring(150, 250) + "...",
                "C": passage.substring(250) + "..."
            },
            correct_order: ["C", "A", "B"],
            explanation: "Paragraph (C) introduces the topic, (A) gives an example, and (B) concludes it."
        };
    }

    // Default Vocab/Other
    return {
        question: "Which word is NOT appropriate in context?",
        passage: passage,
        options: ["(A) good", "(B) bad", "(C) happy", "(D) sad", "(E) fast"],
        answer_index: 2,
        explanation: "In this context, 'happy' contradicts the overall gloomy tone."
    };
};
