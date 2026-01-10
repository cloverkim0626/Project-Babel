import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Timer, AlertTriangle, CheckCircle, XCircle, Sparkles, Book } from 'lucide-react';

interface Question {
    id: string;
    word: string;
    meaning: string;
    distractors: string[];
    correctStreak: number; // Mocked property for Crystallization logic
}

// Mock Data Pool with Varied Streaks to demonstrate Crystallization
const MOCK_POOL: Question[] = Array.from({ length: 100 }, (_, i) => ({
    id: `w-${i}`,
    word: i % 3 === 0 ? `Crystallizable Concept ${i}` : `Abstruse ${i}`, // Every 3rd word is ready to crystallize
    meaning: `Difficult to understand ${i}`,
    distractors: [`Easy ${i}`, `Clear ${i}`, `Simple ${i}`, `Obvious ${i}`],
    correctStreak: i % 3 === 0 ? 2 : 0 // If streak is 2, next correct makes it 3 -> Crystal
}));

interface TestEngineProps {
    onComplete: (results: { correct: number; failed: string[] }) => void;
    onExit: () => void;
}

export const TestEngine: React.FC<TestEngineProps> = ({ onComplete, onExit }) => {
    // Game State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(120);
    const [mistakes, setMistakes] = useState<Question[]>([]);
    const [isOxMode, setIsOxMode] = useState(false);
    const [isFailed, setIsFailed] = useState(false);

    // UI State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [crystallizeAnim, setCrystallizeAnim] = useState(false); // Triggers "Omniscience" effect

    // Initialization
    useEffect(() => {
        const shuffled = [...MOCK_POOL].sort(() => 0.5 - Math.random()).slice(0, 20);
        setQuestions(shuffled);
    }, []);

    // Timer
    useEffect(() => {
        if (timeLeft <= 0 || isFailed || feedback || crystallizeAnim) return; // Pause timer during anims
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isFailed, feedback, crystallizeAnim]);

    // Timeout Fail
    useEffect(() => {
        if (timeLeft === 0 && !isFailed) handleFail("Time Expired");
    }, [timeLeft]);

    const handleFail = (reason: string) => setIsFailed(true);

    const handleAnswer = (answer: string) => {
        if (feedback) return;

        setSelectedOption(answer);
        const currentQ = questions[currentIndex];
        const isCorrect = answer === currentQ.meaning;

        if (isCorrect) {
            setFeedback('correct');
            // Check for Crystallization (Streak 2 -> 3)
            if (currentQ.correctStreak >= 2) {
                setTimeout(() => triggerCrystallization(), 500);
            } else {
                setTimeout(nextQuestion, 600);
            }
        } else {
            console.log("Wrong Answer: Reset streak");
            setFeedback('wrong');
            const newMistakes = [...mistakes, currentQ];
            setMistakes(newMistakes);

            if (!isOxMode && newMistakes.length >= 3) {
                setTimeout(() => handleFail("Too Many Errors"), 1000);
            } else {
                setTimeout(nextQuestion, 800);
            }
        }
    };

    const triggerCrystallization = () => {
        setCrystallizeAnim(true);
        // Reset after animation matches CSS duration
        setTimeout(() => {
            setCrystallizeAnim(false);
            nextQuestion();
        }, 2000);
    };

    const nextQuestion = () => {
        setFeedback(null);
        setSelectedOption(null);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            checkCompletion();
        }
    };

    const checkCompletion = () => {
        if (mistakes.length > 0 && mistakes.length < 3 && !isOxMode) {
            alert("Protocol: Near Miss. Review Errors.");
            setIsOxMode(true);
        } else {
            onComplete({ correct: 20 - mistakes.length, failed: mistakes.map(m => m.word) });
        }
    };

    if (isFailed) return <div className="text-pain text-center p-10 animate-pulse">MISSION FAILED</div>;
    if (questions.length === 0) return <div>Loading...</div>;

    const currentQ = questions[currentIndex];
    const options = [...currentQ.distractors, currentQ.meaning].sort(() => 0.5 - Math.random());

    return (
        <div className={clsx(
            "w-full max-w-2xl mx-auto p-6 transition-all duration-700 relative overflow-hidden rounded-xl",
            // Crystallization Effect: Golden Border & Glow
            crystallizeAnim ? "bg-black/90 border-[3px] border-babel-gold shadow-[0_0_100px_rgba(212,175,55,0.5)] scale-105" : "bg-black/80 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        )}>
            {/* Crystallization Overlay */}
            {crystallizeAnim && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-500">
                    <Book size={64} className="text-babel-gold animate-bounce mb-4" />
                    <Sparkles size={48} className="text-yellow-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" />
                    <h2 className="text-2xl font-serif text-babel-gold font-bold tracking-widest text-shadow-gold">OMNISCIENCE ACHIEVED</h2>
                    <p className="text-stone-300 font-mono text-xs mt-2">Word permanently crystallized in the Archive.</p>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <span className="font-mono text-xs text-stone-500">Q.{currentIndex + 1} / {questions.length}</span>
                <div className={clsx("flex items-center gap-2 font-mono font-bold", timeLeft < 30 ? "text-pain" : "text-babel-gold")}>
                    <Timer size={20} />
                    <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
            </div>

            {/* Question */}
            <div className="mb-12 text-center">
                {/* Visual Cue for 'Ready to Crystallize' */}
                {currentQ.correctStreak >= 2 && !crystallizeAnim && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-yellow-500 border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 rounded mb-2 animate-pulse">
                        <Sparkles size={10} /> Crystallization Ready
                    </div>
                )}

                <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-2 tracking-tight">
                    {currentQ.word}
                </h1>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-4">
                {options.map((opt, idx) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === currentQ.meaning;

                    let btnStyle = "border-white/10 hover:border-babel-gold/50 text-stone-300";
                    if (feedback === 'correct' && isCorrect) btnStyle = "bg-green-500/20 border-green-500 text-green-400";
                    if (feedback === 'wrong' && isSelected) btnStyle = "bg-pain/20 border-pain text-pain";

                    return (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(opt)}
                            disabled={!!feedback || crystallizeAnim}
                            className={clsx("py-4 px-6 border rounded-lg text-lg font-serif transition-all text-left group", btnStyle)}
                        >
                            <span className="flex items-center justify-between">
                                {opt}
                                {feedback === 'correct' && isCorrect && <CheckCircle size={20} />}
                                {feedback === 'wrong' && isSelected && <XCircle size={20} />}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 text-center">
                <button onClick={onExit} className="text-stone-600 text-xs uppercase tracking-widest hover:text-white">Forgive Protocol</button>
            </div>
        </div>
    );
};
