import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { notFoundHandler } from "./common/http";
import prisma from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import mainRouter from "./routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
