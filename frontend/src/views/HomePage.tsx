import { Helmet } from "react-helmet-async";
import { AppShell, Title, Panel, Button } from "@shared/ui/kit";
import { useNavigate } from "react-router-dom";
import { SEO_DESCRIPTIONS } from "@shared/utils/seo";

export function HomePage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <Helmet>
        <title>База отдыха "Победа" - домики, прокат и банкетные залы</title>
        <meta name="description" content={SEO_DESCRIPTIONS.home} />
      </Helmet>
      <div className="space-y-16 py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[40px] bg-[#24170f] px-8 py-24 text-white">
          <div className="relative z-10 max-w-2xl space-y-8">
            <h1 className="text-5xl font-black leading-tight tracking-tighter md:text-7xl">
              Отдых, который вы заслужили
            </h1>
            <p className="text-lg opacity-80 md:text-xl">
              База отдыха «Победа» — это идеальное место для семейного отдыха,
              корпоративных мероприятий и праздников на свежем воздухе.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                className="px-8 py-4 text-lg"
                onClick={() => navigate("/booking")}>
                Забронировать сейчас
              </Button>
              <Button
                variant="secondary"
                className="px-8 py-4 text-lg bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => navigate("/rentals")}>
                Наш прокат
              </Button>
            </div>
          </div>
          {/* Decorative elements could go here */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#c96f2b]/20 to-transparent" />
        </section>

        {/* Services Section */}
        <section className="space-y-8">
          <Title
            eyebrow="Наши услуги"
            heading="Все для вашего комфорта"
            description="Мы предлагаем широкий спектр услуг для полноценного отдыха в любое время года."
          />
          <div className="grid gap-6 md:grid-cols-3">
            <Panel className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-[#fef3e7] p-3 text-[#c96f2b]">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Уютные коттеджи</h3>
              <p className="text-sm text-[color:var(--ink-soft)]">
                Комфортабельные дома со всеми удобствами для компаний любого
                размера.
              </p>
            </Panel>
            <Panel className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-[#fef3e7] p-3 text-[#c96f2b]">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 15.546c.533-1.295.827-2.722.827-4.213 0-2.105-.582-4.074-1.594-5.749m-4.577 12.444c-1.296.533-2.721.827-4.212.827-2.105 0-4.074-.582-5.749-1.594m12.444-4.577c.533-1.295.827-2.722.827-4.213 0-2.105-.582-4.074-1.594-5.749m-4.577 12.444c-1.296.533-2.721.827-4.212.827-2.105 0-4.074-.582-5.749-1.594"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Банкетные залы</h3>
              <p className="text-sm text-[color:var(--ink-soft)]">
                Просторные залы для свадеб, юбилеев и корпоративных мероприятий.
              </p>
            </Panel>
            <Panel className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-[#fef3e7] p-3 text-[#c96f2b]">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Активный отдых</h3>
              <p className="text-sm text-[color:var(--ink-soft)]">
                Прокат спортивного инвентаря, караоке-бар и открытые площадки.
              </p>
            </Panel>
          </div>
        </section>

        {/* Info Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Working Hours */}
          <Panel className="space-y-6">
            <h3 className="text-2xl font-bold">Часы работы</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-dashed border-[color:var(--border)] pb-2">
                <span className="font-medium text-[color:var(--ink-soft)]">
                  Администрация
                </span>
                <span className="font-bold">09:00 — 21:00</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-[color:var(--border)] pb-2">
                <span className="font-medium text-[color:var(--ink-soft)]">
                  Прокат
                </span>
                <span className="font-bold">10:00 — 20:00</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-[color:var(--border)] pb-2">
                <span className="font-medium text-[color:var(--ink-soft)]">
                  Караоке-бар
                </span>
                <span className="font-bold">18:00 — 02:00</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[color:var(--ink-soft)]">
                  Территория
                </span>
                <span className="font-bold text-[#c96f2b]">Круглосуточно</span>
              </div>
            </div>
          </Panel>

          {/* Important News */}
          <Panel className="space-y-6">
            <h3 className="text-2xl font-bold">Важные новости</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#c96f2b]">
                  15 МАЯ 2026
                </span>
                <h4 className="font-bold">Открытие летнего сезона</h4>
                <p className="text-sm text-[color:var(--ink-soft)]">
                  Мы подготовили пляжную зону и новые водные аттракционы для
                  наших гостей.
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#c96f2b]">
                  1 МАЯ 2026
                </span>
                <h4 className="font-bold">Обновление меню в караоке-баре</h4>
                <p className="text-sm text-[color:var(--ink-soft)]">
                  Попробуйте наши новые авторские коктейли и закуски от
                  шеф-повара.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
