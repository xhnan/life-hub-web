import { http } from "@/utils/http";

const prefix = '/sys/role';

// 角色数据结构（参考芋道 RBAC 重设计）
export interface RoleRow {
	id: number | string;
	roleCode: string; // 角色编码（唯一标识），如 SUPER_ADMIN、ADMIN、USER
	roleName: string; // 角色名称
	sortOrder?: number; // 角色排序
	status?: boolean; // 是否启用
	type?: number; // 角色类型：1=内置角色 2=自定义角色
	dataScope?: number; // 数据范围：1=全部 2=指定部门 3=本部门 4=本部门及以下 5=仅本人
	description?: string; // 角色描述
	createdBy?: number;
	createdAt?: string;
	updatedBy?: number;
	updatedAt?: string;
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

// 获取角色列表（分页）
export const getRoleListPageApi = (params: RolePageParams) => {
	return http.get<PageResult<RoleRow>>(`${prefix}/page`, params);
};

// 获取所有角色列表（不分页）
export const getRoleListApi = () => {
	return http.get<RoleRow[]>(`${prefix}`);
};

// 获取角色精简列表（用于角色分配时的选项列表，仅返回启用的角色）
export const getRoleSimpleListApi = () => {
	return http.get<RoleRow[]>(`${prefix}/simple-list`);
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
