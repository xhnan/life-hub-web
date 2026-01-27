import { userStore } from "@/store/user";
import { STORAGE_KEYS } from "./constants";

/**
 * Check if user has permission
 * @param value Permission string or array of strings
 * @returns boolean
 */
export const hasPermission = (value: string | string[]): boolean => {
    if (!value) return true;
    const permissions = userStore.permissions;
    if (!permissions) return false;

    // 超级管理员拥有所有权限
    if (permissions.includes('*:*:*')) return true;

    const requiredPermissions = Array.isArray(value) ? value : [value];
    return requiredPermissions.some(p => permissions.includes(p));
};

/**
 * Check if user has role
 * @param value Role string or array of strings
 * @returns boolean
 */
export const hasRole = (value: string | string[]): boolean => {
    if (!value) return true;
    const roles = userStore.roles;
    if (!roles) return false;

    const requiredRoles = Array.isArray(value) ? value : [value];
    return requiredRoles.some(r => roles.includes(r));
};

/**
 * Clear all authentication data from localStorage and sessionStorage
 */
export const clearAuthData = () => {
    const localItems = [
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.TOKEN_EXPIRES_AT,
        STORAGE_KEYS.USER_INFO
    ];

    const sessionItems = [
        STORAGE_KEYS.USER_ROLES,
        STORAGE_KEYS.USER_PERMISSIONS,
        STORAGE_KEYS.MENU_DATA
    ];

    localItems.forEach(key => localStorage.removeItem(key));
    sessionItems.forEach(key => sessionStorage.removeItem(key));
};
