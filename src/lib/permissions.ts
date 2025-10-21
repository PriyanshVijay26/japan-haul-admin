import React from 'react';
import { AdminUser } from './db/scraped-products';

/**
 * Permission checking utilities for Role-Based Access Control (RBAC)
 */

// Permission definitions - these should match the matrix
export const PERMISSIONS = {
    // Admin permissions
    ADMIN_LOGIN: 'admin.login',
    ADMIN_LIST_EDIT: 'admin.list.edit',
    ADMIN_PERMISSIONS_EDIT: 'admin.permissions.edit',

    // Product permissions
    PRODUCTS_VIEW: 'products.view',
    PRODUCTS_EDIT: 'products.edit',
    PRODUCTS_DELETE: 'products.delete',
    PRODUCTS_POPULARITY_VIEW: 'products.popularity.view',

    // Order permissions
    ORDERS_VIEW: 'orders.view',
    ORDERS_EDIT: 'orders.edit',
    ORDERS_CAPTURE: 'orders.capture',

    // Customer permissions
    CUSTOMERS_VIEW: 'customers.view',
    CUSTOMERS_EDIT: 'customers.edit',
    CUSTOMERS_DELETE: 'customers.delete',

    // Analytics permissions
    ANALYTICS_VIEW: 'analytics.view',
    ANALYTICS_EXPORT: 'analytics.export',
    ANALYTICS_PROFIT_VIEW: 'analytics.profit.view',
    ANALYTICS_PROFIT_EDIT: 'analytics.profit.edit',

    // System permissions
    SYSTEM_SETTINGS: 'system.settings',
    SYSTEM_MAINTENANCE: 'system.maintenance',

    // Report permissions
    REPORTS_SALES_VIEW: 'reports.sales.view',
    REPORTS_INVENTORY_VIEW: 'reports.inventory.view',
    REPORTS_FINANCIAL_VIEW: 'reports.financial.view',

    // Other permissions
    SHIPPING_MANAGE: 'shipping.manage',
    NOTIFICATIONS_SEND: 'notifications.send',
    PROMOTIONS_MANAGE: 'promotions.manage',
    INVENTORY_MANAGE: 'inventory.manage',
    DATA_IMPORT: 'data.import',
    DATA_EXPORT: 'data.export',
    AUDIT_LOGS_VIEW: 'audit.logs.view',
    SECURITY_MANAGE: 'security.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: AdminUser | null, permission: Permission): boolean {
    if (!user || !user.permissions) {
        return false;
    }
    return user.permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: AdminUser | null, permissions: Permission[]): boolean {
    if (!user || !user.permissions) {
        return false;
    }
    return permissions.some(permission => user.permissions.includes(permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: AdminUser | null, permissions: Permission[]): boolean {
    if (!user || !user.permissions) {
        return false;
    }
    return permissions.every(permission => user.permissions.includes(permission));
}

/**
 * Get user's role level for comparison
 */
export function getRoleLevel(role: AdminUser['role']): number {
    switch (role) {
        case 'super_admin': return 4;
        case 'admin': return 3;
        case 'general': return 2;
        case 'test_mode': return 1;
        default: return 0;
    }
}

/**
 * Check if a user role can access a feature (role-based check)
 */
export function canAccessByRole(user: AdminUser | null, requiredRole: AdminUser['role']): boolean {
    if (!user) return false;
    return getRoleLevel(user.role) >= getRoleLevel(requiredRole);
}

/**
 * Permission groups for easier management
 */
export const PERMISSION_GROUPS = {
    ADMIN_MANAGEMENT: ['admin.permissions.edit', 'admin.list.edit'] as Permission[],
    PRODUCT_MANAGEMENT: ['products.view', 'products.edit', 'products.delete', 'products.popularity.view'] as Permission[],
    ORDER_MANAGEMENT: ['orders.view', 'orders.edit', 'orders.capture'] as Permission[],
    CUSTOMER_MANAGEMENT: ['customers.view', 'customers.edit', 'customers.delete'] as Permission[],
    ANALYTICS: ['analytics.view', 'analytics.export', 'analytics.profit.view', 'analytics.profit.edit'] as Permission[],
    SYSTEM_MANAGEMENT: ['system.settings', 'system.maintenance'] as Permission[],
    REPORTS: ['reports.sales.view', 'reports.inventory.view', 'reports.financial.view'] as Permission[],
    OPERATIONS: ['shipping.manage', 'notifications.send', 'promotions.manage', 'inventory.manage'] as Permission[],
    DATA_MANAGEMENT: ['data.import', 'data.export'] as Permission[],
    SECURITY: ['audit.logs.view', 'security.manage'] as Permission[],
    BASIC_ACCESS: ['admin.login'] as Permission[]
} as const;

/**
 * Check if user has access to a specific feature area
 */
export function canAccessFeature(user: AdminUser | null, feature: keyof typeof PERMISSION_GROUPS): boolean {
    if (!user) return false;
    const requiredPermissions = PERMISSION_GROUPS[feature];
    return hasAnyPermission(user, requiredPermissions);
}

/**
 * Permission hook for React components
 */
export function usePermissions() {
    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessByRole,
        canAccessFeature,
        PERMISSIONS,
    };
}

/**
 * Permission guard function for conditional rendering
 */
export function createPermissionGuard(
    hasPermission: boolean,
    children: React.ReactNode,
    fallback: React.ReactNode = null
) {
    return hasPermission ? children : fallback;
}

/**
 * Role-based guard function for conditional rendering
 */
export function createRoleGuard(
    hasRequiredRole: boolean,
    children: React.ReactNode,
    fallback: React.ReactNode = null
) {
    return hasRequiredRole ? children : fallback;
}
