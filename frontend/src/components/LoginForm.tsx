import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { LoginInput } from "@types/index";

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

interface LoginFormProps {
  onSubmit: (data: LoginInput) => Promise<void>;
  isLoading?: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmitHandler = async (data: LoginInput) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка при входе");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-gray-700 font-semibold mb-2">Email</label>
        <input
          type="email"
          placeholder="your@email.com"
          {...register("email")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-2">Пароль</label>
        <input
          type="password"
          placeholder="••••••••"
          {...register("password")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
        {isLoading ? "Вход..." : "Войти"}
      </button>
    </form>
  );
};
