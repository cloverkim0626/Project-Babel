import React from 'react';
import { X, BookOpen, Volume2 } from 'lucide-react';

interface Word {
    word: string;
    meaning: string;
    example?: string;
}

interface VocabReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    questTitle: string;
    words: Word[];
}

export const VocabReviewModal: React.FC<VocabReviewModalProps> = ({
    isOpen,
    onClose,
    questTitle,
    words
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-stone-900 border border-babel-gold/30 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-stone-900 border-b border-white/10 p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-serif text-babel-gold flex items-center gap-2">
                            <BookOpen size={20} />
                            단어장 (Vocabulary Review)
                        </h2>
                        <p className="text-xs text-stone-500 mt-1">{questTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-stone-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Word List */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
                    {words.length === 0 ? (
                        <div className="text-center py-12 text-stone-500">
                            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                            <p>단어 데이터가 없습니다</p>
                        </div>
                    ) : (
                        words.map((word, index) => (
                            <div
                                key={index}
                                className="bg-black/40 border border-white/10 rounded-xl p-4 hover:border-babel-gold/30 transition-colors group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-lg font-bold text-white group-hover:text-babel-gold transition-colors">
                                                {word.word}
                                            </span>
                                            <button className="p-1 hover:bg-white/10 rounded text-stone-500 hover:text-babel-gold transition-colors">
                                                <Volume2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-stone-400 text-sm">{word.meaning}</p>
                                        {word.example && (
                                            <p className="text-stone-600 text-xs mt-2 italic">
                                                "{word.example}"
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-stone-600 font-mono">#{index + 1}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-stone-900 border-t border-white/10 p-4 flex justify-between items-center">
                    <span className="text-xs text-stone-500">
                        총 {words.length}개 단어
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-babel-gold text-black text-sm font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};
