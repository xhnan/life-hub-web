import { http } from "@/utils/http";

const prefix = '/fin/entries';

export interface EntryRow {
  id: number;
  transId: number;
  accountId: number;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  memo?: string;
  quantity?: number;
  price?: number;
  commodityCode?: string;
}

export const getEntryListApi = () => {
  return http.get<EntryRow[]>(`${prefix}`);
};

export const getEntryPageApi = (params: { pageNum: number; pageSize: number }) => {
  return http.get<{ records: EntryRow[]; total: number }>(`${prefix}/page`, { params });
};

export const getEntryDetailApi = (id: number) => {
  return http.get<EntryRow>(`${prefix}/${id}`);
};

export const addEntryApi = (data: Partial<EntryRow>) => {
  return http.post<boolean>(`${prefix}`, data);
};

export const updateEntryApi = (data: Partial<EntryRow>) => {
  return http.put<boolean>(`${prefix}`, data);
};

export const deleteEntryApi = (id: number) => {
  return http.delete<boolean>(`${prefix}/${id}`);
};
