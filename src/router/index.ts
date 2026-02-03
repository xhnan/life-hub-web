import {createRouter, createWebHashHistory, type RouteRecordRaw} from "vue-router";
import {formatRouter} from "@/router/utils.ts";
import remainingRouter from "./modules/remaining";

const modules: Record<string, any> = import.meta.glob(
    ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
    {
        eager: true
    }
);

const constantRouteList: RouteRecordRaw[] = [];
const asyncRouteList: RouteRecordRaw[] = [];

Object.keys(modules).forEach((key) => {
    const name = key.match(/\.\/modules\/(.*)\.ts$/)?.[1];
    const mod = modules[key]?.default;
    if (!mod) return;
    const modList = Array.isArray(mod) ? mod : [mod];

    if (name === 'login' || name === 'home') {
        constantRouteList.push(...modList);
    } else {
        asyncRouteList.push(...modList);
    }
});

constantRouteList.push(...remainingRouter);

export const constantRoutes: Array<RouteRecordRaw> = formatRouter(constantRouteList);
export const asyncRoutes: Array<RouteRecordRaw> = formatRouter(asyncRouteList);

const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
});

import { getUserInfoApi } from "@/api/authApi";
import { userStore, setUserInfo } from "@/store/user";
import { generateRoutes } from "@/store/permission";
import { hasPermission, clearAuthData } from "@/utils/auth";
import { STORAGE_KEYS } from "@/utils/constants";

const whiteList = ['/login'];

router.beforeEach(async (to, _, next) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const tokenExpiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

    // 检查是否过期
    let isExpired = false;
    if (token && tokenExpiresAt) {
        if (Date.now() > Number(tokenExpiresAt)) {
            isExpired = true;
            clearAuthData();
        }
    }

    if (token && !isExpired) {
        if (to.path === '/login') {
            next('/');
        } else {
            // 判断是否已加载权限路由
            if (userStore.roles && userStore.roles.length > 0) {
                if (to.meta?.permissions && !hasPermission(to.meta.permissions as string[])) {
                     next('/403');
                     return;
                }
                next();
            } else {
                try {
                    // 尝试从 sessionStorage 获取角色信息
                    const storedRoles = sessionStorage.getItem(STORAGE_KEYS.USER_ROLES);
                    const storedPermissions = sessionStorage.getItem(STORAGE_KEYS.USER_PERMISSIONS);

                    let roles: string[] = [];
                    let permissions: string[] = [];
                    let isSuperAdmin = false;

                    if (storedRoles && storedPermissions) {
                        roles = JSON.parse(storedRoles);
                        permissions = JSON.parse(storedPermissions);
                        // 兼容旧的 sessionStorage 数据结构（假设没有 isSuperAdmin 字段则为 false，或者需要清理旧缓存）
                    } else {
                        // 调用接口获取
                        const { data } = await getUserInfoApi();
                        // 提取角色 code 列表
                        roles = data.roles.map(r => r.roleCode);
                        // 提取权限 code 列表 (后端返回的是 permissionKey)
                        permissions = data.permissions.map(p => p.permissionKey);
                        isSuperAdmin = data.isSuperAdmin;

                        // 如果是超级管理员，赋予一个特殊角色标识，方便后续权限判断
                        if (isSuperAdmin) {
                            roles.push('super_admin');
                            permissions.push('*:*:*'); // 超级权限标识
                        }

                        // 存入 sessionStorage
                        sessionStorage.setItem(STORAGE_KEYS.USER_ROLES, JSON.stringify(roles));
                        sessionStorage.setItem(STORAGE_KEYS.USER_PERMISSIONS, JSON.stringify(permissions));
                    }
                    
                    setUserInfo(roles, permissions);
                    
                    // 生成并添加路由
                    // generateRoutes 已经修改为 async，需要 await
                    const accessRoutes = await generateRoutes(roles);
                    accessRoutes.forEach(route => {
                        // 移除之前的 router.hasRoute 检查，因为 addRoute 会自动覆盖同名路由（但最好还是保持单一来源）
                        // 由于 permissionStore 已经做了去重，这里直接添加即可
                        // 注意：如果路由名称重复，Vue Router 会覆盖旧路由，并输出警告
                        router.addRoute(route);
                    });
                    
                    // 确保 404 路由最后添加
                    const catchAllRouteName = 'CatchAll';
                    // 先移除旧的 404 路由（如果存在），确保它始终在最后
                    if (router.hasRoute(catchAllRouteName)) {
                        router.removeRoute(catchAllRouteName);
                    }
                    router.addRoute({ 
                        path: '/:pathMatch(.*)*', 
                        name: catchAllRouteName,
                        redirect: '/404', 
                        meta: { hidden: true } 
                    } as any);

                    next({ ...to, replace: true });
                } catch (error) {
                    console.error('Failed to generate routes:', error);
                    // 出错需重置
                    clearAuthData();
                    next('/login');
                }
            }
        }
    } else {
        if (whiteList.includes(to.path)) {
            next();
        } else {
            next('/login');
        }
    }
});

export default router;