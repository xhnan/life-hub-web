
export default {
    path: "/test",
    redirect: "/test/test",
    meta: {
        icon: "ep:files",
        title: "测试页面",
        rank: 999
    },
    children: [
        {
            path: "/test/test",
            name: "测试页面",
            component: () => import('@/views/test/test1.vue'),
            meta: {
                icon: "mdi:flask-empty",
                title: "测试页面1",
            }
        },
        {
            path: "/test/test2",
            name: "测试页面2",
            component: () => import('@/views/test/test2.vue'),
            meta: {
                title: "测试页面2",
                icon: "mdi:flask-outline",
            }
        },
        {
            path: "/test/tts",
            name: "testTTs",
            component: () => import('@/views/test/tts.vue'),
            meta: {
                icon: "mdi:microphone",
                title: "语音合成测试",
            }
        },
    ]
}