import { h, type Component } from 'vue';
import { RouterView, type RouteRecordRaw } from 'vue-router';

/**
 * 后端菜单树节点（对齐后端 MenuTreeModel）。
 */
export interface MenuTreeNode {
    id: number | string;
    parentId?: number | string;
    menuName: string;
    icon?: string;
    sort?: number;
    path: string;
    component?: string;
    menuType: number; // 1 目录 / 2 菜单 / 3 按钮
    visible?: boolean;
    permission?: string;
    routerName?: string;
    status?: boolean;
    keepAlive?: boolean;
    alwaysShow?: boolean;
    children?: MenuTreeNode[];
}

// 预加载所有视图组件
const viewModules = import.meta.glob('../views/**/*.vue');

const Layout = () => import('@/layout/index.vue');

// 多级目录中转组件：渲染子路由
const ParentView: Component = {
    name: 'ParentView',
    render: () => h(RouterView)
};

// 组件解析失败时的兜底占位组件
const NotFoundPlaceholder: Component = {
    name: 'ComponentNotFound',
    render: () =>
        h('div', { style: 'padding: 24px; color: #f56c6c;' }, '该菜单对应的组件不存在，请检查菜单配置')
};

/**
 * 解析菜单 component 字段为实际组件。
 * - 'Layout' → 根布局
 * - 'ParentView' / '#' → 父级中转组件
 * - 相对路径 → views/${c}.vue，回退 views/${c}/index.vue，再回退占位组件
 */
export function resolveComponent(component?: string): Component | (() => Promise<unknown>) {
    if (!component || component === 'Layout') {
        return Layout;
    }
    if (component === 'ParentView' || component === '#') {
        return ParentView;
    }

    // 去除前导 '/' 与 '.vue' 后缀，避免拼接出 views/xxx.vue.vue
    const normalized = component.replace(/^\//, '').replace(/\.vue$/, '');

    const directKey = `../views/${normalized}.vue`;
    const indexKey = `../views/${normalized}/index.vue`;

    if (viewModules[directKey]) {
        return viewModules[directKey] as () => Promise<unknown>;
    }
    if (viewModules[indexKey]) {
        return viewModules[indexKey] as () => Promise<unknown>;
    }

    console.warn(`[router] 未找到组件: ${directKey} 或 ${indexKey}`);
    return NotFoundPlaceholder;
}

/**
 * 将单个菜单节点转换为路由记录。
 */
function toRoute(node: MenuTreeNode): RouteRecordRaw {
    return {
        path: node.path,
        name: node.routerName || undefined,
        component: resolveComponent(node.component),
        meta: {
            title: node.menuName,
            icon: node.icon,
            hidden: node.visible === false,
            permissions: node.permission ? [node.permission] : undefined,
            keepAlive: node.keepAlive ?? false,
            alwaysShow: node.alwaysShow ?? true,
            rank: node.sort ?? 0
        },
        children: []
    } as RouteRecordRaw;
}

/**
 * 将后端路由菜单树转换为 Vue Router 路由记录数组。
 * - 跳过按钮节点（menuType=3）
 * - 单一来源，不做 name/path 去重
 */
export function generateRoutesFromMenus(menus: MenuTreeNode[]): RouteRecordRaw[] {
    if (!Array.isArray(menus)) {
        return [];
    }
    const res: RouteRecordRaw[] = [];
    for (const node of menus) {
        if (node.menuType === 3) {
            continue; // 按钮节点不生成路由
        }
        const route = toRoute(node);
        if (node.children && node.children.length > 0) {
            route.children = generateRoutesFromMenus(node.children);
        }
        res.push(route);
    }
    return res;
}
