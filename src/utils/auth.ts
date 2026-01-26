import { userStore } from "@/store/user";

/**
 * Check if user has permission
 * @param value Permission string or array of strings
 * @returns boolean
 */
export const hasPermission = (value: string | string[]): boolean => {
    if (!value) return true;
    const permissions = userStore.permissions;
    if (!permissions) return false;
    
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
