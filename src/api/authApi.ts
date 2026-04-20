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

// ========== 扫码登录 ==========

/** 生成二维码响应 */
export interface QrcodeGenerateResponse {
	qrCodeId: string;
	expiresIn: number; // 有效期，固定 300 秒
}

/** 二维码状态枚举 */
export type QrcodeStatus = 'PENDING' | 'SCANNED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

/** 查询扫码状态响应 */
export interface QrcodeStatusResponse {
	status: QrcodeStatus;
	userId?: number | null;
	token?: string | null;
	refreshToken?: string | null;
	expiresIn?: number | null; // 毫秒
	username?: string | null;
	avatar?: string | null;
}

export const generateQrcodeApi = () => {
	return http.post<QrcodeGenerateResponse>(`${prefix}/qrcode/generate`);
};

export const getQrcodeStatusApi = (qrCodeId: string) => {
	return http.get<QrcodeStatusResponse>(`${prefix}/qrcode/status/${qrCodeId}`);
};

// ========== GitHub OAuth 登录 ==========

/** GitHub OAuth 回调响应（与 LoginResponse 结构一致） */
export interface GithubOAuthResponse {
	token: string;
	tokenType: string;
	refreshToken?: string;
	expiresIn: number;
	username: string;
	avatar?: string;
}

export const githubOAuthCallbackApi = (code: string) => {
	return http.post<GithubOAuthResponse>(`${prefix}/oauth/github/callback`, { code });
};
