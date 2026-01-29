1.项目使用了vue3+ts+element-plus+Vue Router 4.6
2.使用PNPM作为包管理工具,禁止使用其他包管理工具
3.Axios 1.13，自定义拦截器 - 统一处理 Token 注入、401 跳转、错误提示，响应封装 - 统一的 ApiResponse<T> 数据结构
4.RBAC 模型 - 基于角色的访问控制,权限缓存 - sessionStorage 缓存角色权限,超级管理员 - 支持 super_admin 角色和 *:*:* 超级权限
5.Sass/SCSS使用 
6.路径别名@  →  src/