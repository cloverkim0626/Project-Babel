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
        let mounted = true;

        const initAuth = async () => {
            try {
                // Check current session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    if (error.message.includes('AbortError')) return; // Ignore aborts
                    throw error;
                }

                if (session?.user && mounted) {
                    await fetchProfile(session.user.id, mounted);
                } else if (!session && mounted) {
                    setLoading(false);
                }
            } catch (err: any) {
                console.error("Auth Init Error:", err);
                if (mounted && !err.message?.includes('AbortError')) {
                    setLoading(false);
                }
            }
        };

        const fetchProfile = async (userId: string, isMounted: boolean) => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!isMounted) return;

                if (error) {
                    console.error('Error fetching profile:', error);
                    setLoading(false);
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
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_IN' && session) {
                setLoading(true);
                await fetchProfile(session.user.id, mounted);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                navigate('/login');
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [navigate]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return {
        user,
        role: user?.role || 'student',
        loading,
        signOut,
        isAuthenticated: !!user
    };
};
