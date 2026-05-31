/**
 * 用户状态已合并到 store/permission.ts（统一权限 Store）。
 * 本文件保留为向后兼容的再导出入口，现有 `@/store/user` 引用无需改动。
 */
export { userStore, setUserInfo, clearUserInfo } from './permission';
