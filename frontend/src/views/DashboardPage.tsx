import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { authApi } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import { dashboardApi } from "@features/dashboard/api";
import { extractErrorMessage } from "@shared/api/http";
import { formatCurrency, formatDate, formatDateTime, prettifyEnum } from "@shared/lib/format";
import {
  AppShell,
  Badge,
  Button,
  EmptyState,
  Field,
  Panel,
  Select,
  StatCard,
  TextArea,
  Title,
} from "@shared/ui/kit";
import type { PaymentStatus } from "@shared/api/types";

function paymentTone(status: string | undefined) {
  if (!status) return "neutral" as const;
  if (["succeeded", "paid", "confirmed"].includes(status)) return "success" as const;
  if (["pending"].includes(status)) return "warning" as const;
  if (["cancelled", "failed", "expired"].includes(status)) return "danger" as const;
  return "neutral" as const;
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { user, clearSession } = useAuthStore();
  const [feedback, setFeedback] = useState("");
  const [paymentStatuses, setPaymentStatuses] = useState<Record<number, PaymentStatus>>({});
  const [formState, setFormState] = useState({
    bookableObjectId: "",
    reservationDate: "",
    guestsCount: "1",
    notes: "",
  });
  const [menuQuantities, setMenuQuantities] = useState<Record<number, string>>({});

  const objectsQuery = useQuery({
    queryKey: ["dashboard", "objects"],
    queryFn: dashboardApi.listObjects,
  });
  const menuQuery = useQuery({
    queryKey: ["dashboard", "menu"],
    queryFn: dashboardApi.listMenuItems,
  });
  const rentalsQuery = useQuery({
    queryKey: ["dashboard", "rentals"],
    queryFn: dashboardApi.listRentalItems,
  });
  const reservationsQuery = useQuery({
    queryKey: ["dashboard", "reservations", user?.userId],
    queryFn: () => dashboardApi.listReservations(user?.userId),
    enabled: Boolean(user?.userId),
  });

  const selectedObject = useMemo(
    () =>
      (objectsQuery.data ?? []).find(
        (item) => item.bookableObjectId === Number(formState.bookableObjectId),
      ) ?? null,
    [formState.bookableObjectId, objectsQuery.data],
  );

  const availableMenuItems = selectedObject?.menuItems ?? [];

  const createReservationMutation = useMutation({
    mutationFn: dashboardApi.createReservation,
    onSuccess: () => {
      setFeedback("Бронирование создано. Теперь его можно оплатить или отменить.");
      setFormState({
        bookableObjectId: "",
        reservationDate: "",
        guestsCount: "1",
        notes: "",
      });
      setMenuQuantities({});
      queryClient.invalidateQueries({ queryKey: ["dashboard", "reservations"] });
    },
    onError: (error) => {
      setFeedback(extractErrorMessage(error));
    },
  });

  const cancelReservationMutation = useMutation({
    mutationFn: ({
      reservationId,
      reason,
    }: {
      reservationId: number;
      reason?: string;
    }) => dashboardApi.cancelReservation(reservationId, reason),
    onSuccess: () => {
      setFeedback("Бронирование отменено.");
      queryClient.invalidateQueries({ queryKey: ["dashboard", "reservations"] });
    },
    onError: (error) => {
      setFeedback(extractErrorMessage(error));
    },
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: dashboardApi.initiatePayment,
    onSuccess: (payload) => {
      setFeedback(`Платёж создан до ${formatDateTime(payload.paymentDeadline)}.`);
      window.open(payload.confirmationUrl, "_blank", "noopener,noreferrer");
      queryClient.invalidateQueries({ queryKey: ["dashboard", "reservations"] });
    },
    onError: (error) => {
      setFeedback(extractErrorMessage(error));
    },
  });

  const checkPaymentMutation = useMutation({
    mutationFn: dashboardApi.getPaymentStatus,
    onSuccess: (payload) => {
      setPaymentStatuses((current) => ({
        ...current,
        [payload.paymentId]: payload,
      }));
      queryClient.invalidateQueries({ queryKey: ["dashboard", "reservations"] });
    },
    onError: (error) => {
      setFeedback(extractErrorMessage(error));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearSession();
    },
  });

  const reservations = reservationsQuery.data ?? [];
  const objects = objectsQuery.data ?? [];
  const menuItems = menuQuery.data ?? [];
  const rentals = rentalsQuery.data ?? [];

  return (
    <AppShell
      actions={
        <>
          <span className="hidden rounded-full bg-white/70 px-4 py-2 text-sm font-semibold md:inline-flex">
            {user?.fullName}
          </span>
          <Button variant="secondary" onClick={() => logoutMutation.mutate()}>
            Выйти
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <Panel>
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <Title
              eyebrow="Личный кабинет"
              heading="Управление реальными данными из backend"
              description="Здесь собраны ключевые пользовательские сценарии: просмотр каталога, создание бронирования, проверка статуса оплаты и работа с профилем текущего пользователя."
            />
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StatCard label="Мои бронирования" value={String(reservations.length)} />
              <StatCard label="Доступных объектов" value={String(objects.length)} />
              <StatCard label="Позиции аренды" value={String(rentals.length)} />
            </div>
          </div>
        </Panel>

        {feedback ? (
          <div className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-5 py-4 text-sm text-[#3b2a1d] shadow-[var(--shadow)]">
            {feedback}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <Panel className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">Создать бронирование</h2>
              <Badge tone="warning">POST /reservations</Badge>
            </div>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!user) {
                  return;
                }

                const menuItemsPayload = Object.entries(menuQuantities)
                  .filter(([, quantity]) => Number(quantity) > 0)
                  .map(([menuItemId, quantity]) => ({
                    menuItemId: Number(menuItemId),
                    quantity: Number(quantity),
                  }));

                createReservationMutation.mutate({
                  userId: user.userId,
                  bookableObjectId: Number(formState.bookableObjectId),
                  reservationDate: formState.reservationDate,
                  guestsCount: Number(formState.guestsCount),
                  notes: formState.notes || undefined,
                  menuItems: menuItemsPayload,
                });
              }}
            >
              <Select
                label="Объект"
                value={formState.bookableObjectId}
                onChange={(event) => {
                  setFormState((current) => ({
                    ...current,
                    bookableObjectId: event.target.value,
                  }));
                  setMenuQuantities({});
                }}
                required
              >
                <option value="">Выберите объект</option>
                {objects.map((item) => (
                  <option key={item.bookableObjectId} value={item.bookableObjectId}>
                    {item.name} · {formatCurrency(item.basePrice)}
                  </option>
                ))}
              </Select>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Дата бронирования"
                  type="date"
                  value={formState.reservationDate}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      reservationDate: event.target.value,
                    }))
                  }
                  required
                />
                <Field
                  label="Количество гостей"
                  type="number"
                  min={1}
                  max={selectedObject?.capacity ?? 20}
                  value={formState.guestsCount}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      guestsCount: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <TextArea
                label="Комментарий"
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Например, пожелания по меню или размещению"
              />

              {selectedObject ? (
                <div className="space-y-3 rounded-[24px] border border-[color:var(--border)] bg-white/65 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">Меню для выбранного объекта</h3>
                    <Badge>{prettifyEnum(selectedObject.type)}</Badge>
                  </div>
                  {availableMenuItems.length > 0 ? (
                    <div className="grid gap-3">
                      {availableMenuItems.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="grid gap-3 rounded-[20px] border border-[color:var(--border)] bg-white/75 p-4 md:grid-cols-[1fr,140px]"
                        >
                          <div>
                            <p className="font-bold">{item.menuItem.name}</p>
                            <p className="text-sm text-[color:var(--ink-soft)]">
                              {item.menuItem.description || "Описание отсутствует"}
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {formatCurrency(item.menuItem.price)}
                            </p>
                          </div>
                          <Field
                            label="Количество"
                            type="number"
                            min={0}
                            value={menuQuantities[item.menuItemId] ?? "0"}
                            onChange={(event) =>
                              setMenuQuantities((current) => ({
                                ...current,
                                [item.menuItemId]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Для объекта нет доступных позиций меню"
                      description="Это нормально: backend разрешает меню только поддерживаемым типам объектов."
                    />
                  )}
                </div>
              ) : null}

              <Button disabled={createReservationMutation.isPending}>
                {createReservationMutation.isPending ? "Создаём..." : "Создать бронирование"}
              </Button>
            </form>
          </Panel>

          <Panel className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">Профиль и каталог</h2>
              <Badge tone="success">GET /users/profile</Badge>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/75 p-5">
              <p className="text-sm text-[color:var(--ink-soft)]">Текущий пользователь</p>
              <h3 className="mt-2 text-xl font-extrabold">{user?.fullName}</h3>
              <div className="mt-3 grid gap-2 text-sm text-[color:var(--ink-soft)]">
                <span>Email: {user?.email}</span>
                <span>Телефон: {user?.phoneNumber || "не указан"}</span>
                <span>Роль: {user?.role}</span>
                <span>Регистрация: {formatDateTime(user?.registrationDate)}</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/75 p-5">
                <h3 className="font-bold">Пункты меню</h3>
                <div className="mt-3 space-y-3">
                  {menuItems.slice(0, 4).map((item) => (
                    <div key={item.menuItemId} className="rounded-2xl bg-[#fff8ee] p-3">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-[color:var(--ink-soft)]">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/75 p-5">
                <h3 className="font-bold">Прокат</h3>
                <div className="mt-3 space-y-3">
                  {rentals.slice(0, 4).map((item) => (
                    <div key={item.rentalItemId} className="rounded-2xl bg-[#fff8ee] p-3">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-[color:var(--ink-soft)]">
                        {item.pricePerHour ? formatCurrency(item.pricePerHour) : prettifyEnum(item.category)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link to="/" className="text-sm font-bold text-[color:var(--accent)]">
              Вернуться на главную витрину
            </Link>
          </Panel>
        </div>

        <Panel className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold">Мои бронирования</h2>
            <Badge tone="warning">GET /reservations</Badge>
          </div>
          {reservations.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {reservations.map((reservation) => {
                const paymentStatus = reservation.payment
                  ? paymentStatuses[reservation.payment.paymentId]
                  : undefined;

                return (
                  <div
                    key={reservation.reservationId}
                    className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{reservation.bookableObject.name}</h3>
                        <p className="text-sm text-[color:var(--ink-soft)]">
                          {formatDate(reservation.reservationDate)} · {reservation.guestsCount} гостей
                        </p>
                      </div>
                      <Badge tone={paymentTone(reservation.status)}>{reservation.status}</Badge>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-[color:var(--ink-soft)]">
                      <span>Сумма: {formatCurrency(reservation.totalSum)}</span>
                      <span>Создано: {formatDateTime(reservation.creationDate)}</span>
                      <span>Тип объекта: {prettifyEnum(reservation.bookableObject.type)}</span>
                      {reservation.notes ? <span>Комментарий: {reservation.notes}</span> : null}
                      {reservation.cancellationReason ? (
                        <span>Причина отмены: {reservation.cancellationReason}</span>
                      ) : null}
                    </div>

                    {reservation.menuItems.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-[#fff8ee] p-4">
                        <p className="text-sm font-bold">Меню в заказе</p>
                        <div className="mt-2 space-y-1 text-sm text-[color:var(--ink-soft)]">
                          {reservation.menuItems.map((item) => (
                            <p key={item.menuItemId}>
                              {item.menuItem.name} × {item.quantity} = {formatCurrency(item.itemCost)}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {reservation.status === "pending" ? (
                        <Button
                          onClick={() => initiatePaymentMutation.mutate(reservation.reservationId)}
                          disabled={initiatePaymentMutation.isPending}
                        >
                          Инициировать оплату
                        </Button>
                      ) : null}

                      {reservation.payment ? (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            checkPaymentMutation.mutate(reservation.payment!.paymentId)
                          }
                          disabled={checkPaymentMutation.isPending}
                        >
                          Проверить платёж
                        </Button>
                      ) : null}

                      {!["cancelled", "paid"].includes(reservation.status) ? (
                        <Button
                          variant="danger"
                          onClick={() => {
                            const reason = window.prompt(
                              "Укажите причину отмены бронирования",
                              "Отмена пользователем",
                            );
                            cancelReservationMutation.mutate({
                              reservationId: reservation.reservationId,
                              reason: reason || undefined,
                            });
                          }}
                          disabled={cancelReservationMutation.isPending}
                        >
                          Отменить
                        </Button>
                      ) : null}
                    </div>

                    {paymentStatus ? (
                      <div className="mt-4 rounded-2xl bg-[#f5efe3] p-4 text-sm">
                        <p className="font-bold">Последняя проверка платежа</p>
                        <div className="mt-2 grid gap-1 text-[color:var(--ink-soft)]">
                          <span>Статус: {paymentStatus.status}</span>
                          <span>Сумма: {formatCurrency(paymentStatus.amount)}</span>
                          <span>Статус бронирования: {paymentStatus.reservation.status}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Бронирований пока нет"
              description="Создайте первое бронирование через форму выше, и оно сразу появится в списке."
            />
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
