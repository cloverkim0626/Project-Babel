import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Crosshair, Hammer, Sparkles, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
// import { supabase } from '../lib/supabase'; // Uncomment when Auth is ready

export type ClassType = 'Challenger' | 'Chaser' | 'Fixer' | 'Coordinator';

interface ClassCardProps {
    type: ClassType;
    title: string;
    korTitle: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    selected: boolean;
    onSelect: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ title, korTitle, description, icon, color, selected, onSelect }) => (
    <div
        onClick={onSelect}
        className={clsx(
            "relative group cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-500 ease-out h-[480px] flex flex-col items-center justify-center p-6 text-center select-none",
            selected ? "border-babel-gold bg-babel-gold/10 scale-105 shadow-[0_0_30px_rgba(212,175,55,0.2)]" : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:scale-[1.02]"
        )}
    >
        {/* Glow Effect */}
        <div className={clsx(
            "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-2xl",
            color === 'red' && "bg-pain",
            color === 'indigo' && "bg-indigo-500",
            color === 'slate' && "bg-slate-400",
            color === 'violet' && "bg-purple-500"
        )} />

        {/* Icon */}
        <div className={clsx(
            "mb-8 p-6 rounded-full border border-white/10 transition-all duration-500 group-hover:rotate-12",
            selected ? "bg-babel-gold text-obsidian scale-110" : "bg-black/50 text-stone-500 group-hover:text-white group-hover:border-white/30"
        )}>
            {icon}
        </div>

        {/* Titles */}
        <div className="space-y-1 mb-4">
            <h3 className={clsx(
                "font-serif text-3xl font-black transition-colors duration-300",
                selected ? "text-babel-gold" : "text-stone-300 group-hover:text-white"
            )}>
                {korTitle}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
                {title}
            </p>
        </div>

        {/* Description */}
        <p className="font-mono text-xs text-stone-500 leading-relaxed max-w-[90%] group-hover:text-stone-300 transition-colors">
            {description}
        </p>

        {/* Selection Indicator */}
        {selected && (
            <div className="absolute top-4 right-4 text-babel-gold animate-fade-in drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                <CheckCircle size={24} />
            </div>
        )}
    </div>
);

const RiteOfSelection: React.FC = () => {
    const navigate = useNavigate();
    const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!selectedClass) return;
        setIsSubmitting(true);

        // TODO: Update Supabase User
        // const { error } = await supabase.from('users').update({ class_type: selectedClass }).eq('id', user.id);

        setTimeout(() => {
            setIsSubmitting(false);
            navigate('/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-babel-gold/5 via-obsidian to-obsidian" />

            <header className="mb-12 text-center relative z-20 space-y-4 animate-fade-in">
                <h2 className="font-mono text-xs text-stone-500 tracking-[0.5em]">RITE OF SELECTION</h2>
                <h1 className="text-4xl md:text-5xl font-serif font-black text-white">
                    운명을 선택하십시오
                </h1>
                <p className="font-mono text-stone-500 text-sm">
                    당신의 본성에 이끌리는 아바타를 선택하십시오.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl relative z-20 animate-fade-in delay-200">
                <ClassCard
                    type="Challenger"
                    korTitle="도전자"
                    title="The Challenger"
                    description="깃발과 지도를 든 붉은 머리의 모험가. 미지의 영역을 개척하며 위험을 기회로 바꿉니다."
                    icon={<Flag size={32} />}
                    color="red"
                    selected={selectedClass === 'Challenger'}
                    onSelect={() => setSelectedClass('Challenger')}
                />
                <ClassCard
                    type="Chaser"
                    korTitle="추적자"
                    title="The Chaser"
                    description="쌍안경과 단검을 든 검은 코트의 추적자. 목표를 끝까지 쫓아 반드시 찾아냅니다."
                    icon={<Crosshair size={32} />}
                    color="indigo"
                    selected={selectedClass === 'Chaser'}
                    onSelect={() => setSelectedClass('Chaser')}
                />
                <ClassCard
                    type="Fixer"
                    korTitle="해결사"
                    title="The Fixer"
                    description="거대한 망치와 방패를 든 중갑의 수호자. 단단한 논리로 문제를 분쇄하고 해결합니다."
                    icon={<Hammer size={32} />}
                    color="slate"
                    selected={selectedClass === 'Fixer'}
                    onSelect={() => setSelectedClass('Fixer')}
                />
                <ClassCard
                    type="Coordinator"
                    korTitle="조율자"
                    title="The Coordinator"
                    description="마도서와 정령을 다루는 은발의 마법사. 혼돈 속에서 조화를 찾아내고 연결합니다."
                    icon={<Sparkles size={32} />}
                    color="violet"
                    selected={selectedClass === 'Coordinator'}
                    onSelect={() => setSelectedClass('Coordinator')}
                />
            </div>

            <div className="mt-16 h-20 flex items-center justify-center relative z-20">
                {selectedClass && (
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="group px-16 py-5 bg-babel-gold text-obsidian font-serif font-black text-xl uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] animate-fade-in"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Soul Binding...</span>
                        ) : (
                            <span className="flex items-center gap-3">
                                운명 수락 <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default RiteOfSelection;
