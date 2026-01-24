import { http } from "@/utils/http";

const prefix = '/auth'

export interface LoginForm {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	userInfo?: {
		userId: number | string;
		username: string;
		nickname?: string;
		avatar?: string;
	};
}

export const loginApi = (data: LoginForm) => {
	return http.post<LoginResponse>(`${prefix}/login`, data);
};

export const logoutApi = () => {
	return http.post<void>(`${prefix}/logout`);
};
