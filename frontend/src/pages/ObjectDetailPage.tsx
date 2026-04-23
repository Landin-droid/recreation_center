import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@components/Layout";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { ErrorMessage } from "@components/ErrorMessage";
import { useBookableObject } from "@hooks/useApi";
import { useCreateReservation } from "@hooks/useApi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const ObjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const objectId = parseInt(id || "0");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");

  const {
    data: object,
    isLoading,
    isError,
    error,
    refetch,
  } = useBookableObject(objectId);
  const createReservation = useCreateReservation();

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !guestCount) return;

    try {
      await createReservation.mutateAsync({
        bookableObjectId: objectId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        guestCount: parseInt(guestCount),
      });
      navigate("/reservations");
    } catch (err) {
      console.error("Error creating reservation:", err);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Загрузка детали объекта..." />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <ErrorMessage
          message={error?.message || "Ошибка при загрузке объекта"}
          onRetry={() => refetch()}
        />
      </Layout>
    );
  }

  if (!object) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Объект не найден</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <button
        onClick={() => navigate("/objects")}
        className="mb-6 text-primary-600 hover:text-primary-700 font-semibold">
        ← Вернуться к списку
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-64 rounded-lg flex items-center justify-center mb-6">
            <div className="text-white text-center">
              <div className="text-5xl font-bold">{object.capacity}</div>
              <div className="text-lg opacity-90">мест</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4">{object.name}</h1>
          {object.description && (
            <p className="text-gray-700 text-lg mb-4">{object.description}</p>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Вместимость</p>
                <p className="text-2xl font-bold text-blue-600">
                  {object.capacity} человек
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Цена за ночь</p>
                <p className="text-2xl font-bold text-blue-600">
                  {object.basePrice} ₽
                </p>
              </div>
            </div>
            {object.isSeasonal && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                🌞 Сезонный объект
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-2xl font-bold mb-6">Забронировать</h2>
          <form onSubmit={handleReserve} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Дата начала
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Количество гостей
              </label>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600">
                {Array.from({ length: object.capacity }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i + 1 === 1 ? "гость" : "гостей"}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={createReservation.isPending || !startDate || !endDate}
              className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {createReservation.isPending
                ? "Бронирование..."
                : "Забронировать"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
