import { AppShell, Title, Panel, Button } from "@shared/ui/kit";
import { Link } from "react-router-dom";

export function PaymentSuccessPage() {
  return (
    <AppShell>
      <div className="max-w-xl mx-auto py-12 text-center space-y-8">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <Title
          heading="Оплата прошла успешно!"
          description="Ваше бронирование подтверждено. Мы отправили детали на вашу электронную почту."
        />
        <Panel className="bg-green-50/50 border-green-100">
          <p className="text-sm text-green-800">
            Спасибо, что выбрали базу отдыха «Победа». Мы ждем вас в гости!
          </p>
        </Panel>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button as={Link} to="/profile" className="px-8">Перейти в кабинет</Button>
          <Button as={Link} to="/" variant="secondary">На главную</Button>
        </div>
      </div>
    </AppShell>
  );
}
