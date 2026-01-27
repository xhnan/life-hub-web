import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

// 响应数据结构
export interface ApiResponse<T = any> {
    code: number;
    data: T;
    message: string;
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器
service.interceptors.request.use(
    (config) => {
        // 从 localStorage 获取 token
        const token = localStorage.getItem('life_hub_token');
        const tokenExpiresAt = localStorage.getItem('life_hub_tokenExpiresAt');

        // 检查 token 是否过期
        if (token && tokenExpiresAt) {
            const now = Date.now();
            if (now > Number(tokenExpiresAt)) {
                 localStorage.removeItem('life_hub_token');
                 localStorage.removeItem('life_hub_tokenExpiresAt');
                 localStorage.removeItem('life_hub_userInfo');
                 sessionStorage.removeItem('life_hub_userRoles');
                 sessionStorage.removeItem('life_hub_userPermissions');
                 sessionStorage.removeItem('life_hub_menuData');
                 window.location.href = '/#/login';
                 return Promise.reject(new Error('Token expired'));
             }
        }

        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<any>>) => {
        // 下载等二进制响应不走业务 code 结构
        const responseType = response.config?.responseType;
        if (responseType === 'blob' || responseType === 'arraybuffer') {
            return response;
        }

        const res = response.data;

        // 根据后端约定的 code 判断请求是否成功
        if (res.code !== 200) {
            ElMessage.error(res.message || '请求失败');

            // 401: Token 过期或未登录
            if (res.code === 401) {
                ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
                    confirmButtonText: '重新登录',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    localStorage.removeItem('life_hub_token');
                    localStorage.removeItem('life_hub_tokenExpiresAt');
                    localStorage.removeItem('life_hub_userInfo');
                    sessionStorage.removeItem('life_hub_userRoles');
                    sessionStorage.removeItem('life_hub_userPermissions');
                    sessionStorage.removeItem('life_hub_menuData');
                    window.location.href = '/#/login';
                });
            }

            return Promise.reject(new Error(res.message || '请求失败'));
        }

        // 这里保持返回 AxiosResponse，避免 axios 拦截器类型爆红。
        // 业务数据在 http.get/post/... 中统一解包为 res.data。
        return response;
    },
    (error) => {
        console.error('响应错误:', error);

        // 处理 HTTP 错误状态码
        const status = error.response?.status;
        let message = '网络错误，请稍后重试';

        switch (status) {
            case 400:
                message = '请求参数错误';
                break;
            case 401:
                message = '未授权，请登录';
                localStorage.removeItem('life_hub_token');
                localStorage.removeItem('life_hub_tokenExpiresAt');
                localStorage.removeItem('life_hub_userInfo');
                sessionStorage.removeItem('life_hub_userRoles');
                sessionStorage.removeItem('life_hub_userPermissions');
                sessionStorage.removeItem('life_hub_menuData');
                window.location.href = '/#/login';
                break;
            case 403:
                message = '拒绝访问';
                break;
            case 404:
                message = '请求地址不存在';
                break;
            case 500:
                message = '服务器内部错误';
                break;
            case 502:
                message = '网关错误';
                break;
            case 503:
                message = '服务不可用';
                break;
            default:
                message = error.message || '网络错误';
        }

        ElMessage.error(message);
        return Promise.reject(error);
    }
);

// 封装请求方法
export const http = {
    get<T = any>(url: string, params?: object, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return service.get<ApiResponse<T>>(url, { params, ...config }).then((r) => r.data);
    },

    post<T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return service.post<ApiResponse<T>>(url, data, config).then((r) => r.data);
    },

    put<T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return service.put<ApiResponse<T>>(url, data, config).then((r) => r.data);
    },

    delete<T = any>(url: string, params?: object, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return service.delete<ApiResponse<T>>(url, { params, ...config }).then((r) => r.data);
    },

    // 上传文件
    upload<T = any>(url: string, file: File, fieldName = 'file', config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const formData = new FormData();
        formData.append(fieldName, file);
        return service.post<ApiResponse<T>>(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            ...config
        }).then((r) => r.data);
    },

    // 下载文件
    download(url: string, params?: object, fileName?: string): Promise<void> {
        return service.get(url, {
            params,
            responseType: 'blob'
        }).then((res: AxiosResponse<Blob>) => {
            const blob = new Blob([res.data]);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName || 'download';
            link.click();
            URL.revokeObjectURL(link.href);
        });
    }
};

export default service;