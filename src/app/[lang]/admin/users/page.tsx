"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AdminUser } from "@/lib/db/scraped-products";
import PermissionMatrix from "@/components/admin/PermissionMatrix";
import { useAdmin, usePermissions } from "@/contexts/AdminContext";
import { PERMISSIONS } from "@/lib/permissions";

export default function AdminUsersPage() {
    const { lang: rawLang } = useParams<{ lang: string }>();
    const lang = rawLang === "ja" ? "ja" : "en";
    const { user, isLoading, isAuthenticated, permissions, role, signOut: adminSignOut } = useAdmin();
    const { hasPermission, hasAnyPermission } = usePermissions();
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Load admin users
    const loadAdminUsers = async () => {
        // Check if user has permission to view admin users
        if (!hasPermission(PERMISSIONS.ADMIN_LOGIN)) {
            return;
        }

        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setAdminUsers(data.users);
            }
        } catch (error) {
            console.error('Error loading admin users:', error);
        }
    };

    // Load data when component mounts
    useEffect(() => {
        if (isAuthenticated && hasPermission(PERMISSIONS.ADMIN_LOGIN)) {
            loadAdminUsers();
        }
    }, [isAuthenticated, hasPermission]);

    const handleRoleChange = async (userId: string, newRole: AdminUser['role']) => {
        // Check if user has permission to edit admin users
        if (!hasPermission(PERMISSIONS.ADMIN_PERMISSIONS_EDIT) || !hasPermission(PERMISSIONS.ADMIN_LIST_EDIT)) {
            alert('You do not have permission to edit admin user roles');
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                loadAdminUsers(); // Refresh the list
            } else {
                alert('Failed to update user role');
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role');
        }
    };

    const handleDeleteUser = async (uid: string) => {
        // Check if user has permission to edit admin users
        if (!hasPermission(PERMISSIONS.ADMIN_PERMISSIONS_EDIT) || !hasPermission(PERMISSIONS.ADMIN_LIST_EDIT)) {
            alert('You do not have permission to delete admin users');
            return;
        }

        if (!confirm('Are you sure you want to delete this admin user?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${uid}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                loadAdminUsers(); // Refresh the list
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const getRoleBadgeColor = (role: AdminUser['role']) => {
        switch (role) {
            case 'super_admin':
                return 'bg-red-100 text-red-800';
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            case 'general':
                return 'bg-green-100 text-green-800';
            case 'test_mode':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAuthenticated || !hasPermission(PERMISSIONS.ADMIN_LOGIN)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        You do not have permission to access this page.
                    </p>
                    <Link
                        href={`/${lang}/admin/login`}
                        className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Redirect general users to purchases page since they shouldn't access user management
    if (role === 'general' && !hasPermission(PERMISSIONS.ADMIN_PERMISSIONS_EDIT)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-orange-600 mb-4">Access Restricted</h2>
                    <p className="text-gray-600 mb-6">
                        General users can only access Purchase History.
                    </p>
                    <Link
                        href={`/${lang}/admin/purchases`}
                        className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        Go to Purchase History
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
                                {user?.name && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Welcome back, {user.name} ({role?.replace('_', ' ')})
                                    </p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                                    <Link
                                        href={`/${lang}/admin/products`}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        📦 Products
                                    </Link>
                                )}
                                {hasPermission(PERMISSIONS.ORDERS_VIEW) && (
                                    <Link
                                        href={`/${lang}/admin/purchases`}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                                    >
                                        🛒 Purchases
                                    </Link>
                                )}
                                {hasPermission(PERMISSIONS.ANALYTICS_VIEW) && (
                                    <Link
                                        href={`/${lang}/admin/analytics`}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                                    >
                                        📊 Analytics
                                    </Link>
                                )}
                                {hasPermission(PERMISSIONS.ANALYTICS_PROFIT_VIEW) && (
                                    <Link
                                        href={`/${lang}/admin/profit`}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                    >
                                        💰 Profit
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href={`/${lang}`} className="text-gray-600 hover:text-gray-900 text-sm">
                                Back to Site
                            </Link>
                            <Link href={`/${lang}/admin/products`} className="text-gray-600 hover:text-gray-900 text-sm">
                                Admin Dashboard
                            </Link>
                            <button
                                onClick={adminSignOut}
                                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Admin User Management
                            </h3>
                            {hasPermission(PERMISSIONS.ADMIN_LIST_EDIT) && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                                >
                                    Add Admin User
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {adminUsers.map((user) => (
                                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                {user.name || user.email}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {user.email} • UID: {user.uid}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                {user.role.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {formatDate(user.updatedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h5 className="font-semibold text-gray-900 mb-2">Permissions</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {user.permissions.map((permission) => (
                                                <span key={permission} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                                    {permission}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        {hasPermission(PERMISSIONS.ADMIN_PERMISSIONS_EDIT) && (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as AdminUser['role'])}
                                                className="border rounded px-3 py-1 text-sm"
                                            >
                                                <option value="test_mode">Test Mode</option>
                                                <option value="general">General</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        )}
                                        {hasPermission(PERMISSIONS.ADMIN_LIST_EDIT) && (
                                            <button
                                                onClick={() => handleDeleteUser(user.uid)}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {adminUsers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No admin users found
                            </div>
                        )}
                    </div>
                </div>

                {/* Permission Matrix Section */}
                <div className="mt-8">
                    <PermissionMatrix />
                </div>
            </div>
        </div>
    );
}
