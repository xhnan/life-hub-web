import { http } from "@/utils/http";

const prefix = '/fin/transactions';

import type { EntryRow } from './entry';

export interface TransactionRow {
  id: number;
  bookId: number;
  transDate: string; // LocalDateTime 格式 "yyyy-MM-dd HH:mm:ss"
  description: string;
  attachmentId?: string;
  createdBy?: number;
  createdAt?: string; // LocalDateTime 格式
}

export interface TransactionDTO extends Partial<TransactionRow> {
  entries?: Partial<EntryRow>[];
}

export const getTransactionListApi = (bookId?: number) => {
  return http.get<TransactionRow[]>(`${prefix}`, { params: { bookId } });
};

export const getTransactionPageApi = (params: { pageNum: number; pageSize: number; bookId?: number; startDate?: string; endDate?: string }) => {
  return http.get<{ records: TransactionRow[]; total: number }>(`${prefix}/page`, params);
};

export const getTransactionDetailApi = (id: number) => {
  return http.get<TransactionRow>(`${prefix}/${id}`);
};

export const addTransactionApi = (data: TransactionDTO) => {
  return http.post<boolean>(`${prefix}`, data);
};

export const updateTransactionApi = (data: TransactionDTO) => {
  return http.put<boolean>(`${prefix}`, data);
};

export const deleteTransactionApi = (id: number) => {
  return http.delete<boolean>(`${prefix}/${id}`);
};
