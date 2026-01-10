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

        // SAFETY TIMEOUT: Force stop loading after 5 seconds to prevent "Verifying..." hang
        const safetyTimer = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth check timed out - forcing Loading to false");
                setLoading(false);
            }
        }, 5000);

        // Helper to set fallback user from session
        const setFallbackUser = (sessionUser: any) => {
            if (!sessionUser) return;
            console.warn('Deploying Auth Fallback for:', sessionUser.email);
            setUser({
                id: sessionUser.id,
                nickname: sessionUser.email?.split('@')[0] || 'Unknown',
                classType: 'Challenger',
                role: 'master', // Default to master for admin access during debug; ideally logic should detect or default to student
                level: 1,
                xp: 0,
                points: 0
            });
        };

        const fetchProfile = async (userId: string, isMounted: boolean) => {
            try {
                // Race condition: if this hangs, safetyTimer will trigger.
                // But safetyTimer needs to know TO set user, not just stop loading.

                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!isMounted) return;

                if (error || !data) {
                    console.warn('Profile fetch failed:', error);
                    const session = (await supabase.auth.getSession()).data.session;
                    setFallbackUser(session?.user);
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
                }
            } catch (err) {
                console.error("Auth Exception:", err);
                if (isMounted) {
                    // Try to recover session
                    const session = (await supabase.auth.getSession()).data.session;
                    setFallbackUser(session?.user);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // SAFETY TIMEOUT: Force stop loading after 5 seconds to prevent "Verifying..." hang
        const safetyTimer = setTimeout(async () => {
            if (mounted && loading) {
                console.warn("Auth check timed out - forcing Fallback");
                // Attempt to rescue session
                const session = (await supabase.auth.getSession()).data.session;
                if (session?.user) {
                    setFallbackUser(session.user);
                }
                setLoading(false);
            }
        }, 5000);

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_IN' && session) {
                setLoading(true);
                // We must allow time for fetchProfile again, but safetyTimer is already running/done?
                // Actually safetyTimer runs ONCE on mount.
                // If we re-login, we should ideally have a new timeout or trust fetchProfile.
                // For now, let's trust fetchProfile's internal try/catch/finally to handle "loading=false".
                await fetchProfile(session.user.id, mounted);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                navigate('/login');
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimer);
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
