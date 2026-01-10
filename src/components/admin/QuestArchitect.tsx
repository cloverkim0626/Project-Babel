import React, { useState } from 'react';
import { BookOpen, Calendar, DollarSign, FileText, Save, List } from 'lucide-react';
import { splitQuest } from '../../utils/questSplitter';

export const QuestArchitect: React.FC = () => {
    const [questTitle, setQuestTitle] = useState('');
    const [rawText, setRawText] = useState('');
    const [deadlineDays, setDeadlineDays] = useState(3);
    const [rewardPoints, setRewardPoints] = useState(100);
    const [previewSets, setPreviewSets] = useState<any[]>([]);

    const handlePreview = () => {
        // Parse "Word | Meaning" OR "Word   Meaning" OR "Word(tab)Meaning"
        // Flexible Regex: Capture group 1 (Word) + Separator (Pipe, Tab, or 2+ Spaces) + Capture group 2 (Meaning)
        const regex = /(.+?)(?:\s{2,}|\t|\|)(.+)/;

        const validLines = rawText.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && regex.test(trimmed);
        });

        // Debug log for parser
        console.log(`Parsed ${validLines.length} valid pairs from input.`);

        const wordCount = validLines.length;

        // Split into sets of 20
        const sets = splitQuest(wordCount);
        setPreviewSets(sets);

        if (wordCount === 0 && rawText.trim().length > 0) {
            alert("Parser Warning: Could not detect 'Word [Separator] Meaning' pairs.\nTry using ' | ', Tabs, or 2 spaces between word and meaning.");
        }
    };

    const handleDeploy = () => {
        if (!questTitle || !rawText) return;

        // TODO: Actual Parsing Logic here
        // const parsedData = rawText.split('\n').map(line => {
        //    const [word, meaning] = line.split('|').map(s => s.trim());
        //    return { word, meaning };
        // });

        alert(`Deploying Quest: ${questTitle}\nTarget: All Students\nSets: ${previewSets.length}\nReward: ${rewardPoints} pts`);

        setQuestTitle('');
        setRawText('');
        setPreviewSets([]);
    };

    return (
        <div className="space-y-6">
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                    <BookOpen size={20} className="text-babel-gold" />
                    Quest Architect
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Quest Title</label>
                        <input
                            type="text"
                            value={questTitle}
                            onChange={(e) => setQuestTitle(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors"
                            placeholder="e.g., Week 2: The Crossing"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                                <Calendar size={12} /> Deadline (Days)
                            </label>
                            <input
                                type="number"
                                value={deadlineDays}
                                onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
                                className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                                <DollarSign size={12} /> Reward (Pts)
                            </label>
                            <input
                                type="number"
                                value={rewardPoints}
                                onChange={(e) => setRewardPoints(parseInt(e.target.value))}
                                className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2">
                            <FileText size={12} /> Raw Data (Format: Word | Meaning)
                        </label>
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            onBlur={handlePreview}
                            className="w-full h-40 bg-black border border-white/20 rounded p-3 text-xs font-mono text-stone-300 focus:border-purple-500 outline-none resize-none"
                            placeholder={"Apple | 사과\nBanana | 바나나\nCipher | 암호\n..."}
                        />
                        <div className="text-right text-[10px] text-stone-600 mt-1">
                            {rawText.length > 0 ? `${rawText.split('\n').filter(l => l.trim()).length} words detected` : 'Waiting for input...'}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            onClick={handlePreview}
                            className="px-4 py-2 bg-stone-800 text-stone-300 rounded hover:bg-stone-700 transition-colors text-xs uppercase tracking-widest"
                        >
                            Analyze & Preview
                        </button>
                        <button
                            onClick={handleDeploy}
                            disabled={!questTitle || !rawText}
                            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors text-xs uppercase tracking-widest font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save size={14} /> Deploy to World
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            {previewSets.length > 0 && (
                <div className="bg-black/40 border border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-sm font-bold text-stone-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <List size={14} /> Extraction Preview
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Header Row */}
                        <div className="flex justify-between text-[10px] text-stone-500 px-3 pb-2 border-b border-white/5">
                            <span>Sequence</span>
                            <span>Scale</span>
                        </div>
                        {previewSets.map((set: any) => (
                            <div key={set.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 hover:border-babel-gold/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                                        {set.index}
                                    </div>
                                    <div className="text-xs text-stone-300">
                                        Quest Sequence #{set.index}
                                    </div>
                                </div>
                                <div className="text-[10px] text-stone-500 font-mono">
                                    ~ {set.wordCount} Words
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded text-center">
                        <p className="text-xs text-green-400">
                            System Ready: {previewSets.length} Sets will be generated from input.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
