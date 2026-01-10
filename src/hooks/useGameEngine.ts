import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface LevelSpecs {
    level: number;
    xp: number;
    nextLevelXp: number;
    maxHp: number;
}

interface IncorrectItem {
    id: string;
    word: string;
    nextReview: string; // ISO Date
    level: number; // 0-3
}

export const useGameEngine = () => {
    const { user } = useAuth();

    // State
    const [levelSpecs, setLevelSpecs] = useState<LevelSpecs>({
        level: 1,
        xp: 0,
        nextLevelXp: 100,
        maxHp: 100
    });

    const [points, setPoints] = useState(0);
    const [incorrectVault, setIncorrectVault] = useState<IncorrectItem[]>([]);

    // Refunds
    const [refundRequests, setRefundRequests] = useState<any[]>([]);

    // Load from DB
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            // 1. Load User Stats
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (userData) {
                // Calculate nextLevelXp based on formula: 100 * (1.2 ^ (level-1))
                // Or simplified for now
                const nextXp = Math.floor(100 * Math.pow(1.2, userData.level - 1));

                setLevelSpecs({
                    level: userData.level,
                    xp: userData.xp,
                    nextLevelXp: nextXp,
                    maxHp: userData.max_hp
                });
                setPoints(userData.points);
            }

            // 2. Load Incorrect Vault (Active Revives)
            // Ideally we filter where next_review_at is NOT NULL, etc.
            // For now, simple fetch
            const { data: vaultData } = await supabase
                .from('incorrect_answers')
                .select('*')
                .eq('user_id', user.id);

            if (vaultData) {
                setIncorrectVault(vaultData.map((item: any) => ({
                    id: item.id,
                    word: item.word,
                    nextReview: item.next_review_at,
                    level: item.repetition_level
                })));
            }

            // 3. Load Refunds (Admin or Personal?)
            // If Master -> Load All Pending
            // If Student -> Load Own
            let query = supabase.from('refund_requests').select('*').order('created_at', { ascending: false });

            if (user.role === 'student') {
                query = query.eq('user_id', user.id);
            } else {
                // Master sees pending mainly
                query = query.eq('status', 'pending');
            }

            const { data: refundData } = await query;
            if (refundData) {
                setRefundRequests(refundData.map((r: any) => ({
                    id: r.id,
                    user: 'Unknown', // Join would be better, but for now... 
                    // Actually for master view we need names.
                    // Let's assume for prototype we just show ID or Client-side join if specific
                    amount: r.amount,
                    status: r.status,
                    date: r.created_at
                })));
            }
        };

        loadData();
    }, [user]);

    // --- Actions ---

    const updateDbStats = async (newLevel: number, newXp: number, newHp: number, newPoints: number) => {
        if (!user) return;
        await supabase.from('users').update({
            level: newLevel,
            xp: newXp,
            max_hp: newHp,
            points: newPoints
        }).eq('id', user.id);
    };

    const addXp = (amount: number) => {
        setLevelSpecs(prev => {
            let newXp = prev.xp + amount;
            let newLevel = prev.level;
            let newMaxHp = prev.maxHp;
            let newNextXp = prev.nextLevelXp;

            // Level Up Logic
            while (newXp >= newNextXp) {
                newXp -= newNextXp;
                newLevel++;
                newMaxHp += 10;
                newNextXp = Math.floor(newNextXp * 1.2);
                alert(`🎉 LEVEL UP! You are now Level ${newLevel}.`);
            }

            // Sync DB
            updateDbStats(newLevel, newXp, newMaxHp, points);

            return {
                level: newLevel,
                xp: newXp,
                nextLevelXp: newNextXp,
                maxHp: newMaxHp
            };
        });
    };

    const addPoints = (amount: number) => {
        setPoints(prev => {
            const newPoints = prev + amount;
            // Sync DB (Need to pass current Level/XP too, a bit racy but OK for prototype)
            // For safety, let's just update points if we can, or update all.
            // Since `addXp` and `addPoints` might run together, strictly we should use RPC.
            // But let's just trigger update.
            if (user) {
                supabase.from('users').update({ points: newPoints }).eq('id', user.id).then();
            }
            return newPoints;
        });
    };

    const logError = async (word: string) => {
        if (!user) return;
        // +1 min for demo
        const reviewTime = new Date(Date.now() + 60000).toISOString();

        // Optimistic
        const tempId = crypto.randomUUID();
        const newItem: IncorrectItem = { id: tempId, word, nextReview: reviewTime, level: 0 };
        setIncorrectVault(prev => [...prev, newItem]);

        // DB Insert
        const { error } = await supabase.from('incorrect_answers').insert({
            user_id: user.id,
            word,
            error_type: 'meaning', // default
            next_review_at: reviewTime,
            repetition_level: 0
        });

        if (error) console.error("Failed to log error:", error);
    };

    const getDueRevives = () => {
        const now = new Date().toISOString();
        return incorrectVault.filter(item => item.nextReview <= now);
    };

    const clearRevive = async (wordId: string) => {
        // Find item
        const item = incorrectVault.find(i => i.id === wordId);
        if (!item) return;

        // Optimistic update
        setIncorrectVault(prev => prev.filter(i => i.id !== wordId));

        // Logic: Bump level or remove?
        // Implementing simple clear for now = just remove or bump 
        // Let's just delete from DB for "Crystallized" effect in prototype
        if (user) {
            await supabase.from('incorrect_answers').delete().eq('id', wordId); // Assume using real ID
            // If it was tempId, this fails, but for prototype flows usually we load real IDs.
        }
    };

    const requestRefund = async (amount: number) => {
        if (points < amount) {
            alert("Insufficient Points!");
            return;
        }
        if (!user) return;

        // Optimistic deduct
        setPoints(prev => prev - amount);
        alert("Refund Request Sent!");

        // DB Transaction ideally
        await supabase.from('users').update({ points: points - amount }).eq('id', user.id);
        await supabase.from('refund_requests').insert({
            user_id: user.id,
            amount
        });
    };

    const processRefund = async (id: string, approved: boolean) => {
        // Admin only
        await supabase.from('refund_requests').update({
            status: approved ? 'approved' : 'rejected'
        }).eq('id', id);

        // Update local state
        setRefundRequests(prev => prev.map(req => {
            if (req.id !== id) return req;
            return { ...req, status: approved ? 'approved' : 'rejected' };
        }));
    };

    return {
        levelSpecs,
        points,
        addXp,
        addPoints,
        logError,
        getDueRevives,
        clearRevive,
        incorrectVault,
        requestRefund,
        refundRequests,
        processRefund
    };
};
