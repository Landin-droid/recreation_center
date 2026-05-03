import { useState } from "react";
import { AppShell, Title, Panel, Button, Field, Toast } from "@shared/ui/kit";
import { authApi } from "@features/auth/api";
import { useSearchParams, useNavigate } from "react-router-dom";

export function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Невалидный токен");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({ token, password });
      setToast("Пароль успешно изменен! Перенаправление на страницу входа...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Ошибка при смене пароля");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-12 text-center">
          <Panel className="space-y-6">
            <Title heading="Ошибка" description="Ссылка для восстановления пароля недействительна или устарела." />
            <Button variant="secondary" className="w-full font-bold" onClick={() => navigate("/forgot-password")}>
              Запросить новую ссылку
            </Button>
          </Panel>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto py-12">
        <Panel className="space-y-6">
          <Title heading="Новый пароль" description="Придумайте надежный пароль для вашего аккаунта." />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Field
                label="Новый пароль"
                type="password"
                placeholder="Минимум 8 символов"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Field
                label="Подтвердите пароль"
                type="password"
                placeholder="Повторите пароль"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm font-bold text-red-600">{error}</p>}

            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? "Смена пароля..." : "Сохранить новый пароль"}
            </Button>
          </form>
        </Panel>
      </div>

      {toast && (
        <Toast 
          message={toast} 
          type="success" 
          onClose={() => setToast(null)} 
        />
      )}
    </AppShell>
  );
}
