import { http } from "@/utils/http";
import type { RoleRow } from './roleApi';

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

export function testUserApi(){
    return http.get(`${prefix}/test`);
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

const userRolePrefix = '/sys/userrole'

// 获取用户的角色ID列表
export const getUserRolesApi = (userId: string | number) => {
	return http.get<RoleRow[]>(`${userRolePrefix}/user/${userId}/roles`);
};

// 这里的定义是基于后端 SysUserRoleController 的推断
// 但由于缺失关键的批量接口或根据(userId, roleId)删除的接口，
// 我们暂时只能保留这些定义，并在前端做相应处理或假设后端有隐藏接口。

// 修正：我们先定义出标准的增删改查对应接口
export const sysUserRoleApi = {
    // 新增关联
    add: (data: { userId: number | string; roleId: number | string }) => {
        return http.post<any>(`${userRolePrefix}`, data);
    },
    // 删除关联 (需要中间表ID)
    delete: (id: number | string) => {
        return http.delete<void>(`${userRolePrefix}/${id}`);
    },
    // 更新关联
    update: (data: { id: number | string; userId: number | string; roleId: number | string }) => {
        return http.put<any>(`${userRolePrefix}`, data);
    },
    // 根据ID获取
    getById: (id: number | string) => {
        return http.get<any>(`${userRolePrefix}/${id}`);
    },
    // 获取所有
    getAll: () => {
        return http.get<any[]>(`${userRolePrefix}`);
    }
}