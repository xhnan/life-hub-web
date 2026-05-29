import { http } from "@/utils/http";

const prefix = '/sys/user'

// 用户数据结构
export interface UserRow {
	userId: number | string;
	username: string;
	nickname?: string;
	email?: string;
	phone?: string;
	gender?: number; // 0:未知 1:男 2:女
	avatar?: string;
	status?: 'active' | 'inactive' | 'banned'; // 用户状态
	remark?: string;
	createdBy?: number;
	createdAt?: string;
	updatedBy?: number;
	updatedAt?: string;
	roleIds?: (number | string)[]; // 关联的角色ID列表
}

// 用户-角色关联数据
export interface UserRoleRelation {
	userId: number | string;
	roleIds: (number | string)[];
}

// 分页参数
export interface PageParams {
	pageNum: number;
	pageSize: number;
	username?: string;
	nickname?: string;
	status?: string;
}

// 分页结果
export interface PageResult<T> {
	records: T[];
	total: number;
	pageNum: number;
	pageSize: number;
}

// 获取用户列表（分页）
export const getUserListApi = (params: PageParams) => {
	return http.get<PageResult<UserRow>>(`${prefix}`, params);
};
export const getUserListPageApi = (params: PageParams) => {
    return http.get<PageResult<UserRow>>(`${prefix}/page`, params);
};

// 获取用户详情
export const getUserDetailApi = (id: string | number) => {
	return http.get<UserRow>(`${prefix}/${id}`);
};

// 新增用户
export const addUserApi = (data: Partial<UserRow>) => {
	return http.post<UserRow>(`${prefix}`, data);
};

// 修改用户
export const updateUserApi = (data: Partial<UserRow>) => {
	return http.put<UserRow>(`${prefix}`, data);
};

// 删除用户
export const deleteUserApi = (id: string | number) => {
	return http.delete<void>(`${prefix}/${id}`);
};

// ========== 以下为旧接口，已迁移到 permissionApi.ts 的新 RBAC 模型 ==========
// 用户角色分配请使用: getUserRoleListApi / assignUserRoleApi from '@/api/permissionApi'