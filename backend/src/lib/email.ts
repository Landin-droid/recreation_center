import emailjs from "@emailjs/nodejs";
import { env } from "../config/env";
import dayjs from "dayjs";

class EmailService {
  constructor() {
    // Инициализация EmailJS
    if (env.EMAILJS_PUBLIC_KEY && env.EMAILJS_PRIVATE_KEY) {
      emailjs.init({
        publicKey: env.EMAILJS_PUBLIC_KEY,
        privateKey: env.EMAILJS_PRIVATE_KEY,
      });
    }
  }

  /**
   * Проверить конфигурацию
   */
  async verifyConnection() {
    if (!env.EMAILJS_SERVICE_ID || !env.EMAILJS_PUBLIC_KEY || !env.EMAILJS_PRIVATE_KEY) {
      console.warn("⚠️ EmailJS is not fully configured. Emails will not be sent.");
      return false;
    }
    console.log("✅ EmailJS configuration detected");
    return true;
  }

  /**
   * Отправить письмо через EmailJS
   */
  private async sendEmail(templateId: string, templateParams: any) {
    if (!env.EMAILJS_SERVICE_ID) return;

    try {
      const response = await emailjs.send(
        env.EMAILJS_SERVICE_ID,
        templateId,
        templateParams
      );

      if (response.status === 200) {
        console.log(`Email sent successfully. Status: ${response.status}`);
      } else {
        console.error(`EmailJS error:`, response);
      }
    } catch (error: any) {
      console.error(
        `Failed to send email via EmailJS:`,
        error?.text || error?.message || error
      );
    }
  }

  /**
   * Отправить подтверждение бронирования
   * Ожидаемые переменные в шаблоне EmailJS:
   * - user_email
   * - reservation_id
   * - object_name
   * - date
   * - guests
   * - total_sum
   */
  async sendReservationConfirmation(email: string, reservationData: any) {
    if (!env.EMAILJS_TEMPLATE_ID_RESERVATION) {
      console.warn("⚠️ EMAILJS_TEMPLATE_ID_RESERVATION not set");
      return;
    }

    const { reservationId, bookableObject, reservationDate, totalSum, guestsCount } = reservationData;
    const formattedDate = dayjs(reservationDate).format("DD.MM.YYYY");

    const templateParams = {
      user_email: email,
      reservation_id: reservationId,
      object_name: bookableObject.name,
      date: formattedDate,
      guests: guestsCount,
      total_sum: totalSum,
    };

    await this.sendEmail(env.EMAILJS_TEMPLATE_ID_RESERVATION, templateParams);
  }

  /**
   * Отправить ссылку на сброс пароля
   * Ожидаемые переменные в шаблоне EmailJS:
   * - user_email
   * - reset_url
   */
  async sendPasswordResetEmail(email: string, token: string) {
    if (!env.EMAILJS_TEMPLATE_ID_RESET_PASSWORD) {
      console.warn("⚠️ EMAILJS_TEMPLATE_ID_RESET_PASSWORD not set");
      return;
    }

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    const templateParams = {
      user_email: email,
      reset_url: resetUrl,
    };

    await this.sendEmail(env.EMAILJS_TEMPLATE_ID_RESET_PASSWORD, templateParams);
  }
}

export const emailService = new EmailService();
