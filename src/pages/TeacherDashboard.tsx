import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Users, FileText, Settings, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import { AdminOverview } from '../components/admin/AdminOverview';
import { StudentMonitor } from '../components/admin/StudentMonitor';
import { ProjectList } from '../components/admin/cms/ProjectList';
import { ProjectWizard } from '../components/admin/cms/ProjectWizard';

// Placeholder Components
const PaperTestBuilder = () => <div className="p-8 text-stone-400">Paper Test Builder (Coming Soon)</div>;


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
        <div className="min-h-screen ancient-bg text-[#292524] font-serif flex text-sm">
            {/* Sidebar (Wood & Leather) */}
            <aside className="w-64 ancient-sidebar flex flex-col shadow-2xl z-20">
                <div className="p-6 border-b border-[#451a03]/30">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#d97706] tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        VOCA UNIVERSE
                        <span className="text-[#a8a29e] text-xs block mt-1 font-sans tracking-normal font-normal opacity-80">The Observatory</span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem
                        icon={<LayoutDashboard size={18} />}
                        label="Overview"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <SidebarItem
                        icon={<BookOpen size={18} />}
                        label="Project Manager"
                        active={activeTab === 'projects'}
                        onClick={() => setActiveTab('projects')}
                    />
                    <SidebarItem
                        icon={<Users size={18} />}
                        label="Student DB"
                        active={activeTab === 'students'}
                        onClick={() => setActiveTab('students')}
                    />
                    <SidebarItem
                        icon={<FileText size={18} />}
                        label="Paper Test"
                        active={activeTab === 'print'}
                        onClick={() => setActiveTab('print')}
                    />
                    <div className="pt-4 mt-4 border-t border-[#451a03]/30">
                        <SidebarItem
                            icon={<Settings size={18} />}
                            label="Settings"
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                        />
                    </div>
                </nav>

                <div className="p-4 border-t border-[#451a03]/30">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 text-[#78350f] hover:text-[#b45309] transition-colors w-full px-4 py-2 font-bold"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content (Transparent to show Desk) */}
            <main className="flex-1 flex flex-col relative z-10">
                <header className="h-16 flex items-center justify-between px-8 bg-[#0c0a09]/40 backdrop-blur-sm border-b border-[#78350f]/30 shadow-lg">
                    <h2 className="text-xl font-bold text-[#eaddcf] text-glow-gold tracking-wide">
                        {activeTab === 'overview' && 'Dashboard Overview'}
                        {activeTab === 'projects' && 'Project Management'}
                        {activeTab === 'students' && 'Student Database'}
                        {activeTab === 'print' && 'Paper Test Generator'}
                        {activeTab === 'settings' && 'System Configuration'}
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-[#a8a29e]">
                        <span>Instructor Mode</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
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
                    {activeTab === 'settings' && <div className="p-8 ancient-card text-[#eaddcf]">Settings Window (Under Construction)</div>}
                </div>
            </main>
        </div>
    );
}

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-300 border-l-2",
            active
                ? "ancient-menu-active"
                : "border-transparent text-[#a8a29e] hover:text-[#fbbf24] hover:bg-[#0c0a09]/30"
        )}
    >
        {icon}
        <span className={clsx("font-medium", active ? "font-bold" : "")}>{label}</span>
    </button>
);
