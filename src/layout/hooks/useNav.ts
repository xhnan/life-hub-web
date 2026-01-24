import { onMounted, ref, watch } from 'vue';
import type { RouteRecordRaw } from "vue-router";
import { permissionStore } from "@/store/permission";

export interface MenuItem {
    id: string;
    label: string;
    path?: string;
    icon?: string;
    children?: MenuItem[];
    order?: number;
}

export const useNav = () => {
    const menuData = ref<MenuItem[]>([])
    
    const handleOpen = (key: string, keyPath: string[]) => {
        console.log('open:', key, keyPath);
    }
    const handleClose = (key: string, keyPath: string[]) => {
        console.log('close:', key, keyPath);
    }

    const transformRouteToMenu = (routes: RouteRecordRaw[]): MenuItem[] => {
        return routes
            .filter(route => !route.meta?.hidden && route.meta?.title)
            .map(route => {
                const item: MenuItem = {
                    id: route.path,
                    label: (route.meta?.title as string) || '',
                    path: route.path,
                    icon: (route.meta?.icon as string) || undefined,
                    order: (route.meta?.rank as number) || 0,
                    children: []
                };

                if (route.children && route.children.length > 0) {
                    item.children = transformRouteToMenu(route.children);
                }
                
                return item;
            })
            .sort((a, b) => {
                 if (a.path === '/welcome') return -1;
                 if (b.path === '/welcome') return 1;
                 return (a.order || 0) - (b.order || 0);
            });
    };

    const loadMenuData = () => {
        // 尝试从 sessionStorage 获取
        const storedMenu = sessionStorage.getItem('menuData');
        if (storedMenu) {
             menuData.value = JSON.parse(storedMenu);
             // 如果 store 里没有路由（刷新情况），可能需要重新生成以确保同步？
             // 但这里假设 store 已经通过 router guard 初始化了。
             // 实际上 router guard 可能会比 onMounted 慢吗？不会，guard 阻塞导航。
             // 但是如果只是单纯的页面刷新，router guard 执行完后，store 就有了。
        }

        const buildMenu = () => {
             const menus = transformRouteToMenu(permissionStore.routes);
             menuData.value = menus;
             sessionStorage.setItem('menuData', JSON.stringify(menus));
        }
        
        if (permissionStore.routes.length > 0) {
            buildMenu();
        } else {
            // 监听路由变化（如登录后）
            const stop = watch(() => permissionStore.routes, (newRoutes) => {
                if (newRoutes.length > 0) {
                    buildMenu();
                    stop(); // 只需构建一次
                }
            }, { immediate: true });
        }
    };

    onMounted(() => {
        loadMenuData();
    });

    return {
        handleOpen,
        handleClose,
        menuData
    }
};
