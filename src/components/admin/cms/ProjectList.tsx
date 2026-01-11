import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, MoreVertical, Calendar, Globe, BookOpen, Layers } from 'lucide-react';
import { ContinentManager } from '../ContinentManager';
import { CreateProjectModal } from '../modals/CreateProjectModal';
import { MissionDistributor } from '../MissionDistributor';

interface Continent {
    id: string;
    name: string;
    display_name: string;
    theme_color: string;
    image_url: string;
    created_at: string;
    isNew?: boolean;
}

export const ProjectList = ({ onCreate: _legacyOnCreate }: { onCreate: () => void }) => {
    const [continents, setContinents] = useState<Continent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchContinents();
    }, []);

    const fetchContinents = async () => {
        const { data, error } = await supabase
            .from('continents')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setContinents(data);
        } else if (error) {
            console.error(error); // Log schema errors
        }
        setLoading(false);
    };

    const handleCreateProject = async (name: string, displayName: string, themeColor: string, _metadata: any) => {
        console.log('[ProjectList] handleCreateProject called:', { name, displayName, themeColor });
        try {
            // Note: metadata column doesn't exist in continents table per schema.sql
            const { data, error } = await supabase.from('continents').insert({
                name,
                display_name: displayName,
                theme_color: themeColor
            }).select().single();

            console.log('[ProjectList] Supabase response:', { data, error });

            if (error) {
                // Ignore AbortErrors - harmless navigation cancellations
                if (error.message?.includes('abort')) return;
                console.error('[ProjectList] Insert error:', error);
                alert("생성 실패: " + error.message);
            } else if (data) {
                console.log('[ProjectList] Project created successfully:', data);
                // Success: Switch to this project immediately
                const newProject = { ...data, isNew: true };
                setContinents(prev => [newProject, ...prev]); // Optimistic update
                setSelectedContinent(newProject);
                setShowCreateModal(false);
            }
        } catch (e: any) {
            // Catch fetch-level AbortErrors
            if (e?.message?.includes('abort') || e?.name === 'AbortError') return;
            console.error('[ProjectList] Caught exception:', e);
            alert("생성 실패: " + e.message);
        }
    };

    const [showDistributor, setShowDistributor] = useState(false);

    if (loading) return <div className="p-8 text-babel-gold animate-pulse text-center font-serif">Loading Archives...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-transparent">
            {showDistributor && (
                <MissionDistributor
                    onClose={() => setShowDistributor(false)}
                />
            )}

            {showCreateModal && (
                <CreateProjectModal
                    onClose={() => setShowCreateModal(false)}
                    onConfirm={handleCreateProject}
                />
            )}

            {selectedContinent && (
                <ContinentManager
                    continent={selectedContinent}
                    initialView={selectedContinent.isNew ? 'add' : 'list'}
                    onClose={() => {
                        setSelectedContinent(null);
                        fetchContinents(); // Refresh list on close
                    }}
                />
            )}

            <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
                        <Globe className="text-babel-gold" /> The Knowledge Repository
                    </h2>
                    <p className="text-stone-500 text-sm">관리할 프로젝트 폴더를 선택하거나 새로 생성하십시오.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDistributor(true)}
                        className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                    >
                        <Layers size={18} /> 빠른 배포 (Quick Distribute)
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-babel-gold hover:bg-yellow-500 text-black px-6 py-3 rounded font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    >
                        <Plus size={18} /> 새 프로젝트 (New Project)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {/* Create New Card */}
                <div
                    onClick={() => setShowCreateModal(true)}
                    className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-babel-gold/50 hover:bg-white/5 transition-all group h-64"
                >
                    <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center group-hover:bg-babel-gold group-hover:text-black transition-colors border border-white/10">
                        <Plus size={32} />
                    </div>
                    <span className="text-stone-500 font-medium group-hover:text-white uppercase tracking-widest text-xs">New Project</span>
                </div>

                {continents.map((cont) => (
                    <div
                        key={cont.id}
                        onClick={() => setSelectedContinent(cont)}
                        className="bg-black border border-white/10 rounded-xl p-0 hover:border-babel-gold transition-all cursor-pointer group relative hover:shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden h-64 flex flex-col"
                    >
                        {/* Cover Image Area */}
                        <div className="h-32 bg-stone-900 border-b border-white/5 relative overflow-hidden">
                            {cont.image_url ? (
                                <img src={cont.image_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black flex items-center justify-center">
                                    <Globe size={48} className="text-white/5" />
                                </div>
                            )}
                            <div className="absolute top-3 right-3">
                                <button className="text-white/50 hover:text-white bg-black/50 rounded-full p-1">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Info Area */}
                        <div className="p-5 flex-1 flex flex-col justify-between bg-stone-900/50">
                            <div>
                                <h3 className="text-white font-serif font-bold text-lg mb-1 truncate group-hover:text-babel-gold transition-colors">{cont.display_name}</h3>
                                <p className="text-xs text-stone-500 font-mono truncate">{cont.name}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] text-stone-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                    <BookOpen size={12} /> Content Lib
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} /> {new Date(cont.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {continents.length === 0 && (
                <div className="mt-12 text-center text-stone-600 font-serif">
                    기록된 프로젝트가 없습니다. (Empty Archive)
                </div>
            )}
        </div>
    );
};
