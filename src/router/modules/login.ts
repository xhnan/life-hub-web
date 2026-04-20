export default [
    {
        path: "/login",
        name: "Login",
        component: () => import('@/views/login/index.vue'),
        meta: {
            title: "登录",
            hidden: true
        }
    },
    {
        path: "/oauth2/redirect",
        name: "OAuth2Redirect",
        component: () => import('@/views/oauth2/redirect/index.vue'),
        meta: {
            title: "OAuth2 登录中",
            hidden: true
        }
    }
]
