"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AdminUser, getAdminUserByUID } from '@/lib/db/scraped-products';
import { hasPermission, hasAnyPermission, hasAllPermissions, canAccessByRole, Permission } from '@/lib/permissions';

interface AdminContextType {
    user: AdminUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    permissions: string[];
    role: AdminUser['role'] | null;
    // Permission checking methods
    checkPermission: (permission: Permission) => boolean;
    checkAnyPermission: (permissions: Permission[]) => boolean;
    checkAllPermissions: (permissions: Permission[]) => boolean;
    checkRole: (requiredRole: AdminUser['role']) => boolean;
    // Utility methods
    refreshUser: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Check if user has admin privileges
                    const response = await fetch('/api/admin/check-access', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ uid: firebaseUser.uid, email: firebaseUser.email }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.hasAccess) {
                            // Fetch full admin user data
                            const adminUser = await getAdminUserByUID(firebaseUser.uid);
                            setUser(adminUser);
                            setIsAuthenticated(true);
                        } else {
                            setUser(null);
                            setIsAuthenticated(false);
                        }
                    } else {
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('Error checking admin access:', error);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const checkPermission = (permission: Permission): boolean => {
        return hasPermission(user, permission);
    };

    const checkAnyPermission = (permissions: Permission[]): boolean => {
        return hasAnyPermission(user, permissions);
    };

    const checkAllPermissions = (permissions: Permission[]): boolean => {
        return hasAllPermissions(user, permissions);
    };

    const checkRole = (requiredRole: AdminUser['role']): boolean => {
        return canAccessByRole(user, requiredRole);
    };

    const refreshUser = async (): Promise<void> => {
        if (auth.currentUser) {
            try {
                const adminUser = await getAdminUserByUID(auth.currentUser.uid);
                setUser(adminUser);
            } catch (error) {
                console.error('Error refreshing admin user:', error);
            }
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            await auth.signOut();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const contextValue: AdminContextType = {
        user,
        isLoading,
        isAuthenticated,
        permissions: user?.permissions || [],
        role: user?.role || null,
        checkPermission,
        checkAnyPermission,
        checkAllPermissions,
        checkRole,
        refreshUser,
        signOut,
    };

    return (
        <AdminContext.Provider value={contextValue}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}

// Convenience hook for checking permissions
export function usePermissions() {
    const { checkPermission, checkAnyPermission, checkAllPermissions, checkRole } = useAdmin();
    return {
        hasPermission: checkPermission,
        hasAnyPermission: checkAnyPermission,
        hasAllPermissions: checkAllPermissions,
        hasRole: checkRole,
    };
}
