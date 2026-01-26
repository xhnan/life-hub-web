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

export interface UserInfo {
	roles: string[];
	permissions: string[];
}

export const loginApi = (data: LoginForm) => {
	return http.post<LoginResponse>(`${prefix}/login`, data);
};

export const getUserInfoApi = () => {
	return http.get<UserInfo>(`${prefix}/info`);
};

export const logoutApi = () => {
	return http.post<void>(`${prefix}/logout`);
};
