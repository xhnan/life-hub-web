import {createRouter, createWebHashHistory, type RouteRecordRaw} from "vue-router";
import {formatRouter} from "@/router/utils.ts";

const modules: Record<string, any> = import.meta.glob(
    ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
    {
        eager: true
    }
);


// const routes  = [];

const routesSource: RouteRecordRaw[] = Object.keys(modules).flatMap((key) => {
    const d = modules[key]?.default;
    if (!d) return [];
    return Array.isArray(d) ? d : [d];
}) as RouteRecordRaw[];
export const constantRoutes: Array<RouteRecordRaw> = formatRouter(
    routesSource
);



const router = createRouter({
    history: createWebHashHistory(),
    routes:constantRoutes,
});

const whiteList = ['/login'];

router.beforeEach((to, _, next) => {
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
        }
    }

    if (token && !isExpired) {
        if (to.path === '/login') {
            next('/');
        } else {
            next();
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