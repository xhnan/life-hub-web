export default {
    path: "/health",
    redirect: "/health/dashboard",
    meta: {
        icon: "ep:first-aid-kit",
        title: "健康管理",
        rank: 500
    },
    children: [
        {
            path: "/health/dashboard",
            name: "HealthDashboard",
            component: () => import('@/views/health/dashboard/index.vue'),
            meta: {
                title: "数据总览",
                icon: "ep:data-analysis"
            }
        },
        {
            path: "/health/users",
            name: "HealthUsers",
            component: () => import('@/views/health/users/index.vue'),
            meta: {
                title: "用户健康档案",
                icon: "ep:user"
            }
        },
        {
            path: "/health/psychology",
            name: "HealthPsychology",
            component: () => import('@/views/health/psychology/index.vue'),
            meta: {
                title: "心理监控",
                icon: "ep:warning"
            }
        },
        {
            path: "/health/ai",
            name: "HealthAI",
            component: () => import('@/views/health/ai/index.vue'),
            meta: {
                title: "AI 聊天",
                icon: "ep:chat-dot-round"
            }
        }
    ]
}
