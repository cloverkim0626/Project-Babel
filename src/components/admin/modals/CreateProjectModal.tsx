import React, { useState } from 'react';
import { Globe, X, Check, Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
    onClose: () => void;
    onConfirm: (name: string, displayName: string, themeColor: string) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onConfirm }) => {
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !displayName) return;

        setLoading(true);
        await onConfirm(name, displayName, '#D4AF37');
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden scale-in-95 animate-in duration-200">
                {/* Header */}
                <div className="p-4 bg-black/40 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-serif text-babel-gold flex items-center gap-2">
                        <Globe size={18} />
                        New Project
                    </h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Project Code (Folder Name)</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. 2024-SEP-MOCK"
                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold focus:outline-none transition-colors font-mono text-sm"
                        />
                        <p className="text-[10px] text-stone-600 mt-1">Used for internal sorting and identification.</p>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. 9월 모의고사 대비반"
                            className="w-full bg-black border border-white/20 rounded-lg p-3 text-white focus:border-babel-gold focus:outline-none transition-colors"
                        />
                        <p className="text-[10px] text-stone-600 mt-1">This is what students and teachers will see.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-stone-400 hover:text-white text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name || !displayName || loading}
                            className="px-6 py-2 bg-babel-gold text-black font-bold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
