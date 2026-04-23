import { Layout } from "@components/Layout";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { ErrorMessage } from "@components/ErrorMessage";
import { useReservations } from "@hooks/useApi";
import { Reservation, ReservationStatus } from "../types/index";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "react-router-dom";

const getStatusColor = (status: ReservationStatus) => {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getStatusLabel = (status: ReservationStatus) => {
  const labels = {
    PENDING: "Ожидание",
    CONFIRMED: "Подтверждено",
    CANCELLED: "Отменено",
    COMPLETED: "Завершено",
  };
  return labels[status] || status;
};

export const ReservationsPage = () => {
  const {
    data: reservations,
    isLoading,
    isError,
    error,
    refetch,
  } = useReservations();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Мои бронирования</h1>
        <p className="text-gray-600 mt-2">Управляйте вашими бронированиями</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Загрузка бронирований..." />
        </div>
      )}

      {isError && (
        <ErrorMessage
          message={error?.message || "Ошибка при загрузке бронирований"}
          onRetry={() => refetch()}
        />
      )}

      {reservations && reservations.length > 0 ? (
        <div className="grid gap-4">
          {reservations.map((reservation: Reservation) => (
            <div
              key={reservation.reservationId}
              className="bg-white rounded-lg shadow-md p-6">
              <div className="grid md:grid-cols-4 gap-4 items-center">
                <div>
                  <p className="text-gray-600 text-sm">Объект</p>
                  <p className="text-lg font-semibold">
                    {reservation.bookableObject?.name || "Объект"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Даты</p>
                  <p className="text-sm">
                    {format(new Date(reservation.startDate), "d MMM", {
                      locale: ru,
                    })}{" "}
                    -{" "}
                    {format(new Date(reservation.endDate), "d MMM", {
                      locale: ru,
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Статус</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(reservation.status)}`}>
                    {getStatusLabel(reservation.status)}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-gray-600 text-sm">Сумма</p>
                  <p className="text-lg font-bold text-primary-600">
                    {reservation.totalPrice} ₽
                  </p>
                  <Link
                    to={`/reservations/${reservation.reservationId}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold mt-2 inline-block">
                    Детали →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 text-lg mb-4">
            У вас нет активных бронирований
          </p>
          <Link
            to="/objects"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
            Просмотреть объекты
          </Link>
        </div>
      )}
    </Layout>
  );
};
