import { Link } from "react-router-dom";
import { useAuthStore } from "@store/authStore";
import { Layout } from "@components/Layout";

export const HomePage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-lg p-12 mb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">Добро пожаловать в Pobeda</h1>
        <p className="text-xl mb-8 opacity-90">
          Зарезервируйте лучшие объекты для ваших событий
        </p>
        {!isAuthenticated && (
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Начать
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition">
              Войти
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold mb-2">Большой выбор</h3>
          <p className="text-gray-600">
            Множество объектов на любой вкус и кошелёк
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-xl font-semibold mb-2">Безопасные платежи</h3>
          <p className="text-gray-600">
            Интеграция с Yookassa для надежной обработки
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">Простое бронирование</h3>
          <p className="text-gray-600">
            Зарезервируйте объект в несколько кликов
          </p>
        </div>
      </div>

      {isAuthenticated && (
        <div className="text-center">
          <Link
            to="/objects"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition">
            Просмотреть объекты
          </Link>
        </div>
      )}
    </Layout>
  );
};
