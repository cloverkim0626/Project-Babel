import React from 'react';
import { X, BookOpen, Volume2, Database } from 'lucide-react';

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
            {/* Liquid Backdrop */}
            <div
                className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl max-h-[80vh] abyss-glass flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.1)] border border-cyan-500/20 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="shrink-0 p-6 border-b border-white/5 bg-slate-900/50 flex items-center justify-between relative z-10">
                    <div>
                        <h2 className="text-2xl text-cinematic flex items-center gap-3 drop-shadow-md">
                            <Database size={24} className="text-cyan-500" />
                            FRAGMENT ANALYSIS
                        </h2>
                        <p className="text-xs text-cyan-500/60 mt-1 uppercase tracking-widest pl-1 font-mono">
                            Source: {questTitle}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-red-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-slate-950/30">
                    {words.length === 0 ? (
                        <div className="text-center py-20 text-slate-600">
                            <BookOpen size={64} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-mono tracking-widest">DATA CORRUPTED // EMPTY</p>
                        </div>
                    ) : (
                        words.map((word, index) => (
                            <div
                                key={index}
                                className="group relative bg-slate-900/40 border border-white/5 p-5 rounded-lg hover:border-cyan-500/30 hover:bg-slate-900/60 transition-all duration-300"
                            >
                                <div className="absolute top-4 right-4 text-[10px] text-slate-600 font-mono group-hover:text-cyan-500/50">
                                    SEQ_ID: 00{index + 1}
                                </div>

                                <div className="flex items-start gap-6">
                                    <div className="text-2xl font-serif text-slate-200 group-hover:text-cyan-400 transition-colors font-bold tracking-wide">
                                        {word.word}
                                    </div>
                                </div>
                                <div className="mt-2 pl-1 border-l-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors">
                                    <p className="text-slate-400 text-sm pl-3">{word.meaning}</p>
                                    {word.example && (
                                        <p className="text-slate-500 text-xs pl-3 mt-1 italic font-serif">
                                            "{word.example}"
                                        </p>
                                    )}
                                </div>

                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-cyan-500 hover:text-white transition-colors">
                                        <Volume2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 p-4 border-t border-white/5 bg-slate-950/50 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>Total Fragments: {words.length}</span>
                    <span className="text-cyan-900">End of File</span>
                </div>
            </div>
        </div>
    );
};
