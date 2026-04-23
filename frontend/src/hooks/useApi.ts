import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@services/api";

// ====== BOOKABLE OBJECTS HOOKS ======

export const useBookableObjects = () => {
  return useQuery({
    queryKey: ["bookableObjects"],
    queryFn: () => api.getBookableObjects(),
  });
};

export const useBookableObject = (id: number) => {
  return useQuery({
    queryKey: ["bookableObject", id],
    queryFn: () => api.getBookableObjectById(id),
    enabled: !!id,
  });
};

export const useAvailability = (
  bookableObjectId: number,
  startDate: Date,
  endDate: Date,
) => {
  return useQuery({
    queryKey: ["availability", bookableObjectId, startDate, endDate],
    queryFn: () => api.getAvailability(bookableObjectId, startDate, endDate),
    enabled: !!bookableObjectId && !!startDate && !!endDate,
  });
};

// ====== RESERVATIONS HOOKS ======

export const useReservations = () => {
  return useQuery({
    queryKey: ["reservations"],
    queryFn: () => api.getReservations(),
  });
};

export const useReservation = (id: number) => {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => api.getReservationById(id),
    enabled: !!id,
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};

export const useUpdateReservation = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.updateReservation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};

export const useCancelReservation = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};

// ====== PAYMENTS HOOKS ======

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reservationId,
      returnUrl,
    }: {
      reservationId: number;
      returnUrl: string;
    }) => api.createPayment(reservationId, returnUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
};

export const usePaymentStatus = (paymentId: number) => {
  return useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => api.getPaymentStatus(paymentId),
    enabled: !!paymentId,
    refetchInterval: 2000, // Проверять каждые 2 секунды
  });
};

// ====== MENU HOOKS ======

export const useMenu = () => {
  return useQuery({
    queryKey: ["menu"],
    queryFn: () => api.getMenu(),
  });
};

export const useMenuItems = () => {
  return useQuery({
    queryKey: ["menuItems"],
    queryFn: () => api.getMenuItems(),
  });
};

// ====== RENTALS HOOKS ======

export const useRentals = () => {
  return useQuery({
    queryKey: ["rentals"],
    queryFn: () => api.getRentals(),
  });
};

export const useCreateRental = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.createRental(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });
};
