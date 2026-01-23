import { http } from "@/utils/http";

const prefix = '/sys/permission';

// 权限数据结构（前端展示用）
export interface PermissionRow {
	id?: number | string;
	parentId?: number | string; // 关联的父级ID（对应后端 parentId，可关联菜单）
	appCode: string; // 应用编码
	permissionKey: string; // 权限编码（唯一标识，对应后端 permissionKey）
	name: string; // 权限名称（对应后端 name）
	description?: string; // 权限描述
	status?: boolean; // 是否启用
	type?: number; // 权限类型
	priority?: number; // 优先级
	isSystem?: boolean; // 是否系统权限
	isDeleted?: boolean; // 是否删除
	createdAt?: string;
	updatedAt?: string;
}

// 前端表单数据（包含便于展示的字段）
export interface PermissionFormData {
	id?: number | string;
	menuId?: number | string; // 前端使用：关联的菜单ID
	appCode: string; // 应用编码
	permissionCode: string; // 前端使用：权限编码
	permissionName: string; // 前端使用：权限名称
	description?: string; // 权限描述
	status?: boolean; // 是否启用
}

// 分页参数
export interface PermissionPageParams {
	pageNum: number;
	pageSize: number;
	permissionKey?: string; // 对应后端字段
	name?: string; // 对应后端字段
	appCode?: string;
	status?: boolean;
}

// 分页结果
export interface PageResult<T> {
	records: T[];
	total: number;
	pageNum: number;
	pageSize: number;
}

// 获取权限列表（分页）
export const getPermissionListPageApi = (params: PermissionPageParams) => {
	return http.get<PageResult<PermissionRow>>(`${prefix}/page`, params);
};

// 获取所有权限列表（不分页）
export const getPermissionListApi = () => {
	return http.get<PermissionRow[]>(`${prefix}`);
};
// 兼容别名
export const getAllPermissionListApi = getPermissionListApi;

// 获取应用编码列表（去重）
export const getAppCodeListApi = () => {
	return http.get<string[]>(`${prefix}/appCodes`);
};

// 获取权限详情
export const getPermissionDetailApi = (id: string | number) => {
	return http.get<PermissionRow>(`${prefix}/${id}`);
};

// 前端到后端字段转换
const transformToBackend = (data: Partial<PermissionFormData>): any => {
	const { menuId, permissionCode, permissionName, ...rest } = data;
	return {
		...rest,
		parentId: menuId, // menuId 转为 parentId
		permissionKey: permissionCode, // permissionCode 转为 permissionKey
		name: permissionName // permissionName 转为 name
	};
};

// 后端到前端字段转换（导出供外部使用）
export const transformToFrontend = (data: PermissionRow): PermissionFormData => {
	return {
		id: data.id,
		menuId: data.parentId,
		appCode: data.appCode,
		permissionCode: data.permissionKey,
		permissionName: data.name,
		description: data.description,
		status: data.status
	};
};

// 新增权限
export const addPermissionApi = (data: Partial<PermissionFormData>) => {
	const backendData = transformToBackend(data);
	return http.post<PermissionRow>(`${prefix}`, backendData);
};

// 修改权限
export const updatePermissionApi = (data: Partial<PermissionFormData>) => {
	const backendData = transformToBackend(data);
	return http.put<PermissionRow>(`${prefix}`, backendData);
};

// 删除权限
export const deletePermissionApi = (id: string | number) => {
	return http.delete<void>(`${prefix}/${id}`);
};

// 根据菜单ID获取权限列表
export const getPermissionsByMenuIdApi = (menuId: string | number) => {
	return http.get<PermissionRow[]>(`${prefix}/menu/${menuId}`);
};

// 批量删除权限
export const batchDeletePermissionApi = (ids: (string | number)[]) => {
	return http.delete<void>(`${prefix}/batch`, { data: ids });
};
