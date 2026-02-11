import { http } from "@/utils/http";

const prefix = '/fin/budgets';

export interface BudgetRow {
  id?: number | string;
  bookId?: number;
  name?: string;
  /** 预算总金额 */
  amount?: number;
  /** 已使用金额 */
  usedAmount?: number;
  /** 预算周期: MONTHLY / YEARLY / CUSTOM */
  period?: string;
  /** 关联科目ID */
  accountId?: number | string;
  /** 科目名称（展示用） */
  accountName?: string;
  startDate?: string;
  endDate?: string;
  /** 是否启用 */
  enabled?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getBudgetListApi = (bookId: number) => {
  return http.get<BudgetRow[]>(`${prefix}`, { bookId });
};

export const getBudgetPageApi = (params: { pageNum: number; pageSize: number; bookId: number; name?: string }) => {
  return http.get<{ records: BudgetRow[]; total: number }>(`${prefix}/page`, params);
};

export const addBudgetApi = (data: Partial<BudgetRow>) => {
  return http.post<boolean>(`${prefix}`, data);
};

export const updateBudgetApi = (data: Partial<BudgetRow>) => {
  return http.put<boolean>(`${prefix}`, data);
};

export const deleteBudgetApi = (id: number | string) => {
  return http.delete<boolean>(`${prefix}/${id}`);
};
