import {createRouter, createWebHashHistory, type RouteRecordRaw} from "vue-router";
import {formatRouter} from "@/router/utils.ts";

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

export const constantRoutes: Array<RouteRecordRaw> = formatRouter(constantRouteList);
export const asyncRoutes: Array<RouteRecordRaw> = formatRouter(asyncRouteList);

const router = createRouter({
    history: createWebHashHistory(),
    routes: constantRoutes,
});

import { getUserInfoApi } from "@/api/authApi";
import { userStore, setUserInfo } from "@/store/user";
import { generateRoutes } from "@/store/permission";
import { hasPermission } from "@/utils/auth";

const whiteList = ['/login'];

router.beforeEach(async (to, _, next) => {
    const token = localStorage.getItem('token');
    const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');

    // 检查是否过期
    let isExpired = false;
    if (token && tokenExpiresAt) {
        if (Date.now() > Number(tokenExpiresAt)) {
            isExpired = true;
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpiresAt');
            localStorage.removeItem('userInfo');
            sessionStorage.removeItem('userRoles');
            sessionStorage.removeItem('userPermissions');
            sessionStorage.removeItem('menuData');
        }
    }

    if (token && !isExpired) {
        if (to.path === '/login') {
            next('/');
        } else {
            // 判断是否已加载权限路由
            if (userStore.roles && userStore.roles.length > 0) {
                if (to.meta?.permissions && !hasPermission(to.meta.permissions as string[])) {
                     next('/404');
                     return;
                }
                next();
            } else {
                try {
                    // 尝试从 sessionStorage 获取角色信息
                    const storedRoles = sessionStorage.getItem('userRoles');
                    const storedPermissions = sessionStorage.getItem('userPermissions');
                    
                    let roles: string[] = [];
                    let permissions: string[] = [];

                    if (storedRoles && storedPermissions) {
                        roles = JSON.parse(storedRoles);
                        permissions = JSON.parse(storedPermissions);
                    } else {
                        // 调用接口获取
                        const { data } = await getUserInfoApi();
                        roles = data.roles;
                        permissions = data.permissions;
                        
                        // 存入 sessionStorage
                        sessionStorage.setItem('userRoles', JSON.stringify(roles));
                        sessionStorage.setItem('userPermissions', JSON.stringify(permissions));
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
                    localStorage.removeItem('token');
                    localStorage.removeItem('tokenExpiresAt');
                    localStorage.removeItem('userInfo');
                    sessionStorage.removeItem('userRoles');
                    sessionStorage.removeItem('userPermissions');
                    sessionStorage.removeItem('menuData');
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