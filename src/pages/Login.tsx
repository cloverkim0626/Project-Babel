import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nickname: email.split('@')[0], // Default nickname
                            class_type: 'Challenger' // Default class
                        }
                    }
                });
                if (error) throw error;
                alert('Sign up successful! You can now log in.');
                setMode('signin');
            } else {
                const { data: { session }, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;

                // Fetch Role to determine redirect
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (profile?.role === 'master' || profile?.role === 'admin') {
                        navigate('/admin');
                    } else {
                        navigate('/dashboard');
                    }
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymous = async () => {
        setLoading(true);
        const demoEmail = 'student@babel.com';
        const demoPassword = 'password123';

        try {
            // 1. Try Login
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: demoEmail,
                password: demoPassword
            });

            if (signInError) {
                // 2. If Login fails, Try Sign Up (Auto-create Demo Account)
                console.log("Demo account not found, creating...");
                const { error: signUpError } = await supabase.auth.signUp({
                    email: demoEmail,
                    password: demoPassword,
                    options: {
                        data: {
                            nickname: 'Demo Student',
                            class_type: 'Challenger'
                        }
                    }
                });

                if (signUpError) {
                    throw new Error("Demo creation failed. Please disable 'Confirm Email' in Supabase!");
                }

                // If signup success (and email confirm is OFF), logic falls through or we auto-login? 
                // Usually signUp returns session if auto-confirm is on.
                // Let's retry login just to be safe or check session.
                const { error: retryError } = await supabase.auth.signInWithPassword({
                    email: demoEmail,
                    password: demoPassword
                });
                if (retryError) {
                    // Likely "Email not confirmed"
                    alert("User created but email not confirmed. Go to Supabase -> Auth -> Providers -> Email -> Disable 'Confirm Email'.");
                    return;
                }
                navigate('/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian flex items-center justify-center p-4 font-mono text-paper relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black -z-10" />
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="w-full max-w-md bg-black/60 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl relative">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-babel-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-babel-gold/30">
                        <Shield className="text-babel-gold w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-serif text-white mb-2 tracking-wide">BABEL SYSTEM</h1>
                    <p className="text-xs text-stone-500 uppercase tracking-widest">Identify Yourself</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-stone-500 ml-1">Access ID</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={16} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-babel-gold focus:ring-1 focus:ring-babel-gold outline-none transition-all"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-stone-500 ml-1">Passcode</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600" size={16} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-babel-gold focus:ring-1 focus:ring-babel-gold outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-3 rounded border border-red-500/30">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-babel-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (mode === 'signin' ? 'Initialize Link' : 'Register Identity')}
                        {!loading && <ArrowRight size={16} />}
                    </button>
                </form>

                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={() => handleAnonymous()}
                        disabled={loading}
                        className="w-full bg-white/5 text-stone-400 text-xs py-3 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                    >
                        Use Demo Account (Guest)
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-stone-600">Or</span></div>
                    </div>

                    <button
                        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        className="w-full text-stone-500 hover:text-babel-gold text-xs transition-colors uppercase tracking-widest"
                    >
                        {mode === 'signin' ? 'Create New Identity' : 'Return to Login'}
                    </button>
                </div>
            </div>
        </div>
    );
}
