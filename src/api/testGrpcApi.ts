import { http } from "@/utils/http";

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
}

export const getHealthCheckApi = () => {
  return http.get<HealthStatus>("/grpc-test/health");
};
