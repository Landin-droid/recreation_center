import { http, unwrap } from "@shared/api/http";
import type {
  BookableObject,
  CancelReservationResult,
  MenuItem,
  PaymentInitiation,
  PaymentStatus,
  RentalItem,
  Reservation,
  ReservationFormData,
  User,
} from "@shared/api/types";

export const dashboardApi = {
  listObjects() {
    return unwrap<BookableObject[]>(http.get("/bookable-objects"));
  },
  listMenuItems() {
    return unwrap<MenuItem[]>(http.get("/menu/items"));
  },
  listRentalItems() {
    return unwrap<RentalItem[]>(http.get("/rentals/items"));
  },
  listReservations(userId?: number) {
    return unwrap<Reservation[]>(
      http.get("/reservations", {
        params: userId ? { userId } : undefined,
      }),
    );
  },
  createReservation(payload: ReservationFormData) {
    return unwrap<Reservation>(http.post("/reservations", payload));
  },
  cancelReservation(reservationId: number, reason?: string) {
    return unwrap<CancelReservationResult>(
      http.post(`/reservations/${reservationId}/cancel`, { reason }),
    );
  },
  initiatePayment(reservationId: number) {
    return unwrap<PaymentInitiation>(
      http.post(`/reservations/${reservationId}/payment/initiate`),
    );
  },
  getPaymentStatus(paymentId: number) {
    return unwrap<PaymentStatus>(http.get(`/payments/${paymentId}/status`));
  },
  updateProfile(userId: number, data: { fullName?: string; email?: string; phoneNumber?: string }) {
    return unwrap<User>(http.put(`/users/${userId}`, data));
  },
};
