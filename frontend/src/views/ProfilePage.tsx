import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppShell, Title, Panel, Badge, Loader, EmptyState, Button, Field } from "@shared/ui/kit";
import { dashboardApi } from "@features/dashboard/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import type { Reservation, User } from "@shared/api/types";
import { formatCurrency } from "@shared/lib/format";
import { format, parseISO, isAfter, addHours, startOfToday } from "date-fns";
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
    if (!formData.fullName.trim() || formData.fullName.trim().split(" ").length < 2) {
      newErrors.fullName = "Введите Фамилию Имя Отчество (при наличии)";
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
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
    } catch (err: any) {
      alert(err.message || "Ошибка при сохранении профиля");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите отменить бронирование?")) return;
    try {
      await dashboardApi.cancelReservation(id, "Отменено пользователем");
      const updated = await dashboardApi.listReservations(user?.userId);
      setReservations(updated);
    } catch (err: any) {
      alert(err.message || "Ошибка при отмене");
    }
  };

  const canCancel = (res: Reservation) => {
    if (res.status === "cancelled") return false;
    const resDate = parseISO(res.reservationDate);
    const deadline = addHours(startOfToday(), 10);
    // Нельзя отменить, если дата бронирования равна сегодня + 10 часов
    return !isAfter(deadline, resDate);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge tone="success">Подтверждено</Badge>;
      case "paid": return <Badge tone="success">Оплачено</Badge>;
      case "pending": return <Badge tone="warning">Ожидает оплаты</Badge>;
      case "cancelled": return <Badge tone="danger">Отменено</Badge>;
      case "expired": return <Badge tone="danger">Истекло время действия</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <div className="space-y-12">
        <Title
          eyebrow="Личный кабинет"
          heading={`Добро пожаловать, ${user.fullName.split(' ')[1]}`}
          description="Здесь вы можете управлять своими данными и просматривать историю бронирований."
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* User Info */}
          <Panel className="lg:col-span-1 h-fit space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Ваши данные</h3>
              <Button 
                variant="ghost" 
                className="text-xs" 
                onClick={() => {
                  setIsEditing(!isEditing);
                  setFormErrors({});
                }}
              >
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
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                    />
                    {formErrors.fullName && <p className="text-xs text-red-500">{formErrors.fullName}</p>}
                  </div>
                  <div className="space-y-1">
                    <Field 
                      label="Email" 
                      type="email" 
                      placeholder="mail@example.ru"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                    {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-1">
                    <Field 
                      label="Телефон" 
                      type="tel" 
                      placeholder="+79001234567"
                      value={formData.phoneNumber} 
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith("+7")) val = "+7" + val.replace(/\D/g, "");
                        setFormData({...formData, phoneNumber: val});
                      }} 
                    />
                    {formErrors.phoneNumber && <p className="text-xs text-red-500">{formErrors.phoneNumber}</p>}
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={isSaving} 
                    onClick={handleSaveProfile}
                  >
                    {isSaving ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-soft)]">ФИО</p>
                    <p className="font-medium">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-soft)]">Электронная почта</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-soft)]">Телефон</p>
                    <p className="font-medium">{user.phoneNumber || "Не указан"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-soft)]">Дата регистрации</p>
                    <p className="font-medium">{format(parseISO(user.registrationDate), "d MMMM yyyy", { locale: ru })}</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Booking History */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold">История бронирований</h3>
            
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
                  <Panel key={res.reservationId} className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[color:var(--ink-soft)]">#{res.reservationId}</span>
                          {getStatusBadge(res.status)}
                        </div>
                        <h4 className="text-lg font-bold">{res.bookableObject.name}</h4>
                        <p className="text-sm text-[color:var(--ink-soft)]">
                          Дата: <span className="text-black font-medium">{format(parseISO(res.reservationDate), "d MMMM yyyy", { locale: ru })}</span>
                        </p>
                      </div>
                      <div className="sm:text-right space-y-2 w-full sm:w-auto">
                        <p className="text-xl font-bold text-[#c96f2b]">{formatCurrency(res.totalSum)}</p>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button 
                            variant="secondary" 
                            className="text-xs py-1" 
                            onClick={() => setExpandedId(expandedId === res.reservationId ? null : res.reservationId)}
                          >
                            {expandedId === res.reservationId ? "Скрыть" : "Детали"}
                          </Button>
                          {res.status === "pending" && (
                            <Button 
                              className="text-xs py-1" 
                              onClick={() => {
                                dashboardApi.initiatePayment(res.reservationId).then(data => {
                                  window.location.href = data.confirmationUrl;
                                });
                              }}
                            >
                              Оплатить
                            </Button>
                          )}
                          {canCancel(res) && (
                            <Button 
                              variant="danger" 
                              className="text-xs py-1" 
                              onClick={() => handleCancelReservation(res.reservationId)}
                            >
                              Отменить
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {expandedId === res.reservationId && (
                      <div className="mt-4 pt-4 border-t space-y-3 animate-in slide-in-from-top duration-300">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Объект:</p>
                            <p className="font-medium">{res.bookableObject.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Дата создания:</p>
                            <p className="font-medium">{format(parseISO(res.creationDate), "d.MM.yyyy HH:mm")}</p>
                          </div>
                        </div>
                        
                        {res.menuItems && res.menuItems.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">Меню:</p>
                            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                              {res.menuItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span>{item.menuItem.name} x {item.quantity}</span>
                                  <span>{formatCurrency(Number(item.itemCost))}</span>
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
    </AppShell>
  );
}
