import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import loginRoutes from "./modules/login";
import homeRoute from "./modules/home";
import remainingRouter from "./modules/remaining";

// ========== 常量路由（单一来源：业务路由全部来自后端菜单树） ==========
// 仅保留登录、OAuth2 回调、首页/布局、403/404/错误页等与业务菜单无关的固定路由。
const homeRouteList: RouteRecordRaw[] = Array.isArray(homeRoute)
    ? (homeRoute as RouteRecordRaw[])
    : [homeRoute as RouteRecordRaw];

export const constantRoutes: Array<RouteRecordRaw> = [
    ...(loginRoutes as RouteRecordRaw[]),
    ...homeRouteList,
    ...remainingRouter
];

const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
});

import { getPermissionInfoApi } from "@/api/authApi";
import {
    permissionStore,
    setPermissionInfo,
    generateRoutes,
    restoreFromCache
} from "@/store/permission";
import { hasPermission, clearAuthData } from "@/utils/auth";
import { STORAGE_KEYS } from "@/utils/constants";
import { ElMessage } from "element-plus";

const whiteList = ['/login', '/oauth2/redirect', '/error'];
const CATCH_ALL_NAME = 'CatchAll';
const MAX_INIT_ATTEMPTS = 2;

/**
 * 确保 404 兜底路由始终注册在所有动态路由之后。
 */
function ensureCatchAllLast() {
    if (router.hasRoute(CATCH_ALL_NAME)) {
        router.removeRoute(CATCH_ALL_NAME);
    }
    router.addRoute({
        path: '/:pathMatch(.*)*',
        name: CATCH_ALL_NAME,
        redirect: '/404',
        meta: { hidden: true }
    } as RouteRecordRaw);
}

/**
 * 将动态路由注册到 router。
 */
function registerDynamicRoutes(routes: RouteRecordRaw[]) {
    routes.forEach(route => router.addRoute(route));
    ensureCatchAllLast();
}

/**
 * 权限初始化：拉取聚合权限信息 → 生成并注册动态路由。
 * 失败时有限重试；重试耗尽后尝试缓存降级，仍无则跳转错误页。
 * 返回 next() 的目标（重定向对象或字符串路径）。
 */
async function initPermission(toFullPath: any): Promise<any> {
    for (let attempt = 0; attempt < MAX_INIT_ATTEMPTS; attempt++) {
        try {
            const { data } = await getPermissionInfoApi();
            setPermissionInfo(data);
            const routes = generateRoutes(data.menus);
            registerDynamicRoutes(routes);
            return { ...toFullPath, replace: true };
        } catch (e) {
            console.error(`[router] 权限初始化失败（第 ${attempt + 1} 次）`, e);
        }
    }

    // 重试耗尽：尝试缓存降级
    const cached = restoreFromCache();
    if (cached) {
        setPermissionInfo(cached);
        const routes = generateRoutes(cached.menus);
        registerDynamicRoutes(routes);
        ElMessage.warning('使用本地缓存，数据可能非最新');
        return { ...toFullPath, replace: true };
    }

    // 无缓存：跳转错误页（不清除 token，避免循环重定向）
    return '/error';
}

router.beforeEach(async (to, _, next) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const tokenExpiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

    // 过期判定
    let isExpired = false;
    if (token && tokenExpiresAt && Date.now() > Number(tokenExpiresAt)) {
        isExpired = true;
        clearAuthData();
    }

    // 未登录 / 已过期
    if (!token || isExpired) {
        if (whiteList.includes(to.path)) {
            next();
        } else {
            next('/login');
        }
        return;
    }

    // 已登录访问登录页 → 跳首页
    if (to.path === '/login') {
        next('/');
        return;
    }

    // 已完成权限初始化：按 meta.permissions 做 403 校验
    if (permissionStore.isRoutesGenerated) {
        if (to.meta?.permissions && !hasPermission(to.meta.permissions as string[])) {
            next('/403');
            return;
        }
        next();
        return;
    }

    // 白名单页面（如错误页）即使未初始化也放行，避免在错误页再次触发初始化
    if (whiteList.includes(to.path)) {
        next();
        return;
    }

    // 未初始化：执行权限初始化
    const target = await initPermission(to);
    next(target);
});

export default router;
