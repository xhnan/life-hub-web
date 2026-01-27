import { onMounted, ref, watch } from 'vue';
import type { RouteRecordRaw } from "vue-router";
import { permissionStore } from "@/store/permission";
import {hasPermission} from "@/utils/auth.ts";

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
            .filter(route => {
                if (route.meta?.hidden) return false;
                if (!route.meta?.title) return false;
                if (route.meta?.permissions && !hasPermission(route.meta.permissions as string[])) return false;
                return true;
            })
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
        const buildMenu = () => {
             const menus = transformRouteToMenu(permissionStore.routes);
             menuData.value = menus;
             sessionStorage.setItem('life_hub_menuData', JSON.stringify(menus));
        }
        
        // 始终监听路由变化，确保动态路由加载后能更新菜单
        watch(() => permissionStore.routes, (newRoutes) => {
            if (newRoutes.length > 0) {
                buildMenu();
            }
        }, { immediate: true, deep: true });
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
