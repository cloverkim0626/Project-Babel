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
    const initializedRef = useRef(false); // Prevent double init

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
        } catch (err) {
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
            if (initializedRef.current) return; // Already initialized
            initializedRef.current = true;

            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session?.user && mounted) {
                    setFallbackUser(session.user); // Immediate access
                    await fetchProfile(session.user.id);
                } else if (mounted) {
                    setLoading(false);
                }
            } catch (e) {
                console.error("AuthContext Init Error:", e);
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
