import { http, unwrap } from "@shared/api/http";
import type {
  AdminStats,
  BookableObject,
  MenuItem,
  RentalItem,
  Reservation,
  User,
} from "@shared/api/types";

export const adminApi = {
  // Stats
  getStats() {
    return unwrap<AdminStats>(http.get("/reservations/stats"));
  },

  // Users
  listUsers() {
    return unwrap<User[]>(http.get("/users"));
  },
  deleteUser(userId: number) {
    return http.delete(`/users/${userId}`);
  },
  updateUser(userId: number, data: Partial<User>) {
    return unwrap<User>(http.put(`/users/${userId}`, data));
  },

  // Bookable Objects
  listObjects() {
    return unwrap<BookableObject[]>(http.get("/bookable-objects"));
  },
  createObject(data: any) {
    return unwrap<BookableObject>(http.post("/bookable-objects", data));
  },
  updateObject(id: number, data: any) {
    return unwrap<BookableObject>(http.put(`/bookable-objects/${id}`, data));
  },
  deleteObject(id: number) {
    return http.delete(`/bookable-objects/${id}`);
  },

  // Menu Items
  listMenuItems() {
    return unwrap<MenuItem[]>(http.get("/menu/items"));
  },
  createMenuItem(data: any) {
    return unwrap<MenuItem>(http.post("/menu/items", data));
  },
  updateMenuItem(id: number, data: any) {
    return unwrap<MenuItem>(http.put(`/menu/items/${id}`, data));
  },
  deleteMenuItem(id: number) {
    return http.delete(`/menu/items/${id}`);
  },

  // Rental Items
  listRentalItems() {
    return unwrap<RentalItem[]>(http.get("/rentals/items"));
  },
  createRentalItem(data: any) {
    return unwrap<RentalItem>(http.post("/rentals/items", data));
  },
  updateRentalItem(id: number, data: any) {
    return unwrap<RentalItem>(http.put(`/rentals/items/${id}`, data));
  },
  deleteRentalItem(id: number) {
    return http.delete(`/rentals/items/${id}`);
  },

  // Reservations
  listReservations() {
    return unwrap<Reservation[]>(http.get("/reservations"));
  },
  updateReservation(id: number, data: any) {
    return unwrap<Reservation>(http.put(`/reservations/${id}`, data));
  },
  deleteReservation(id: number) {
    return http.delete(`/reservations/${id}`);
  },
};
