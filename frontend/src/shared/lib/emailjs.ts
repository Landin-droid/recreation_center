import emailjs from "emailjs-com";

// Эти значения должны быть настроены в EmailJS консоли и добавлены в .env
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_RESET = import.meta.env.VITE_EMAILJS_TEMPLATE_RESET_PASWORD_ID;
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
};
