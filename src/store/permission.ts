import { reactive } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { constantRoutes, asyncRoutes } from '@/router';

interface PermissionState {
    routes: RouteRecordRaw[];
    addRoutes: RouteRecordRaw[];
}

export const permissionStore = reactive<PermissionState>({
    routes: [],
    addRoutes: []
});

function hasPermission(roles: string[], route: RouteRecordRaw) {
    if (route.meta && route.meta.roles) {
        const routeRoles = route.meta.roles as string[];
        return roles.some(role => routeRoles.includes(role));
    } else {
        return true;
    }
}

export function filterAsyncRoutes(routes: RouteRecordRaw[], roles: string[]) {
    const res: RouteRecordRaw[] = [];
    routes.forEach(route => {
        const tmp = { ...route };
        if (hasPermission(roles, tmp)) {
            if (tmp.children) {
                tmp.children = filterAsyncRoutes(tmp.children, roles);
            }
            res.push(tmp);
        }
    });
    return res;
}

export const generateRoutes = (roles: string[]) => {
    let accessedRoutes;
    if (roles.includes('admin')) {
        accessedRoutes = asyncRoutes || [];
    } else {
        accessedRoutes = filterAsyncRoutes(asyncRoutes, roles);
    }
    permissionStore.addRoutes = accessedRoutes;
    permissionStore.routes = constantRoutes.concat(accessedRoutes);
    return accessedRoutes;
};
