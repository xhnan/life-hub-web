import { http } from "@/utils/http";

const prefix = '/sys/user'

// 用户数据结构
export interface UserRow {
	id: number | string;
	username: string;
	nickname?: string;
	email?: string;
	phone?: string;
	gender?: number; // 0:未知 1:男 2:女
	avatar?: string;
	status?: boolean; // 是否启用
	remark?: string;
	createdBy?: number;
	createdAt?: string;
	updatedBy?: number;
	updatedAt?: string;
}

// 分页参数
export interface PageParams {
	pageNum: number;
	pageSize: number;
	username?: string;
	nickname?: string;
	status?: boolean;
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