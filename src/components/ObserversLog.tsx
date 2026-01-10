import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface Stats {
    accuracy: number;
    speed: number;
    persistence: number;
    knowledge: number;
    planning: number;
    trust: number;
}

interface ObserversLogProps {
    stats: Stats;
}

export const ObserversLog: React.FC<ObserversLogProps> = ({ stats }) => {
    const data = [
        { subject: '정확도 (Acc)', A: stats.accuracy, fullMark: 100 },
        { subject: '속도 (Spd)', A: stats.speed, fullMark: 100 },
        { subject: '끈기 (Vit)', A: stats.persistence, fullMark: 100 },
        { subject: '지식 (Int)', A: stats.knowledge, fullMark: 100 },
        { subject: '계획 (Plan)', A: stats.planning, fullMark: 100 },
        { subject: '신뢰 (Trust)', A: stats.trust, fullMark: 100 },
    ];

    return (
        <div className="w-full relative" style={{ height: '300px' }}>
            {/* Holographic Container Frame */}
            <div className="absolute inset-0 border border-babel-gold/20 bg-babel-gold/5 rounded-xl backdrop-blur-sm -z-10" />
            <div className="absolute top-0 left-0 p-2 text-[10px] font-mono text-babel-gold tracking-widest border-b border-r border-babel-gold/20 rounded-tl-xl">
                능력치 분석 (Observer)
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    />
                    <Radar
                        name="Stats"
                        dataKey="A"
                        stroke="#D4AF37"
                        strokeWidth={2}
                        fill="#D4AF37"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
