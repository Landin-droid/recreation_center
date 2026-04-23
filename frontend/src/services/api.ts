import axios, { AxiosInstance, AxiosError } from "axios";
import {
  AuthResponse,
  LoginInput,
  User,
  UserCreateInput,
  UserUpdateInput,
} from "../types/index";

// Utility types
interface ApiError {
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(
    baseURL: string = import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:3000/api",
  ) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Добавляем интерцептор для добавления токена
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Обработка ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Если токен истёк, редирект на логин
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );
  }

  // ====== AUTH ENDPOINTS ======

  async login(data: LoginInput): Promise<AuthResponse> {
    const { data: response } = await this.client.post<AuthResponse>(
      "/users/login",
      data,
    );
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    return response;
  }

  async register(data: UserCreateInput): Promise<AuthResponse> {
    const { data: response } = await this.client.post<AuthResponse>(
      "/users/register",
      data,
    );
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    return response;
  }

  async logout(): Promise<void> {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  // ====== USER ENDPOINTS ======

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>("/users/me");
    return data;
  }

  async updateUser(data: UserUpdateInput): Promise<User> {
    const { data: response } = await this.client.patch<User>("/users/me", data);
    return response;
  }

  async getUserById(id: number): Promise<User> {
    const { data } = await this.client.get<User>(`/users/${id}`);
    return data;
  }

  // ====== BOOKABLE OBJECTS ENDPOINTS ======

  async getBookableObjects() {
    const { data } = await this.client.get("/bookable-objects");
    return data;
  }

  async getBookableObjectById(id: number) {
    const { data } = await this.client.get(`/bookable-objects/${id}`);
    return data;
  }

  async getAvailability(
    bookableObjectId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const { data } = await this.client.get("/bookable-objects/availability", {
      params: {
        bookableObjectId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return data;
  }

  // ====== RESERVATIONS ENDPOINTS ======

  async createReservation(data: unknown) {
    const { data: response } = await this.client.post("/reservations", data);
    return response;
  }

  async getReservations() {
    const { data } = await this.client.get("/reservations");
    return data;
  }

  async getReservationById(id: number) {
    const { data } = await this.client.get(`/reservations/${id}`);
    return data;
  }

  async updateReservation(id: number, data: unknown) {
    const { data: response } = await this.client.patch(
      `/reservations/${id}`,
      data,
    );
    return response;
  }

  async cancelReservation(id: number) {
    const { data } = await this.client.delete(`/reservations/${id}`);
    return data;
  }

  // ====== PAYMENTS ENDPOINTS ======

  async createPayment(reservationId: number, returnUrl: string) {
    const { data } = await this.client.post("/payments", {
      reservationId,
      returnUrl,
    });
    return data;
  }

  async getPaymentStatus(paymentId: number) {
    const { data } = await this.client.get(`/payments/${paymentId}`);
    return data;
  }

  async confirmPayment(kassaPaymentId: string) {
    const { data } = await this.client.post("/payments/confirm", {
      kassaPaymentId,
    });
    return data;
  }

  // ====== MENU ENDPOINTS ======

  async getMenu() {
    const { data } = await this.client.get("/menu");
    return data;
  }

  async getMenuItems() {
    const { data } = await this.client.get("/menu/items");
    return data;
  }

  // ====== RENTALS ENDPOINTS ======

  async getRentals() {
    const { data } = await this.client.get("/rentals");
    return data;
  }

  async createRental(data: unknown) {
    const { data: response } = await this.client.post("/rentals", data);
    return response;
  }
}

export default new ApiClient();
