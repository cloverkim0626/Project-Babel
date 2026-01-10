
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Folder, Plus, MoreVertical, Calendar, BookOpen, FileText, Layers } from 'lucide-react';
import { MissionDistributor } from '../MissionDistributor';

interface Mission {
    id: string;
    title: string;
    category: 'textbook' | 'mock' | 'custom';
    metadata: any;
    total_sets: number;
    created_at: string;
}

export const ProjectList = ({ onCreate }: { onCreate: () => void }) => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        const { data, error } = await supabase
            .from('missions')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMissions(data as any);
        }
        setLoading(false);
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'textbook': return <BookOpen size={24} className="text-blue-400" />;
            case 'mock': return <FileText size={24} className="text-red-400" />;
            default: return <Folder size={24} className="text-babel-gold" />;
        }
    };

    const [showDistributor, setShowDistributor] = useState(false);

    if (loading) return <div className="p-8 text-stone-500 animate-pulse">Loading Projects...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {showDistributor && <MissionDistributor onClose={() => setShowDistributor(false)} />}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-serif text-white mb-2">My Projects</h2>
                    <p className="text-stone-500 text-sm">Manage your curriculum folders or distribute assignments.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDistributor(true)}
                        className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors border border-white/10"
                    >
                        <Layers size={18} /> Distribute Mission
                    </button>
                    <button
                        onClick={onCreate}
                        className="bg-babel-gold hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> New Project
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Create New Placeholder */}
                <div
                    onClick={onCreate}
                    className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-babel-gold/50 hover:bg-white/5 transition-all group h-48"
                >
                    <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center group-hover:bg-babel-gold group-hover:text-black transition-colors">
                        <Plus size={24} />
                    </div>
                    <span className="text-stone-500 font-medium group-hover:text-white">Create New</span>
                </div>

                {missions.map((mission) => (
                    <div key={mission.id} className="bg-stone-900 border border-white/10 rounded-xl p-5 hover:border-babel-gold/30 transition-all cursor-pointer group relative hover:shadow-lg hover:shadow-black/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black rounded-lg border border-white/5">
                                {getIcon(mission.category)}
                            </div>
                            <button className="text-stone-600 hover:text-white">
                                <MoreVertical size={16} />
                            </button>
                        </div>

                        <h3 className="text-white font-bold text-lg mb-1 truncate">{mission.title}</h3>

                        <div className="text-xs text-stone-500 mb-4 h-10 overflow-hidden">
                            {mission.metadata?.publisher && <span className="mr-2">[{mission.metadata.publisher}]</span>}
                            {mission.metadata?.subject && <span>{mission.metadata.subject}</span>}
                            {mission.metadata?.year && <span>{mission.metadata.year}년 {mission.metadata.month}월</span>}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                                <Folder size={12} /> {mission.total_sets} Sets
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={12} /> {new Date(mission.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {missions.length === 0 && (
                <div className="mt-12 text-center text-stone-600">
                    No folders yet. Start by creating a project.
                </div>
            )}
        </div>
    );
};
