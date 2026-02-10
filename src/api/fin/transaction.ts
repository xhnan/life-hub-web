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
  tagIds?: number[];
}

export interface TransactionEntryResponseDTO {
  transId: number;
  transDate: string;
  description: string;
}

export const getTransactionListApi = (bookId: number) => {
  return http.get<TransactionRow[]>(`${prefix}`, { bookId });
};

export const getTransactionPageApi = (params: { pageNum: number; pageSize: number; bookId: number; startDate?: string; endDate?: string }) => {
  return http.get<{ records: TransactionRow[]; total: number }>(`${prefix}/page`, params);
};

export const getTransactionDetailApi = (id: number, bookId: number) => {
  return http.get<TransactionRow>(`${prefix}/${id}`, { bookId });
};

/**
 * 简单新增交易（仅主表，不含分录）
 * POST /fin/transactions/save
 */
export const addTransactionApi = (data: TransactionDTO) => {
  return http.post<boolean>(`${prefix}/save`, data);
};

/**
 * 统一记账接口：创建交易及分录（复式记账）
 * POST /fin/transactions/with-entries
 */
export const addTransactionWithEntriesApi = (data: TransactionDTO) => {
  return http.post<TransactionEntryResponseDTO>(`${prefix}/with-entries`, data);
};

export const updateTransactionApi = (data: TransactionDTO) => {
  return http.put<boolean>(`${prefix}`, data);
};

export const deleteTransactionApi = (id: number, bookId: number) => {
  return http.delete<boolean>(`${prefix}/${id}`, { bookId });
};
