import nodemailer from "nodemailer";
import { env } from "../config/env";
import dayjs from "dayjs";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER && env.SMTP_PASS ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      } : undefined,
      connectionTimeout: 10000, // 10 секунд на подключение
    });
  }

  /**
   * Проверить подключение к SMTP серверу
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("✅ SMTP Connection verified successfully");
      return true;
    } catch (error) {
      console.error("❌ SMTP Connection failed:", error);
      return false;
    }
  }

  /**
   * Отправить письмо с информацией о бронировании
   */
  async sendReservationConfirmation(email: string, reservationData: any) {
    const { reservationId, bookableObject, reservationDate, totalSum, guestsCount } = reservationData;
    const formattedDate = dayjs(reservationDate).format("DD.MM.YYYY");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">Подтверждение бронирования</h2>
        <p>Здравствуйте!</p>
        <p>Ваше бронирование в <strong>Центре отдыха "ПОБЕДА"</strong> успешно подтверждено.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #34495e;">Детали бронирования #${reservationId}</h3>
          <p><strong>Объект:</strong> ${bookableObject.name}</p>
          <p><strong>Дата:</strong> ${formattedDate}</p>
          <p><strong>Количество гостей:</strong> ${guestsCount}</p>
          <p><strong>Итоговая сумма:</strong> ${totalSum} руб.</p>
        </div>

        <p>Мы ждем вас по адресу: г. Самара, ул. Береговая, 10.</p>
        <p>Если у вас возникнут вопросы, свяжитесь с нами по телефону: +7 (927) 700-00-00.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">Это автоматическое письмо, на него не нужно отвечать.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: `Подтверждение бронирования #${reservationId} - Центр отдыха ПОБЕДА`,
        html,
      });
      console.log(`Email sent: Reservation confirmation for ${email}`);
    } catch (error) {
      console.error(`Failed to send reservation confirmation to ${email}:`, error);
    }
  }

  /**
   * Отправить письмо для сброса пароля
   */
  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2c3e50; text-align: center;">Восстановление пароля</h2>
        <p>Здравствуйте!</p>
        <p>Вы получили это письмо, потому что запросили сброс пароля для вашей учетной записи в <strong>Центре отдыха "ПОБЕДА"</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Сбросить пароль</a>
        </div>

        <p>Эта ссылка будет активна в течение 1 часа.</p>
        <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">Это автоматическое письмо, на него не нужно отвечать.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: "Восстановление пароля - Центр отдыха ПОБЕДА",
        html,
      });
      console.log(`Email sent: Password reset for ${email}`);
    } catch (error) {
      console.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error("Failed to send password reset email");
    }
  }
}

export const emailService = new EmailService();
