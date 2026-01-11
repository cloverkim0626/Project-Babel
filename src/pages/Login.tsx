import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Anchor, Lock, Mail, AlertCircle, Waves } from 'lucide-react';

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
                            nickname: email.split('@')[0],
                            class_type: 'Challenger'
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

                if (session?.user) {
                    const { data: profile, error } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (error || profile?.role === 'master' || profile?.role === 'admin') {
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
        setError(null);
        const demoEmail = 'student@babel.com';
        const demoPassword = 'password123';

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: demoEmail,
                password: demoPassword
            });

            if (signInError) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email: demoEmail,
                    password: demoPassword,
                    options: {
                        data: {
                            nickname: 'Demo Student',
                            class_type: 'Challenger',
                            role: 'student'
                        }
                    }
                });

                if (signUpError) throw new Error("Demo creation failed.");

                const { error: retryError } = await supabase.auth.signInWithPassword({
                    email: demoEmail,
                    password: demoPassword
                });
                if (retryError) throw retryError;
            }
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError("체험판 입장 실패: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">

            {/* ATMOSPHERIC LAYER: Caustics */}
            <div className="caustic-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-[#0f172a] opacity-80 pointer-events-none" />

            <div className="w-full max-w-[480px] flex flex-col items-center relative z-10 space-y-10">

                {/* 1. Header: The Movie Poster Title */}
                <div className="text-center space-y-6">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 bg-cyan-500/10 rounded-full animate-pulse blur-xl" />
                        <div className="relative w-full h-full rounded-full border border-cyan-500/30 bg-slate-950/50 flex items-center justify-center backdrop-blur-md shadow-2xl">
                            <Anchor className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" size={40} />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-5xl md:text-6xl text-cinematic mb-2 tracking-widest drop-shadow-2xl">
                            THE ABYSS
                        </h1>
                        <p className="text-cyan-500/80 text-sm font-bold tracking-[0.4em] uppercase font-sans drop-shadow-lg">
                            Archive Access
                        </p>
                    </div>
                </div>

                {/* 2. Login Form: Cinematic Panel */}
                <div className="w-full abyss-glass p-10 space-y-8 shadow-2xl border-t border-white/10">
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold tracking-[0.2em] text-cyan-500/80 uppercase ml-1">Identity Code</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-cyan-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="abyss-input pl-12 text-base"
                                    placeholder="OPERATOR ID"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold tracking-[0.2em] text-cyan-500/80 uppercase ml-1">Access Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-cyan-400" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="abyss-input pl-12 text-base"
                                    placeholder="••••••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-300 text-xs bg-red-950/20 p-3 rounded border border-red-500/10">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full abyss-btn py-3.5 text-sm uppercase shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>{loading ? 'Submerging...' : (mode === 'signin' ? 'Dive In' : 'Initiate')}</span>
                            {!loading && <Waves size={16} className="opacity-70" />}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 opacity-30">
                        <div className="h-px bg-slate-500 flex-1" />
                        <span className="text-[10px] uppercase tracking-widest text-slate-400">Or</span>
                        <div className="h-px bg-slate-500 flex-1" />
                    </div>

                    {/* Guest Actions */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => handleAnonymous()}
                            className="w-full py-3 text-xs font-medium text-slate-400 hover:text-cyan-300 transition-colors border border-dashed border-slate-700 hover:border-cyan-500/30 rounded-lg flex items-center justify-center gap-2"
                        >
                            Guest Dive (체험판)
                        </button>

                        {/* Hidden Emergency Route */}
                        <button
                            type="button"
                            onClick={async () => {
                                setLoading(true);
                                const emEmail = 'emergency@babel.com';
                                const emPass = 'babel_emergency_123';
                                try {
                                    const { error: loginErr } = await supabase.auth.signInWithPassword({ email: emEmail, password: emPass });
                                    if (loginErr) {
                                        await supabase.auth.signUp({ email: emEmail, password: emPass });
                                        await supabase.auth.signInWithPassword({ email: emEmail, password: emPass });
                                    }
                                    navigate('/admin');
                                } catch (e) {
                                    alert("긴급 접속 실패: " + JSON.stringify(e));
                                    setLoading(false);
                                }
                            }}
                            className="w-full text-slate-700 hover:text-red-400/80 text-[10px] py-2 transition-colors flex items-center justify-center gap-1 opacity-40 hover:opacity-100 tracking-widest"
                        >
                            <span>SYSTEM OVERRIDE</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            className="w-full text-center text-xs text-slate-600 hover:text-slate-300 transition-colors py-2"
                        >
                            {mode === 'signin' ? 'Create New Signal' : 'Return to Login'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
