class EmailService {
  constructor() {}

  /**
   * Проверить конфигурацию
   */
  async verifyConnection() {
    console.log("ℹ️ Email service is in placeholder mode");
    return true;
  }

  /**
   * Отправить письмо (заглушка)
   */
  private async sendEmail(templateId: string, templateParams: any) {
    console.log(`📧 Email placeholder: Sending ${templateId}`, templateParams);
  }

  async sendReservationConfirmation(email: string, reservationData: any) {
    console.log(`📧 Email placeholder: Confirmation to ${email}`, reservationData);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    console.log(`📧 Email placeholder: Reset password for ${email}, token: ${token}`);
  }
}

export const emailService = new EmailService();
