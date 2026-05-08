import emailjs from "emailjs-com";

// Эти значения должны быть настроены в EmailJS консоли и добавлены в .env
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_RESET = import.meta.env.VITE_EMAILJS_TEMPLATE_RESET_PASWORD_ID;
const TEMPLATE_RECEIPT = import.meta.env.VITE_EMAILJS_TEMPLATE_RECEIPT_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const emailjsService = {
  sendPasswordResetEmail: async (toEmail: string, resetLink: string) => {
    try {
      const templateParams = {
        to_email: toEmail,
        reset_link: resetLink,
      };

      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_RESET,
        templateParams,
        PUBLIC_KEY,
      );
      console.log("Password reset email sent");
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  },

  sendPaymentReceipt: async (receiptData: {
    to_email: string;
    receipt_type_label: string;
    receipt_type: string;
    amount: string;
    receipt_id: string;
    fiscalization_date: string;
    receipt_status: string;
    contact_email: string;
    fiscal_document_number: string;
    fiscal_storage_number: string;
    fiscal_attribute: string;
    fiscal_provider_id: string;
    object_name: string;
    reservation_date: string;
    item_description: string;
    item_quantity: string;
    item_price: string;
    total_sum: string;
    vat_info: string;
  }) => {
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_RECEIPT,
        receiptData,
        PUBLIC_KEY,
      );
      console.log("Payment receipt email sent");
    } catch (error) {
      console.error("Failed to send payment receipt email:", error);
    }
  },

  sendRefundReceipt: async (receiptData: {
    to_email: string;
    receipt_type_label: string;
    receipt_type: string;
    amount: string;
    receipt_id: string;
    fiscalization_date: string;
    receipt_status: string;
    contact_email: string;
    fiscal_document_number: string;
    fiscal_storage_number: string;
    fiscal_attribute: string;
    fiscal_provider_id: string;
    object_name: string;
    reservation_date: string;
    item_description: string;
    item_quantity: string;
    item_price: string;
    total_sum: string;
    vat_info: string;
  }) => {
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_RECEIPT,
        receiptData,
        PUBLIC_KEY,
      );
      console.log("Refund receipt email sent");
    } catch (error) {
      console.error("Failed to send refund receipt email:", error);
    }
  },
};
