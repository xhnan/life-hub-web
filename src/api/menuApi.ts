import { http } from "@/utils/http";

const prefix = '/sys/menu';

// 菜单数据结构
export interface MenuRow {
	id: number | string;
	parentId?: number; // 父菜单ID，0表示根菜单
	menuName: string; // 菜单名称
    routerName?: string; // 路由名称
	menuCode?: string; // 菜单权限标识（按钮或接口权限）
	menuType: number; // 菜单类型：1目录 2菜单 3按钮
	path: string; // 前端路由路径
	component?: string; // 前端组件路径
	icon?: string; // 菜单图标
	sortOrder?: number; // 菜单排序
	visible?: boolean; // 是否在菜单中显示
	status?: boolean; // 是否启用
	remark?: string; // 备注说明
	createdBy?: number;
	createdAt?: string;
	updatedBy?: number;
	updatedAt?: string;
	children?: MenuRow[]; // 子菜单
}

// 获取菜单树
export const getMenuTreeApi = () => {
	return http.get<MenuRow[]>(`${prefix}/user/tree`);
};

// 获取所有菜单列表
export const getMenuListApi = () => {
	return http.get<MenuRow[]>(`${prefix}`);
};

// 获取菜单详情
export const getMenuDetailApi = (id: string | number) => {
	return http.get<MenuRow>(`${prefix}/${id}`);
};

// 新增菜单
export const addMenuApi = (data: Partial<MenuRow>) => {
	return http.post<MenuRow>(`${prefix}`, data);
};

// 修改菜单（根据后端接口，PUT 不带 ID 路径参数）
export const updateMenuApi = (data: Partial<MenuRow>) => {
	return http.put<MenuRow>(`${prefix}`, data);
};

// 删除菜单
export const deleteMenuApi = (id: string | number) => {
	return http.delete<void>(`${prefix}/${id}`);
};

// 生成权限（同步生成权限）- 预留接口
export const generatePermissionApi = (menuId: string | number) => {
    // 假设后端接口路径为 /sys/permission/generate/{menuId}
    // 暂时用 mock 或者实际请求，这里写实际请求定义的格式
    return http.post<void>(`/sys/permission/generate/${menuId}`);
};
