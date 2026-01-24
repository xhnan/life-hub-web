import { http } from "@/utils/http";

const prefix = '/auth'

export interface LoginForm {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	tokenType: string;
	expiresIn: number;
	username: string;
	avatar?: string;
}

export interface UserInfo {
	roles: string[];
	permissions: string[];
}

export const loginApi = (data: LoginForm) => {
	return http.post<LoginResponse>(`${prefix}/login`, data);
};

export const getUserInfoApi = () => {
	// 模拟获取用户信息接口
	return new Promise<{ code: number; data: UserInfo; message: string }>((resolve) => {
		setTimeout(() => {
			resolve({
				code: 200,
				data: {
					roles: ['admin'], // 默认返回 admin 角色
					permissions: ['sys:user:add', 'sys:user:edit']
				},
				message: 'success'
			});
		}, 100);
	});
};

export const logoutApi = () => {
	return http.post<void>(`${prefix}/logout`);
};
