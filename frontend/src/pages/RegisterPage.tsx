import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@components/Layout";
import { RegisterForm } from "@components/RegisterForm";
import { useAuth } from "@hooks/useAuth";
import { Link } from "react-router-dom";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (data: any) => {
    setIsLoading(true);
    try {
      await register(data);
      navigate("/objects");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Регистрация</h1>
        <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
        <p className="text-center mt-6 text-gray-600">
          Уже есть аккаунт?{" "}
          <Link
            to="/login"
            className="text-primary-600 font-semibold hover:text-primary-700">
            Вход
          </Link>
        </p>
      </div>
    </Layout>
  );
};
