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

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession({
        user: session,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      navigate("/dashboard");
    },
    onError: (error) => {
      setErrorMessage(extractErrorMessage(error));
    },
  });

  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <Panel className="space-y-6">
          <Title
            eyebrow="Авторизация"
            heading="Вход в личный кабинет"
            description="Используется реальный endpoint `POST /api/users/login`, после входа доступны профиль, бронирования и запуск оплаты."
          />
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setErrorMessage("");
              loginMutation.mutate({ email, password });
            }}
          >
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Field
              label="Пароль"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
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
