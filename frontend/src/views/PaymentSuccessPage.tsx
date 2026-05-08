import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell, Title, Panel } from "@shared/ui/kit";
import { Link } from "react-router-dom";
import { http } from "@shared/api/http";
import { emailjsService } from "@shared/lib/emailjs";

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
    if (paymentId) {
      const sendReceiptEmail = async () => {
        try {
          console.log('PaymentSuccessPage: Starting receipt email process for paymentId:', paymentId);
          const response = await http.get(`/payments/${paymentId}`);
          console.log('PaymentSuccessPage: API response:', response.data);
          const { receiptEmailData } = response.data.data;

          if (receiptEmailData) {
            console.log('PaymentSuccessPage: Sending receipt email with data:', receiptEmailData);
            await emailjsService.sendPaymentReceipt(receiptEmailData);
            console.log('PaymentSuccessPage: Receipt email sent successfully');
          } else {
            console.log('PaymentSuccessPage: No receiptEmailData found in response');
          }
        } catch (error) {
          console.error("PaymentSuccessPage: Failed to send payment receipt email:", error);
        }
      };
      sendReceiptEmail();
    } else {
      console.log('PaymentSuccessPage: No paymentId in URL params');
    }
  }, [paymentId]);


  return (
    <AppShell>
      <div className="max-w-xl mx-auto py-12 text-center space-y-8">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
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
          <Link
            to="/profile"
            className="px-8 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition">
            Перейти в кабинет
          </Link>
          <Link
            to="/"
            className="px-8 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition">
            На главную
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
