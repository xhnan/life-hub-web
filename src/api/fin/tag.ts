import { http } from "@/utils/http";

const prefix = '/fin/tags';

export interface TagRow {
  id: number | string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getTagListApi = () => {
  return http.get<TagRow[]>(prefix);
};

export const getTagPageApi = (params: { pageNum: number; pageSize: number; name?: string }) => {
  return http.get<{ records: TagRow[]; total: number }>(prefix + '/page', params);
};

export const addTagApi = (data: Partial<TagRow>) => {
  return http.post<boolean>(prefix, data);
};

export const updateTagApi = (data: Partial<TagRow>) => {
  return http.put<boolean>(prefix, data);
};

export const deleteTagApi = (id: number | string) => {
  return http.delete<boolean>(prefix + '/' + id);
};