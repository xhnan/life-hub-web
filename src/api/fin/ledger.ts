import { http } from "@/utils/http";
import type { components } from "@/types/api-schema";

const prefix = '/fin/books';

export type FinBooks = components["schemas"]["FinBooks"];
export type PageFinBooks = components["schemas"]["PageFinBooks"];

// Alias for compatibility if needed, or just use FinBooks
export type LedgerRow = FinBooks;

export const getLedgerPageApi = (params: { pageNum: number; pageSize: number }) => {
  return http.get<{ records: FinBooks[]; total: number }>(`${prefix}/page`, params);
};

export const getLedgerListApi = () => {
  return http.get<FinBooks[]>(`${prefix}`);
};

export const getLedgerDetailApi = (id: number) => {
  return http.get<FinBooks>(`${prefix}/${id}`);
};

export const addLedgerApi = (data: FinBooks) => {
  return http.post<boolean>(`${prefix}`, data);
};

export const updateLedgerApi = (data: FinBooks) => {
  return http.put<boolean>(`${prefix}`, data);
};

export const deleteLedgerApi = (id: number) => {
  return http.delete<boolean>(`${prefix}/${id}`);
};
