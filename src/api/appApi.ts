import { http } from "@/utils/http";

const prefix = '/sys/app';

// 应用数据结构
export interface AppRow {
  id: number | string;
  appName: string;       // 应用名称
  appCode: string;       // 应用编码（唯一标识）
  description?: string;  // 应用描述
  status?: boolean;      // 是否启用
  createdBy?: number;
  createdAt?: string;
  updatedBy?: number;
  updatedAt?: string;
}

// 分页参数
export interface AppPageParams {
  pageNum: number;
  pageSize: number;
  appName?: string;
  appCode?: string;
  status?: boolean | string;
}

// 分页结果
export interface PageResult<T> {
  records: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

// 获取应用列表（分页）
export const getAppListPageApi = (params: AppPageParams) => {
  return http.get<PageResult<AppRow>>(`${prefix}/page`, params);
};

// 获取所有应用列表（不分页）
export const getAppListApi = () => {
  return http.get<AppRow[]>(`${prefix}`);
};

// 获取应用详情
export const getAppDetailApi = (id: string | number) => {
  return http.get<AppRow>(`${prefix}/${id}`);
};

// 新增应用
export const addAppApi = (data: Partial<AppRow>) => {
  return http.post<AppRow>(`${prefix}`, data);
};

// 修改应用
export const updateAppApi = (data: Partial<AppRow>) => {
  return http.put<AppRow>(`${prefix}`, data);
};

// 删除应用
export const deleteAppApi = (id: string | number) => {
  return http.delete<void>(`${prefix}/${id}`);
};
