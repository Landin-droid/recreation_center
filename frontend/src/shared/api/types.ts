export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiErrorPayload {
  statusCode?: number;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  registrationDate: string;
  role: string;
}

export interface AuthSession extends User {
  accessToken: string;
  refreshToken: string;
}

export interface BookableObjectMenuItem {
  menuItemId: number;
  isAvailable: boolean;
  menuItem: {
    menuItemId: number;
    name: string;
    price: number;
    description: string | null;
    isAvailable: boolean;
    category: string | null;
  };
}

export interface BookableObject {
  bookableObjectId: number;
  name: string;
  capacity: number;
  basePrice: number;
  isSeasonal: boolean;
  seasonStart: string | null;
  seasonEnd: string | null;
  description: string | null;
  isActive: boolean;
  type: string;
  details: Record<string, unknown> | null;
  menuItems: BookableObjectMenuItem[];
}

export interface MenuItem {
  menuItemId: number;
  name: string;
  price: number;
  description: string | null;
  isAvailable: boolean;
  category: string | null;
  availableIn: Array<{
    bookableObjectId: number;
    objectName: string;
    objectType: string;
    isAvailable: boolean;
  }>;
}

export interface RentalPriceRule {
  ruleId: number;
  pricePerKm: number;
  minKm: number;
  maxKm: number | null;
  passengerType: string;
}

export interface RentalItem {
  rentalItemId: number;
  name: string;
  description: string | null;
  pricePerHour: number | null;
  isSeasonal: boolean;
  maxCapacity: number | null;
  imageUrl: string | null;
  isActive: boolean;
  category: string;
  seasonType: string | null;
  priceRules: RentalPriceRule[];
}

export interface ReservationMenuItem {
  menuItemId: number;
  quantity: number;
  itemCost: number;
  menuItem: {
    name: string;
    price: number;
  };
}

export interface ReservationPayment {
  paymentId: number;
  amount: number;
  status: string;
  method: string | null;
}

export interface Reservation {
  reservationId: number;
  reservationDate: string;
  creationDate: string;
  guestsCount: number;
  totalSum: number;
  notes: string | null;
  status: string;
  cancellationReason: string | null;
  user: {
    userId: number;
    fullName: string;
    email: string;
    phoneNumber: string | null;
  };
  bookableObject: {
    bookableObjectId: number;
    name: string;
    type: string;
    basePrice: number;
  };
  menuItems: ReservationMenuItem[];
  payment: ReservationPayment | null;
}

export interface PaymentInitiation {
  paymentId: number;
  confirmationUrl: string;
  paymentDeadline: string;
}

export interface PaymentStatus {
  paymentId: number;
  status: string;
  amount: string;
  kassaPaymentId: string | null;
  reservation: {
    reservationId: number;
    status: string;
    cancellationReason: string | null;
  };
}

export interface ReservationFormData {
  userId: number;
  bookableObjectId: number;
  reservationDate: string;
  guestsCount: number;
  notes?: string;
  menuItems?: Array<{
    menuItemId: number;
    quantity: number;
  }>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}
