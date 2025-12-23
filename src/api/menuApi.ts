import { http } from "@/utils/http";

const prefix = '/sys/menu';

// 菜单数据结构
export interface MenuRow {
	id: string | number;
	parentId?: string | number;
	name: string;
	path: string;
	component?: string;
	type: 'CATALOG' | 'MENU' | 'BUTTON';
	icon?: string;
	orderNum?: number;
	status?: 0 | 1; // 0: 禁用, 1: 启用
	visible?: 0 | 1;
	children?: MenuRow[];
}

// 获取菜单树
export const getMenuTree = (params?: Record<string, unknown>) => {
	return http.get<MenuRow[]>(`${prefix}/list`, params);
};

