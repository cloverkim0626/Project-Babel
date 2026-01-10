import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameEngine } from '../hooks/useGameEngine';
import { Shield, DollarSign, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ContinentManager } from '../components/admin/ContinentManager';
import { QuestArchitect } from '../components/admin/QuestArchitect';
import { StudentMonitor } from '../components/admin/StudentMonitor';

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

    // Statistics Mock (Keep for now)
    const stats = {
        totalStudents: 42,
        activeQuests: 3,
        dangerZoneStudents: 5
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
                {/* Quest Creator Panel is now split into specific managers */}
                <div className="space-y-8">
                    <ContinentManager />
                    <QuestArchitect />
                </div>

                {/* Right Column: Student Monitor & Refunds */}
                <div className="space-y-8">
                    <StudentMonitor />

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
