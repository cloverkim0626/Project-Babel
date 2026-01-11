import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Loader2, ArrowLeft, BookOpen, GraduationCap, Archive } from 'lucide-react';
import { ContinentManager } from '../components/admin/ContinentManager';

type Category = 'TEXTBOOK' | 'MOCK' | 'OTHER';

const TEXTBOOK_SUBJECTS = ['공통영어1', '공통영어2', '영어1', '영어2', '심화영어'];
const MOCK_YEARS = Array.from({ length: 7 }, (_, i) => String(2020 + i)); // 2020-2026
const MOCK_MONTHS = ['3월', '6월', '9월', '10월', '대수능'];

export default function CreateProjectPage() {
    const navigate = useNavigate();

    // Core State
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [createdProject, setCreatedProject] = useState<any>(null);

    // Rich UI State
    const [category, setCategory] = useState<Category>('TEXTBOOK');

    // Textbook State
    const [tbSubject, setTbSubject] = useState(TEXTBOOK_SUBJECTS[0]);
    const [tbUnit, setTbUnit] = useState('');

    // Mock State
    const [mockYear, setMockYear] = useState('2024');
    const [mockGrade, setMockGrade] = useState('High 1');
    const [mockMonth, setMockMonth] = useState('3월');

    // Other State
    const [otherWorkbook, setOtherWorkbook] = useState('');
    const [otherPublisher, setOtherPublisher] = useState('');
    const [otherUnit, setOtherUnit] = useState('');

    // Auto-generate Display Name Effect
    useEffect(() => {
        // Only auto-fill if name is empty or looks like an auto-generated one
        // Ideally we just display the preview
    }, [category, tbSubject, tbUnit, mockYear, mockGrade, mockMonth, otherWorkbook]);

    const getDisplayName = () => {
        if (category === 'TEXTBOOK') return `${tbSubject} - ${tbUnit}`;
        if (category === 'MOCK') return `${mockYear}년 ${mockMonth} 고${mockGrade === 'High 1' ? 1 : mockGrade === 'High 2' ? 2 : 3} 모의고사`;
        if (category === 'OTHER') return `${otherWorkbook} ${otherUnit} (${otherPublisher})`;
        return name;
    }

    const handleCreate = async () => {
        if (!name.trim()) return;

        setLoading(true);
        setStatus('Initializing Manual Auth...');

        try {
            // NUCLEAR OPTION: Bypass supabase.auth.getSession() completely.
            // Read directly from LocalStorage.

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                throw new Error("환경변수 누락");
            }

            // 1. Extract Project ID
            let projectId = '';
            try {
                const urlParts = supabaseUrl.split('//')[1]; // [project-ref].supabase.co
                projectId = urlParts.split('.')[0];
            } catch (e) {
                console.error("URL Parsing failed", e);
                // Fallback: try to find any key in localstorage
            }

            // 2. Construct LocalStorage Key: sb-[id]-auth-token
            let storageKey = `sb-${projectId}-auth-token`;
            let sessionStr = localStorage.getItem(storageKey);

            // 3. Fallback: Search for any key starting with sb- and ending with -auth-token if exact match fails
            if (!sessionStr) {
                console.warn('[CreatePage] Exact key not found:', storageKey);
                const allKeys = Object.keys(localStorage);
                const potentialKey = allKeys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                if (potentialKey) {
                    console.log('[CreatePage] Found fallback key:', potentialKey);
                    sessionStr = localStorage.getItem(potentialKey);
                } else {
                    throw new Error("브라우저에 저장된 로그인 정보가 없습니다. (No Token Found)");
                }
            }

            const sessionData = JSON.parse(sessionStr || "{}");
            const token = sessionData.access_token;

            if (!token) {
                throw new Error("토큰을 찾을 수 없습니다. 다시 로그인해주세요.");
            }

            setStatus('Constructing Metadata...');

            // Construct Rich Metadata
            const metadata = {
                category,
                textbook: category === 'TEXTBOOK' ? { subject: tbSubject, unit: tbUnit } : null,
                mock: category === 'MOCK' ? { year: mockYear, month: mockMonth, grade: mockGrade } : null,
                other: category === 'OTHER' ? { workbook: otherWorkbook, publisher: otherPublisher, unit: otherUnit } : null
            };

            const finalDisplayName = getDisplayName() || name;

            console.log('[CreatePage] Payload:', { name, finalDisplayName, metadata });

            // 4. Send Request directly to REST API
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
                    display_name: finalDisplayName,
                    theme_color: '#D4AF37',
                    metadata: metadata
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('[CreatePage] Success:', result);
            setStatus('Success! Starting Workflow...');

            // DIRECT TRANSITION: Open ContinentManager immediately instead of redirecting
            setTimeout(() => {
                const newProject = Array.isArray(result) ? result[0] : result;
                setCreatedProject(newProject);
            }, 500);

        } catch (e: any) {
            console.error('[CreatePage] Error:', e);
            setStatus(`Error: ${e.message}`);
            alert(`오류 발생: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // If project created, show the manager full screen
    if (createdProject) {
        return (
            <div className="fixed inset-0 z-50 bg-stone-950">
                <ContinentManager
                    continent={createdProject}
                    initialView="add"
                    onClose={() => navigate('/admin')}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-stone-900 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-babel-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-stone-500 hover:text-white mb-8 text-sm transition-colors"
                >
                    <ArrowLeft size={16} /> 취소하고 돌아가기
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-babel-gold/10 rounded-xl text-babel-gold border border-babel-gold/20">
                        <Layers size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif text-white mb-1">
                            Create New Project
                        </h1>
                        <p className="text-stone-400 text-sm">
                            새로운 학습 프로젝트를 생성합니다. (Safe Mode Active)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: Input Details */}
                    <div className="space-y-6">
                        {/* Folder Name */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 font-bold">Folder Name (Internal)</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-lg p-4 text-white font-mono focus:border-babel-gold outline-none focus:ring-1 focus:ring-babel-gold/50 transition-all placeholder:text-stone-700"
                                placeholder="ex: 2024-Regular-Spring"
                                autoFocus
                            />
                            <p className="text-[10px] text-stone-600 mt-1"> URL 및 내부 식별용 영문 이름</p>
                        </div>

                        {/* Category Selection */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 font-bold">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['TEXTBOOK', 'MOCK', 'OTHER'] as Category[]).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`py-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-1 ${category === cat
                                            ? 'bg-babel-gold text-black border-babel-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                                            : 'bg-stone-800 text-stone-400 border-white/5 hover:bg-stone-700'
                                            }`}
                                    >
                                        {cat === 'TEXTBOOK' && <BookOpen size={14} />}
                                        {cat === 'MOCK' && <GraduationCap size={14} />}
                                        {cat === 'OTHER' && <Archive size={14} />}
                                        {cat === 'TEXTBOOK' && '교과서'}
                                        {cat === 'MOCK' && '모의고사'}
                                        {cat === 'OTHER' && '기타'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dynamic Inputs */}
                        <div className="bg-black/40 p-5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                            {category === 'TEXTBOOK' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase text-stone-500 mb-1">과목 선택</label>
                                        <select value={tbSubject} onChange={(e) => setTbSubject(e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold">
                                            {TEXTBOOK_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase text-stone-500 mb-1">단원 (Unit)</label>
                                        <input type="text" placeholder="예: Lesson 1" value={tbUnit} onChange={(e) => setTbUnit(e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold" />
                                    </div>
                                </div>
                            )}
                            {category === 'MOCK' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase text-stone-500 mb-1">연도 (Year)</label>
                                            <select value={mockYear} onChange={(e) => setMockYear(e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold">
                                                {MOCK_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-stone-500 mb-1">학년 (Grade)</label>
                                            <select value={mockGrade} onChange={(e) => setMockGrade(e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold">
                                                <option value="High 1">고1</option>
                                                <option value="High 2">고2</option>
                                                <option value="High 3">고3</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase text-stone-500 mb-1">시행월 (Month)</label>
                                        <div className="flex gap-2">
                                            {MOCK_MONTHS.map(m => (
                                                <button key={m} type="button" onClick={() => setMockMonth(m)} className={`flex-1 py-2 text-xs rounded border transition-colors ${mockMonth === m ? 'bg-stone-700 text-white border-babel-gold' : 'bg-stone-800 text-stone-500 border-transparent hover:bg-stone-700'}`}>{m}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {category === 'OTHER' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase text-stone-500 mb-1">문제집 종류</label>
                                        <input type="text" placeholder="예: 수능특강" value={otherWorkbook} onChange={(e) => setOtherWorkbook(e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase text-stone-500 mb-1">출판사</label>
                                            <input type="text" placeholder="예: EBS" value={otherPublisher} onChange={(e) => setOtherPublisher(e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-stone-500 mb-1">단원</label>
                                            <input type="text" placeholder="예: 01" value={otherUnit} onChange={(e) => setOtherUnit(e.target.value)} className="w-full bg-stone-900 border border-white/10 rounded p-2 text-white outline-none focus:border-babel-gold" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Preview & Action */}
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 font-bold">Preview Card</label>
                            <div className="bg-black border border-white/10 rounded-xl p-0 hover:border-babel-gold transition-all group relative overflow-hidden h-48 flex flex-col shadow-2xl">
                                <div className="h-24 bg-stone-900 border-b border-white/5 relative overflow-hidden flex items-center justify-center">
                                    <div className="w-full h-full bg-gradient-to-br from-stone-800 to-black flex items-center justify-center">
                                        <Layers size={32} className="text-white/10" />
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between bg-stone-900/50">
                                    <div>
                                        <h3 className="text-white font-serif font-bold text-lg mb-1 truncate text-babel-gold">
                                            {getDisplayName() || 'Display Name'}
                                        </h3>
                                        <p className="text-xs text-stone-500 font-mono truncate">
                                            {name || 'folder-name'}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-stone-400 uppercase tracking-wider">
                                        <span>Preview Only</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                                <h4 className="text-babel-gold text-xs font-bold mb-1 flex items-center gap-2">
                                    <Loader2 size={12} className={loading ? "animate-spin" : "opacity-0"} />
                                    System Status
                                </h4>
                                <p className="text-stone-400 text-xs font-mono h-4">
                                    {status || 'Ready to create.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto pt-8">
                            <button
                                onClick={handleCreate}
                                disabled={loading || !name.trim()}
                                className="w-full bg-babel-gold text-black font-bold py-4 rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all transform active:scale-95 text-lg"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Layers />}
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
