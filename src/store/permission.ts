import { reactive } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { constantRoutes } from '@/router';
import { generateRoutesFromMenus, type MenuTreeNode } from '@/router/transform';
import type { PermissionInfo } from '@/api/authApi';
import { STORAGE_KEYS, PERMISSION_CACHE_TTL_MS } from '@/utils/constants';

interface PermissionState {
    roles: string[];
    permissions: string[];
    routes: RouteRecordRaw[];        // 完整路由（constant + dynamic），供 useNav 使用
    dynamicRoutes: RouteRecordRaw[]; // 仅后端生成的动态路由
    menus: MenuTreeNode[];           // 后端返回的路由菜单树
    isRoutesGenerated: boolean;
}

export const permissionStore = reactive<PermissionState>({
    roles: [],
    permissions: [],
    routes: [],
    dynamicRoutes: [],
    menus: [],
    isRoutesGenerated: false
});

/**
 * 向后兼容：旧代码以 userStore.roles / userStore.permissions 读取，
 * 与 permissionStore 同源。
 */
export const userStore = permissionStore;

/**
 * 兼容旧签名：仅设置角色码与权限码。
 */
export function setUserInfo(roles: string[], permissions: string[]): void {
    permissionStore.roles = Array.isArray(roles) ? roles.map(String) : [];
    permissionStore.permissions = Array.isArray(permissions) ? permissions.map(String) : [];
}

/**
 * 兼容旧导出：清空角色与权限。
 */
export function clearUserInfo(): void {
    clearPermission();
}

/**
 * 写入聚合权限信息到 store，并缓存（带时间戳）。
 */
export function setPermissionInfo(info: PermissionInfo): void {
    const roles = (info.roles || []).map(String);
    const permissions = (info.permissions || []).map(String);
    permissionStore.roles = roles;
    permissionStore.permissions = permissions;
    permissionStore.menus = Array.isArray(info.menus) ? info.menus : [];

    try {
        sessionStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(roles));
        sessionStorage.setItem(STORAGE_KEYS.USER_PERMISSIONS, JSON.stringify(permissions));
        // 原始后端菜单树写入独立的 MENU_TREE，避免与 useNav 写入 MENU_DATA 的前端菜单产生冲突
        sessionStorage.setItem(STORAGE_KEYS.MENU_TREE, JSON.stringify(permissionStore.menus));
        sessionStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, String(Date.now()));
    } catch (e) {
        console.warn('[permission] 缓存权限信息失败', e);
    }
}

/**
 * 清空 store 与缓存（登出/凭证过期时调用）。
 */
export function clearPermission(): void {
    permissionStore.roles = [];
    permissionStore.permissions = [];
    permissionStore.routes = [];
    permissionStore.dynamicRoutes = [];
    permissionStore.menus = [];
    permissionStore.isRoutesGenerated = false;
    try {
        sessionStorage.removeItem(STORAGE_KEYS.USER_ROLES);
        sessionStorage.removeItem(STORAGE_KEYS.USER_PERMISSIONS);
        sessionStorage.removeItem(STORAGE_KEYS.MENU_DATA);
        sessionStorage.removeItem(STORAGE_KEYS.MENU_TREE);
        sessionStorage.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP);
    } catch {
        // ignore
    }
}

/**
 * 从缓存恢复聚合权限信息（仅用于接口不可达时的降级）。
 * 缓存超过 PERMISSION_CACHE_TTL_MS 视为过期，返回 null。
 */
export function restoreFromCache(): PermissionInfo | null {
    try {
        const ts = Number(sessionStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP) || 0);
        if (!ts || Date.now() - ts > PERMISSION_CACHE_TTL_MS) {
            return null;
        }
        const rolesRaw = sessionStorage.getItem(STORAGE_KEYS.USER_ROLES);
        const permsRaw = sessionStorage.getItem(STORAGE_KEYS.USER_PERMISSIONS);
        const menusRaw = sessionStorage.getItem(STORAGE_KEYS.MENU_TREE);
        if (!rolesRaw || !permsRaw) {
            return null;
        }
        return {
            user: { userId: '', username: '', nickname: '', avatar: '' },
            roles: JSON.parse(rolesRaw),
            permissions: JSON.parse(permsRaw),
            menus: menusRaw ? JSON.parse(menusRaw) : []
        };
    } catch {
        return null;
    }
}

/**
 * 由后端菜单树生成动态路由，写入 store。
 * 空/非数组 menus → 告警并返回空动态路由（仅常量路由生效）。
 */
export function generateRoutes(menus: MenuTreeNode[]): RouteRecordRaw[] {
    if (!Array.isArray(menus) || menus.length === 0) {
        console.warn('[permission] 后端菜单树为空或非数组，仅注册常量路由');
        permissionStore.dynamicRoutes = [];
        permissionStore.routes = [...constantRoutes];
        permissionStore.isRoutesGenerated = true;
        return [];
    }

    const dynamicRoutes = generateRoutesFromMenus(menus);
    permissionStore.dynamicRoutes = dynamicRoutes;
    permissionStore.routes = [...constantRoutes, ...dynamicRoutes];
    permissionStore.isRoutesGenerated = true;
    return dynamicRoutes;
}
