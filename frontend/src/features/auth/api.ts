import { http, unwrap } from "@shared/api/http";
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  User,
} from "@shared/api/types";

export const authApi = {
  login(payload: LoginPayload) {
    return unwrap<AuthSession>(http.post("/users/login", payload));
  },
  register(payload: RegisterPayload) {
    return unwrap<AuthSession>(http.post("/users/register", payload));
  },
  profile() {
    return unwrap<User>(http.get("/users/profile"));
  },
  logout() {
    return unwrap<{ message?: string }>(http.post("/users/logout"));
  },
  forgotPassword(email: string) {
    return unwrap<{ resetToken?: string }>(http.post("/users/forgot-password", { email }));
  },
  resetPassword(payload: { token: string; password?: string }) {
    return unwrap<{ message: string }>(http.post("/users/reset-password", payload));
  },
};
