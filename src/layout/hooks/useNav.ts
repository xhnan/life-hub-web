import {ref, onMounted} from 'vue';
import {useRouter} from "vue-router";

interface MenuItem {
    id: string;
    label: string;
    path?: string;
    icon?: string;
    children?: MenuItem[];
}

export const useNav = () => {


    const menuData = ref<MenuItem[]>([])
    const handleOpen = (key: string, keyPath: string[]) => {
        console.log('open:', key, keyPath);
    }
    const handleClose = (key: string, keyPath: string[]) => {
        console.log('close:', key, keyPath);
    }
    const loadMenuData = () => {
        // 从路由里提取有 meta.title 的路由，按第一段分组为菜单（支持 icon/order）
        const router = useRouter();
        const routes = router
            .getRoutes()
            .filter(r => {
                const m = r.meta as any;
                // 过滤掉没有标题、参数化路由以及根路径
                return m && m.title && !r.path.includes(':') && r.path !== '/';
            });

        const map = new Map<string, MenuItem & { order?: number }>();

        routes.forEach(r => {
            const meta = r.meta as any;
            const path = r.path;
            const seg = path.split('/').filter(Boolean);
            if (seg.length === 0) return;

            const topKey = '/' + seg[0];

            if (!map.has(topKey)) {
                // 尝试找到对应的顶级路由用于标题/icon/order
                const topRoute = routes.find(rt => rt.path === topKey);
                map.set(topKey, {
                    id: topKey,
                    label: topRoute ? (topRoute.meta as any).title : seg[0],
                    path: topRoute ? topRoute.path : topKey,
                    icon: topRoute ? (topRoute.meta as any).icon : undefined,
                    children: [],
                    order: topRoute ? (topRoute.meta as any).order : 0
                });
            }

            const entry = map.get(topKey)!;

            if (seg.length === 1) {
                // 顶级路由：更新显示信息
                entry.label = meta.title || entry.label;
                entry.path = path || entry.path;
                entry.icon = meta.icon || entry.icon;
                entry.order = meta.order ?? entry.order;
            } else {
                // 子项（只按完整路径去重）
                if (!entry.children!.some(c => c.path === path)) {
                    entry.children!.push({
                        id: path,
                        label: meta.title,
                        path,
                        icon: meta.icon,
                        children: undefined
                    });
                    // 如果希望对子项也保留排序值，可以附加 order 字段
                    (entry.children![entry.children!.length - 1] as any).order = meta.order ?? 0;
                }
            }
        });

        // 转数组并按 order 排序
        const menuArray = Array.from(map.values())
            .map(item => {
                if (item.children && item.children.length) {
                    item.children.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
                }
                return item;
            })
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        menuData.value = menuArray;
        console.log(menuData);
    }


    onMounted(() => {
        loadMenuData();
    });

    return {
        handleOpen,
        handleClose,
        menuData
    }


};
