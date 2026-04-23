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
            bookableObjectId: {
              type: "integer",
            },
            name: {
              type: "string",
            },
            capacity: {
              type: "integer",
            },
            basePrice: {
              type: "number",
            },
            isSeasonal: {
              type: "boolean",
            },
            seasonStart: {
              type: "string",
              format: "date",
              nullable: true,
            },
            seasonEnd: {
              type: "string",
              format: "date",
              nullable: true,
            },
            description: {
              type: "string",
              nullable: true,
            },
            isActive: {
              type: "boolean",
            },
            type: {
              type: "string",
              enum: [
                "COTTAGE",
                "BANQUET_HALL",
                "GAZEBO",
                "KARAOKE_BAR",
                "OUTDOOR_VENUE",
              ],
            },
          },
        },
        MenuItem: {
          type: "object",
          properties: {
            menuItemId: {
              type: "integer",
            },
            name: {
              type: "string",
            },
            price: {
              type: "number",
            },
            description: {
              type: "string",
              nullable: true,
            },
            isAvailable: {
              type: "boolean",
            },
            category: {
              type: "string",
              enum: ["FOOD", "BEVERAGE", "DESSERT", "OTHER"],
              nullable: true,
            },
          },
        },
        MenuAssignment: {
          type: "object",
          properties: {
            bookableObjectId: {
              type: "integer",
            },
            menuItemId: {
              type: "integer",
            },
            isAvailable: {
              type: "boolean",
            },
          },
        },
        RentalItem: {
          type: "object",
          properties: {
            rentalItemId: {
              type: "integer",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
              nullable: true,
            },
            pricePerHour: {
              type: "number",
              nullable: true,
            },
            maxCapacity: {
              type: "integer",
              nullable: true,
            },
            imageUrl: {
              type: "string",
              nullable: true,
            },
            isActive: {
              type: "boolean",
            },
            category: {
              type: "string",
              enum: ["VEHICLE", "EQUIPMENT", "FURNITURE", "OTHER"],
            },
            seasonType: {
              type: "string",
              enum: ["SUMMER", "WINTER", "YEAR_ROUND"],
              nullable: true,
            },
            isSeasonal: {
              type: "boolean",
            },
          },
        },
        RentalPriceRule: {
          type: "object",
          properties: {
            rentalPriceRuleId: {
              type: "integer",
            },
            rentalItemId: {
              type: "integer",
            },
            pricePerKm: {
              type: "number",
            },
            minKm: {
              type: "integer",
              nullable: true,
            },
            maxKm: {
              type: "integer",
              nullable: true,
            },
            passengerType: {
              type: "string",
              enum: ["ADULT", "CHILD", "SENIOR"],
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
            reservationDate: {
              type: "string",
              format: "date",
            },
            guestsCount: {
              type: "integer",
            },
            notes: {
              type: "string",
              nullable: true,
            },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled"],
            },
            creationDate: {
              type: "string",
              format: "date-time",
            },
            paymentDeadline: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            cancellationReason: {
              type: "string",
              nullable: true,
            },
          },
        },
        ReservationMenuItem: {
          type: "object",
          properties: {
            menuItemId: {
              type: "integer",
            },
            quantity: {
              type: "integer",
            },
          },
        },
        Payment: {
          type: "object",
          properties: {
            paymentId: {
              type: "integer",
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
            kassaPaymentId: {
              type: "string",
              nullable: true,
            },
            cheque_url: {
              type: "string",
              nullable: true,
            },
            paymentDate: {
              type: "string",
              format: "date-time",
            },
          },
        },
        PaymentInitiateResponse: {
          type: "object",
          properties: {
            paymentId: {
              type: "integer",
            },
            confirmationUrl: {
              type: "string",
            },
            paymentDeadline: {
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
