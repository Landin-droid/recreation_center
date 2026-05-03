import { useEffect, useState } from "react";
import { AppShell, Title, Panel, Badge, Loader, EmptyState } from "@shared/ui/kit";
import { dashboardApi } from "@features/dashboard/api";
import type { RentalItem } from "@shared/api/types";
import { formatCurrency } from "@shared/lib/format";

export function RentalPage() {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .listRentalItems()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getSeasonLabel = (item: RentalItem) => {
    if (!item.isSeasonal) return "Весь год";
    const type = item.seasonType?.toLowerCase();
    if (type === "winter") return "Зимний";
    if (type === "summer") return "Летний";
    return "Сезонный";
  };

  const getPersonString = (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return "человека";
    return "человек";
  };

  return (
    <AppShell>
      <div className="space-y-12">
        <Title
          eyebrow="Прокат инвентаря"
          heading="Все для активного отдыха"
          description="У нас вы можете арендовать современное оборудование для спорта и отдыха в любое время года."
        />

        {/* Rules Block */}
        <Panel className="bg-[#fef3e7] border-[#f5d9bd]">
          <div className="flex gap-4">
            <div className="flex-shrink-0 text-[#c96f2b]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#3b2a1d]">Правила проката</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-[color:var(--ink-soft)]">
                <li>Инвентарь выдается при предъявлении документа, удостоверяющего личность.</li>
                <li>Оплата производится за каждый полный или неполный час использования.</li>
                <li>В случае повреждения инвентаря взимается штраф согласно прейскуранту.</li>
                <li>Возврат инвентаря осуществляется не позднее времени закрытия пункта проката.</li>
                <li className="font-bold text-[#c96f2b]">Со своими плюшками, коньками и лыжами проход бесплатный!</li>
              </ul>
            </div>
          </div>
        </Panel>

        {loading ? (
          <Loader label="Загружаем инвентарь..." />
        ) : error ? (
          <EmptyState title="Ошибка" description={error} />
        ) : items.length === 0 ? (
          <EmptyState title="Ничего не найдено" description="В данный момент прокат недоступен." />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Panel key={item.rentalItemId} className="flex flex-col overflow-hidden p-0 h-full">
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge tone={item.isSeasonal ? "warning" : "neutral"}>
                      {getSeasonLabel(item)}
                    </Badge>
                    <span className="text-sm font-bold text-[#c96f2b]">
                      {item.pricePerHour ? `${formatCurrency(item.pricePerHour)} / час` : "Вариативная цена"}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{item.name}</h3>
                  <p className="mb-4 text-sm text-[color:var(--ink-soft)] line-clamp-2">
                    {item.description || "Описание отсутствует."}
                  </p>
                  
                  {item.priceRules && item.priceRules.length > 0 && (
                    <div className="mb-4 overflow-hidden border rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 uppercase font-bold text-[color:var(--ink-soft)]">
                          <tr>
                            <th className="px-3 py-2">Тип</th>
                            <th className="px-3 py-2">Цена/км</th>
                            <th className="px-3 py-2">Мин/Макс км</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {item.priceRules.map(rule => (
                            <tr key={rule.ruleId}>
                              <td className="px-3 py-2">{rule.passengerType.toUpperCase() === "CHILD" ? "Детский" : "Взрослый"}</td>
                              <td className="px-3 py-2 font-bold">{formatCurrency(rule.pricePerKm)}</td>
                              <td className="px-3 py-2">{rule.minKm}{rule.maxKm ? ` - ${rule.maxKm}` : "+"} км</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {item.maxCapacity && (
                    <div className="mt-auto flex items-center gap-2 text-xs font-medium text-[color:var(--ink-soft)]">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      До {item.maxCapacity} {getPersonString(item.maxCapacity)}
                    </div>
                  )}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
