import { http } from "@/utils/http";

const prefix = '/fin/accounts';

/**
 * 科目类型枚举
 */
export const SubjectType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE'
} as const;

export type SubjectType = typeof SubjectType[keyof typeof SubjectType];

/**
 * 借贷方向枚举
 */
export const Direction = {
  DEBIT: 'DEBIT',   // 借
  CREDIT: 'CREDIT'  // 贷
} as const;

export type Direction = typeof Direction[keyof typeof Direction];

/**
 * 财务科目实体 (对应后端 SubjectTreeDTO / FinAccounts)
 */
export interface AccountRow {
  id: number;
  parentId: number | null;
  bookId: number;             // 账本ID
  code: string;               // 业务编码
  name: string;               // 账户名称
  accountTypeEnum: SubjectType; // 账户类型枚举
  balanceDirectionEnum: Direction; // 借贷方向枚举
  currencyCode: string;
  initialBalance: number;
  currentBalance: number;
  isArchived: boolean;        // true:归档, false:启用
  description?: string;
  isLeaf: boolean;            // 是否叶子节点
  children?: AccountRow[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 获取科目树形结构
 * 接口地址: GET /fin/accounts/subjects/tree
 * @param params 查询参数 { accountType, bookId }
 */
export const getAccountTreeApi = (params: { accountType?: string; bookId?: number }) => {
  return http.get<AccountRow[]>(`${prefix}/subjects/tree`, params);
};

/**
 * 获取指定父级下的子科目列表 (懒加载用)
 * 接口地址: GET /fin/accounts/subjects
 * @param params 查询参数 { parentId, bookId }
 */
export const getAccountChildrenApi = (params: { parentId?: number; bookId?: number }) => {
  return http.get<AccountRow[]>(`${prefix}/subjects`, params);
};

/**
 * 获取所有科目列表 (平铺)
 * 接口地址: GET /fin/accounts
 * @param bookId 账本ID
 */
export const getAccountListApi = (bookId?: number) => {
  return http.get<AccountRow[]>(`${prefix}`, { bookId });
};

/**
 * 获取科目详情
 * 接口地址: GET /fin/accounts/{id}
 * @param id 科目ID
 * @param bookId 账本ID
 */
export const getAccountDetailApi = (id: number, bookId?: number) => {
  return http.get<AccountRow>(`${prefix}/${id}`, { bookId });
};

/**
 * 新增科目
 * 接口地址: POST /fin/accounts
 */
export const addAccountApi = (data: Partial<AccountRow>) => {
  return http.post<void>(`${prefix}`, data);
};

/**
 * 修改科目
 * 接口地址: PUT /fin/accounts
 */
export const updateAccountApi = (data: Partial<AccountRow>) => {
  return http.put<void>(`${prefix}`, data);
};

/**
 * 删除科目
 * 接口地址: DELETE /fin/accounts/{id}
 */
export const deleteAccountApi = (id: number) => {
  return http.delete<void>(`${prefix}/${id}`);
};

/**
 * 初始化默认账户
 * 接口地址: POST /fin/accounts/init?bookId={bookId}
 */
export const initAccountsApi = (bookId: number) => {
  return http.post<void>(`${prefix}/init`, undefined, { params: { bookId } });
};
