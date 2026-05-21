import { http } from '@/utils/http';
import type {
  AdminOverviewVO,
  AdminTrendVO,
  AdminUserSummaryVO,
  AdminUserDetailVO,
  PsychologyAlertVO,
  AdminUserListParams,
  PageResult
} from './types';

const prefix = '/health/admin';

/** 获取平台健康数据总览 */
export const getOverviewApi = () => {
  return http.get<AdminOverviewVO>(`${prefix}/stats/overview`);
};

/** 获取趋势数据 */
export const getTrendsApi = (days: number = 7) => {
  return http.get<AdminTrendVO[]>(`${prefix}/stats/trends`, { days });
};

/** 分页查询用户健康摘要列表 */
export const getUserListApi = (params: AdminUserListParams) => {
  return http.get<PageResult<AdminUserSummaryVO>>(`${prefix}/users`, params);
};

/** 获取用户健康详情 */
export const getUserDetailApi = (userId: number) => {
  return http.get<AdminUserDetailVO>(`${prefix}/users/${userId}/detail`);
};

/** 获取心理风险预警列表 */
export const getPsychologyAlertsApi = () => {
  return http.get<PsychologyAlertVO[]>(`${prefix}/psychology/alerts`);
};
