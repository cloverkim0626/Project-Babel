import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Zap, CheckCircle, XCircle } from 'lucide-react';

const MissionPlay: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Mock State for Prototype
    const [progress, setProgress] = useState(0);
    const [answer, setAnswer] = useState('');

    return (
        <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                <button onClick={() => navigate(-1)} className="text-stone-400 hover:text-white transition-colors flex items-center gap-2">
                    <ArrowLeft size={20} /> ABORT
                </button>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1 text-red-500"><Heart size={20} fill="currentColor" /> 3</div>
                    <div className="flex items-center gap-1 text-yellow-500"><Zap size={20} fill="currentColor" /> 1050</div>
                </div>
            </div>

            {/* Main Quiz Area */}
            <div className="max-w-2xl w-full space-y-12 text-center">
                <div className="space-y-4">
                    <div className="text-sm text-babel-gold uppercase tracking-[0.3em]">Synapse Link Establishing...</div>
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-shadow-glow">Ephemeral</h1>
                    <div className="h-1 w-32 bg-babel-gold mx-auto" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['단명하는, 덧없는', '영원불멸의', '강력한, 압도적인', '신비로운, 알 수 없는'].map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => alert("Correct! (Mock)")}
                            className="p-6 border border-white/20 hover:border-babel-gold hover:bg-babel-gold/10 rounded-lg transition-all text-lg hover:scale-105 active:scale-95"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="fixed bottom-0 left-0 w-full h-2 bg-stone-900">
                <div className="h-full bg-babel-gold w-[30%]" />
            </div>
        </div>
    );
};

export default MissionPlay;
