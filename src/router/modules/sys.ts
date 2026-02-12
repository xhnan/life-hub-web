export default {
    path: "/sys",
    redirect: "/sys/user",
    meta: {
        icon: "ep:setting",
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
                icon: "ep:user"
            }
        },
        {
            path: "/sys/menu",
            name: "SysMenu",
            component: () => import('@/views/sys/menu/index.vue'),
            meta: {
                title: "菜单管理",
                icon: "ep:menu"
            }
        },
        {
            path: "/sys/role",
            name: "SysRole",
            component: () => import('@/views/sys/role/index.vue'),
            meta: {
                title: "角色管理",
                icon: "ep:avatar"
            }
        },
        {
            path: "/sys/permission",
            name: "SysPermission",
            component: () => import('@/views/sys/permission/index.vue'),
            meta: {
                title: "权限管理",
                icon: "ep:lock"
            }
        },
        {
            path: "/sys/app",
            name: "SysApp",
            component: () => import('@/views/sys/app/index.vue'),
            meta: {
                title: "应用管理",
                icon: "ep:grid"
            }
        }
    ]
}