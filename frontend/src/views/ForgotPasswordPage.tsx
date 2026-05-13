import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { AppShell, Title, Panel, Button, Field } from "@shared/ui/kit";
import { authApi } from "@features/auth/api";
import { emailjsService } from "@shared/lib/emailjs";
import { Link, useNavigate } from "react-router-dom";
import { SEO_DESCRIPTIONS } from "@shared/utils/seo";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { resetToken } = await authApi.forgotPassword(email);

      if (resetToken) {
        const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
        await emailjsService.sendPasswordResetEmail(email, resetLink);
      }

      setSuccess(true);
    } catch (err: Error | unknown) {
      setError((err as Error).message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>Восстановление пароля - База отдыха "Победа"</title>
        <meta name="description" content={SEO_DESCRIPTIONS.forgotPassword} />
      </Helmet>
      <div className="max-w-md mx-auto py-12">
        <Panel className="space-y-6">
          <Title
            heading="Восстановление пароля"
            description="Введите ваш email, и мы отправим вам инструкции по смене пароля."
          />

          {success ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-sm">
                Если аккаунт с таким email существует, мы отправили на него
                письмо с ссылкой для восстановления пароля.
              </div>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => navigate("/login")}>
                Вернуться ко входу
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label="Электронная почта"
                type="email"
                placeholder="example@mail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Отправка..." : "Отправить ссылку"}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-[color:var(--ink-soft)] hover:text-[#c96f2b] font-medium">
                  Я вспомнил пароль
                </Link>
              </div>
            </form>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
