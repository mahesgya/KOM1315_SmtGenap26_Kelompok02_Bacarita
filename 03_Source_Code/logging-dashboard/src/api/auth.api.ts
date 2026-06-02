import apiClient from "./client";

interface LoginRequest {
  email: string;
  password: string;
}

export class AuthApi {
  static async login(data: LoginRequest): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>("/api/auth/login", data);
  }

  static async logout(): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>("/api/auth/logout", {});
  }
}
