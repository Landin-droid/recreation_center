import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cron from "node-cron";
import swaggerUi from "swagger-ui-express";
import { notFoundHandler } from "./common/http";
import prisma from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import mainRouter from "./routes";
import { paymentService } from "./modules/payment/payment.service";
import { specs } from "./config/swagger";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve);
app.get(
  "/api-docs",
  swaggerUi.setup(specs, { swaggerOptions: { url: "/api-docs.json" } }),
);
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

app.use("/api", mainRouter);

app.get("/health", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Cron job для отмены просрочённых платежей (каждую минуту)
cron.schedule("* * * * *", async () => {
  try {
    await paymentService.cancelExpiredReservations();
  } catch (error) {
    console.error("Cron job error (cancelExpiredReservations):", error);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
