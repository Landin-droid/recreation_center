import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import prisma from "./lib/prisma";

const PORT = parseInt(env.PORT) || 5000;

async function startServer() {
  try {
    // Проверка подключения к БД
    await prisma.$connect();
    console.log("✅ Connected to database");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
