import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();
    const [timedOut, setTimedOut] = useState(false);

    // Loading timeout - redirect to login if stuck for too long
    useEffect(() => {
        if (!loading) {
            setTimedOut(false);
            return;
        }

        const timer = setTimeout(() => {
            console.warn('[RoleGuard] Loading timeout - redirecting to login');
            setTimedOut(true);
        }, 4000); // 4 second timeout

        return () => clearTimeout(timer);
    }, [loading]);

    // Timeout reached - force redirect to login
    if (timedOut && loading) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-babel-gold flex flex-col items-center justify-center font-mono p-4">
                <div className="animate-pulse mb-4 text-lg">VERIFYING CITIZENSHIP...</div>
                <div className="text-xs text-stone-500">Connecting to Babel System...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const userRole = role as string;
    const roles = allowedRoles as string[] | undefined;

    // Master accessing Student-only pages -> Redirect to Admin
    if (userRole === 'master' && roles && !roles.includes('master') && !roles.includes('admin')) {
        return <Navigate to="/admin" replace />;
    }

    // Student accessing Admin pages -> Redirect to Dashboard
    if (userRole !== 'master' && userRole !== 'admin' && roles?.some(r => r === 'master' || r === 'admin')) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
