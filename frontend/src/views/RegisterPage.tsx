import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import { extractErrorMessage } from "@shared/api/http";
import { AppShell, Button, Field, Panel, Title } from "@shared/ui/kit";

export function RegisterPage() {
  const navigate = useNavigate();
  const { accessToken, setSession } = useAuthStore();
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const registerMutation = useMutation({
    mutationFn: authApi.register,
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
      <div className="mx-auto max-w-2xl">
        <Panel className="space-y-6">
          <Title
            eyebrow="Регистрация"
            heading="Создание нового пользователя"
            description="Форма подключена к `POST /api/users/register` и сразу создает рабочую сессию с access/refresh token."
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              setErrorMessage("");
              registerMutation.mutate({
                ...formState,
                phoneNumber: formState.phoneNumber || undefined,
              });
            }}
          >
            <Field
              label="ФИО"
              value={formState.fullName}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              required
            />
            <Field
              label="Телефон"
              value={formState.phoneNumber}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  phoneNumber: event.target.value,
                }))
              }
            />
            <Field
              label="Email"
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
            <Field
              label="Пароль"
              type="password"
              hint="Минимум 8 символов, как требует backend"
              value={formState.password}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required
            />
            {errorMessage ? (
              <p className="md:col-span-2 rounded-2xl bg-[#fae0dc] px-4 py-3 text-sm text-[color:var(--danger)]">
                {errorMessage}
              </p>
            ) : null}
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Создаём аккаунт..." : "Зарегистрироваться"}
              </Button>
              <Link className="text-sm font-semibold text-[color:var(--accent)]" to="/login">
                Уже есть аккаунт
              </Link>
            </div>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
