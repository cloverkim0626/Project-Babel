import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameEngine } from '../hooks/useGameEngine';
import { splitQuest } from '../utils/questSplitter';
import { Shield, BookOpen, Save, Calendar, DollarSign, FileText, Check, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function TeacherDashboard() {
    const { role } = useAuth();
    const navigate = useNavigate();
    const { refundRequests, processRefund } = useGameEngine();

    // Redirect if not master
    React.useEffect(() => {
        if (role !== 'master') {
            navigate('/dashboard');
        }
    }, [role, navigate]);

    // Form State
    const [questTitle, setQuestTitle] = useState('');
    const [rawText, setRawText] = useState('');
    const [deadlineDays, setDeadlineDays] = useState(3);
    const [rewardPoints, setRewardPoints] = useState(100);
    const [previewSets, setPreviewSets] = useState<any[]>([]);

    // Statistics Mock
    const stats = {
        totalStudents: 42,
        activeQuests: 3,
        dangerZoneStudents: 5
    };

    const handlePreview = () => {
        // Mock word count by spaces
        const wordCount = rawText.trim().split(/\s+/).length;
        const sets = splitQuest(wordCount);
        setPreviewSets(sets);
    };

    const handleDeploy = () => {
        if (!questTitle || !rawText) return;
        alert(`Deploying Quest: ${questTitle}\nTarget: All Students\nSets: ${previewSets.length}\nReward: ${rewardPoints} pts`);
        // Here we would call Supabase insert
        setQuestTitle('');
        setRawText('');
        setPreviewSets([]);
    };

    return (
        <div className="min-h-screen bg-obsidian text-paper font-mono p-4 md:p-8">
            <header className="flex items-center justify-between border-b border-purple-500/30 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-purple-400 flex items-center gap-3">
                        <Shield className="fill-current" />
                        Control Tower
                    </h1>
                    <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">
                        Administrator Access Level: Alpha
                    </p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="px-4 py-2 bg-purple-900/20 border border-purple-500/30 rounded text-purple-300">
                        Active Students: <span className="text-white font-bold">{stats.totalStudents}</span>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">
                        [Exit to Student View]
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quest Creator Panel */}
                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                            <BookOpen size={20} className="text-babel-gold" />
                            Quest Architect
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Quest Title</label>
                                <input
                                    type="text"
                                    value={questTitle}
                                    onChange={(e) => setQuestTitle(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors"
                                    placeholder="e.g., Week 2: The Crossing"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                                        <Calendar size={12} /> Deadline (Days)
                                    </label>
                                    <input
                                        type="number"
                                        value={deadlineDays}
                                        onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
                                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                                        <DollarSign size={12} /> Reward (Pts)
                                    </label>
                                    <input
                                        type="number"
                                        value={rewardPoints}
                                        onChange={(e) => setRewardPoints(parseInt(e.target.value))}
                                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                                    <FileText size={12} /> Raw Data Source (Words)
                                </label>
                                <textarea
                                    value={rawText}
                                    onChange={(e) => {
                                        setRawText(e.target.value);
                                        // Auto-preview logic could go here
                                    }}
                                    onBlur={handlePreview}
                                    className="w-full h-40 bg-black border border-white/20 rounded p-3 text-xs font-mono text-stone-300 focus:border-purple-500 outline-none resize-none"
                                    placeholder="Paste word list or text content here..."
                                />
                                <div className="text-right text-[10px] text-stone-600 mt-1">
                                    {rawText.length > 0 ? `${rawText.trim().split(/\s+/).length} words detected` : 'Waiting for input...'}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={handlePreview}
                                    className="px-4 py-2 bg-stone-800 text-stone-300 rounded hover:bg-stone-700 transition-colors text-xs uppercase tracking-widest"
                                >
                                    Analyze & Preview
                                </button>
                                <button
                                    onClick={handleDeploy}
                                    disabled={!questTitle || !rawText}
                                    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors text-xs uppercase tracking-widest font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Save size={14} /> Deploy to World
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview & Monitor Panel */}
                <div className="space-y-6">
                    {/* Preview Section */}
                    {previewSets.length > 0 && (
                        <div className="bg-black/40 border border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-sm font-bold text-stone-400 mb-4 uppercase tracking-widest">
                                Extraction Preview
                            </h3>
                            <div className="space-y-2">
                                {previewSets.map((set) => (
                                    <div key={set.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                                                {set.index}
                                            </div>
                                            <div className="text-xs text-stone-300">
                                                Quest Sequence #{set.index}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-stone-500 font-mono">
                                            ~ {set.wordCount} Words
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded text-center">
                                <p className="text-xs text-green-400">
                                    System Ready: {previewSets.length} Sets will be generated.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Refund Requests Monitor */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-stone-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                            <DollarSign size={14} className="text-green-500" /> Refund Requests (Cash Out)
                        </h3>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {refundRequests.length === 0 ? (
                                <div className="text-xs text-stone-600 italic text-center py-8">No pending requests</div>
                            ) : (
                                refundRequests.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10 hover:border-white/20 transition-colors">
                                        <div>
                                            <div className="text-xs font-bold text-white mb-1">{req.user}</div>
                                            <div className="text-[10px] text-stone-500 uppercase tracking-widest">{req.amount} Pts • {new Date(req.date).toLocaleDateString()}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {req.status === 'pending' ? (
                                                <>
                                                    <button onClick={() => processRefund(req.id, true)} className="p-1 hover:bg-green-500/20 text-green-500 rounded"><Check size={14} /></button>
                                                    <button onClick={() => processRefund(req.id, false)} className="p-1 hover:bg-red-500/20 text-red-500 rounded"><X size={14} /></button>
                                                </>
                                            ) : (
                                                <span className={clsx(
                                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                                                    req.status === 'approved' ? "bg-green-900/30 text-green-500" : "bg-red-900/30 text-red-500"
                                                )}>
                                                    {req.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
