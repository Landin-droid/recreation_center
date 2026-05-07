import { Decimal } from "@prisma/client/runtime/client";
import { BookableObjectType } from "../generated/prisma/enums";

class EmailService {
  constructor() {}

  /**
   * Проверить конфигурацию
   */
  async verifyConnection() {
    console.log("ℹ️ Email service is in placeholder mode");
    return true;
  }

  async sendReservationConfirmation(email: string, reservationData: any, p0: { reservationId: number; bookableObject: { type: BookableObjectType; name: string; bookableObjectId: number; capacity: number; basePrice: Decimal; isSeasonal: boolean; seasonStart: Date | null; seasonEnd: Date | null; description: string | null; isActive: boolean; imageUrls: string[]; }; reservationDate: Date; totalSum: string; guestsCount: number; }) {
    console.log(`📧 Email placeholder: Confirmation to ${email}`, reservationData);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    console.log(`📧 Email placeholder: Reset password for ${email}, token: ${token}`);
  }

  async sendRefundConfirmation(
    email: string,
    refundData: {
      refundId: number;
      bookableObjectName: string;
      reservationDate: Date;
      refundAmount: Decimal;
      userName: string;
    },
  ) {
    console.log(
      `📧 Email placeholder: Refund confirmation to ${email}`,
      refundData,
    );
  }
}

export const emailService = new EmailService();
