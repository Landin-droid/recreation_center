import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@components/Layout";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { ErrorMessage } from "@components/ErrorMessage";
import {
  useReservation,
  useCancelReservation,
  useCreatePayment,
} from "@hooks/useApi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";

export const ReservationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reservationId = parseInt(id || "0");
  const [isPaying, setIsPaying] = useState(false);

  const {
    data: reservation,
    isLoading,
    isError,
    error,
    refetch,
  } = useReservation(reservationId);
  const cancelReservation = useCancelReservation(reservationId);
  const createPayment = useCreatePayment();

  const handleCancel = async () => {
    if (!confirm("Вы уверены, что хотите отменить бронирование?")) return;
    try {
      await cancelReservation.mutateAsync();
      navigate("/reservations");
    } catch (err) {
      console.error("Error cancelling reservation:", err);
    }
  };

  const handlePay = async () => {
    setIsPaying(true);
    try {
      const paymentData = await createPayment.mutateAsync({
        reservationId,
        returnUrl: `${window.location.origin}/payment-success`,
      });
      // Редирект на форму оплаты
      if (paymentData.confirmation?.confirmation_url) {
        window.location.href = paymentData.confirmation.confirmation_url;
      }
    } catch (err) {
      console.error("Error creating payment:", err);
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Загрузка деталей бронирования..." />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <ErrorMessage
          message={error?.message || "Ошибка при загрузке бронирования"}
          onRetry={() => refetch()}
        />
      </Layout>
    );
  }

  if (!reservation) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Бронирование не найдено</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <button
        onClick={() => navigate("/reservations")}
        className="mb-6 text-primary-600 hover:text-primary-700 font-semibold">
        ← Вернуться к бронированиям
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-6">Детали бронирования</h1>

            <div className="space-y-6">
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm mb-1">Объект</p>
                <p className="text-2xl font-bold">
                  {reservation.bookableObject?.name}
                </p>
              </div>

              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm mb-1">Даты проживания</p>
                <p className="text-lg">
                  {format(new Date(reservation.startDate), "d MMMM yyyy", {
                    locale: ru,
                  })}{" "}
                  -{" "}
                  {format(new Date(reservation.endDate), "d MMMM yyyy", {
                    locale: ru,
                  })}
                </p>
              </div>

              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm mb-1">Количество гостей</p>
                <p className="text-lg">{reservation.guestCount} человек</p>
              </div>

              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm mb-1">
                  Специальные пожелания
                </p>
                <p className="text-lg">
                  {reservation.specialRequests || "Нет"}
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-1">Дата создания</p>
                <p className="text-lg">
                  {format(
                    new Date(reservation.createdAt),
                    "d MMMM yyyy HH:mm",
                    { locale: ru },
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 h-fit">
          <h2 className="text-2xl font-bold mb-6">Сумма</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-600 text-sm mb-2">К оплате</p>
            <p className="text-4xl font-bold text-blue-600">
              {reservation.totalPrice} ₽
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Статус:</span>
              <span
                className={`font-semibold px-3 py-1 rounded-full text-sm ${
                  reservation.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : reservation.status === "CONFIRMED"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                }`}>
                {reservation.status}
              </span>
            </div>
          </div>

          {reservation.status === "PENDING" && (
            <button
              onClick={handlePay}
              disabled={isPaying || createPayment.isPending}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-3">
              {isPaying || createPayment.isPending
                ? "Обработка..."
                : "Оплатить"}
            </button>
          )}

          {reservation.status !== "COMPLETED" &&
            reservation.status !== "CANCELLED" && (
              <button
                onClick={handleCancel}
                disabled={cancelReservation.isPending}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                {cancelReservation.isPending
                  ? "Отмена..."
                  : "Отменить бронирование"}
              </button>
            )}
        </div>
      </div>
    </Layout>
  );
};
