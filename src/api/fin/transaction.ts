import { http } from "@/utils/http";

const prefix = '/fin/transactions';

export interface TransactionRow {
  id: number;
  transDate: string;
  description: string;
  attachmentId?: string;
  createdBy?: number;
  createdAt?: string;
}

export const getTransactionListApi = () => {
  return http.get<TransactionRow[]>(`${prefix}`);
};

export const getTransactionPageApi = (params: { pageNum: number; pageSize: number }) => {
  return http.get<{ records: TransactionRow[]; total: number }>(`${prefix}/page`, { params });
};

export const getTransactionDetailApi = (id: number) => {
  return http.get<TransactionRow>(`${prefix}/${id}`);
};

export const addTransactionApi = (data: Partial<TransactionRow>) => {
  return http.post<boolean>(`${prefix}`, data);
};

export const updateTransactionApi = (data: Partial<TransactionRow>) => {
  return http.put<boolean>(`${prefix}`, data);
};

export const deleteTransactionApi = (id: number) => {
  return http.delete<boolean>(`${prefix}/${id}`);
};
