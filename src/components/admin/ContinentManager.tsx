import React, { useState } from 'react';
import { Globe, Save, Image as ImageIcon } from 'lucide-react';

export const ContinentManager: React.FC = () => {
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [themeColor, setThemeColor] = useState('#D4AF37');

    const handleCreate = () => {
        if (!name || !displayName) return;
        alert(`Creating Continent:\n${displayName} (${name})\nImage: ${imageUrl}`);
        // TODO: Supabase Insert
        setName('');
        setDisplayName('');
        setImageUrl('');
    };

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Globe size={20} className="text-blue-400" />
                Continent Manager
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Raw Name (System ID)</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., 2024 Sep Mock Exam"
                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Display Name (Fantasy)</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g., 9월의 황금 신전"
                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                        <ImageIcon size={12} /> Background Image URL
                    </label>
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Theme Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            className="bg-transparent border-none w-10 h-10 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            className="flex-1 bg-black border border-white/20 rounded p-3 text-white uppercase font-mono"
                        />
                    </div>
                </div>

                <div className="pt-4 text-right">
                    <button
                        onClick={handleCreate}
                        disabled={!name || !displayName}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-xs uppercase tracking-widest font-bold disabled:opacity-50 flex items-center gap-2 ml-auto"
                    >
                        <Save size={14} /> Register Continent
                    </button>
                </div>
            </div>
        </div>
    );
};
