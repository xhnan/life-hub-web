import { describe, it, expect } from 'vitest';
import { generateRoutesFromMenus, resolveComponent, type MenuTreeNode } from './transform';

function collectPaths(routes: any[], acc: string[] = []): string[] {
    for (const r of routes) {
        acc.push(r.path);
        if (r.children?.length) collectPaths(r.children, acc);
    }
    return acc;
}

describe('resolveComponent', () => {
    it('resolves Layout / empty to the layout loader', () => {
        expect(typeof resolveComponent('Layout')).toBe('function');
        expect(typeof resolveComponent(undefined)).toBe('function');
    });

    it('resolves ParentView / # to a render component', () => {
        const parent = resolveComponent('ParentView') as any;
        const hash = resolveComponent('#') as any;
        expect(parent.name).toBe('ParentView');
        expect(hash.name).toBe('ParentView');
    });

    it('falls back to placeholder when component cannot be resolved', () => {
        const c = resolveComponent('sys/does-not-exist/index') as any;
        // 在测试环境 import.meta.glob 不含真实视图，应回退占位组件
        expect(c.name).toBe('ComponentNotFound');
    });
});

describe('generateRoutesFromMenus', () => {
    it('skips button nodes (menuType=3) and produces no route for them', () => {
        const menus: MenuTreeNode[] = [
            {
                id: 1, parentId: 0, menuName: '系统管理', path: '/sys',
                component: 'Layout', menuType: 1, visible: true,
                children: [
                    {
                        id: 2, parentId: 1, menuName: '用户管理', path: '/sys/user',
                        component: 'sys/user/index', menuType: 2, visible: true, routerName: 'SysUser',
                        children: [
                            { id: 3, parentId: 2, menuName: '新增', path: '', menuType: 3, permission: 'system:user:create' }
                        ]
                    }
                ]
            }
        ];
        const routes = generateRoutesFromMenus(menus);
        expect(routes).toHaveLength(1);
        expect(routes[0].children).toHaveLength(1);
        // 按钮节点不生成子路由
        expect(routes[0].children![0].children).toHaveLength(0);
    });

    it('maps meta fields correctly', () => {
        const menus: MenuTreeNode[] = [
            { id: 1, parentId: 0, menuName: '隐藏页', path: '/hidden', component: 'foo/index', menuType: 2, visible: false, routerName: 'Hidden', sort: 7, permission: 'a:b:c' }
        ];
        const [route] = generateRoutesFromMenus(menus);
        expect(route.name).toBe('Hidden');
        expect((route.meta as any).title).toBe('隐藏页');
        expect((route.meta as any).hidden).toBe(true);
        expect((route.meta as any).rank).toBe(7);
        expect((route.meta as any).permissions).toEqual(['a:b:c']);
        expect((route.meta as any).keepAlive).toBe(false);
        expect((route.meta as any).alwaysShow).toBe(true);
    });

    it('produces unique paths (no duplicate registration)', () => {
        const menus: MenuTreeNode[] = [
            { id: 1, parentId: 0, menuName: 'A', path: '/a', component: 'Layout', menuType: 1, visible: true,
              children: [
                { id: 2, parentId: 1, menuName: 'A1', path: '/a/1', component: 'x/index', menuType: 2, visible: true },
                { id: 3, parentId: 1, menuName: 'A2', path: '/a/2', component: 'y/index', menuType: 2, visible: true }
              ] },
            { id: 4, parentId: 0, menuName: 'B', path: '/b', component: 'Layout', menuType: 1, visible: true }
        ];
        const paths = collectPaths(generateRoutesFromMenus(menus));
        expect(new Set(paths).size).toBe(paths.length);
    });

    it('returns empty array for empty / non-array input', () => {
        expect(generateRoutesFromMenus([])).toEqual([]);
        // @ts-expect-error 测试非法输入
        expect(generateRoutesFromMenus(null)).toEqual([]);
    });
});
