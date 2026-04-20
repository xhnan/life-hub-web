import { http } from "@/utils/http";

const prefix = "/sys/user-api-keys";

export type ApiKeyStatus = "active" | "revoked" | "expired";

export interface CreateApiKeyPayload {
  keyName: string;
  description?: string;
  allowedPaths?: string[];
  expiresAt?: string;
}

export interface CreateApiKeyResult {
  id: number;
  apiKey: string;
  keyName: string;
  keyPrefix: string;
  allowedPaths: string[];
  createdAt: string;
}

export interface ApiKeyItem {
  id: number;
  keyName: string;
  maskedKey: string;
  description?: string;
  allowedPaths: string[];
  status: ApiKeyStatus;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export const createUserApiKeyApi = (data: CreateApiKeyPayload) => {
  return http.post<CreateApiKeyResult>(prefix, data);
};

export const getUserApiKeyListApi = () => {
  return http.get<ApiKeyItem[]>(prefix);
};

export const revokeUserApiKeyApi = (id: number | string) => {
  return http.delete<boolean>(`${prefix}/${id}`);
};
