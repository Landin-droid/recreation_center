import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AppShell,
  Title,
  Panel,
  Button,
  Loader,
  EmptyState,
  Badge,
  Field,
  Select,
  TextArea,
  Modal,
  Toast,
} from "@shared/ui/kit";
import { adminApi } from "@features/admin/api";
import { formatCurrency, formatDate, formatDateTime, prettifyEnum } from "@shared/lib/format";
import { useAuthStore } from "@features/auth/model/auth-store";
import { Navigate } from "react-router-dom";
import clsx from "clsx";

type AdminTab = "dashboard" | "users" | "objects" | "menu" | "rentals" | "reservations";

export function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  if (!user || !["admin", "staff"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64">
          <Panel className="sticky top-24 space-y-1 !p-2">
            <SidebarItem
              label="Дашборд"
              icon="📊"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <SidebarItem
              label="Пользователи"
              icon="👥"
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
            />
            <SidebarItem
              label="Объекты"
              icon="🏡"
              active={activeTab === "objects"}
              onClick={() => setActiveTab("objects")}
            />
            <SidebarItem
              label="Меню"
              icon="🍽️"
              active={activeTab === "menu"}
              onClick={() => setActiveTab("menu")}
            />
            <SidebarItem
              label="Прокат"
              icon="🎿"
              active={activeTab === "rentals"}
              onClick={() => setActiveTab("rentals")}
            />
            <SidebarItem
              label="Бронирования"
              icon="📅"
              active={activeTab === "reservations"}
              onClick={() => setActiveTab("reservations")}
            />
          </Panel>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {activeTab === "dashboard" && <AdminDashboard />}
          {activeTab === "users" && <AdminUsers setToast={setToast} />}
          {activeTab === "objects" && <AdminObjects setToast={setToast} />}
          {activeTab === "menu" && <AdminMenu setToast={setToast} />}
          {activeTab === "rentals" && <AdminRentals setToast={setToast} />}
          {activeTab === "reservations" && <AdminReservations setToast={setToast} />}
        </main>
      </div>

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

function SidebarItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition",
        active
          ? "bg-[color:var(--accent)] text-white shadow-lg shadow-orange-200"
          : "text-[color:var(--ink-soft)] hover:bg-white/70",
      )}>
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

// --- Dashboard ---

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.getStats,
  });

  if (isLoading) return <Loader label="Загрузка статистики..." />;
  if (!stats) return <EmptyState title="Ошибка" description="Не удалось загрузить данные" />;

  return (
    <div className="space-y-6">
      <Title heading="Панель управления" description="Обзор основных показателей системы" />
      
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Всего бронирований" value={stats.totalReservations} icon="📅" />
        <StatCard label="Пользователей" value={stats.totalUsers} icon="👥" />
        <StatCard label="Общая выручка" value={formatCurrency(stats.totalRevenue)} icon="💰" />
      </div>

      <Panel className="space-y-4">
        <h3 className="text-lg font-bold">Последние бронирования</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[color:var(--ink-soft)]">
                <th className="pb-3 font-bold">ID</th>
                <th className="pb-3 font-bold">Клиент</th>
                <th className="pb-3 font-bold">Объект</th>
                <th className="pb-3 font-bold">Дата</th>
                <th className="pb-3 font-bold">Сумма</th>
                <th className="pb-3 font-bold">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.recentReservations.map((res) => (
                <tr key={res.reservationId}>
                  <td className="py-3 font-medium">#{res.reservationId}</td>
                  <td className="py-3">{res.user.fullName}</td>
                  <td className="py-3">{res.bookableObject.name}</td>
                  <td className="py-3">{formatDate(res.reservationDate)}</td>
                  <td className="py-3 font-bold">{formatCurrency(res.totalSum)}</td>
                  <td className="py-3">
                    <Badge tone={res.status === "paid" ? "success" : res.status === "pending" ? "warning" : "danger"}>
                      {prettifyEnum(res.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <Panel className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-soft)]">
          {label}
        </p>
        <p className="text-xl font-black text-[#24170f]">{value}</p>
      </div>
    </Panel>
  );
}

// --- Users ---

function AdminUsers({ setToast }: { setToast: (t: any) => void }) {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.listUsers,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { userId: number; role: string }) =>
      adminApi.updateUser(data.userId, { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditingUser(null);
      setToast({ message: "Роль обновлена", type: "success" });
    },
    onError: () => setToast({ message: "Ошибка при обновлении", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setToast({ message: "Пользователь удален", type: "success" });
    },
    onError: () => setToast({ message: "Ошибка при удалении", type: "error" }),
  });

  if (isLoading) return <Loader label="Загрузка пользователей..." />;

  return (
    <div className="space-y-6">
      <Title heading="Пользователи" description="Управление аккаунтами клиентов и персонала" />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[color:var(--ink-soft)]">
                <th className="pb-3 font-bold">ID</th>
                <th className="pb-3 font-bold">Имя</th>
                <th className="pb-3 font-bold">Email</th>
                <th className="pb-3 font-bold">Роль</th>
                <th className="pb-3 font-bold">Регистрация</th>
                <th className="pb-3 font-bold text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users?.map((u) => (
                <tr key={u.userId}>
                  <td className="py-3">#{u.userId}</td>
                  <td className="py-3 font-medium">{u.fullName}</td>
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">
                    {editingUser?.userId === u.userId ? (
                      <select
                        defaultValue={u.role}
                        onChange={(e) => updateMutation.mutate({ userId: u.userId, role: e.target.value })}
                        className="rounded border p-1 text-xs"
                      >
                        <option value="user">Пользователь</option>
                        <option value="staff">Персонал</option>
                        <option value="admin">Администратор</option>
                      </select>
                    ) : (
                      <Badge tone={u.role === "admin" ? "danger" : u.role === "staff" ? "warning" : "neutral"}>
                        {prettifyEnum(u.role)}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3">{formatDate(u.registrationDate)}</td>
                  <td className="py-3 text-right space-x-2">
                    <Button
                      variant="ghost"
                      className="text-blue-500 hover:bg-blue-50"
                      onClick={() => setEditingUser(editingUser?.userId === u.userId ? null : u)}
                    >
                      {editingUser?.userId === u.userId ? "💾" : "✏️"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Удалить пользователя?")) deleteMutation.mutate(u.userId);
                      }}
                    >
                      🗑️
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// --- Objects ---

function AdminObjects({ setToast }: { setToast: (t: any) => void }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<any>(null);

  const { data: objects, isLoading } = useQuery({
    queryKey: ["admin", "objects"],
    queryFn: adminApi.listObjects,
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => 
      editingObject 
        ? adminApi.updateObject(editingObject.bookableObjectId, data)
        : adminApi.createObject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "objects"] });
      setIsModalOpen(false);
      setEditingObject(null);
      setToast({ message: "Объект сохранен", type: "success" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteObject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "objects"] });
      setToast({ message: "Объект удален", type: "success" });
    },
  });

  if (isLoading) return <Loader label="Загрузка объектов..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title heading="Объекты" description="Управление домиками и площадками" />
        <Button onClick={() => { setEditingObject(null); setIsModalOpen(true); }}>
          Добавить объект
        </Button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {objects?.map((obj) => (
          <Panel key={obj.bookableObjectId} className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold">{obj.name}</h4>
                <p className="text-xs text-[color:var(--ink-soft)]">{prettifyEnum(obj.type)}</p>
              </div>
              <Badge tone={obj.isActive ? "success" : "neutral"}>
                {obj.isActive ? "Активен" : "Скрыт"}
              </Badge>
            </div>
            <p className="text-sm line-clamp-2 text-[color:var(--ink-soft)]">{obj.description}</p>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="font-bold text-orange-600">{formatCurrency(obj.basePrice)}</span>
              <div className="flex gap-2">
                <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => { setEditingObject(obj); setIsModalOpen(true); }}>
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(`Удалить объект "${obj.name}"?`)) deleteMutation.mutate(obj.bookableObjectId);
                  }}
                >
                  🗑️
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingObject ? "Редактировать объект" : "Новый объект"}
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const data = {
            name: fd.get("name"),
            type: fd.get("type"),
            basePrice: Number(fd.get("basePrice")),
            capacity: Number(fd.get("capacity")),
            description: fd.get("description"),
            isActive: fd.get("isActive") === "on",
          };
          upsertMutation.mutate(data);
        }}>
          <Field label="Название" name="name" defaultValue={editingObject?.name} required />
          <Select label="Тип" name="type" defaultValue={editingObject?.type}>
            <option value="cottage">Домик</option>
            <option value="gazebo">Беседка</option>
            <option value="banquet_hall">Банкетный зал</option>
            <option value="karaoke_bar">Караоке-бар</option>
            <option value="outdoor_venue">Открытая площадка</option>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Цена" name="basePrice" type="number" defaultValue={editingObject?.basePrice} required />
            <Field label="Вместимость" name="capacity" type="number" defaultValue={editingObject?.capacity} required />
          </div>
          <TextArea label="Описание" name="description" defaultValue={editingObject?.description} />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="isActive" defaultChecked={editingObject?.isActive ?? true} />
            Активен
          </label>
          <Button className="w-full" type="submit" disabled={upsertMutation.isPending}>
            Сохранить
          </Button>
        </form>
      </Modal>
    </div>
  );
}

// --- Menu ---

function AdminMenu({ setToast }: { setToast: (t: any) => void }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: menu, isLoading } = useQuery({
    queryKey: ["admin", "menu"],
    queryFn: adminApi.listMenuItems,
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => 
      editingItem 
        ? adminApi.updateMenuItem(editingItem.menuItemId, data)
        : adminApi.createMenuItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu"] });
      setIsModalOpen(false);
      setEditingItem(null);
      setToast({ message: "Блюдо сохранено", type: "success" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu"] });
      setToast({ message: "Блюдо удалено", type: "success" });
    },
  });

  if (isLoading) return <Loader label="Загрузка меню..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title heading="Меню" description="Управление блюдами и напитками" />
        <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
          Добавить блюдо
        </Button>
      </div>

      <Panel>
        <div className="grid gap-4">
          {menu?.map((item) => (
            <div key={item.menuItemId} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                )}
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-[color:var(--ink-soft)]">{prettifyEnum(item.category)} • {formatCurrency(item.price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={item.isAvailable ? "success" : "neutral"}>
                  {item.isAvailable ? "В наличии" : "Нет"}
                </Badge>
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>✏️</Button>
                <Button variant="ghost" className="px-2 py-1 text-xs text-red-500 cursor-pointer" onClick={() => {
                  if (confirm(`Удалить "${item.name}"?`)) deleteMutation.mutate(item.menuItemId);
                }}>🗑️</Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Редактировать блюдо" : "Новое блюдо"}
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          upsertMutation.mutate({
            name: fd.get("name"),
            category: fd.get("category"),
            price: Number(fd.get("price")),
            isAvailable: fd.get("isAvailable") === "on",
            description: fd.get("description"),
            imageUrl: fd.get("imageUrl") || null,
          });
        }}>
          <Field label="Название" name="name" defaultValue={editingItem?.name} required />
          <Select label="Категория" name="category" defaultValue={editingItem?.category}>
            <option value="snack">Закуски</option>
            <option value="food">Еда</option>
            <option value="drink">Напитки</option>
            <option value="dessert">Десерты</option>
          </Select>
          <Field label="Цена" name="price" type="number" defaultValue={editingItem?.price} required />
          <Field label="URL изображения" name="imageUrl" defaultValue={editingItem?.imageUrl} />
          <TextArea label="Описание" name="description" defaultValue={editingItem?.description} />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="isAvailable" defaultChecked={editingItem?.isAvailable ?? true} />
            В наличии
          </label>
          <Button className="w-full" type="submit" disabled={upsertMutation.isPending}>Сохранить</Button>
        </form>
      </Modal>
    </div>
  );
}

// --- Rentals ---

function AdminRentals({ setToast }: { setToast: (t: any) => void }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: rentals, isLoading } = useQuery({
    queryKey: ["admin", "rentals"],
    queryFn: adminApi.listRentalItems,
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => 
      editingItem 
        ? adminApi.updateRentalItem(editingItem.rentalItemId, data)
        : adminApi.createRentalItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rentals"] });
      setIsModalOpen(false);
      setEditingItem(null);
      setToast({ message: "Предмет сохранен", type: "success" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteRentalItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rentals"] });
      setToast({ message: "Предмет удален", type: "success" });
    },
  });

  if (isLoading) return <Loader label="Загрузка проката..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title heading="Прокат" description="Управление инвентарем" />
        <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
          Добавить предмет
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rentals?.map((item) => (
          <Panel key={item.rentalItemId} className="flex justify-between items-center">
             <div className="flex items-center gap-4">
                {item.imageUrl && <img src={item.imageUrl} className="h-10 w-10 rounded object-cover" />}
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-[color:var(--ink-soft)]">{prettifyEnum(item.category)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={item.isActive ? "success" : "neutral"}>
                  {item.isActive ? "Активен" : "Скрыт"}
                </Badge>
                <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>✏️</Button>
                <Button variant="ghost" className="px-2 py-1 text-xs text-red-500 cursor-pointer" onClick={() => {
                  if (confirm(`Удалить "${item.name}"?`)) deleteMutation.mutate(item.rentalItemId);
                }}>🗑️</Button>
              </div>
          </Panel>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Редактировать предмет" : "Новый предмет"}
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          upsertMutation.mutate({
            name: fd.get("name"),
            category: fd.get("category"),
            pricePerHour: Number(fd.get("pricePerHour")),
            isActive: fd.get("isActive") === "on",
            description: fd.get("description"),
            imageUrl: fd.get("imageUrl") || null,
          });
        }}>
          <Field label="Название" name="name" defaultValue={editingItem?.name} required />
          <Select label="Категория" name="category" defaultValue={editingItem?.category}>
            <option value="ski">Лыжи</option>
            <option value="tube">Тюбинг</option>
            <option value="snowmobile">Снегоходы</option>
            <option value="skates">Коньки</option>
          </Select>
          <Field label="Цена в час" name="pricePerHour" type="number" defaultValue={editingItem?.pricePerHour} required />
          <Field label="URL изображения" name="imageUrl" defaultValue={editingItem?.imageUrl} />
          <TextArea label="Описание" name="description" defaultValue={editingItem?.description} />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="isActive" defaultChecked={editingItem?.isActive ?? true} />
            Активен
          </label>
          <Button className="w-full" type="submit" disabled={upsertMutation.isPending}>Сохранить</Button>
        </form>
      </Modal>
    </div>
  );
}

// --- Reservations ---

function AdminReservations({ setToast }: { setToast: (t: any) => void }) {
  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin", "reservations"],
    queryFn: adminApi.listReservations,
  });

  if (isLoading) return <Loader label="Загрузка бронирований..." />;

  return (
    <div className="space-y-6">
      <Title heading="Бронирования" description="Список всех заказов в системе" />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[color:var(--ink-soft)]">
                <th className="pb-3 font-bold">ID</th>
                <th className="pb-3 font-bold">Клиент</th>
                <th className="pb-3 font-bold">Объект</th>
                <th className="pb-3 font-bold">Дата</th>
                <th className="pb-3 font-bold">Статус</th>
                <th className="pb-3 font-bold">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reservations?.map((res) => (
                <tr key={res.reservationId}>
                  <td className="py-3">#{res.reservationId}</td>
                  <td className="py-3">
                    <p className="font-medium">{res.user.fullName}</p>
                    <p className="text-xs text-[color:var(--ink-soft)]">{res.user.email}</p>
                  </td>
                  <td className="py-3">{res.bookableObject.name}</td>
                  <td className="py-3">{formatDate(res.reservationDate)}</td>
                  <td className="py-3">
                    <Badge tone={res.status === "paid" ? "success" : res.status === "pending" ? "warning" : "danger"}>
                      {prettifyEnum(res.status)}
                    </Badge>
                  </td>
                  <td className="py-3 font-bold">{formatCurrency(res.totalSum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
