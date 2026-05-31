import { type RouteRecordRaw } from 'vue-router';

const remainingRouter: Array<RouteRecordRaw> = [
  {
    path: "/403",
    name: "403",
    component: () => import("@/views/error/403.vue"),
    meta: {
      title: "403",
      hidden: true
    }
  },
  {
    path: "/404",
    name: "404",
    component: () => import("@/views/error/404.vue"),
    meta: {
      title: "404",
      hidden: true
    }
  },
  {
    path: "/error",
    name: "AppError",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: "错误",
      hidden: true
    }
  }
];

export default remainingRouter;
