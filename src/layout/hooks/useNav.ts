import {onMounted, ref} from 'vue';
import {useRouter} from "vue-router";

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
    const loadMenuData = () => {
        const router = useRouter();
        const routes = router
            .getRoutes()
            .filter(r => {
                const m = r.meta as any;
                return m && m.title && !r.path.includes(':') && r.path !== '/';
            });

        const map = new Map<string, MenuItem>();

        routes.forEach(r => {
            const meta = r.meta as any;
            const path = r.path;
            const seg = path.split('/').filter(Boolean);
            if (seg.length === 0) return;

            const topKey = '/' + seg[0];

            if (!map.has(topKey)) {
                const topRoute = routes.find(rt => rt.path === topKey);
                map.set(topKey, {
                    id: topKey,
                    label: topRoute ? (topRoute.meta as any).title : seg[0],
                    path: topRoute ? topRoute.path : topKey,
                    icon: topRoute ? (topRoute.meta as any).icon : undefined,
                    children: [],
                    order: topRoute ? (topRoute.meta as any).rank ?? 0 : 0
                });
            }

            const entry = map.get(topKey)!;

            if (seg.length === 1) {
                entry.label = meta.title || entry.label;
                entry.path = path || entry.path;
                entry.icon = meta.icon || entry.icon;
                entry.order = meta.rank ?? entry.order;
            } else {
                if (!entry.children!.some(c => c.path === path)) {
                    entry.children!.push({
                        id: path,
                        label: meta.title,
                        path,
                        icon: meta.icon,
                        order: meta.rank ?? 0
                    });
                }
            }
        });

        // 转数组并排序
        menuData.value = Array.from(map.values())
            .map(item => {
                if (item.children && item.children.length) {
                    item.children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                }
                return item;
            })
            .sort((a, b) => {
                // /welcome 始终第一
                if (a.path === '/welcome') return -1;
                if (b.path === '/welcome') return 1;
                return (a.order ?? 0) - (b.order ?? 0);
            });
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
