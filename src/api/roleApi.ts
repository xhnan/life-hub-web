import { http } from "@/utils/http";

const prefix = '/sys/role';

// 角色数据结构
export interface RoleRow {
	id: number | string;
	roleCode: string; // 角色编码（唯一标识）
	roleName: string; // 角色名称
	description?: string; // 角色描述
	status?: boolean; // 是否启用
	createdBy?: number;
	createdAt?: string;
	updatedBy?: number;
	updatedAt?: string;
	permissionIds?: (number | string)[]; // 关联的权限ID列表
}

// 分页参数
export interface RolePageParams {
	pageNum: number;
	pageSize: number;
	roleCode?: string;
	roleName?: string;
	status?: boolean;
}

// 分页结果
export interface PageResult<T> {
	records: T[];
	total: number;
	pageNum: number;
	pageSize: number;
}

// 角色-权限关联数据
export interface RolePermissionRelation {
	roleId: number | string;
	permissionIds: (number | string)[];
}

// 获取角色列表（分页）
export const getRoleListPageApi = (params: RolePageParams) => {
	return http.get<PageResult<RoleRow>>(`${prefix}/page`, params);
};
export const testApi = () => {
    return http.get(`${prefix}/test`);
}
// 获取所有角色列表（不分页）
export const getRoleListApi = () => {
	return http.get<RoleRow[]>(`${prefix}`);
};

// 获取角色详情
export const getRoleDetailApi = (id: string | number) => {
	return http.get<RoleRow>(`${prefix}/${id}`);
};

// 新增角色
export const addRoleApi = (data: Partial<RoleRow>) => {
	return http.post<RoleRow>(`${prefix}`, data);
};

// 修改角色
export const updateRoleApi = (data: Partial<RoleRow>) => {
	return http.put<RoleRow>(`${prefix}`, data);
};

// 删除角色
export const deleteRoleApi = (id: string | number) => {
	return http.delete<void>(`${prefix}/${id}`);
};

// 获取角色的权限ID列表
export const getRolePermissionIdsApi = (roleId: string | number) => {
	return http.get<(number | string)[]>(`${prefix}/${roleId}/permissions`);
};
// 兼容旧名
export const getRolePermissionsApi = getRolePermissionIdsApi;

// 分配角色权限
export const assignRolePermissionsApi = (roleId: string | number, permissionIds: (number | string)[]) => {
	return http.post<void>(`${prefix}/${roleId}/permissions`, { permissionIds });
};

// 获取角色关联的菜单ID列表
export const getRoleMenuIdsApi = (roleId: string | number) => {
	return http.get<number[]>(`${prefix}/${roleId}/menus`);
};

// 分配角色菜单
export const assignRoleMenusApi = (roleId: string | number, menuIds: number[]) => {
	return http.post<void>(`${prefix}/${roleId}/menus`, { menuIds });
};

// 批量删除角色
export const batchDeleteRoleApi = (ids: (string | number)[]) => {
	return http.delete<void>(`${prefix}/batch`, { data: ids });
};

// 根据用户ID获取角色列表
export const getRolesByUserIdApi = (userId: string | number) => {
	return http.get<RoleRow[]>(`${prefix}/user/${userId}`);
};
