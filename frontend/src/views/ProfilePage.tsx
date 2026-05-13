import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  AppShell,
  Title,
  Panel,
  Badge,
  Loader,
  EmptyState,
  Button,
  Field,
  Modal,
  Toast,
} from "@shared/ui/kit";
import { dashboardApi } from "@features/dashboard/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import type { Reservation, ReservationReceipt } from "@shared/api/types";
import { formatCurrency } from "@shared/lib/format";
import {
  format,
  parseISO,
  isBefore,
  addHours,
  addDays,
  differenceInMinutes,
} from "date-fns";
import { ru } from "date-fns/locale";

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [cancelModalId, setCancelModalId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<"cancel" | "refund" | null>(null);
  const [modalReason, setModalReason] = useState("Отмена пользователем");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      dashboardApi
        .listReservations(user.userId)
        .then(setReservations)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (
      !formData.fullName.trim() ||
      formData.fullName.trim().split(" ").length < 2
    ) {
      newErrors.fullName = "Введите Фамилию Имя Отчество (при наличии)";
    }
    if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
    ) {
      newErrors.email = "Неверный формат почты";
    }
    if (!/^\+7\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Формат: +79001234567";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!validate()) return;
    setIsSaving(true);
    try {
      const updatedUser = await dashboardApi.updateProfile(user.userId, {
        ...formData,
      });
      updateUser(updatedUser);
      setIsEditing(false);
      setToast({ message: "Профиль успешно обновлен", type: "success" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setToast({
        message: message || "Ошибка при сохранении профиля",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelModalId || !modalMode) return;
    setIsCancelling(true);
    try {
      let successMessage = "Операция завершена";

      if (modalMode === "refund") {
        const reservation = reservations.find(
          (item) => item.reservationId === cancelModalId,
        );
        if (!reservation?.payment?.paymentId) {
          throw new Error("Платеж не найден для возврата");
        }

        const refund = await dashboardApi.createRefund(
          reservation.payment.paymentId,
          modalReason,
        );

        successMessage =
          refund.status === "succeeded"
            ? "Возврат успешно проведен"
            : "Запрос на возврат отправлен";
      } else {
        await dashboardApi.cancelReservation(cancelModalId, modalReason);
        successMessage = "Бронирование успешно отменено";
      }

      const updated = await dashboardApi.listReservations(user?.userId);
      setReservations(updated);
      setToast({ message: successMessage, type: "success" });
      setCancelModalId(null);
      setModalMode(null);
      setModalReason("Отмена пользователем");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setToast({ message: message || "Ошибка при операции", type: "error" });
    } finally {
      setIsCancelling(false);
    }
  };

  const getRefundDeadline = (reservation: Reservation) => {
    const reservationDate = parseISO(reservation.reservationDate);
    const isGazeboOrCottage = ["cottage", "gazebo"].includes(
      reservation.bookableObject.type,
    );
    return isGazeboOrCottage
      ? addHours(reservationDate, 10)
      : addDays(reservationDate, -1);
  };

  const canCancelPending = (res: Reservation) => res.status === "pending";

  const canRefund = (res: Reservation) => {
    if (res.status !== "paid" || res.payment?.status !== "succeeded") {
      return false;
    }
    return isBefore(new Date(), getRefundDeadline(res));
  };

  const translatePaymentStatus = (status?: string | null) => {
    switch (status) {
      case "pending":
        return "Ожидается";
      case "succeeded":
        return "Успешно";
      case "canceled":
        return "Отменено";
      case "failed":
        return "Не удалось";
      case "waiting_for_capture":
        return "Ожидает захвата";
      default:
        return status ?? "—";
    }
  };

  const translatePaymentMethod = (method?: string | null) => {
    switch (method) {
      case "bank_card":
        return "Банковская карта";
      case "yoo_money":
        return "ЮMoney кошелек";
      case "sberbank":
        return "Сбербанк";
      case "alfa_pay":
        return "Альфа-Банк";
      case "tinkoff_bank":
        return "Т-банк";
      case "sbp":
        return "СБП";
      case "cash":
        return "Наличными";
      default:
        return method || "не указан";
    }
  };

  const translateRefundStatus = (status?: string | null) => {
    switch (status) {
      case "pending":
        return "Ожидает";
      case "succeeded":
        return "Успешно";
      case "canceled":
        return "Отменено";
      default:
        return status ?? "—";
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return "—";
    const minutes = differenceInMinutes(parseISO(deadline), new Date());
    if (minutes <= 0) return "Время действия истекло";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours > 0 ? `${hours}ч ` : ""}${remainingMinutes} мин`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge tone="success">Оплачено</Badge>;
      case "pending":
        return <Badge tone="warning">Ожидает оплаты</Badge>;
      case "canceled":
        return <Badge tone="danger">Отменено</Badge>;
      case "refunded":
        return <Badge tone="success">Возвращено</Badge>;
      case "expired":
        return <Badge tone="danger">Истекло время действия</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatReceiptAmount = (receipt: ReservationReceipt) => {
    if (!receipt.amount) return "—";
    const amount = Number(receipt.amount);
    return Number.isFinite(amount)
      ? formatCurrency(amount)
      : `${receipt.amount} ${receipt.currency}`;
  };

  const handleOpenReceiptPdf = async (receipt: ReservationReceipt) => {
    try {
      const blob = await dashboardApi.getReceiptPdf(receipt.receiptId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setToast({
        message: message || "Не удалось открыть PDF-файл чека",
        type: "error",
      });
    }
  };

  const handleDownloadReceiptPdf = async (receipt: ReservationReceipt) => {
    try {
      const blob = await dashboardApi.getReceiptPdf(receipt.receiptId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${receipt.type}-${receipt.receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setToast({
        message: message || "Не удалось скачать PDF-файл чека",
        type: "error",
      });
    }
  };

  const renderReceipt = (receipt: ReservationReceipt | null) => {
    if (!receipt) return null;

    return (
      <div className="rounded-2xl border border-[#efe4d6] bg-white/75 p-4 text-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase text-[#72543d]">
              {receipt.typeLabel}
            </p>
            <p className="font-bold text-[#24170f]">
              {receipt.statusLabel}
            </p>
            <p className="text-[color:var(--ink-soft)]">
              Сумма: {formatReceiptAmount(receipt)}
            </p>
            {receipt.registeredAt ? (
              <p className="text-[color:var(--ink-soft)]">
                Дата регистрации чека: {receipt.registeredAt}
              </p>
            ) : null}
            <p className="break-all text-[color:var(--ink-soft)]">
              ID чека ЮKassa: {receipt.receiptId}
            </p>
          </div>

          {receipt.canOpenPdf ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                variant="secondary"
                className="py-2 text-xs font-bold"
                onClick={() => handleOpenReceiptPdf(receipt)}>
                Посмотреть PDF
              </Button>
              <Button
                variant="ghost"
                className="py-2 text-xs font-bold"
                onClick={() => handleDownloadReceiptPdf(receipt)}>
                Скачать
              </Button>
            </div>
          ) : null}
        </div>

        {receipt.fiscalDocumentNumber ||
        receipt.fiscalStorageNumber ||
        receipt.fiscalAttribute ? (
          <div className="mt-3 grid gap-2 border-t border-[#efe4d6] pt-3 text-xs sm:grid-cols-3">
            <p className="break-all text-[color:var(--ink-soft)]">
              Номер фискального документа: {receipt.fiscalDocumentNumber || "—"}
            </p>
            <p className="break-all text-[color:var(--ink-soft)]">
              Фискальный накопитель: {receipt.fiscalStorageNumber || "—"}
            </p>
            <p className="break-all text-[color:var(--ink-soft)]">
              Фискальный атрибут: {receipt.fiscalAttribute || "—"}
            </p>
          </div>
        ) : null}
      </div>
    );
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <div className="space-y-12">
        <Title
          eyebrow="Личный кабинет"
          heading={`Добро пожаловать, ${user.fullName.split(" ")[1]}`}
          description="Здесь вы можете управлять своими данными и просматривать историю бронирований."
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* User Info */}
          <Panel className="lg:col-span-1 lg:sticky top-24 h-fit space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#24170f]">Ваши данные</h3>
              <Button
                variant="ghost"
                className="text-xs font-bold"
                onClick={() => {
                  setIsEditing(!isEditing);
                  setFormErrors({});
                }}>
                {isEditing ? "Отмена" : "Изменить"}
              </Button>
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Field
                      label="ФИО"
                      placeholder="Фамилия Имя Отчество"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                    {formErrors.fullName && (
                      <p className="text-xs font-bold text-red-600">
                        {formErrors.fullName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Field
                      label="Email"
                      type="email"
                      placeholder="mail@example.ru"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                    {formErrors.email && (
                      <p className="text-xs font-bold text-red-600">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Field
                      label="Телефон"
                      type="tel"
                      placeholder="+79001234567"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith("+7"))
                          val = "+7" + val.replace(/\D/g, "");
                        setFormData({ ...formData, phoneNumber: val });
                      }}
                    />
                    {formErrors.phoneNumber && (
                      <p className="text-xs font-bold text-red-600">
                        {formErrors.phoneNumber}
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    disabled={isSaving}
                    onClick={handleSaveProfile}>
                    {isSaving ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#72543d]">
                      ФИО
                    </p>
                    <p className="font-bold text-[#24170f]">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#72543d]">
                      Электронная почта
                    </p>
                    <p className="font-bold text-[#24170f]">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#72543d]">
                      Телефон
                    </p>
                    <p className="font-bold text-[#24170f]">
                      {user.phoneNumber || "Не указан"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#72543d]">
                      Дата регистрации
                    </p>
                    <p className="font-bold text-[#24170f]">
                      {format(parseISO(user.registrationDate), "d MMMM yyyy", {
                        locale: ru,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Booking History */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-black text-[#24170f]">
              История бронирований
            </h3>

            {loading ? (
              <Loader label="Загружаем историю..." />
            ) : error ? (
              <EmptyState title="Ошибка" description={error} />
            ) : reservations.length === 0 ? (
              <EmptyState
                title="У вас еще нет бронирований"
                description="Все ваши будущие и прошедшие бронирования будут отображаться здесь."
              />
            ) : (
              <div className="space-y-4">
                {reservations.map((res) => (
                  <Panel
                    key={res.reservationId}
                    className="flex flex-col gap-4 overflow-hidden border-2 border-transparent hover:border-[#efe4d6] transition-colors">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-[#72543d]">
                            #{res.reservationId}
                          </span>
                          {getStatusBadge(res.status)}
                        </div>
                        <h4 className="text-xl font-black text-[#24170f]">
                          {res.bookableObject.name}
                        </h4>
                        <p className="text-sm font-bold text-[#72543d]">
                          Дата:{" "}
                          <span className="text-[#24170f]">
                            {format(
                              parseISO(res.reservationDate),
                              "d MMMM yyyy",
                              { locale: ru },
                            )}
                          </span>
                        </p>
                      </div>
                      <div className="sm:text-right space-y-2 w-full sm:w-auto">
                        <p className="text-2xl font-black text-[#c96f2b]">
                          {formatCurrency(res.totalSum)}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            variant="secondary"
                            className="text-xs font-bold py-1.5"
                            onClick={() =>
                              setExpandedId(
                                expandedId === res.reservationId
                                  ? null
                                  : res.reservationId,
                              )
                            }>
                            {expandedId === res.reservationId
                              ? "Скрыть"
                              : "Детали"}
                          </Button>

                          {res.status === "pending" && (
                            <Button
                              className="text-xs font-bold py-1.5"
                              onClick={() => {
                                dashboardApi
                                  .initiatePayment(res.reservationId)
                                  .then((data) => {
                                    window.location.href = data.confirmationUrl;
                                  })
                                  .catch((err) => {
                                    setToast({
                                      message: err.message || "Ошибка при оплате",
                                      type: "error",
                                    });
                                  });
                              }}>
                              {res.payment ? "Продолжить оплату" : "Оплатить"}
                            </Button>
                          )}

                          {res.status === "pending" &&
                            res.payment?.status === "pending" && (
                              <Button
                                variant="secondary"
                                className="text-xs font-bold py-1.5"
                                onClick={() => {
                                  dashboardApi
                                    .getPaymentStatus(res.payment!.paymentId)
                                    .then((data) => {
                                      setToast({
                                        message: `Статус платежа: ${translatePaymentStatus(data.status)}`,
                                        type: "info",
                                      });
                                      // Обновляем список бронирований, чтобы увидеть актуальный статус
                                      if (user) {
                                        dashboardApi
                                          .listReservations(user.userId)
                                          .then(setReservations);
                                      }
                                    });
                                }}>
                                Обновить статус
                              </Button>
                            )}

                          {res.status === "paid" && canRefund(res) && (
                            <Button
                              variant="danger"
                              className="text-xs font-bold py-1.5"
                              onClick={() => {
                                setCancelModalId(res.reservationId);
                                setModalMode("refund");
                              }}>
                              Возврат средств
                            </Button>
                          )}

                          {res.status === "paid" &&
                            !canRefund(res) &&
                            res.payment?.status === "succeeded" && (
                              <Button
                                variant="ghost"
                                className="text-xs font-bold py-1.5 opacity-60 cursor-not-allowed"
                                disabled>
                                Возврат недоступен
                              </Button>
                            )}

                          {canCancelPending(res) && (
                            <Button
                              variant="danger"
                              className="text-xs font-bold py-1.5"
                              onClick={() => {
                                setCancelModalId(res.reservationId);
                                setModalMode("cancel");
                              }}>
                              Отменить
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedId === res.reservationId && (
                      <div className="mt-4 pt-4 border-t border-[#efe4d6] space-y-4 animate-in slide-in-from-top duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-[#72543d]">
                              Объект:
                            </p>
                            <p className="font-bold text-[#24170f]">
                              {res.bookableObject.name}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-[#72543d]">
                              Цена аренды:
                            </p>
                            <p className="font-bold text-[#c96f2b]">
                              {formatCurrency(res.bookableObject.basePrice)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-[#72543d]">
                              Дата создания:
                            </p>
                            <p className="font-bold text-[#24170f]">
                              {format(
                                parseISO(res.creationDate),
                                "d.MM.yyyy HH:mm",
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {res.payment?.status === "succeeded" ? (
                            <div className="space-y-1">
                              <p className="text-xs font-black uppercase text-[#72543d]">
                                Статус оплаты
                              </p>
                              <p className="font-bold text-[#24170f]">
                                Оплачено
                              </p>
                            </div>
                          ) : res.paymentDeadline ? (
                            <div className="space-y-1">
                              <p className="text-xs font-black uppercase text-[#72543d]">
                                Время на оплату
                              </p>
                              <p className="font-bold text-[#24170f]">
                                {formatDeadline(res.paymentDeadline)}
                              </p>
                            </div>
                          ) : null}
                          <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-[#72543d]">
                              Платеж
                            </p>
                            {res.payment ? (
                              <div className="space-y-1">
                                <p className="font-bold text-[#24170f]">
                                  {translatePaymentStatus(res.payment.status)}
                                </p>
                                <p className="text-[color:var(--ink-soft)]">
                                  Метод:{" "}
                                  {translatePaymentMethod(res.payment.method)}
                                </p>
                                {res.payment.kassaPaymentId ? (
                                  <p className="text-[color:var(--ink-soft)] break-all">
                                    Заказ ЮKassa: {res.payment.kassaPaymentId}
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="font-bold text-[#24170f]">
                                Платеж не создан
                              </p>
                            )}
                          </div>
                        </div>

                        {(res.payment?.receipt ||
                          res.payment?.refund?.receipt) && (
                          <div className="space-y-3">
                            <p className="text-xs font-black uppercase text-[#72543d]">
                              Чеки
                            </p>
                            <div className="space-y-3">
                              {renderReceipt(res.payment?.receipt ?? null)}
                              {renderReceipt(res.payment?.refund?.receipt ?? null)}
                            </div>
                          </div>
                        )}

                        {res.payment?.refund && (
                          <div className="rounded-2xl bg-[#f4f7ff] p-4 border border-[#e3e9ff] text-sm">
                            <p className="text-xs font-black uppercase text-[#72543d]">
                              Возврат
                            </p>
                            <p className="font-bold text-[#24170f]">
                              {translateRefundStatus(res.payment.refund.status)}
                            </p>
                            <p className="text-[color:var(--ink-soft)]">
                              Сумма возврата:{" "}
                              {formatCurrency(res.payment.refund.refundAmount)}
                            </p>
                            {res.payment.refund.kassaRefundId ? (
                              <p className="text-[color:var(--ink-soft)] break-all">
                                ID возврата ЮKassa:{" "}
                                {res.payment.refund.kassaRefundId}
                              </p>
                            ) : null}
                          </div>
                        )}

                        {res.menuItems && res.menuItems.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-black uppercase text-[#72543d]">
                              Заказанное меню:
                            </p>
                            <div className="bg-[#fffaf2] rounded-2xl p-4 space-y-2 border border-[#efe4d6]">
                              {res.menuItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-xs font-bold">
                                  <span className="text-[#3b2a1d]">
                                    {item.menuItem.name} x {item.quantity}
                                  </span>
                                  <span className="text-[#c96f2b]">
                                    {formatCurrency(Number(item.itemCost))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Panel>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalId !== null}
        onClose={() => {
          setCancelModalId(null);
          setModalMode(null);
          setModalReason("Отмена пользователем");
        }}
        title={
          modalMode === "refund" ? "Запрос на возврат" : "Отмена бронирования"
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCancelModalId(null);
                setModalMode(null);
                setModalReason("Отмена пользователем");
              }}
              disabled={isCancelling}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelReservation}
              disabled={isCancelling}>
              {isCancelling
                ? modalMode === "refund"
                  ? "Отправляем..."
                  : "Отменяем..."
                : modalMode === "refund"
                  ? "Запросить возврат"
                  : "Подтвердить отмену"}
            </Button>
          </>
        }>
        {modalMode === "refund" ? (
          <div className="space-y-4">
            <p className="font-medium">
              Вы отправляете запрос на возврат средств по бронированию №
              {cancelModalId}.
            </p>
            <p className="text-sm text-[color:var(--ink-soft)]">
              Возврат будет выполнен на тот же способ оплаты после проверки.
              Обычно зачисление занимает до 5 рабочих дней.
            </p>
            <Field
              label="Причина возврата"
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
              placeholder="Укажите причину возврата (опционально)"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-medium">
              Вы уверены, что хотите отменить бронирование №{cancelModalId}? Это
              действие нельзя будет отменить.
            </p>
            <Field
              label="Причина отмены"
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
              placeholder="Укажите причину отмены (опционально)"
            />
          </div>
        )}
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppShell>
  );
}
