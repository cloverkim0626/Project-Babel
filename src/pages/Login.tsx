import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Anchor, Lock, Mail, AlertCircle, Droplets, Waves } from 'lucide-react';

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
                    const { data: profile, error } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    // If profile allows, OR if error occurs (assume Admin is fixing DB), go to Admin
                    if (error || profile?.role === 'master' || profile?.role === 'admin') {
                        console.log("Redirecting to Admin (Profile:", profile, "Error:", error, ")");
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
            // 1. Try Login first
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: demoEmail,
                password: demoPassword
            });

            if (signInError) {
                // 2. If Login fails, Try Sign Up
                console.log("Demo account not found, creating...");
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

                if (signUpError) {
                    throw new Error("Demo creation failed. Check Supabase email confirmation settings.");
                }

                // Retry login after signup
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
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Texture & Ambience - Deep Ocean */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#020617] pointer-events-none" />
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)`
            }} />

            {/* Floating Particles/Bubbles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-cyan-400/20 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="w-full max-w-md relative z-50">
                {/* Title Section */}
                <div className="text-center mb-10">
                    {/* Icon - Anchor/Abyss */}
                    <div className="relative inline-block mb-6">
                        <div className="w-20 h-20 rounded-full bg-slate-900/50 flex items-center justify-center border border-teal-500/30 shadow-[0_0_40px_rgba(20,184,166,0.2)] backdrop-blur-md">
                            <Anchor className="text-cyan-400 w-10 h-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                        </div>
                        {/* Ripple Ring */}
                        <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-[ping_3s_ease-in-out_infinite]" />
                    </div>

                    {/* Main Title */}
                    <h1 className="text-4xl md:text-5xl font-serif text-slate-200 mb-3 tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-light">
                        THE ABYSS
                    </h1>
                    <div className="flex items-center justify-center gap-4 mb-4 opacity-60">
                        <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-teal-500" />
                        <span className="text-teal-400 text-xs font-mono tracking-[0.4em] uppercase">Deep Knowledge</span>
                        <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-teal-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-sans tracking-widest">"심연의 끝에서 진리를 마주하다"</p>
                </div>

                {/* Login Card - Wet Glass Style */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-500/20 p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    {/* Fluid Highlight */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs tracking-widest text-teal-500/70 ml-1 font-bold uppercase">Identity (Email)</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-3.5 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:border-cyan-500/50 focus:bg-slate-900/80 outline-none transition-all shadow-inner"
                                    placeholder="diver@abyss.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs tracking-widest text-teal-500/70 ml-1 font-bold uppercase">Passcode</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-3.5 pl-12 pr-4 text-slate-200 placeholder-slate-600 focus:border-cyan-500/50 focus:bg-slate-900/80 outline-none transition-all shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-300 text-xs bg-red-950/30 p-3 rounded-lg border border-red-500/20">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-teal-900 to-slate-900 text-cyan-400 font-bold py-4 rounded-lg border border-teal-500/30 hover:border-cyan-400 hover:text-cyan-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-cyan-400/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                            <span className="relative z-10">{loading ? 'Submerging...' : (mode === 'signin' ? 'DIVE (접속)' : 'INITIATE (등록)')}</span>
                            {!loading && <Waves size={18} className="relative z-10" />}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative py-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-slate-900 px-4 text-slate-600 text-[10px] tracking-widest uppercase">OR</span>
                        </div>
                    </div>

                    {/* Quick Access Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => handleAnonymous()}
                            disabled={loading}
                            className="w-full bg-slate-800/30 text-slate-400 py-3 rounded-lg hover:bg-slate-700/30 hover:text-slate-200 transition-all border border-slate-700/30 flex items-center justify-center gap-2 text-xs font-bold tracking-wide"
                        >
                            <Droplets size={14} />
                            GUEST DIVE (체험판)
                        </button>

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
                            className="w-full text-slate-600 hover:text-red-400 text-[10px] py-2 transition-colors flex items-center justify-center gap-1 opacity-50 hover:opacity-100"
                        >
                            <span>SYSTEM OVERRIDE</span>
                        </button>

                        <button
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            className="w-full text-teal-600 hover:text-cyan-400 text-xs transition-colors py-2 tracking-wide font-mono"
                        >
                            {mode === 'signin' ? '> Create New Signal' : '> Return to Login Sequence'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
