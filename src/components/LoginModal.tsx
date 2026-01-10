import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
// import { supabase } from '../lib/supabase'; // Uncomment when Auth is real

interface LoginModalProps {
    onLoginSuccess: (isNewUser: boolean) => void;
}

// Background images for Class Preview
const CLASS_PREVIEWS = [
    { name: '도전자 (The Challenger)', color: 'bg-red-500/10', text: 'text-red-500', url: 'https://images.unsplash.com/photo-1542259681-dadcd731560b?q=80&w=2669&auto=format&fit=crop' },
    { name: '추적자 (The Chaser)', color: 'bg-indigo-500/10', text: 'text-indigo-500', url: 'https://images.unsplash.com/photo-1552084117-5635e80c9e46?q=80&w=2669&auto=format&fit=crop' },
    { name: '해결사 (The Fixer)', color: 'bg-slate-500/10', text: 'text-slate-400', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop' },
    { name: '조율자 (The Coordinator)', color: 'bg-violet-500/10', text: 'text-violet-500', url: 'https://images.unsplash.com/photo-1506509531818-4e8913d395a1?q=80&w=2670&auto=format&fit=crop' }
];

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    // Cycle through visual themes in background
    useEffect(() => {
        const interval = setInterval(() => {
            setPreviewIndex(prev => (prev + 1) % CLASS_PREVIEWS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // TODO: Actual Supabase Auth
        // const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        // Mock Login Delay -> Simulate New User (to show Selection)
        setTimeout(() => {
            setLoading(false);
            onLoginSuccess(true); // Always force New User flow for demo
        }, 1500);
    };

    const currentTheme = CLASS_PREVIEWS[previewIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-obsidian">
            {/* Dynamic Background Carousel */}
            <div className="absolute inset-0 transition-all duration-1000 ease-in-out">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-20"
                    style={{ backgroundImage: `url(${currentTheme.url})` }}
                />
                <div className={clsx("absolute inset-0 bg-gradient-to-b from-obsidian/80 via-obsidian/40 to-obsidian transition-colors duration-1000", currentTheme.color)} />
            </div>

            {/* Login Frame */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl animate-fade-in mx-4">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-serif font-bold text-white mb-2">Identify Yourself</h2>
                    <p className="font-mono text-xs text-stone-400">Class Alpha: <span className={clsx("font-bold transition-colors duration-500", currentTheme.text)}>{currentTheme.name}</span></p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <input
                            type="email"
                            placeholder="EMAIL ACCESS KEY"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-4 text-paper font-mono focus:border-babel-gold focus:outline-none placeholder:text-stone-600 transition-colors"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="PASSPHRASE"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-4 text-paper font-mono focus:border-babel-gold focus:outline-none placeholder:text-stone-600 transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-babel-gold text-obsidian font-bold font-serif uppercase tracking-widest hover:bg-yellow-600 transition-all disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Connect"}
                    </button>

                    <div className="flex justify-between text-[10px] font-mono text-stone-500 uppercase">
                        <span className="hover:text-babel-gold cursor-pointer transition-colors">Create Logic Node</span>
                        <span className="hover:text-babel-gold cursor-pointer transition-colors">Forgot Passphrase?</span>
                    </div>
                </form>
            </div>
        </div>
    );
};
