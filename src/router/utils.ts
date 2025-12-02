import type { RouteRecordRaw } from 'vue-router';




function formatRouter(routes: any[]): RouteRecordRaw[]{
    return routes.map(route => {
        const formattedRoute: RouteRecordRaw = {
            path: route.path,
            name: route.name,
            meta: {
                ...(route.meta || {}),
                title: route.meta?.title || route.name,
            },
            ...(route.component ? { component: route.component } : {}),
            children: route.children ? formatRouter(route.children) : [],
        }
        return formattedRoute;
    });

}





export {
    formatRouter
}