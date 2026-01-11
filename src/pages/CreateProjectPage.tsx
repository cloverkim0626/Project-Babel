import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Layers, Loader2, ArrowLeft } from 'lucide-react';

export default function CreateProjectPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');

    const handleCreate = async () => {
        if (!name.trim()) return;

        setLoading(true);
        setStatus('Initializing Auth...');

        try {
            // Robust Direct Fetch Method
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!token || !supabaseUrl || !supabaseKey) {
                setStatus('Auth session missing or invalid configuration');
                alert("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
                return;
            }

            setStatus('Sending Request...');
            console.log('[CreatePage] Requesting creation for:', name);

            const response = await fetch(`${supabaseUrl}/rest/v1/continents`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    name: name,
                    display_name: name,
                    theme_color: '#D4AF37'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('[CreatePage] Success:', result);
            setStatus('Success! Redirecting...');

            // Short delay to show success
            setTimeout(() => {
                navigate('/admin');
            }, 1000);

        } catch (e: any) {
            console.error('[CreatePage] Error:', e);
            setStatus(`Error: ${e.message}`);
            alert(`오류 발생: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-stone-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-stone-500 hover:text-white mb-6 text-sm"
                >
                    <ArrowLeft size={16} /> 취소하고 돌아가기
                </button>

                <h1 className="text-2xl font-serif text-babel-gold mb-6 flex items-center gap-3">
                    <Layers className="animate-pulse" />
                    Create New Project
                </h1>

                <p className="text-stone-400 text-xs mb-8">
                    새 프로젝트를 생성하기 위한 전용 페이지입니다. <br />
                    (Dedicated page for project creation to ensure stability)
                </p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Folder Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded-lg p-4 text-white font-mono focus:border-babel-gold outline-none focus:ring-1 focus:ring-babel-gold/50 transition-all"
                            placeholder="ex: 2024-03-Mock-Exam"
                            autoFocus
                        />
                    </div>

                    <div className="text-xs text-center h-4 font-mono text-babel-gold/70">
                        {status}
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading || !name.trim()}
                        className="w-full bg-babel-gold text-black font-bold py-4 rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all transform active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Layers />}
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
}
