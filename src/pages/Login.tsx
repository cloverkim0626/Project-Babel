import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

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

                if (retryError) {
                    throw new Error("Login after signup failed. Email confirmation may be required.");
                }
            }

            // Login successful - navigate immediately (don't block on profile update)
            // Fire-and-forget profile update (no await - don't block navigation)
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    supabase.from('users').upsert({
                        id: session.user.id,
                        nickname: 'Demo Student',
                        class_type: 'Challenger',
                        role: 'student',
                        level: 1,
                        xp: 0,
                        points: 0
                    }, { onConflict: 'id' }).then(() => {
                        console.log('[Guest] Profile updated');
                    });
                }
            });

            // Navigate to student dashboard (has stats/HP)
            navigate('/dashboard');

        } catch (err: any) {
            console.error('[Guest Login Error]:', err);
            setError(err.message || 'Guest login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0908] flex items-center justify-center p-4 font-mono text-paper relative overflow-hidden">
            {/* Background - Ancient Mystical Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-[#0a0908] to-[#0a0908]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-babel-gold/30 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Ancient Border Frame */}
            <div className="absolute inset-4 md:inset-8 border border-babel-gold/10 rounded-3xl pointer-events-none" />
            <div className="absolute inset-6 md:inset-12 border border-babel-gold/5 rounded-2xl pointer-events-none" />

            {/* Main Container */}
            <div className="w-full max-w-md relative z-10">
                {/* Title Section - Voca Universe : Babel */}
                <div className="text-center mb-8 md:mb-12">
                    {/* Mystical Icon */}
                    <div className="relative inline-block mb-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-babel-gold/20 to-amber-900/10 rounded-full flex items-center justify-center border-2 border-babel-gold/40 shadow-[0_0_60px_rgba(212,175,55,0.3)]">
                            <BookOpen className="text-babel-gold w-10 h-10 md:w-12 md:h-12" />
                        </div>
                        {/* Glowing Ring */}
                        <div className="absolute inset-0 rounded-full border border-babel-gold/20 animate-ping" style={{ animationDuration: '3s' }} />
                    </div>

                    {/* Main Title */}
                    <h1 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-babel-gold via-yellow-200 to-babel-gold mb-2 tracking-wider drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                        Voca Universe
                    </h1>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent to-babel-gold/50" />
                        <span className="text-babel-gold/80 text-lg font-serif tracking-[0.3em]">BABEL</span>
                        <div className="w-12 h-px bg-gradient-to-l from-transparent to-babel-gold/50" />
                    </div>
                    <p className="text-stone-500 text-xs tracking-[0.2em] uppercase">지식의 심연에서 진리를 찾아라</p>
                </div>

                {/* Login Card - Ancient Scroll Style */}
                <div className="bg-gradient-to-b from-stone-900/80 to-black/60 backdrop-blur-xl border border-babel-gold/20 p-6 md:p-8 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    {/* Decorative Corner Accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-babel-gold/30 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-babel-gold/30 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-babel-gold/30 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-babel-gold/30 rounded-br-xl" />

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs tracking-widest text-babel-gold/70 ml-1 font-medium">마법사 ID</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-babel-gold/40" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/60 border border-babel-gold/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-stone-600 focus:border-babel-gold focus:ring-1 focus:ring-babel-gold/30 focus:bg-black/80 outline-none transition-all"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs tracking-widest text-babel-gold/70 ml-1 font-medium">비밀 주문</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-babel-gold/40" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/60 border border-babel-gold/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-stone-600 focus:border-babel-gold focus:ring-1 focus:ring-babel-gold/30 focus:bg-black/80 outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-babel-gold to-amber-500 text-black font-bold py-4 rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? '연결 중...' : (mode === 'signin' ? '지식의 문 열기' : '마법사 등록')}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative py-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-babel-gold/10" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-stone-900/80 px-4 text-babel-gold/40 text-xs tracking-widest">또는</span>
                        </div>
                    </div>

                    {/* Quick Access Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => handleAnonymous()}
                            disabled={loading}
                            className="w-full bg-babel-gold/10 text-babel-gold py-3.5 rounded-xl hover:bg-babel-gold/20 transition-all border border-babel-gold/20 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <BookOpen size={16} />
                            체험판 입장 (게스트)
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
                            className="w-full bg-purple-900/20 text-purple-400 text-xs py-2.5 rounded-lg border border-purple-500/20 hover:bg-purple-900/30 transition-colors"
                        >
                            🔮 관리자 긴급 접속
                        </button>

                        <button
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            className="w-full text-stone-500 hover:text-babel-gold text-xs transition-colors py-2"
                        >
                            {mode === 'signin' ? '새로운 마법사 등록하기' : '기존 계정으로 로그인'}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-stone-600 text-xs tracking-widest">
                    <p>"어휘의 우주에서 지식의 정수를 탐험하라"</p>
                </div>
            </div>
        </div>
    );
}
