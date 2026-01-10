import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: any[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-babel-gold flex flex-col items-center justify-center font-mono p-4">
                <div className="animate-pulse mb-4">VERIFYING CITIZENSHIP...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Force types to any to prevent TS build errors during critical fix
    const userRole = role as any;
    const roles = allowedRoles as any[];

    // Master accessing Student pages -> Redirect to Admin
    if (userRole === 'master' && roles && !roles.includes('master')) {
        return <Navigate to="/admin" replace />;
    }

    // Student accessing Admin pages -> Redirect to Dashboard
    if (userRole !== 'master' && userRole !== 'admin' && roles?.includes('master')) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
