import React, { useState } from 'react';
import { BookOpen, Users, FileText, Settings, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import { ProjectList } from '../components/admin/cms/ProjectList';
import { ProjectWizard } from '../components/admin/cms/ProjectWizard';

// Placeholder Components
const StudentManager = () => <div className="p-8 text-stone-400">Student Database Component (Coming Soon)</div>;
const PaperTestBuilder = () => <div className="p-8 text-stone-400">Paper Test Builder (Coming Soon)</div>;

export default function TeacherDashboard() {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'projects' | 'students' | 'print' | 'settings'>('projects');
    const [showWizard, setShowWizard] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-stone-900 text-stone-200 font-sans flex text-sm">
            {/* Sidebar */}
            <aside className="w-64 bg-black border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-serif text-babel-gold tracking-widest">BABEL<span className="text-stone-500 text-xs block mt-1 font-sans">Control Tower</span></h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
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
                    <div className="pt-4 mt-4 border-t border-white/10">
                        <SidebarItem
                            icon={<Settings size={18} />}
                            label="Settings"
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                        />
                    </div>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 text-stone-500 hover:text-red-400 transition-colors w-full px-4 py-2"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-stone-950">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-stone-900/50 backdrop-blur-sm">
                    <h2 className="text-lg font-medium text-white">
                        {activeTab === 'projects' && 'Project Management'}
                        {activeTab === 'students' && 'Student Database'}
                        {activeTab === 'print' && 'Paper Test Generator'}
                        {activeTab === 'settings' && 'System Configuration'}
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span>Instructor Mode</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                </header>

                <div className="flex-1 overflow-auto">
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
                    {activeTab === 'students' && <StudentManager />}
                    {activeTab === 'print' && <PaperTestBuilder />}
                    {activeTab === 'settings' && <div className="p-8">Settings</div>}
                </div>
            </main>
        </div>
    );
}

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            active ? "bg-babel-gold/10 text-babel-gold border border-babel-gold/20" : "text-stone-400 hover:bg-white/5 hover:text-stone-200"
        )}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);
