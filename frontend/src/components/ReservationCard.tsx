import { Reservation } from "@types/index";
import { useCancelReservation } from "@hooks/useApi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface ReservationCardProps {
  reservation: Reservation;
  onCancel?: () => void;
}

export const ReservationCard = ({
  reservation,
  onCancel,
}: ReservationCardProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const cancelMutation = useCancelReservation(reservation.reservationId);

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync();
      onCancel?.();
    } finally {
      setShowConfirm(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {reservation.bookableObject?.name}
            </h3>
            <p className="text-sm text-gray-600">
              ID: {reservation.reservationId}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(reservation.status)}`}>
            {reservation.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-600">Даты проживания</p>
            <p className="font-semibold">
              {format(new Date(reservation.startDate), "d MMM", { locale: ru })}{" "}
              - {format(new Date(reservation.endDate), "d MMM", { locale: ru })}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Гостей</p>
            <p className="font-semibold">{reservation.guestCount}</p>
          </div>
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <div>
            <p className="text-gray-600 text-sm">Сумма</p>
            <p className="text-xl font-bold text-primary-600">
              {reservation.totalPrice} ₽
            </p>
          </div>
          {reservation.status === "PENDING" && (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-600 hover:text-red-700 font-semibold">
              Отменить
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Отменить бронирование?"
          message="Это действие не можно отменить. Вы уверены?"
          onConfirm={handleCancel}
          onCancel={() => setShowConfirm(false)}
          confirmText="Отменить"
          cancelText="Назад"
          isDangerous
        />
      )}
    </>
  );
};
