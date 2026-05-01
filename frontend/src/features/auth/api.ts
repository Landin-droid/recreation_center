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
};
