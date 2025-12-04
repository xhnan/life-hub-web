export default {
    path: "/sys",
    redirect: "/sys/user",
    meta: {
        icon: "streamline-freehand-color:settings-cog",
        title: "系统管理",
        rank: 800
    },
    children: [
        {
            path: "/sys/user",
            name: "SysUser",
            component: () => import('@/views/sys/user/index.vue'),
            meta: {
                title: "用户管理",
                icon: "streamline-freehand-color:smiley-thumbs-up"
            }
        },
        {
            path: "/sys/menu",
            name: "SysMenu",
            component: () => import('@/views/sys/menu/index.vue'),
            meta: {
                title: "菜单管理",
                icon: "mdi:menu"
            }
        }
    ]
}