import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppShell, Title, Panel, Badge, Loader, EmptyState, Button, Field, Modal, Toast } from "@shared/ui/kit";
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

  // Notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [cancelModalId, setCancelModalId] = useState<number | null>(null);
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
      setToast({ message: "Профиль успешно обновлен", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Ошибка при сохранении профиля", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelModalId) return;
    setIsCancelling(true);
    try {
      await dashboardApi.cancelReservation(cancelModalId, "Отменено пользователем");
      const updated = await dashboardApi.listReservations(user?.userId);
      setReservations(updated);
      setToast({ message: "Бронирование успешно отменено", type: "success" });
      setCancelModalId(null);
    } catch (err: any) {
      setToast({ message: err.message || "Ошибка при отмене", type: "error" });
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancel = (res: Reservation) => {
    if (res.status === "cancelled") return false;
    const resDate = parseISO(res.reservationDate);
    const deadline = addHours(startOfToday(), 10);
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
              <h3 className="text-xl font-bold text-[#24170f]">Ваши данные</h3>
              <Button 
                variant="ghost" 
                className="text-xs font-bold" 
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
                    {formErrors.fullName && <p className="text-xs font-bold text-red-600">{formErrors.fullName}</p>}
                  </div>
                  <div className="space-y-1">
                    <Field 
                      label="Email" 
                      type="email" 
                      placeholder="mail@example.ru"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                    {formErrors.email && <p className="text-xs font-bold text-red-600">{formErrors.email}</p>}
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
                    {formErrors.phoneNumber && <p className="text-xs font-bold text-red-600">{formErrors.phoneNumber}</p>}
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
                    <p className="text-xs font-black uppercase tracking-wider text-[#72543d]">ФИО</p>
                    <p className="font-bold text-[#24170f]">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#72543d]">Электронная почта</p>
                    <p className="font-bold text-[#24170f]">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#72543d]">Телефон</p>
                    <p className="font-bold text-[#24170f]">{user.phoneNumber || "Не указан"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#72543d]">Дата регистрации</p>
                    <p className="font-bold text-[#24170f]">{format(parseISO(user.registrationDate), "d MMMM yyyy", { locale: ru })}</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Booking History */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-black text-[#24170f]">История бронирований</h3>
            
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
                  <Panel key={res.reservationId} className="flex flex-col gap-4 overflow-hidden border-2 border-transparent hover:border-[#efe4d6] transition-colors">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-[#72543d]">#{res.reservationId}</span>
                          {getStatusBadge(res.status)}
                        </div>
                        <h4 className="text-xl font-black text-[#24170f]">{res.bookableObject.name}</h4>
                        <p className="text-sm font-bold text-[#72543d]">
                          Дата: <span className="text-[#24170f]">{format(parseISO(res.reservationDate), "d MMMM yyyy", { locale: ru })}</span>
                        </p>
                      </div>
                      <div className="sm:text-right space-y-2 w-full sm:w-auto">
                        <p className="text-2xl font-black text-[#c96f2b]">{formatCurrency(res.totalSum)}</p>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button 
                            variant="secondary" 
                            className="text-xs font-bold py-1.5" 
                            onClick={() => setExpandedId(expandedId === res.reservationId ? null : res.reservationId)}
                          >
                            {expandedId === res.reservationId ? "Скрыть" : "Детали"}
                          </Button>
                          {res.status === "pending" && (
                            <Button 
                              className="text-xs font-bold py-1.5" 
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
                              className="text-xs font-bold py-1.5" 
                              onClick={() => setCancelModalId(res.reservationId)}
                            >
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
                            <p className="text-xs font-black uppercase text-[#72543d]">Объект:</p>
                            <p className="font-bold text-[#24170f]">{res.bookableObject.name}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-[#72543d]">Цена аренды:</p>
                            <p className="font-bold text-[#c96f2b]">{formatCurrency(res.bookableObject.basePrice)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-[#72543d]">Дата создания:</p>
                            <p className="font-bold text-[#24170f]">{format(parseISO(res.creationDate), "d.MM.yyyy HH:mm")}</p>
                          </div>
                        </div>
                        
                        {res.menuItems && res.menuItems.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-black uppercase text-[#72543d]">Заказанное меню:</p>
                            <div className="bg-[#fffaf2] rounded-2xl p-4 space-y-2 border border-[#efe4d6]">
                              {res.menuItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs font-bold">
                                  <span className="text-[#3b2a1d]">{item.menuItem.name} x {item.quantity}</span>
                                  <span className="text-[#c96f2b]">{formatCurrency(Number(item.itemCost) * item.quantity)}</span>
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
        onClose={() => setCancelModalId(null)}
        title="Отмена бронирования"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelModalId(null)} disabled={isCancelling}>
              Назад
            </Button>
            <Button variant="danger" onClick={handleCancelReservation} disabled={isCancelling}>
              {isCancelling ? "Отменяем..." : "Подтвердить отмену"}
            </Button>
          </>
        }
      >
        <p className="font-medium">Вы уверены, что хотите отменить бронирование №{cancelModalId}? Это действие нельзя будет отменить.</p>
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
