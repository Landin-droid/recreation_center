import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";

import prisma from "./lib/prisma";
import { errorHandler } from "./middleware/errorHandler";
import mainRouter from "./routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", mainRouter);

// Health check
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use(errorHandler);

export default app;

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// // Graceful shutdown
// process.on("SIGINT", async () => {
//   await prisma.$disconnect();
//   process.exit(0);
// });
