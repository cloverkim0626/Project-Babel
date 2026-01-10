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

                if (error || !data) {
                    console.warn('Profile fetch failed, using session fallback:', error);
                    // Fallback to basic user if profile fails (prevents logout loop)
                    const sessionUser = (await supabase.auth.getSession()).data.session?.user;
                    setUser({
                        id: userId,
                        nickname: sessionUser?.email?.split('@')[0] || 'Unknown',
                        classType: 'Challenger',
                        role: 'master', // Temporary fallback, ideally 'student' but master for safety? No, student default.
                        level: 1,
                        xp: 0,
                        points: 0
                    });
                    setLoading(false);
                } else {
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
                console.error("Auth Exception:", err);
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
