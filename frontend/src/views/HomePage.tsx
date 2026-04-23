import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { dashboardApi } from "@features/dashboard/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import { formatCurrency, prettifyEnum } from "@shared/lib/format";
import {
  AppShell,
  Badge,
  Button,
  EmptyState,
  Loader,
  Panel,
  StatCard,
  Title,
} from "@shared/ui/kit";

export function HomePage() {
  const user = useAuthStore((state) => state.user);

  const objectsQuery = useQuery({
    queryKey: ["public", "objects"],
    queryFn: dashboardApi.listObjects,
  });
  const menuQuery = useQuery({
    queryKey: ["public", "menu"],
    queryFn: dashboardApi.listMenuItems,
  });
  const rentalsQuery = useQuery({
    queryKey: ["public", "rentals"],
    queryFn: dashboardApi.listRentalItems,
  });

  const isLoading =
    objectsQuery.isLoading || menuQuery.isLoading || rentalsQuery.isLoading;

  if (isLoading) {
    return <Loader label="Подгружаем витрину клиентской части..." />;
  }

  const objects = objectsQuery.data ?? [];
  const menuItems = menuQuery.data ?? [];
  const rentals = rentalsQuery.data ?? [];

  return (
    <AppShell
      actions={
        user ? (
          <Link to="/dashboard">
            <Button>Личный кабинет</Button>
          </Link>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost">Войти</Button>
            </Link>
            <Link to="/register">
              <Button>Регистрация</Button>
            </Link>
          </>
        )
      }
    >
      <div className="space-y-8">
        <Panel className="overflow-hidden">
          <div className="grid gap-10 lg:grid-cols-[1.35fr,0.85fr]">
            <div className="space-y-6">
              <Title
                eyebrow="React + backend integration"
                heading="Клиентская часть для демонстрации готового API базы отдыха"
                description="Фронтенд собран поверх реальных модулей из backend: авторизация, объекты бронирования, меню, аренда, мои бронирования и запуск оплаты. Никаких вымышленных эндпоинтов."
              />
              <div className="flex flex-wrap gap-3">
                <Link to={user ? "/dashboard" : "/register"}>
                  <Button>{user ? "Открыть кабинет" : "Начать бронирование"}</Button>
                </Link>
                <a href="#catalog">
                  <Button variant="secondary">Посмотреть каталог</Button>
                </a>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StatCard label="Объектов бронирования" value={String(objects.length)} />
              <StatCard label="Пунктов меню" value={String(menuItems.length)} />
              <StatCard label="Позиций аренды" value={String(rentals.length)} />
            </div>
          </div>
        </Panel>

        <section id="catalog" className="grid gap-6 xl:grid-cols-3">
          <Panel className="xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">Объекты</h2>
              <Badge tone="success">Публичный API</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {objects.length > 0 ? (
                objects.map((item) => (
                  <div
                    key={item.bookableObjectId}
                    className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                          {item.description || "Описание пока не заполнено в базе."}
                        </p>
                      </div>
                      <Badge>{prettifyEnum(item.type)}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--ink-soft)]">
                      <span>Вместимость: {item.capacity}</span>
                      <span>Цена: {formatCurrency(item.basePrice)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Объекты пока не добавлены"
                  description="Как только данные появятся в backend, они автоматически появятся и здесь."
                />
              )}
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-extrabold">Меню</h2>
                <Badge tone="warning">/menu/items</Badge>
              </div>
              <div className="space-y-3">
                {menuItems.slice(0, 5).map((item) => (
                  <div
                    key={item.menuItemId}
                    className="rounded-[22px] border border-[color:var(--border)] bg-white/75 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-[color:var(--ink-soft)]">
                          {item.description || "Без описания"}
                        </p>
                      </div>
                      <span className="text-sm font-extrabold">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-extrabold">Аренда</h2>
                <Badge tone="warning">/rentals/items</Badge>
              </div>
              <div className="space-y-3">
                {rentals.slice(0, 5).map((item) => (
                  <div
                    key={item.rentalItemId}
                    className="rounded-[22px] border border-[color:var(--border)] bg-white/75 p-4"
                  >
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-[color:var(--ink-soft)]">
                      {item.description || prettifyEnum(item.category)}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {item.pricePerHour ? formatCurrency(item.pricePerHour) : "Цена по запросу"}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
