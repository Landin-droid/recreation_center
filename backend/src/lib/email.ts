import axios from "axios";
import { Decimal } from "@prisma/client/runtime/client";
import { BookableObjectType } from "../generated/prisma/enums";
import { env } from "../config/env";

const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

interface EmailParams {
  [key: string]: string | number | boolean | undefined;
}

class EmailService {
  private get isConfigured(): boolean {
    return Boolean(env.EMAILJS_SERVICE_ID && env.EMAILJS_PUBLIC_KEY);
  }

  private logMissingTemplate(templateName: string, templateId?: string) {
    if (!templateId) {
      console.warn(
        `⚠️  EmailJS template not configured: ${templateName} (env variable is missing)`,
      );
      return true;
    }
    return false;
  }

  async verifyConnection() {
    if (!this.isConfigured) {
      console.log("⚠️  EmailJS: Missing configuration");
      console.log(
        "   - EMAILJS_SERVICE_ID:",
        env.EMAILJS_SERVICE_ID ? "✓" : "❌ missing",
      );
      console.log(
        "   - EMAILJS_PUBLIC_KEY:",
        env.EMAILJS_PUBLIC_KEY ? "✓" : "❌ missing",
      );
      console.log(
        "   - EMAILJS_TEMPLATE_RECEIPT_ID:",
        env.EMAILJS_TEMPLATE_RECEIPT_ID ? "✓" : "⚠️  optional",
      );
      console.log(
        "   - EMAILJS_TEMPLATE_RESET_PASSWORD_ID:",
        env.EMAILJS_TEMPLATE_RESET_PASSWORD_ID ? "✓" : "⚠️  optional",
      );
      console.log(
        "📧 Email service is in placeholder mode (templates will log instead of sending)",
      );
      return true;
    }

    console.log("✅ EmailJS configured and ready to send emails");
    return true;
  }

  private async sendEmail(
    templateId: string | undefined,
    templateParams: EmailParams,
  ) {
    if (!env.EMAILJS_SERVICE_ID || !env.EMAILJS_PUBLIC_KEY || !templateId) {
      console.log(
        "📧 Email placeholder (template not configured):",
        JSON.stringify(
          { templateId, to_email: templateParams.to_email },
          null,
          2,
        ),
      );
      return;
    }

    try {
      const response = await axios.post(EMAILJS_API_URL, {
        service_id: env.EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: env.EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      });
      console.log("✅ Email sent successfully to", templateParams.to_email);
      return response.data;
    } catch (error: any) {
      console.error(
        "❌ Failed to send email via EmailJS:",
        error?.response?.data || error?.message || error,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    if (
      this.logMissingTemplate(
        "EMAILJS_TEMPLATE_RESET_PASSWORD_ID",
        env.EMAILJS_TEMPLATE_RESET_PASSWORD_ID,
      )
    ) {
      return;
    }
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.sendEmail(env.EMAILJS_TEMPLATE_RESET_PASSWORD_ID, {
      to_email: email,
      reset_link: resetLink,
    });
  }

  async sendReceipt(
    email: string,
    receiptData: {
      receiptType: "payment" | "refund";
      receiptTypeLabel: string;
      amount: string;
      receiptId: string;
      receiptStatus?: string;
      fiscalizationDate?: string;
      contactEmail?: string;
      yookassaReceiptId: string;
      fiscalDocumentNumber?: string;
      fiscalStorageNumber?: string;
      fiscalAttribute?: string;
      fiscalProviderId?: string;
      objectName: string;
      reservationDate: string;
      itemDescription: string;
      itemQuantity: string;
      itemPrice: string;
      totalSum: string;
      vatInfo?: string;
    },
  ) {
    if (
      this.logMissingTemplate(
        "EMAILJS_TEMPLATE_RECEIPT_ID",
        env.EMAILJS_TEMPLATE_RECEIPT_ID,
      )
    ) {
      return;
    }
    await this.sendEmail(env.EMAILJS_TEMPLATE_RECEIPT_ID, {
      to_email: email,
      receipt_type_label: receiptData.receiptTypeLabel,
      receipt_type: receiptData.receiptType,
      amount: receiptData.amount,
      receipt_id: receiptData.receiptId,
      fiscalization_date: receiptData.fiscalizationDate || "",
      receipt_status: receiptData.receiptStatus || "",
      contact_email: receiptData.contactEmail || email,
      fiscal_document_number: receiptData.fiscalDocumentNumber || "",
      fiscal_storage_number: receiptData.fiscalStorageNumber || "",
      fiscal_attribute: receiptData.fiscalAttribute || "",
      fiscal_provider_id: receiptData.fiscalProviderId || "",
      object_name: receiptData.objectName,
      reservation_date: receiptData.reservationDate,
      item_description: receiptData.itemDescription,
      item_quantity: receiptData.itemQuantity,
      item_price: receiptData.itemPrice,
      total_sum: receiptData.totalSum,
      vat_info: receiptData.vatInfo || "",
    });
  }
}

export const emailService = new EmailService();
