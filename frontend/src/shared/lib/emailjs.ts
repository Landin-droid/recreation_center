import emailjs from 'emailjs-com';

// Эти значения должны быть настроены в EmailJS консоли и добавлены в .env
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_BOOKING = import.meta.env.VITE_EMAILJS_TEMPLATE_RESERVATION_ID;
const TEMPLATE_RESET = import.meta.env.VITE_EMAILJS_TEMPLATE_RESET_PASWORD_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const emailjsService = {
  sendBookingConfirmation: async (toEmail: string, userName: string, bookingDetails: any) => {
    try {
      const templateParams = {
        to_email: toEmail,
        user_name: userName,
        booking_id: bookingDetails.reservationId,
        object_name: bookingDetails.bookableObject.name,
        date: bookingDetails.reservationDate,
        total_sum: bookingDetails.totalSum,
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_BOOKING, templateParams, PUBLIC_KEY);
      console.log('Booking confirmation email sent');
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
    }
  },

  sendPasswordResetEmail: async (toEmail: string, resetLink: string, siteLink: string) => {
    try {
      const templateParams = {
        to_email: toEmail,
        reset_link: resetLink,
        site_link: siteLink,
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_RESET, templateParams, PUBLIC_KEY);
      console.log('Password reset email sent');
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }
};
