import { http } from "@/utils/http";

const prefix = '/auth'

export interface LoginForm {
	username: string;
	password: string;
    rememberMe?: boolean;
}

export interface AuthUserProfile {
	userId: number;
	username: string;
	nickname: string;
	avatar: string;
}

export interface AuthLoginPayload {
	token: string;
	userProfile: AuthUserProfile;
}

export interface SysRole {
    id: number;
    roleName: string;
    roleCode: string;
    description?: string;
}

export interface PermissionItem {
    permissionKey: string;
    name: string;
}

export interface UserPermissionsDTO {
    userId: number;
    isSuperAdmin: boolean;
    roles: SysRole[];
    permissions: PermissionItem[];
}

export const loginApi = (data: LoginForm) => {
	return http.post<AuthLoginPayload>(`${prefix}/login`, data);
};

/**
 * 获取当前用户的权限和角色信息
 * 调用旧的 /sys/permission/user/current 接口
 * 注意：在新 RBAC 模型中，真实权限标识来自菜单的 menuCode 字段
 * 此接口仍然返回旧的 SysPermission 数据，但前端会从菜单树中提取 menuCode 作为补充
 */
export const getUserInfoApi = () => {
	return http.get<UserPermissionsDTO>('/sys/permission/user/current');
};

/**
 * 获取当前用户的个人信息
 */
export const getProfileApi = () => {
	return http.get<AuthUserProfile>(`${prefix}/profile`);
};

export const logoutApi = () => {
	return http.post<void>(`${prefix}/logout`);
};

// ========== 扫码登录 ==========

/** 生成二维码响应 */
export interface QrcodeGenerateResponse {
	qrCodeId: string;
	expiresIn: number;
}

/** 二维码状态枚举 */
export type QrcodeStatus = 'PENDING' | 'SCANNED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

/** 查询扫码状态响应 */
export interface QrcodeStatusResponse {
	status: QrcodeStatus;
	userId?: number | null;
	token?: string | null;
	refreshToken?: string | null;
	expiresIn?: number | null;
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
