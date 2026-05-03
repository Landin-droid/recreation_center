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
      result = result.filter(obj => obj.type === typeFilter);
    }
    
    result.sort((a, b) => {
      if (sortOrder === "asc") return a.basePrice - b.basePrice;
      return b.basePrice - a.basePrice;
    });
    
    return result;
  }, [objects, typeFilter, sortOrder]);

  const handleOpenBooking = async (obj: BookableObject) => {
    setSelectedObject(obj);
    setSelectedDate("");
    setGuestsCount(1);
    
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
    return types[type] || type;
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
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    <div className="w-2 h-2 rounded-full bg-white/50"></div>
                    <div className="w-2 h-2 rounded-full bg-white/50"></div>
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
                      <span>Вместимость: до {obj.capacity} чел.</span>
                    </div>
                    {obj.details && Object.entries(obj.details).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <svg className="h-5 w-5 text-[#c96f2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{key}: {String(value)}</span>
                      </div>
                    ))}
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
            <Panel className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Бронирование: {selectedObject.name}</h3>
                <button onClick={() => setSelectedObject(null)} className="text-[color:var(--ink-soft)] hover:text-black">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

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

                <div className="pt-4 border-t border-[color:var(--border)]">
                  <div className="flex justify-between mb-4">
                    <span className="font-medium">Итого к оплате:</span>
                    <span className="text-xl font-bold text-[#c96f2b]">{formatCurrency(selectedObject.basePrice)}</span>
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
              </div>
            </Panel>
          </div>
        )}
      </div>
    </AppShell>
  );
}
