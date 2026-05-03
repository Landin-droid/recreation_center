import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppShell, Title, Panel, Badge, Loader, EmptyState, Button, Field } from "@shared/ui/kit";
import { dashboardApi } from "@features/dashboard/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import type { Reservation, User } from "@shared/api/types";
import { formatCurrency } from "@shared/lib/format";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      dashboardApi
        .listReservations(user.userId)
        .then(setReservations)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge tone="success">Подтверждено</Badge>;
      case "pending": return <Badge tone="warning">Ожидает оплаты</Badge>;
      case "cancelled": return <Badge tone="danger">Отменено</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <div className="space-y-12">
        <Title
          eyebrow="Личный кабинет"
          heading={`Добро пожаловать, ${user.fullName.split(' ')[0]}`}
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
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Отмена" : "Изменить"}
              </Button>
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <Field 
                    label="ФИО" 
                    value={formData.fullName} 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                  />
                  <Field 
                    label="Email" 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                  <Field 
                    label="Телефон" 
                    type="tel" 
                    value={formData.phoneNumber} 
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} 
                  />
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
                  <Panel key={res.reservationId} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[color:var(--ink-soft)]">#{res.reservationId}</span>
                        {getStatusBadge(res.status)}
                      </div>
                      <h4 className="text-lg font-bold">{res.bookableObject.name}</h4>
                      <p className="text-sm text-[color:var(--ink-soft)]">
                        Дата: <span className="text-black font-medium">{format(parseISO(res.reservationDate), "d MMMM yyyy", { locale: ru })}</span>
                      </p>
                      <p className="text-xs text-[color:var(--ink-soft)]">
                        Создано: {format(parseISO(res.creationDate), "d.MM.yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="sm:text-right space-y-2">
                      <p className="text-xl font-bold text-[#c96f2b]">{formatCurrency(res.totalSum)}</p>
                      {res.status === "pending" && (
                        <Button 
                          className="w-full sm:w-auto text-xs py-2" 
                          onClick={() => {
                            dashboardApi.initiatePayment(res.reservationId).then(data => {
                              window.location.href = data.confirmationUrl;
                            });
                          }}
                        >
                          Оплатить
                        </Button>
                      )}
                    </div>
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
