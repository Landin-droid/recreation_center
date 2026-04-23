import { Layout } from "@components/Layout";
import { useAuthStore } from "@store/authStore";
import { useState } from "react";

export const ProfilePage = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-8">Мой профиль</h1>

          {user && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 text-sm mb-2">Полное имя</p>
                <p className="text-xl font-semibold">{user.fullName}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-2">Email</p>
                <p className="text-xl font-semibold">{user.email}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-2">Телефон</p>
                <p className="text-xl font-semibold">
                  {user.phoneNumber || "Не указан"}
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-2">Роль</p>
                <p className="text-xl font-semibold">
                  {user.role === "ADMIN"
                    ? "Администратор"
                    : user.role === "STAFF"
                      ? "Сотрудник"
                      : "Пользователь"}
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-2">Дата регистрации</p>
                <p className="text-xl font-semibold">
                  {new Date(user.registrationDate).toLocaleDateString("ru-RU")}
                </p>
              </div>

              <div className="pt-6 border-t">
                <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
                  Редактировать профиль
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
