// User Types
export type UserRole = "ADMIN" | "STAFF" | "USER";

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  registrationDate: Date;
  role: UserRole;
}

export interface UserCreateInput {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface UserUpdateInput {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

// BookableObject Types
export interface BookableObject {
  bookableObjectId: number;
  name: string;
  capacity: number;
  basePrice: string;
  isSeasonal: boolean;
  seasonStart?: Date;
  seasonEnd?: Date;
  description?: string;
}

// Reservation Types
export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export interface Reservation {
  reservationId: number;
  userId: number;
  bookableObjectId: number;
  startDate: Date;
  endDate: Date;
  guestCount: number;
  totalPrice: string;
  status: ReservationStatus;
  specialRequests?: string;
  createdAt: Date;
  bookableObject?: BookableObject;
}

export interface ReservationCreateInput {
  bookableObjectId: number;
  startDate: Date;
  endDate: Date;
  guestCount: number;
  specialRequests?: string;
}

// Payment Types
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "CANCELED" | "FAILED";
export type PaymentMethod =
  | "BANK_CARD"
  | "YOOMONEY"
  | "APPLE_PAY"
  | "GOOGLE_PAY"
  | null;

export interface Payment {
  paymentId: number;
  reservationId: number;
  amount: string;
  status: PaymentStatus;
  method: PaymentMethod;
  kassaPaymentId: string | null;
  createdAt: Date;
}

export interface PaymentCreateInput {
  reservationId: number;
  returnUrl: string;
}

// Menu Types
export interface MenuItem {
  menuItemId: number;
  name: string;
  description?: string;
  price: string;
  isAvailable: boolean;
  category?: string;
}

// Rental Types
export interface Rental {
  rentalId: number;
  reservationId: number;
  equipment: string;
  quantity: number;
  pricePerDay: string;
  startDate: Date;
  endDate: Date;
}

// API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
