import { AppShell, Title, Panel } from "@shared/ui/kit";
import { Link } from "react-router-dom";

export function PaymentFailurePage() {
  return (
    <AppShell>
      <div className="max-w-xl mx-auto py-12 text-center space-y-8">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <Title
          heading="Ошибка оплаты"
          description="К сожалению, транзакция не была завершена. Пожалуйста, попробуйте еще раз или выберите другой способ оплаты."
        />
        <Panel className="bg-red-50/50 border-red-100">
          <p className="text-sm text-red-800">
            Если деньги были списаны, но статус не изменился, обратитесь в нашу службу поддержки по телефону: +7 (999) 000-00-00.
          </p>
        </Panel>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/profile" className="px-8 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">Вернуться к бронированию</Link>
          <Link to="/" className="px-8 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition">На главную</Link>
        </div>
      </div>
    </AppShell>
  );
}
