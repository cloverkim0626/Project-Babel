import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

// Create fallback user from session
const createFallbackUser = (sessionUser: { id: string; email?: string | null }): UserProfile => ({
    id: sessionUser.id,
    nickname: sessionUser.email?.split('@')[0] || 'User',
    classType: 'Challenger',
    role: 'master', // Default to master during emergency fix
    level: 1,
    xp: 0,
    points: 0
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);
    const initCompletedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;

        const initAuth = async () => {
            // Prevent double initialization
            if (initCompletedRef.current) return;
            initCompletedRef.current = true;

            console.log('[Auth] Starting initialization...');

            // Safety timeout - force unlock after 5 seconds
            const timeoutId = setTimeout(() => {
                if (mountedRef.current && loading) {
                    console.warn('[Auth] Timeout! Force unlocking UI');
                    setLoading(false);
                }
            }, 5000);

            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[Auth] Session error:', error.message);
                    if (mountedRef.current) setLoading(false);
                    clearTimeout(timeoutId);
                    return;
                }

                if (!session?.user) {
                    console.log('[Auth] No session found');
                    if (mountedRef.current) setLoading(false);
                    clearTimeout(timeoutId);
                    return;
                }

                console.log('[Auth] Session found for:', session.user.email);

                // CRITICAL: Set fallback user IMMEDIATELY and unlock UI
                const fallbackUser = createFallbackUser(session.user);
                if (mountedRef.current) {
                    setUser(fallbackUser);
                    setLoading(false); // UI unlocked NOW
                }
                clearTimeout(timeoutId);

                // Background profile fetch (optional upgrade, no blocking)
                try {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile && mountedRef.current) {
                        console.log('[Auth] Profile upgraded:', profile.role);
                        setUser({
                            id: profile.id,
                            nickname: profile.nickname || fallbackUser.nickname,
                            classType: profile.class_type || 'Challenger',
                            role: profile.role || 'master',
                            level: profile.level || 1,
                            xp: profile.xp || 0,
                            points: profile.points || 0
                        });
                    }
                } catch (profileErr) {
                    console.log('[Auth] Profile fetch failed (using fallback):', profileErr);
                    // Keep using fallback - no problem
                }

            } catch (err) {
                console.error('[Auth] Critical error:', err);
                if (mountedRef.current) setLoading(false);
                clearTimeout(timeoutId);
            }
        };

        initAuth();

        // Auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mountedRef.current) return;

            console.log('[Auth] State change:', event);

            if (event === 'INITIAL_SESSION') {
                // Already handled by initAuth
                return;
            }

            if (event === 'SIGNED_IN' && session?.user) {
                const fallbackUser = createFallbackUser(session.user);
                setUser(fallbackUser);
                setLoading(false);

                // Background profile upgrade
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile && mountedRef.current) {
                    setUser({
                        id: profile.id,
                        nickname: profile.nickname || fallbackUser.nickname,
                        classType: profile.class_type || 'Challenger',
                        role: profile.role || 'master',
                        level: profile.level || 1,
                        xp: profile.xp || 0,
                        points: profile.points || 0
                    });
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            mountedRef.current = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
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
