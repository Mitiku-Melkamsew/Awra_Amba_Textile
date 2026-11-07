import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { authService, setToken } from "../infrastructure";
import type { AuthUser, UserRole } from "../domain/models";

interface SignupData {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  companyName?: string;
  role?: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isWeaver: boolean;
  isMerchant: boolean;
  hasRole: (role: UserRole) => boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  signup: (data: SignupData) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getMe()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => {
    const roles = user?.roles ?? (user?.role ? [user.role] : []);
    const hasRole = (role: UserRole) => roles.includes(role) || user?.role === role;

    return {
      user,
      loading,
      isAdmin: hasRole("admin"),
      isWeaver: hasRole("weaver"),
      isMerchant: hasRole("merchant"),
      hasRole,
      async login(username: string, password: string) {
        const result = await authService.login(username, password);
        setToken(result.token);
        setUser(result.user);
        return result.user;
      },
      async signup(data: SignupData) {
        const result = await authService.signup(data);
        setToken(result.token);
        setUser(result.user);
        return result.user;
      },
      logout() {
        setToken(null);
        setUser(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
