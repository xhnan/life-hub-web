export default {
    path: "/login",
    name: "Login",
    component: () => import('@/views/login/index.vue'),
    meta: {
        title: "登录",
        hidden: true
    }
}
