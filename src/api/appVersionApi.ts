import { http } from "@/utils/http";

const prefix = "/sys/app-version";

export type PublishSource = "JWT" | "USER_API_KEY" | "LEGACY_API_KEY" | "UNKNOWN";

export type SysAppVersion = {
  id: number;
  versionCode: number;
  versionName: string;
  fileUrl: string;
  fileSize?: number;
  fileMd5?: string;
  updateLog?: string;
  isForce?: number;
  platform?: string;
  status?: number;
  publishedByUserId?: number;
  publishedByApiKeyId?: number;
  publishSource?: PublishSource;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
};

export interface QuickPublishPayload {
  versionCode: string;
  versionName: string;
  file: File;
  updateLog?: string;
  isForce?: "0" | "1";
  platform?: string;
  apiKey: string;
}

export const quickPublishAppVersionApi = (payload: QuickPublishPayload) => {
  const formData = new FormData();
  formData.append("versionCode", payload.versionCode);
  formData.append("versionName", payload.versionName);
  formData.append("file", payload.file);

  if (payload.updateLog) {
    formData.append("updateLog", payload.updateLog);
  }

  formData.append("isForce", payload.isForce ?? "0");
  formData.append("platform", payload.platform ?? "android");

  return http.post<SysAppVersion>(`${prefix}/quick-publish`, formData, {
    skipAuth: true,
    headers: {
      "Content-Type": "multipart/form-data",
      "X-API-Key": payload.apiKey
    }
  });
};
