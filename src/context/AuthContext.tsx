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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);
    const initCompletedRef = useRef(false);

    // Fetch profile from DB - returns null if failed
    const fetchProfile = async (userId: string, email?: string | null): Promise<UserProfile | null> => {
        try {
            const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !profile) {
                console.log('[Auth] Profile fetch failed:', error?.message);
                return null;
            }

            console.log('[Auth] Profile loaded:', profile.role);
            return {
                id: profile.id,
                nickname: profile.nickname || email?.split('@')[0] || 'User',
                classType: profile.class_type || 'Challenger',
                role: profile.role || 'student', // Default to student for safety
                level: profile.level || 1,
                xp: profile.xp || 0,
                points: profile.points || 0
            };
        } catch (err) {
            console.log('[Auth] Profile fetch exception:', err);
            return null;
        }
    };

    // Create fallback user when DB fails
    const createFallbackUser = (sessionUser: { id: string; email?: string | null }, isAdmin: boolean): UserProfile => ({
        id: sessionUser.id,
        nickname: sessionUser.email?.split('@')[0] || 'User',
        classType: 'Challenger',
        role: isAdmin ? 'master' : 'student', // Only admin emails get master
        level: 1,
        xp: 0,
        points: 0
    });

    // Check if email is admin (emergency access)
    const isAdminEmail = (email: string | null | undefined): boolean => {
        if (!email) return false;
        return email.includes('emergency') || email.includes('admin@') || email.includes('master@');
    };

    useEffect(() => {
        mountedRef.current = true;

        const initAuth = async () => {
            if (initCompletedRef.current) return;
            initCompletedRef.current = true;

            console.log('[Auth] Starting initialization...');

            // Safety timeout - force unlock after 4 seconds
            const timeoutId = setTimeout(() => {
                if (mountedRef.current && loading) {
                    console.warn('[Auth] Timeout! Force unlocking UI');
                    setLoading(false);
                }
            }, 4000);

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

                // TRY to fetch profile FIRST (this determines role accurately)
                const profile = await fetchProfile(session.user.id, session.user.email);

                if (mountedRef.current) {
                    if (profile) {
                        // Use DB profile (has accurate role)
                        // FORCE OVERRIDE for Emergency/Admin emails to prevent DB lockouts
                        if (isAdminEmail(session.user.email)) {
                            console.log('[Auth] Emergency Override: Forcing Master Role');
                            profile.role = 'master';
                        }
                        setUser(profile);
                    } else {
                        // Fallback based on email pattern
                        const fallback = createFallbackUser(session.user, isAdminEmail(session.user.email));
                        setUser(fallback);
                    }
                    setLoading(false);
                }
                clearTimeout(timeoutId);

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

            if (event === 'INITIAL_SESSION') return;

            if (event === 'SIGNED_IN' && session?.user) {
                setLoading(true);

                // Fetch profile to get accurate role
                const profile = await fetchProfile(session.user.id, session.user.email);

                if (mountedRef.current) {
                    if (profile) {
                        // FORCE OVERRIDE for Emergency/Admin emails to prevent DB lockouts
                        if (isAdminEmail(session.user.email)) {
                            console.log('[Auth] Emergency Override (Listener): Forcing Master Role');
                            profile.role = 'master';
                        }
                        setUser(profile);
                    } else {
                        setUser(createFallbackUser(session.user, isAdminEmail(session.user.email)));
                    }
                    setLoading(false);
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
