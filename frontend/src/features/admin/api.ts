import { http, unwrap } from "@shared/api/http";
import type {
  AdminStats,
  BookableObject,
  MenuItem,
  RentalItem,
  RentalPriceRule,
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

  // Menu Assignments
  listMenuAssignments(bookableObjectId?: number) {
    return unwrap<any[]>(http.get("/menu/assignments", { params: { bookableObjectId } }));
  },
  upsertMenuAssignment(data: { bookableObjectId: number; menuItemId: number; isAvailable?: boolean }) {
    return unwrap<any>(http.post("/menu/assignments", data));
  },
  deleteMenuAssignment(bookableObjectId: number, menuItemId: number) {
    return http.delete(`/menu/assignments/${bookableObjectId}/${menuItemId}`);
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

  // Rental Price Rules
  listPriceRules(rentalItemId?: number) {
    return unwrap<RentalPriceRule[]>(http.get("/rentals/price-rules", { params: { rentalItemId } }));
  },
  createPriceRule(data: any) {
    return unwrap<RentalPriceRule>(http.post("/rentals/price-rules", data));
  },
  updatePriceRule(id: number, data: any) {
    return unwrap<RentalPriceRule>(http.put(`/rentals/price-rules/${id}`, data));
  },
  deletePriceRule(id: number) {
    return http.delete(`/rentals/price-rules/${id}`);
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
