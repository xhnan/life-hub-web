import { http } from "@/utils/http";

const prefix = '/sys/permission';

/**
 * 权限 API（参考芋道 RBAC 重设计）
 *
 * 新设计：去除中间的 sys_permission 层，直接用菜单的 menuCode 字段作为权限标识
 * 关系链：User → Role → Menu（通过 sys_role_menu 关联）
 */

// ========== 角色-菜单 权限 ==========

// 获取角色拥有的菜单编号列表
export const getRoleMenuListApi = (roleId: number | string) => {
	return http.get<number[]>(`${prefix}/list-role-menus`, { roleId });
};

// 赋予角色菜单
export interface AssignRoleMenuReqVO {
	roleId: number | string;
	menuIds: number[];
}
export const assignRoleMenuApi = (data: AssignRoleMenuReqVO) => {
	return http.post<boolean>(`${prefix}/assign-role-menu`, data);
};

// ========== 用户-角色 权限 ==========

// 获取用户拥有的角色编号列表
export const getUserRoleListApi = (userId: number | string) => {
	return http.get<number[]>(`${prefix}/list-user-roles`, { userId });
};

// 赋予用户角色
export interface AssignUserRoleReqVO {
	userId: number | string;
	roleIds: number[];
}
export const assignUserRoleApi = (data: AssignUserRoleReqVO) => {
	return http.post<boolean>(`${prefix}/assign-user-role`, data);
};
