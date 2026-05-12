import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AppShell,
  Title,
  Panel,
  Badge,
  Loader,
  EmptyState,
  Button,
  Select,
  Field,
} from "@shared/ui/kit";
import { ImageCarousel } from "@shared/ui/ImageCarousel";
import { dashboardApi } from "@features/dashboard/api";
import type { BookableObject, Reservation } from "@shared/api/types";
import { formatCurrency } from "@shared/lib/format";
import { useLockBodyScroll } from "@shared/lib/useLockBodyScroll";
import { getObjectTypeName, getPersonString } from "@shared/lib/utils";
import { format, isSameDay, parseISO, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuthStore } from "@features/auth/model/auth-store";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

export function BookingPage() {
  const { data: objects = [], isLoading, error } = useQuery({
    queryKey: ["bookable-objects"],
    queryFn: () => dashboardApi.listObjects(),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations"],
    queryFn: () => dashboardApi.listReservations(),
  });

  // Filtering and Sorting state
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Booking Modal state
  const [selectedObject, setSelectedObject] = useState<BookableObject | null>(
    null,
  );
  const [busyDates, setBusyDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [isBooking, setIsBooking] = useState(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  useLockBodyScroll(!!selectedObject);

  useEffect(() => {
    if (!selectedObject) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedObject(null);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedObject]);

  const filteredAndSortedObjects = useMemo(() => {
    let result = [...objects];

    if (typeFilter !== "ALL") {
      result = result.filter(
        (obj) => obj.type.toLowerCase() === typeFilter.toLowerCase(),
      );
    }

    result.sort((a, b) => {
      if (sortOrder === "asc") return Number(a.basePrice) - Number(b.basePrice);
      return Number(b.basePrice) - Number(a.basePrice);
    });

    return result;
  }, [objects, typeFilter, sortOrder]);

  const handleOpenBooking = async (obj: BookableObject) => {
    setSelectedObject(obj);
    setSelectedDate("");
    setGuestsCount(1);
    setSelectedMenuItems([]);

    // Filter reservations for this object that still block the date
    const busy = reservations
      .filter(
        (r) =>
          r.bookableObject.bookableObjectId === obj.bookableObjectId &&
          !["canceled", "expired", "refunded"].includes(r.status),
      )
      .map((r) => parseISO(r.reservationDate));
    setBusyDates(busy);
  };

  const handleCreateReservation = async () => {
    if (!user || !selectedObject || !selectedDate) return;

    setIsBooking(true);
    try {
      await dashboardApi.createReservation({
        userId: user.userId,
        bookableObjectId: selectedObject.bookableObjectId,
        reservationDate: selectedDate,
        guestsCount: guestsCount,
        menuItems: selectedMenuItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });

      // Navigate to profile or payment
      navigate("/profile");
    } catch (err: any) {
      alert(err.message || "Ошибка при бронировании");
    } finally {
      setIsBooking(false);
    }
  };

  const isDateBusy = (dateStr: string) => {
    if (!dateStr) return false;
    const date = parseISO(dateStr);
    return (
      busyDates.some((busyDate) => isSameDay(busyDate, date)) ||
      isBefore(date, startOfDay(new Date()))
    );
  };

  const [selectedMenuItems, setSelectedMenuItems] = useState<
    Array<{ menuItemId: number; name: string; price: number; quantity: number }>
  >([]);
  const [activeTab, setActiveTab] = useState<"details" | "menu">("details");

  const toggleMenuItem = (item: any) => {
    setSelectedMenuItems((prev) => {
      const existing = prev.find(
        (i) => i.menuItemId === item.menuItem.menuItemId,
      );
      if (existing) {
        return prev.filter((i) => i.menuItemId !== item.menuItem.menuItemId);
      }
      return [
        ...prev,
        {
          menuItemId: item.menuItem.menuItemId,
          name: item.menuItem.name,
          price: Number(item.menuItem.price),
          quantity: 1,
        },
      ];
    });
  };

  const updateMenuItemQuantity = (itemId: number, delta: number) => {
    setSelectedMenuItems((prev) =>
      prev.map((item) => {
        if (item.menuItemId === itemId) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      }),
    );
  };

  const totalMenuPrice = selectedMenuItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const renderAmenities = (obj: BookableObject) => {
    const type = obj.type.toUpperCase();
    const amenitiesStr = (obj as any).details?.amenities || "";

    if (type === "COTTAGE") {
      const cottageAmenities = [
        { name: "Холодильник", key: "холодильник", icon: "🗄️" },
        { name: "Микроволновка", key: "микроволновка", icon: "♨️" },
        { name: "Чайник", key: "чайник", icon: "☕" },
        { name: "Водоснабжение", key: "водоснабжение", icon: "💧" },
        { name: "Электричество", key: "электричество", icon: "⚡" },
        { name: "Санузел", key: "санузел", icon: "🚽" },
      ];

      return (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          {cottageAmenities.map((am) => (
            <div
              key={am.key}
              className="flex items-center gap-2 text-sm sm:text-base">
              <span>{am.icon}</span>
              <span className="flex-1">{am.name}</span>
              <span>
                {amenitiesStr.toLowerCase().includes(am.key) ? "✅" : "❌"}
              </span>
            </div>
          ))}
          <div className="mt-1 text-sm font-medium sm:col-span-2 sm:mt-2 sm:text-base">
            Площадь: {(obj as any).details?.squareMeters || 0} м²
          </div>
        </div>
      );
    }

    if (type === "GAZEBO") {
      const gazeboAmenities = [
        { name: "Мангал", key: "мангал", icon: "🍖" },
        { name: "Электричество", key: "электричество", icon: "⚡" },
      ];

      return (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          {gazeboAmenities.map((am) => (
            <div
              key={am.key}
              className="flex items-center gap-2 text-sm sm:text-base">
              <span>{am.icon}</span>
              <span className="flex-1">{am.name}</span>
              <span>
                {amenitiesStr.toLowerCase().includes(am.key) ? "✅" : "❌"}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (type === "BANQUET_HALL" || type === "KARAOKE_BAR") {
      return (
        <div className="mt-3 text-sm font-medium sm:text-base">
          Количество столов:{" "}
          {(obj as any).details?.maxTables ||
            (obj as any).details?.tablesAmount ||
            0}
        </div>
      );
    }

    return null;
  };

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-10">
        <Title
          eyebrow="Бронирование"
          heading="Выберите идеальное место"
          description="От уютных беседок до просторных банкетных залов — у нас есть всё для вашего мероприятия."
        />

        {/* Filters and Sorting */}
        <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
          <Select
            label="Тип объекта"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full lg:w-64">
            <option value="ALL">Все типы</option>
            <option value="COTTAGE">Домики</option>
            <option value="BANQUET_HALL">Банкетные залы</option>
            <option value="GAZEBO">Беседки</option>
            <option value="KARAOKE_BAR">Караоке-бар</option>
            <option value="OUTDOOR_VENUE">Открытые площадки</option>
          </Select>

          <Select
            label="Сортировка по цене"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="w-full lg:w-64">
            <option value="asc">Сначала дешевле</option>
            <option value="desc">Сначала дороже</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader label="Загружаем объекты..." />
          </div>
        ) : error ? (
          <EmptyState
            title="Ошибка"
            description="Не удалось загрузить объекты. Пожалуйста, попробуйте позже."
          />
        ) : filteredAndSortedObjects.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            description="Попробуйте изменить параметры фильтрации."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedObjects.map((obj) => (
              <Panel
                key={obj.bookableObjectId}
                className="group flex flex-col overflow-hidden !p-0 transition-transform hover:scale-[1.02]">
                <div className="relative aspect-[4/3] w-full">
                  <ImageCarousel images={obj.imageUrls} name={obj.name} />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#24170f]">
                      {obj.name}
                    </h3>
                    <Badge tone="neutral">
                      {getObjectTypeName(obj.type)}
                    </Badge>
                  </div>
                  <p className="mb-6 line-clamp-2 flex-1 text-sm text-[color:var(--ink-soft)]">
                    {obj.description || "Нет описания"}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium uppercase tracking-wider text-[color:var(--ink-soft)]">
                        От
                      </p>
                      <p className="text-xl font-black text-[#c96f2b]">
                        {formatCurrency(Number(obj.basePrice))}
                      </p>
                    </div>
                    <Button onClick={() => handleOpenBooking(obj)}>
                      Забронировать
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedObject && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-4"
            style={{ marginTop: "0px" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="Модальное окно бронирования"
            onClick={() => setSelectedObject(null)}>
            <Panel
              onClick={(e) => e.stopPropagation()}
              className="my-auto max-h-full w-full max-w-2xl space-y-5 overflow-y-auto animate-in fade-in zoom-in duration-300 sm:space-y-6">
              <div className="flex items-start justify-between gap-3">
                <h3
                  id="Модальное окно бронирования"
                  className="text-lg font-bold leading-tight sm:text-xl">
                  Бронирование: {selectedObject.name}
                </h3>
                <button
                  onClick={() => setSelectedObject(null)}
                  className="shrink-0 text-[color:var(--ink-soft)] transition hover:text-black">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Tabs if menu is available */}
              {["BANQUET_HALL", "OUTDOOR_VENUE", "KARAOKE_BAR"].includes(
                selectedObject.type.toUpperCase(),
              ) && (
                <div className="flex overflow-x-auto border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    className={`shrink-0 px-4 py-2 font-bold ${activeTab === "details" ? "border-b-2 border-[color:var(--accent)] text-[color:var(--accent)]" : "text-gray-500"}`}
                    onClick={() => setActiveTab("details")}>
                    Детали
                  </button>
                  <button
                    className={`shrink-0 px-4 py-2 font-bold ${activeTab === "menu" ? "border-b-2 border-[color:var(--accent)] text-[color:var(--accent)]" : "text-gray-500"}`}
                    onClick={() => setActiveTab("menu")}>
                    Выбор меню
                  </button>
                </div>
              )}

              {activeTab === "details" ||
              !["BANQUET_HALL", "OUTDOOR_VENUE", "KARAOKE_BAR"].includes(
                selectedObject.type.toUpperCase(),
              ) ? (
                <div className="space-y-4">
                  <Field
                    label="Выберите дату"
                    type="date"
                    value={selectedDate}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    hint={
                      selectedDate && isDateBusy(selectedDate)
                        ? "Эта дата уже занята"
                        : ""
                    }
                    className={
                      selectedDate && isDateBusy(selectedDate)
                        ? "border-red-500"
                        : ""
                    }
                  />

                  <Field
                    label="Количество гостей"
                    type="number"
                    min={1}
                    max={selectedObject.capacity}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                  />

                  {selectedMenuItems.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-bold text-sm">Выбранное меню:</p>
                      {selectedMenuItems.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="flex justify-between text-sm">
                          <span>
                            {item.name} x {item.quantity}
                          </span>
                          <span>
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Доступные позиции меню для {selectedObject.name}:
                  </p>
                  <div className="grid gap-3">
                    {selectedObject.menuItems
                      ?.filter((m) => m.isAvailable)
                      .map((item: any) => (
                        <div
                          key={item.menuItemId}
                          className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-bold">{item.menuItem.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(item.menuItem.price)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                            {selectedMenuItems.find(
                              (i) => i.menuItemId === item.menuItemId,
                            ) ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateMenuItemQuantity(item.menuItemId, -1)
                                  }
                                  className="w-8 h-8 rounded-full bg-gray-100">
                                  -
                                </button>
                                <span className="w-4 text-center">
                                  {
                                    selectedMenuItems.find(
                                      (i) => i.menuItemId === item.menuItemId,
                                    )?.quantity
                                  }
                                </span>
                                <button
                                  onClick={() =>
                                    updateMenuItemQuantity(item.menuItemId, 1)
                                  }
                                  className="w-8 h-8 rounded-full bg-gray-100">
                                  +
                                </button>
                                <button
                                  onClick={() => toggleMenuItem(item)}
                                  className="ml-2 text-red-500">
                                  🗑️
                                </button>
                              </div>
                            ) : (
                              <Button
                                variant="secondary"
                                className="text-xs py-1"
                                onClick={() => toggleMenuItem(item)}>
                                Добавить
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    {(!selectedObject.menuItems ||
                      selectedObject.menuItems.length === 0) && (
                      <p className="text-center py-4 text-gray-400">
                        Меню не найдено
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-[color:var(--border)] pt-4">
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Аренда объекта:</span>
                    <span>{formatCurrency(selectedObject.basePrice)}</span>
                  </div>
                  {totalMenuPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Итого по меню:</span>
                      <span>{formatCurrency(totalMenuPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-lg">
                    <span>Итого:</span>
                    <span className="text-[#c96f2b]">
                      {formatCurrency(
                        Number(selectedObject.basePrice) + totalMenuPrice,
                      )}
                    </span>
                  </div>
                </div>

                {!user ? (
                  <Button className="w-full" onClick={() => navigate("/login")}>
                    Войдите, чтобы забронировать
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={
                      !selectedDate || isDateBusy(selectedDate) || isBooking
                    }
                    onClick={handleCreateReservation}>
                    {isBooking ? "Оформление..." : "Подтвердить бронирование"}
                  </Button>
                )}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </AppShell>
  );
}
