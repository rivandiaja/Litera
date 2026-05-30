import { apiRequest } from "../lib/api-client";
import type { LoginRequest, RegisterRequest, TokenResponse, User } from "../types/auth";

export const authService = {
  login(payload: LoginRequest) {
    return apiRequest<TokenResponse>("/auth/login", {
      method: "POST",
      body: payload,
      token: null,
    });
  },

  register(payload: RegisterRequest) {
    return apiRequest<User>("/auth/register", {
      method: "POST",
      body: payload,
      token: null,
    });
  },

  me(token?: string | null) {
    return apiRequest<User>("/auth/me", { token });
  },
};
