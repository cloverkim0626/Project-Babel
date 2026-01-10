import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export interface UserProfile {
    id: string;
    nickname: string;
    classType: string;
    role: 'student' | 'master';
    level: number;
    xp: number;
    points: number;
}

export const useAuth = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Get Session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setLoading(false);
                // If not locked behind RequireAuth, we don't force redirect here yet, 
                // but usually we might want to.
            }
        };

        getSession();

        // 2. Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                navigate('/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // If profile missing (maybe manually deleted?), fallback or handle
            } else if (data) {
                setUser({
                    id: data.id,
                    nickname: data.nickname || 'Unknown',
                    classType: data.class_type || 'Challenger',
                    role: data.role || 'student',
                    level: data.level || 1,
                    xp: data.xp || 0,
                    points: data.points || 0
                });
            }
        } catch (err) {
            console.error('Profile fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return {
        user,
        role: user?.role || 'student', // Backward compatibility
        loading,
        signOut,
        // Mock toggle removed, real roles are in DB
        isAuthenticated: !!user
    };
};
