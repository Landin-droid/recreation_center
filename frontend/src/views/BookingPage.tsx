import { useEffect, useState, useMemo } from "react";
import { AppShell, Title, Panel, Badge, Loader, EmptyState, Button, Select, Field } from "@shared/ui/kit";
import { dashboardApi } from "@features/dashboard/api";
import type { BookableObject, Reservation } from "@shared/api/types";
import { formatCurrency } from "@shared/lib/format";
import { format, addDays, isSameDay, parseISO, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuthStore } from "@features/auth/model/auth-store";
import { useNavigate } from "react-router-dom";

import { emailjsService } from "@shared/lib/emailjs";

export function BookingPage() {
  const [objects, setObjects] = useState<BookableObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering and Sorting state
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Booking Modal state
  const [selectedObject, setSelectedObject] = useState<BookableObject | null>(null);
  const [busyDates, setBusyDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [isBooking, setIsBooking] = useState(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi
      .listObjects()
      .then(setObjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredAndSortedObjects = useMemo(() => {
    let result = [...objects];
    
    if (typeFilter !== "ALL") {
      result = result.filter(obj => obj.type.toLowerCase() === typeFilter.toLowerCase());
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
    
    try {
      const reservations = await dashboardApi.listReservations();
      // Filter reservations for this object that are not cancelled
      const busy = reservations
        .filter(r => r.bookableObject.bookableObjectId === obj.bookableObjectId && r.status !== "cancelled")
        .map(r => parseISO(r.reservationDate));
      setBusyDates(busy);
    } catch (err) {
      console.error("Failed to fetch busy dates", err);
    }
  };

  const handleCreateReservation = async () => {
    if (!user || !selectedObject || !selectedDate) return;
    
    setIsBooking(true);
    try {
      const reservation = await dashboardApi.createReservation({
        userId: user.userId,
        bookableObjectId: selectedObject.bookableObjectId,
        reservationDate: selectedDate,
        guestsCount: guestsCount,
        menuItems: selectedMenuItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        }))
      });
      
      // Send confirmation email via EmailJS
      await emailjsService.sendBookingConfirmation(
        user.email,
        user.fullName,
        reservation
      );
      
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
    return busyDates.some(busyDate => isSameDay(busyDate, date)) || isBefore(date, startOfDay(new Date()));
  };

  const getObjectTypeName = (type: string) => {
    const types: Record<string, string> = {
      COTTAGE: "Коттедж",
      BANQUET_HALL: "Банкетный зал",
      GAZEBO: "Беседка",
      KARAOKE_BAR: "Караоке-бар",
      OUTDOOR_VENUE: "Открытая площадка",
    };
    return types[type.toUpperCase()] || type;
  };

  const getPersonString = (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return "человека";
    return "человек";
  };

  const [selectedMenuItems, setSelectedMenuItems] = useState<Array<{ menuItemId: number; name: string; price: number; quantity: number }>>([]);
  const [activeTab, setActiveTab] = useState<"details" | "menu">("details");

  const toggleMenuItem = (item: any) => {
    setSelectedMenuItems(prev => {
      const existing = prev.find(i => i.menuItemId === item.menuItem.menuItemId);
      if (existing) {
        return prev.filter(i => i.menuItemId !== item.menuItem.menuItemId);
      }
      return [...prev, { 
        menuItemId: item.menuItem.menuItemId, 
        name: item.menuItem.name, 
        price: Number(item.menuItem.price), 
        quantity: 1 
      }];
    });
  };

  const updateMenuItemQuantity = (itemId: number, delta: number) => {
    setSelectedMenuItems(prev => prev.map(item => {
      if (item.menuItemId === itemId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const totalMenuPrice = selectedMenuItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const renderAmenities = (obj: BookableObject) => {
    const type = obj.type.toUpperCase();
    const amenitiesStr = (obj as any).details?.amenities || "";
    
    if (type === "COTTAGE") {
      const cottageAmenities = [
        { name: "Холодильник", key: "холодильник", icon: "❄️" },
        { name: "Микроволновка", key: "микроволновка", icon: "🔥" },
        { name: "Чайник", key: "чайник", icon: "☕" },
        { name: "Водоснабжение", key: "водоснабжение", icon: "🚰" },
        { name: "Электричество", key: "электричество", icon: "⚡" },
        { name: "Санузел", key: "санузел", icon: "🚽" },
      ];

      return (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {cottageAmenities.map(am => (
            <div key={am.key} className="flex items-center gap-2 text-sm">
              <span>{am.icon}</span>
              <span className="flex-1">{am.name}</span>
              <span>{amenitiesStr.toLowerCase().includes(am.key) ? "✅" : "❌"}</span>
            </div>
          ))}
          <div className="col-span-2 text-sm mt-2 font-medium">
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
        <div className="grid grid-cols-1 gap-2 mt-4">
          {gazeboAmenities.map(am => (
            <div key={am.key} className="flex items-center gap-2 text-sm">
              <span>{am.icon}</span>
              <span className="flex-1">{am.name}</span>
              <span>{amenitiesStr.toLowerCase().includes(am.key) ? "✅" : "❌"}</span>
            </div>
          ))}
        </div>
      );
    }

    if (type === "BANQUET_HALL" || type === "KARAOKE_BAR") {
      return (
        <div className="mt-4 text-sm font-medium">
          Количество столов: {(obj as any).details?.maxTables || (obj as any).details?.tablesAmount || 0}
        </div>
      );
    }

    return null;
  };

  return (
    <AppShell>
      <div className="space-y-12">
        <Title
          eyebrow="Бронирование"
          heading="Выберите идеальное место"
          description="От уютных беседок до просторных банкетных залов — у нас есть всё для вашего мероприятия."
        />

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4 items-end">
          <Select 
            label="Тип объекта" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-64"
          >
            <option value="ALL">Все типы</option>
            <option value="COTTAGE">Коттеджи</option>
            <option value="BANQUET_HALL">Банкетные залы</option>
            <option value="GAZEBO">Беседки</option>
            <option value="KARAOKE_BAR">Караоке-бар</option>
            <option value="OUTDOOR_VENUE">Площадки</option>
          </Select>

          <Select 
            label="Сортировка по цене" 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="w-full md:w-64"
          >
            <option value="asc">Сначала дешевле</option>
            <option value="desc">Сначала дороже</option>
          </Select>
        </div>

        {loading ? (
          <Loader label="Загружаем объекты..." />
        ) : error ? (
          <EmptyState title="Ошибка" description={error} />
        ) : filteredAndSortedObjects.length === 0 ? (
          <EmptyState title="Ничего не найдено" description="Попробуйте изменить параметры фильтрации." />
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {filteredAndSortedObjects.map((obj) => (
              <Panel key={obj.bookableObjectId} className="flex flex-col md:flex-row overflow-hidden p-0 h-full">
                {/* Photo Carousel Placeholder */}
                <div className="md:w-2/5 relative bg-gray-200 aspect-video md:aspect-auto">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge tone="neutral">{getObjectTypeName(obj.type)}</Badge>
                    <span className="text-lg font-bold text-[#c96f2b]">
                      {formatCurrency(obj.basePrice)}
                    </span>
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">{obj.name}</h3>
                  <p className="mb-4 text-sm text-[color:var(--ink-soft)] line-clamp-3">
                    {obj.description || "Прекрасное место для вашего отдыха."}
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="h-5 w-5 text-[#c96f2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Вместимость: до {obj.capacity} {getPersonString(obj.capacity)}</span>
                    </div>
                    {renderAmenities(obj)}
                  </div>

                  <Button 
                    className="mt-6 w-full" 
                    onClick={() => handleOpenBooking(obj)}
                  >
                    Забронировать
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedObject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <Panel className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Бронирование: {selectedObject.name}</h3>
                <button onClick={() => setSelectedObject(null)} className="text-[color:var(--ink-soft)] hover:text-black">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs if menu is available */}
              {["BANQUET_HALL", "OUTDOOR_VENUE", "KARAOKE_BAR"].includes(selectedObject.type.toUpperCase()) && (
                <div className="flex border-b">
                  <button 
                    className={`px-4 py-2 font-bold ${activeTab === "details" ? "border-b-2 border-[color:var(--accent)] text-[color:var(--accent)]" : "text-gray-500"}`}
                    onClick={() => setActiveTab("details")}
                  >
                    Детали
                  </button>
                  <button 
                    className={`px-4 py-2 font-bold ${activeTab === "menu" ? "border-b-2 border-[color:var(--accent)] text-[color:var(--accent)]" : "text-gray-500"}`}
                    onClick={() => setActiveTab("menu")}
                  >
                    Выбор меню
                  </button>
                </div>
              )}

              {activeTab === "details" || !["BANQUET_HALL", "OUTDOOR_VENUE", "KARAOKE_BAR"].includes(selectedObject.type.toUpperCase()) ? (
                <div className="space-y-4">
                  <Field 
                    label="Выберите дату" 
                    type="date" 
                    value={selectedDate}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    hint={selectedDate && isDateBusy(selectedDate) ? "Эта дата уже занята" : ""}
                    className={selectedDate && isDateBusy(selectedDate) ? "border-red-500" : ""}
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
                      {selectedMenuItems.map(item => (
                        <div key={item.menuItemId} className="flex justify-between text-sm">
                          <span>{item.name} x {item.quantity}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Доступные позиции меню для {selectedObject.name}:</p>
                  <div className="grid gap-3">
                    {selectedObject.menuItems?.filter(m => m.isAvailable).map((item: any) => (
                      <div key={item.menuItemId} className="flex items-center justify-between p-3 border rounded-xl">
                        <div>
                          <p className="font-bold">{item.menuItem.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(item.menuItem.price)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedMenuItems.find(i => i.menuItemId === item.menuItemId) ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateMenuItemQuantity(item.menuItemId, -1)} className="w-8 h-8 rounded-full bg-gray-100">-</button>
                              <span className="w-4 text-center">{selectedMenuItems.find(i => i.menuItemId === item.menuItemId)?.quantity}</span>
                              <button onClick={() => updateMenuItemQuantity(item.menuItemId, 1)} className="w-8 h-8 rounded-full bg-gray-100">+</button>
                              <button onClick={() => toggleMenuItem(item)} className="ml-2 text-red-500">🗑️</button>
                            </div>
                          ) : (
                            <Button variant="secondary" className="text-xs py-1" onClick={() => toggleMenuItem(item)}>Добавить</Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!selectedObject.menuItems || selectedObject.menuItems.length === 0) && (
                      <p className="text-center py-4 text-gray-400">Меню не найдено</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[color:var(--border)]">
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
                    <span className="text-[#c96f2b]">{formatCurrency(Number(selectedObject.basePrice) + totalMenuPrice)}</span>
                  </div>
                </div>
                
                {!user ? (
                  <Button className="w-full" onClick={() => navigate("/login")}>Войдите, чтобы забронировать</Button>
                ) : (
                  <Button 
                    className="w-full" 
                    disabled={!selectedDate || isDateBusy(selectedDate) || isBooking}
                    onClick={handleCreateReservation}
                  >
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
