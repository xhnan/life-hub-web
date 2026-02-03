import { http } from "@/utils/http";

export interface GenerateCodeRequest {
    prompt: string;
}

export interface GenerateCodeResponse {
    code: string;
    explanation?: string;
}

export const generateCodeApi = (data: GenerateCodeRequest) => {
    return http.post<GenerateCodeResponse>("/ai/code/generate", data);
};
