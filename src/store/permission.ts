import { reactive, h } from 'vue';
import { type RouteRecordRaw, RouterView } from 'vue-router';
import { constantRoutes, asyncRoutes } from '@/router';
import { getMenuTreeApi, type MenuRow } from '@/api/menuApi';
import Layout from '@/layout/index.vue';

// 导入所有视图组件
const modules = import.meta.glob('../views/**/*.vue');

// 简单的 RouterView 包装器，用于多级菜单（非根目录）
const ParentView = {
    name: 'ParentView',
    render: () => h(RouterView)
};

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

/**
 * 将后端菜单转换为路由对象
 */
function transformMenuToRoutes(menus: MenuRow[]): RouteRecordRaw[] {
    const routes: RouteRecordRaw[] = [];
    
    menus.forEach(menu => {
        // 忽略按钮类型
        if (menu.menuType === 3) return;

        // 如果没有 path，生成一个临时的（通常不应发生，除非是纯目录且无 path）
        // 增加空值检查，防止后端返回 null 导致 crash
        const rawPath = menu.path || `${menu.id}`;
        const routePath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        
        const route: RouteRecordRaw = {
            path: routePath,
            name: menu.routerName || menu.menuName, // 优先使用 routerName，否则回退到 menuName
            meta: {
                title: menu.menuName,
                icon: menu.icon,
                permissions: menu.permission ? [menu.permission] : undefined,
                // rank: menu.sortOrder // 如果需要排序
            },
            component: undefined,
            children: []
        };

        // 处理组件
        // 逻辑更新：如果 component 字段为空，尝试使用 path 作为组件路径
        let componentToResolve = menu.component;
        if (!componentToResolve && menu.menuType === 2) {
             // 如果是菜单类型且没配置组件，尝试用 path 找
             componentToResolve = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
        }

        if (componentToResolve) {
            // 如果是 Layout
            if (componentToResolve === 'Layout') {
                route.component = Layout;
            } else {
                // 动态加载组件
                // 标准化 component 路径，移除开头的 /
                const rawComponent = componentToResolve.startsWith('/') ? componentToResolve.slice(1) : componentToResolve;
                
                const componentPath = `../views/${rawComponent}.vue`;
                const componentIndexPath = `../views/${rawComponent}/index.vue`;

                if (modules[componentPath]) {
                    route.component = modules[componentPath];
                } else if (modules[componentIndexPath]) {
                    route.component = modules[componentIndexPath];
                } else {
                    console.warn(`Component not found: ${componentPath} or ${componentIndexPath}`);
                    // 组件文件不存在时的兜底
                    route.component = { 
                        name: 'ComponentNotFound',
                        render: () => h('div', { style: 'padding: 20px; color: red;' }, `Component not found: ${componentToResolve}`) 
                    };
                }
            }
        } else {
            // 没有配置 component
            if (menu.children && menu.children.length > 0) {
                 // 有子节点，说明是目录
                 if (!menu.parentId) {
                     // 一级目录 -> Layout
                     route.component = Layout;
                 } else {
                     // 多级目录 -> ParentView (渲染子路由)
                     route.component = ParentView;
                 }
            } else {
                // 既没 component 也没 children -> 无效路由 (叶子节点缺失组件)
                // 给一个默认的提示组件，防止 Router 报错
                route.component = { 
                    name: 'EmptyMenu',
                    render: () => h('div', { style: 'padding: 20px;' }, '该菜单暂无配置组件') 
                };
            }
        }

        // 处理子菜单
        if (menu.children && menu.children.length > 0) {
            route.children = transformMenuToRoutes(menu.children);
        }

        routes.push(route);
    });

    return routes;
}

/**
 * 生成路由
 */
export const generateRoutes = async (roles: string[]) => {
    try {
        // 1. 获取后端菜单
        const { data: menuTree } = await getMenuTreeApi();

        if (!Array.isArray(menuTree)) {
             console.warn('Backend returned invalid menu data:', menuTree);
             // 即使后端失败，也应该继续处理前端静态路由
        }
        
        // 2. 转换为路由配置 (后端路由)
        const backendRoutes = transformMenuToRoutes(menuTree || []);

        // 3. 处理前端静态异步路由 (src/router/modules)
        let frontendRoutes: RouteRecordRaw[] = [];
        if (roles.includes('admin')) {
            frontendRoutes = asyncRoutes || [];
        } else {
            frontendRoutes = filterAsyncRoutes(asyncRoutes, roles);
        }

        // 4. 合并路由 (后端 + 前端) 并去重
        const allRoutes = [...backendRoutes, ...frontendRoutes];
        
        // 使用 Map 进行去重，优先保留后端路由（假设后端配置优先级更高，或者根据实际需求调整）
        // 键使用路由名称（name）或路径（path）
        const uniqueRoutesMap = new Map<string, RouteRecordRaw>();
        
        allRoutes.forEach(route => {
            // 优先使用 name 作为唯一标识，其次是 path
            const key = (route.name as string) || route.path;
            if (!uniqueRoutesMap.has(key)) {
                uniqueRoutesMap.set(key, route);
            } else {
                // 如果已存在，可以选择合并或跳过。这里选择保留第一个（即 backendRoutes 优先）
                console.warn(`Duplicate route detected and skipped: ${key}`);
            }
        });

        const accessedRoutes = Array.from(uniqueRoutesMap.values());

        permissionStore.addRoutes = accessedRoutes;
        permissionStore.routes = constantRoutes.concat(accessedRoutes);
        return accessedRoutes;
    } catch (error) {
        console.error('Failed to generate routes:', error);
        
        // 出错时，至少返回前端静态路由作为兜底
        let frontendRoutes: RouteRecordRaw[] = [];
        if (roles.includes('admin')) {
            frontendRoutes = asyncRoutes || [];
        } else {
            frontendRoutes = filterAsyncRoutes(asyncRoutes, roles);
        }
        
        permissionStore.addRoutes = frontendRoutes;
        permissionStore.routes = constantRoutes.concat(frontendRoutes);
        return frontendRoutes;
    }
};
