import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "../lib/api-error";
import { clearStoredToken, getStoredToken, setStoredToken } from "../lib/auth-storage";
import { authService } from "../services/auth-service";
import type { LoginRequest, RegisterRequest, User } from "../types/auth";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<User>;
  register: (payload: RegisterRequest) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      return null;
    }

    try {
      const profile = await authService.me(currentToken);
      setToken(currentToken);
      setUser(profile);
      return profile;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        return null;
      }
      throw error;
    }
  }, [logout]);

  useEffect(() => {
    let active = true;

    async function validateToken() {
      setIsLoading(true);
      try {
        await refreshProfile();
      } finally {
        if (active) setIsLoading(false);
      }
    }

    validateToken();
    return () => {
      active = false;
    };
  }, [refreshProfile]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    setStoredToken(response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback((payload: RegisterRequest) => authService.register(payload), []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  }), [user, token, isLoading, login, register, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
