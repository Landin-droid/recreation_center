import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@components/Layout";
import { LoginForm } from "@components/LoginForm";
import { useAuth } from "@hooks/useAuth";
import { Link } from "react-router-dom";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (data: any) => {
    setIsLoading(true);
    try {
      await login(data);
      navigate("/objects");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Вход в аккаунт</h1>
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        <p className="text-center mt-6 text-gray-600">
          Нет аккаунта?{" "}
          <Link
            to="/register"
            className="text-primary-600 font-semibold hover:text-primary-700">
            Регистрация
          </Link>
        </p>
      </div>
    </Layout>
  );
};
