import { http } from "@/utils/http";

const prefix = '/auth'

export interface LoginForm {
	username: string;
	password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
	token: string;
	tokenType: string;
	expiresIn: number;
	username: string;
	avatar?: string;
}

export interface SysRole {
    id: number;
    roleName: string;
    roleCode: string;
    description?: string;
}

export interface SysPermission {
    id: number;
    name: string; // 后端返回的是 name
    permissionKey: string; // 后端返回的是 permissionKey
    description?: string;
}

export interface UserPermissionsDTO {
    userId: number;
    isSuperAdmin: boolean;
    roles: SysRole[];
    permissions: SysPermission[];
}

export const loginApi = (data: LoginForm) => {
	return http.post<LoginResponse>(`${prefix}/login`, data);
};

export const getUserInfoApi = () => {
	// 调用新的后端接口
	return http.get<UserPermissionsDTO>('/sys/permission/user/current');
};

export const logoutApi = () => {
	return http.post<void>(`${prefix}/logout`);
};
