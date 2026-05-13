import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import { extractErrorMessage } from "@shared/api/http";
import { AppShell, Button, Field, Panel, Title } from "@shared/ui/kit";
import { SEO_DESCRIPTIONS } from "@shared/utils/seo";

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, setSession } = useAuthStore();
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    phoneNumber: "+7",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // ФИО validation
    if (!formState.fullName.trim()) {
      newErrors.fullName = "ФИО обязательно";
    } else if (formState.fullName.trim().split(" ").length < 2) {
      newErrors.fullName = "Введите Фамилию Имя Отчество (при наличии)";
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formState.email) {
      newErrors.email = "Email обязателен";
    } else if (!emailRegex.test(formState.email)) {
      newErrors.email = "Неверный формат почты (mail@example.ru)";
    }

    // Phone validation
    const phoneRegex = /^\+7\d{10}$/;
    if (!formState.phoneNumber || formState.phoneNumber === "+7") {
      newErrors.phoneNumber = "Номер телефона обязателен";
    } else if (!phoneRegex.test(formState.phoneNumber)) {
      newErrors.phoneNumber = "Формат: +79001234567";
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!formState.password) {
      newErrors.password = "Пароль обязателен";
    } else if (!passwordRegex.test(formState.password)) {
      newErrors.password =
        "Минимум 8 символов, одна заглавная, одна строчная и одна цифра";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: any) => {
      setSession({
        user: data,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      navigate("/profile");
    },
    onError: (error) => {
      setErrorMessage(extractErrorMessage(error));
    },
  });

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AppShell>
      <Helmet>
        <title>Регистрация - База отдыха "Победа"</title>
        <meta name="description" content={SEO_DESCRIPTIONS.register} />
      </Helmet>
      <div className="mx-auto max-w-2xl">
        <Panel className="space-y-6">
          <Title
            eyebrow="Регистрация"
            heading="Создание нового пользователя"
            description="Заполните форму, чтобы создать аккаунт и получить доступ к бронированию."
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              setErrorMessage("");
              if (validate()) {
                registerMutation.mutate(formState);
              }
            }}>
            <div className="space-y-1">
              <Field
                label="ФИО"
                placeholder="Фамилия Имя Отчество (при наличии)"
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                required
              />
              {errors.fullName && (
                <p className="text-xs text-[color:var(--danger)]">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Field
                label="Телефон"
                placeholder="+79001234567"
                value={formState.phoneNumber}
                onChange={(event) => {
                  let value = event.target.value;
                  if (!value.startsWith("+7"))
                    value = "+7" + value.replace(/\D/g, "");
                  setFormState((current) => ({
                    ...current,
                    phoneNumber: value,
                  }));
                }}
                required
              />
              {errors.phoneNumber && (
                <p className="text-xs text-[color:var(--danger)]">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Field
                label="Email"
                type="email"
                placeholder="mail@example.ru"
                value={formState.email}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
              {errors.email && (
                <p className="text-xs text-[color:var(--danger)]">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Field
                label="Пароль"
                type="password"
                placeholder="Пароль"
                value={formState.password}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
              />
              {errors.password && (
                <p className="text-xs text-[color:var(--danger)]">
                  {errors.password}
                </p>
              )}
            </div>

            {errorMessage ? (
              <p className="md:col-span-2 rounded-2xl bg-[#fae0dc] px-4 py-3 text-sm text-[color:var(--danger)]">
                {errorMessage}
              </p>
            ) : null}
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button disabled={registerMutation.isPending}>
                {registerMutation.isPending
                  ? "Создаём аккаунт..."
                  : "Зарегистрироваться"}
              </Button>
              <Link
                className="text-sm font-semibold text-[color:var(--accent)]"
                to="/login">
                Уже есть аккаунт
              </Link>
            </div>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
