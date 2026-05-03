import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import { extractErrorMessage } from "@shared/api/http";
import { AppShell, Button, Field, Panel, Title } from "@shared/ui/kit";

export function LoginPage() {
  const navigate = useNavigate();
  const { accessToken, setSession } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = "Email обязателен";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = "Неверный формат почты";
    }
    if (!password) {
      newErrors.password = "Пароль обязателен";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      setSession({
        user,
        accessToken: "cookie-based",
        refreshToken: "cookie-based",
      });
      navigate("/profile");
    },
    onError: (error) => {
      setErrorMessage(extractErrorMessage(error));
    },
  });

  if (accessToken) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <Panel className="space-y-6">
          <Title
            eyebrow="Авторизация"
            heading="Вход в личный кабинет"
            description="Введите свои учетные данные для доступа к системе."
          />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setErrorMessage("");
              if (validate()) {
                loginMutation.mutate({ email, password });
              }
            }}
          >
            <div className="space-y-1">
              <Field
                label="Email"
                type="email"
                placeholder="mail@example.ru"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {errors.email && <p className="text-xs text-[color:var(--danger)]">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <Field
                label="Пароль"
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {errors.password && <p className="text-xs text-[color:var(--danger)]">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <Link 
                to="/forgot-password" 
                className="text-sm font-semibold text-[color:var(--accent)] hover:underline"
              >
                Забыли пароль?
              </Link>
            </div>

            {errorMessage ? (
              <p className="rounded-2xl bg-[#fae0dc] px-4 py-3 text-sm text-[color:var(--danger)]">
                {errorMessage}
              </p>
            ) : null}
            <Button className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Входим..." : "Войти"}
            </Button>
          </form>
          <p className="text-sm text-[color:var(--ink-soft)]">
            Нет аккаунта? <Link className="font-bold text-[color:var(--accent)]" to="/register">Создать</Link>
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
