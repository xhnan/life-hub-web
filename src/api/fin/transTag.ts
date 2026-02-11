import { http } from "@/utils/http";

const prefix = '/fin/transtags';

export interface TransTagRow {
  id?: number;
  transId?: number;
  tagId?: number;
}

/** 查询所有交易标签关联 */
export const getTransTagListApi = () => {
  return http.get<TransTagRow[]>(`${prefix}`);
};
