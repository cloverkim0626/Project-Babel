import React, { useState } from 'react';
import { X, Check, Loader2, Layers } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SimpleCreateModalProps {
    onClose: () => void;
    onSuccess: (newProject: any) => void;
}

export const SimpleCreateModal: React.FC<SimpleCreateModalProps> = ({ onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;

        console.log('[SimpleCreate] Starting creation for:', name);
        setLoading(true);

        try {
            // STRATEGY: Bypass supabase-js client completely. Use raw fetch.
            // This rules out client-library internal state issues.

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!token || !supabaseUrl || !supabaseKey) {
                alert("인증 세션이 없거나 환경변수가 누락되었습니다.");
                return;
            }

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
            const data = result[0];

            console.log('[SimpleCreate] Success via REST:', data);
            onSuccess(data);
            onClose();

        } catch (e: any) {
            console.error('[SimpleCreate] Exception:', e);
            alert(`오류 발생: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-stone-900 border border-white/20 p-6 rounded-xl w-96 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-babel-gold mb-4 flex items-center gap-2">
                    <Layers size={20} /> 새 프로젝트
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-stone-400 mb-1">폴더명</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-babel-gold outline-none"
                            placeholder="프로젝트 이름 입력"
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading || !name.trim()}
                        className="w-full bg-babel-gold text-black font-bold py-3 rounded hover:bg-yellow-500 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Check />}
                        생성하기
                    </button>
                </div>
            </div>
        </div>
    );
};
