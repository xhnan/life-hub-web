
export default {
    path: "/test",
    redirect: "/test/test",
    meta: {
        icon: "material-icon-theme:test-js",
        title: "测试页面",
        rank: 999
    },
    children: [
        {
            path: "/test/test",
            name: "测试页面",
            component: () => import('@/views/test/test1.vue'),
            meta: {
                icon: "twemoji:test-tube",
                title: "测试页面1",
            }
        },
        {
            path: "/test/test2",
            name: "测试页面2",
            component: () => import('@/views/test/test2.vue'),
            meta: {
                title: "测试页面2",
                icon: "streamline-kameleon-color:test-tube-duo",
            }
        },
        {
            path: "/test/tts",
            name: "testTTs",
            component: () => import('@/views/test/tts.vue'),
            meta: {
                icon: "twemoji:test-tube",
                title: "语音合成测试",
            }
        },
    ]
}