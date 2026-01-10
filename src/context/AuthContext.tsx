import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    nickname: string;
    classType: string;
    role: 'student' | 'master';
    level: number;
    xp: number;
    points: number;
}

interface AuthContextType {
    user: UserProfile | null;
    role: 'student' | 'master';
    loading: boolean;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to set fallback user from session
    const setFallbackUser = (sessionUser: any) => {
        if (!sessionUser) return;
        setUser({
            id: sessionUser.id,
            nickname: sessionUser.email?.split('@')[0] || 'Unknown',
            classType: 'Challenger',
            role: 'master', // FORCE MASTER for safety during debug
            level: 1,
            xp: 0,
            points: 0
        });
    };

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) {
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
        } catch (err: any) {
            // Ignore AbortErrors
            if (err?.message?.includes('abort') || err?.name === 'AbortError') return;
            console.error("AuthContext Exception:", err);
            const session = (await supabase.auth.getSession()).data.session;
            setFallbackUser(session?.user);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            console.log('[AuthContext] initAuth running...');

            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                console.log('[AuthContext] Session check:', session ? 'EXISTS' : 'NONE', error);

                if (error) throw error;

                if (session?.user && mounted) {
                    console.log('[AuthContext] Setting fallback user:', session.user.email);
                    setFallbackUser(session.user); // Immediate access with master role
                    setLoading(false); // Unlock UI immediately
                    // Background fetch for full profile (optional upgrade)
                    fetchProfile(session.user.id);
                } else if (mounted) {
                    console.log('[AuthContext] No session, setting loading=false');
                    setLoading(false);
                }
            } catch (e: any) {
                // Ignore AbortErrors - these happen during navigation and are harmless
                if (e?.message?.includes('abort') || e?.name === 'AbortError') {
                    console.log('[AuthContext] Request aborted (navigation)');
                    return;
                }
                console.error("[AuthContext] Init Error:", e);
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // Skip INITIAL_SESSION - already handled by initAuth
            if (event === 'INITIAL_SESSION') return;

            if (event === 'SIGNED_IN' && session) {
                setLoading(true);
                setFallbackUser(session.user);
                await fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        // State update handled by listener
    };

    return (
        <AuthContext.Provider value={{
            user,
            role: user?.role || 'student',
            loading,
            signOut,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
