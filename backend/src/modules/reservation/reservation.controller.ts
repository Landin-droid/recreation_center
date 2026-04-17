import { Request, Response } from "express";
import { asyncHandler, parseIdParam } from "../../common/http";
import { reservationService } from "./reservation.service";
import {
  listReservationsQuerySchema,
  reservationSchema,
  updateReservationSchema,
} from "./reservation.validation";
import { paymentService } from "../payment/payment.service";

export const reservationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = listReservationsQuerySchema.parse({
      userId:
        typeof req.query.userId === "string" ? req.query.userId : undefined,
      bookableObjectId:
        typeof req.query.bookableObjectId === "string"
          ? req.query.bookableObjectId
          : undefined,
      status:
        typeof req.query.status === "string" ? req.query.status : undefined,
    });
    const reservations = await reservationService.listReservations(query);
    res.json({ success: true, data: reservations });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "reservation");
    const reservation = await reservationService.getReservationById(id);
    res.json({ success: true, data: reservation });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const payload = reservationSchema.parse(req.body);
    const reservation = await reservationService.createReservation(payload);
    res.status(201).json({ success: true, data: reservation });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "reservation");
    const payload = updateReservationSchema.parse(req.body);
    const reservation = await reservationService.updateReservation(id, payload);
    res.json({ success: true, data: reservation });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "reservation");
    await reservationService.deleteReservation(id);
    res.status(204).send();
  }),

  initiatePayment: asyncHandler(async (req: Request, res: Response) => {
    const id = parseIdParam(String(req.params.id), "reservation");
    const result = await paymentService.initiatePayment(id);
    res.status(201).json({
      success: true,
      data: {
        paymentId: result.paymentId,
        confirmationUrl: result.confirmationUrl,
        paymentDeadline: result.paymentDeadline,
      },
    });
  }),
};
