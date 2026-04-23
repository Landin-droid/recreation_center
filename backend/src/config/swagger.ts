import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API для системы бронирования базы отдыха",
      version: "1.0.0",
      description: "API для системы бронирования базы отдыха",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://pobeda-backend.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Введите JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            statusCode: {
              type: "number",
            },
            message: {
              type: "string",
            },
            timestamp: {
              type: "string",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            userId: {
              type: "integer",
              example: 1,
            },
            fullName: {
              type: "string",
              example: "Иван Петров",
            },
            email: {
              type: "string",
              format: "email",
              example: "ivan@example.com",
            },
            phoneNumber: {
              type: "string",
              nullable: true,
              example: "+79991234567",
            },
            registrationDate: {
              type: "string",
              format: "date-time",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              example: "user",
            },
          },
        },
        Tokens: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              description: "JWT access token для авторизации",
            },
            refreshToken: {
              type: "string",
              description: "Refresh token для обновления access token",
            },
          },
        },
        UserWithTokens: {
          allOf: [
            {
              $ref: "#/components/schemas/User",
            },
            {
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                },
                refreshToken: {
                  type: "string",
                },
              },
            },
          ],
        },
        BookableObject: {
          type: "object",
          properties: {
            id: {
              type: "integer",
            },
            name: {
              type: "string",
              example: "Домик у реки",
            },
            description: {
              type: "string",
            },
            imageUrl: {
              type: "string",
              nullable: true,
            },
          },
        },
        Reservation: {
          type: "object",
          properties: {
            reservationId: {
              type: "integer",
            },
            userId: {
              type: "integer",
            },
            bookableObjectId: {
              type: "integer",
            },
            rentalDateStart: {
              type: "string",
              format: "date-time",
            },
            rentalDateEnd: {
              type: "string",
              format: "date-time",
            },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Payment: {
          type: "object",
          properties: {
            paymentId: {
              type: "string",
            },
            reservationId: {
              type: "integer",
            },
            amount: {
              type: "number",
            },
            status: {
              type: "string",
              enum: ["pending", "succeeded", "failed", "cancelled"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Users",
        description: "Операции с пользователями",
      },
      {
        name: "Bookable Objects",
        description: "Операции с доступными объектами",
      },
      {
        name: "Menu",
        description: "Операции с меню",
      },
      {
        name: "Reservations",
        description: "Операции с бронированиями",
      },
      {
        name: "Rentals",
        description: "Операции с арендами",
      },
      {
        name: "Payments",
        description: "Операции с платежами",
      },
    ],
  },
  apis: ["./src/modules/**/*.routes.ts", "./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);
