import type { RouteRecordRaw } from 'vue-router';

//设置路由白名单，如果在这个名单里面不加入layout布局
const whiteList = ['/login','/welcome'];


function formatRouter(routes: any[]): RouteRecordRaw[]{
    console.log(routes)
    //遍历路由
    const routerRaw=  handleRouter(routes);
     //排序后返回
    const sortedRoutes = sortRoutes(routerRaw);
    console.log(sortedRoutes);
    return sortedRoutes;
}
// 判断是否为顶级路由：以 / 开头且只有一段路径
function isTopLevelRoute(path: string): boolean {
    if (!path || !path.startsWith('/')) return false;
    const segments = path.split('/').filter(Boolean);
    return segments.length === 1;
}

// 递归处理路由
function handleRouter(routes: any[]): RouteRecordRaw[] {
    if (!Array.isArray(routes)) return [];

    const res: RouteRecordRaw[] = [];

    routes.forEach(route => {
        const rawChildren = Array.isArray(route.children) ? route.children : [];
        const children = handleRouter(rawChildren);

        // 判断是否需要包裹 Layout：顶级路由 + 不在白名单
        const needLayout = isTopLevelRoute(route.path) && !whiteList.includes(route.path);

        const temp: RouteRecordRaw = {
            path: route.path,
            name: route.name,
            component: needLayout ? () => import('@/layout/index.vue') : route.component,
            redirect: route.redirect,
            meta: route.meta || {},
            children: needLayout && children.length === 0 && route.component
                ? [
                    // 无子路由时，把原 component 作为空路径子路由
                    {
                        path: '',
                        name: route.name ? `${route.name}Index` : undefined,
                        component: route.component,
                        meta: route.meta || {}
                    } as RouteRecordRaw
                  ]
                : children
        };

        res.push(temp);
    });

    return res;
}

//排序

// 递归排序路由（根据 meta.order，默认值为 0，数字越小越靠前）
function sortRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
    return routes
        .map(route => {
            // 如果有子路由，递归排序
            if (route.children && route.children.length > 0) {
                route.children = sortRoutes(route.children);
            }
            return route;
        })
        .sort((a, b) => {
            if (a.path === '/welcome') return -1;
            if (b.path === '/welcome') return 1;
            const orderA = (a.meta as any)?.rank ?? 0;
            const orderB = (b.meta as any)?.rank ?? 0;
            return orderA - orderB;
        });
}



export {
    formatRouter
}