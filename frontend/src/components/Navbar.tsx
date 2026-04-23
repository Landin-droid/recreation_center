import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@store/authStore";
import { useAuth } from "@hooks/useAuth";
import { useState } from "react";

export const Navbar = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">Pobeda</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/objects"
              className="text-gray-700 hover:text-primary-600 transition">
              Объекты
            </Link>
            <Link
              to="/menu"
              className="text-gray-700 hover:text-primary-600 transition">
              Меню
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/reservations"
                  className="text-gray-700 hover:text-primary-600 transition">
                  Бронирования
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-primary-600 transition">
                  {user?.fullName || "Профиль"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition">
                  Вход
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <Link
              to="/objects"
              className="block py-2 text-gray-700 hover:text-primary-600">
              Объекты
            </Link>
            <Link
              to="/menu"
              className="block py-2 text-gray-700 hover:text-primary-600">
              Меню
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/reservations"
                  className="block py-2 text-gray-700 hover:text-primary-600">
                  Бронирования
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-700 hover:text-primary-600">
                  Профиль
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-red-500 hover:text-red-600">
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 hover:text-primary-600">
                  Вход
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-gray-700 hover:text-primary-600">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
