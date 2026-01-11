import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Users, FileText, Settings, LogOut, Anchor, Compass } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import { AdminOverview } from '../components/admin/AdminOverview';
import { StudentMonitor } from '../components/admin/StudentMonitor';
import { ProjectList } from '../components/admin/cms/ProjectList';
import { ProjectWizard } from '../components/admin/cms/ProjectWizard';

// Placeholder Components
const PaperTestBuilder = () => <div className="p-8 text-slate-500 text-center uppercase tracking-widest border border-dashed border-slate-800 rounded-lg">Paper Test Builder (Coming Soon)</div>;


export default function TeacherDashboard() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'students' | 'print' | 'settings'>('overview');
    const [showWizard, setShowWizard] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex text-sm relative overflow-hidden">
            <div className="caustic-overlay" />

            {/* Sidebar (Abyss Style) */}
            <aside className="w-64 bg-slate-950/80 backdrop-blur-md border-r border-white/5 flex flex-col z-20">
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-bold text-cinematic tracking-widest mb-1 flex items-center gap-2">
                        <Anchor size={20} className="text-cyan-500" />
                        ABYSS ADMIN
                    </h1>
                    <span className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em] block">Control Tower</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem
                        icon={<LayoutDashboard size={18} />}
                        label="Overview (관제탑)"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <SidebarItem
                        icon={<BookOpen size={18} />}
                        label="Projects (작전 설계)"
                        active={activeTab === 'projects'}
                        onClick={() => setActiveTab('projects')}
                    />
                    <SidebarItem
                        icon={<Users size={18} />}
                        label="Students (대원 관리)"
                        active={activeTab === 'students'}
                        onClick={() => setActiveTab('students')}
                    />
                    <SidebarItem
                        icon={<FileText size={18} />}
                        label="Paper Tech (문서화)"
                        active={activeTab === 'print'}
                        onClick={() => setActiveTab('print')}
                    />
                    <div className="pt-4 mt-4 border-t border-white/5">
                        <SidebarItem
                            icon={<Settings size={18} />}
                            label="Configuration"
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                        />
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all w-full px-4 py-3 rounded-lg font-bold tracking-wider text-xs uppercase"
                    >
                        <LogOut size={16} />
                        <span>Emergency Surface</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
                <header className="h-16 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-sm border-b border-white/5">
                    <h2 className="text-lg font-bold text-slate-200 tracking-wide flex items-center gap-2">
                        <Compass size={18} className="text-cyan-500" />
                        {activeTab === 'overview' && 'Status Overview'}
                        {activeTab === 'projects' && 'Operation Management'}
                        {activeTab === 'students' && 'Diver Database'}
                        {activeTab === 'print' && 'Paper Test Generator'}
                        {activeTab === 'settings' && 'System Configuration'}
                    </h2>
                    <div className="flex items-center gap-4 text-xs font-mono text-cyan-500/70">
                        <span className="uppercase tracking-widest">System Normal</span>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 scrollbar-hide">
                    {activeTab === 'overview' && <AdminOverview />}
                    {activeTab === 'projects' && (
                        showWizard ? (
                            <div className="p-8">
                                <ProjectWizard
                                    onCancel={() => setShowWizard(false)}
                                    onComplete={() => setShowWizard(false)}
                                />
                            </div>
                        ) : (
                            <ProjectList onCreate={() => setShowWizard(true)} />
                        )
                    )}
                    {activeTab === 'students' && <StudentMonitor />}
                    {activeTab === 'print' && <PaperTestBuilder />}
                    {activeTab === 'settings' && <div className="p-12 text-center text-slate-500 border border-white/10 rounded-xl">System calibration locked by Master Architect.</div>}
                </div>
            </main>
        </div>
    );
}

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
            active
                ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
        )}
    >
        {icon}
        <span className={clsx("font-medium tracking-wide", active ? "font-bold" : "")}>{label}</span>
    </button>
);
