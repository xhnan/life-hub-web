import { http } from "@/utils/http";

const prefix = '/wechat/app-config';

// 企业微信应用配置数据结构 (对应 BaseWeChatAppConfig)
export interface WeworkAppRow {
  id?: number;
  appName?: string;           // 应用名称
  corpId?: string;            // 企业微信企业ID
  corpSecret?: string;        // 企业微信应用密钥
  agentId?: number;           // 企业微信应用AgentId
  token?: string;             // 回调验证Token
  encodingAesKey?: string;    // 消息加密密钥
  isEnabled?: number;         // 是否启用(0=停用,1=启用)
  handlerBeanName?: string;   // 消息处理器Bean名称
  createdAt?: string;         // 创建时间
  updatedAt?: string;         // 更新时间
  createdBy?: number;         // 创建人ID
}

// 分页参数
export interface WeworkAppPageParams {
  pageNum: number;
  pageSize: number;
}

// 分页结果
export interface PageResult<T> {
  records?: T[];
  total?: number;
  size?: number;
  current?: number;
}

// 获取企业微信应用列表（分页）
export const getWeworkAppListPageApi = (params: WeworkAppPageParams) => {
  return http.get<PageResult<WeworkAppRow>>(`${prefix}/page`, params);
};

// 获取所有企业微信应用列表（不分页）
export const getWeworkAppListApi = () => {
  return http.get<WeworkAppRow[]>(`${prefix}`);
};

// 获取企业微信应用详情
export const getWeworkAppDetailApi = (id: number) => {
  return http.get<WeworkAppRow>(`${prefix}/${id}`);
};

// 新增企业微信应用
export const addWeworkAppApi = (data: Partial<WeworkAppRow>) => {
  return http.post<WeworkAppRow>(`${prefix}`, data);
};

// 修改企业微信应用
export const updateWeworkAppApi = (data: Partial<WeworkAppRow>) => {
  return http.put<WeworkAppRow>(`${prefix}`, data);
};

// 删除企业微信应用
export const deleteWeworkAppApi = (id: number) => {
  return http.delete<void>(`${prefix}/${id}`);
};

// 测试接口
export const testWeworkAppApi = () => {
  return http.get<any>(`${prefix}/test`);
};
