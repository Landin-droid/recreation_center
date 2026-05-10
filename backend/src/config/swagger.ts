import swaggerJsdoc from "swagger-jsdoc";

const ok = (schema: Record<string, unknown>, description = "Успешный ответ") => ({
  description,
  content: {
    "application/json": {
      schema: {
        allOf: [
          { $ref: "#/components/schemas/ApiSuccess" },
          {
            type: "object",
            properties: {
              data: schema,
            },
          },
        ],
      },
    },
  },
});

const created = (schema: Record<string, unknown>, description = "Ресурс создан") =>
  ok(schema, description);

const errorResponses = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  404: { $ref: "#/components/responses/NotFound" },
  409: { $ref: "#/components/responses/Conflict" },
  500: { $ref: "#/components/responses/InternalServerError" },
};

const authSecurity = [{ cookieAuth: [] }, { bearerAuth: [] }];

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pobeda Recreation Center API",
      version: "1.0.0",
      description:
        "REST API для системы бронирования базы отдыха: пользователи, объекты бронирования, меню, прокат, бронирования, платежи ЮKassa, возвраты и чеки.",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Локальный backend",
      },
      {
        url: "https://pobeda-backend.onrender.com",
        description: "Production backend",
      },
    ],
    tags: [
      { name: "Auth", description: "Регистрация, вход, обновление cookie-сессии и восстановление пароля" },
      { name: "Users", description: "Профили пользователей" },
      { name: "Bookable Objects", description: "Объекты базы отдыха, доступные для бронирования" },
      { name: "Menu", description: "Позиции меню и привязка меню к объектам" },
      { name: "Reservations", description: "Создание, просмотр, изменение и отмена бронирований" },
      { name: "Rentals", description: "Прокат и правила расчета цены" },
      { name: "Payments", description: "Платежи, статусы, PDF-чеки и webhooks" },
      { name: "Refunds", description: "Возвраты средств" },
      { name: "System", description: "Служебные endpoints" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description:
            "HttpOnly cookie с access-токеном. Основной способ авторизации frontend-клиента.",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Альтернативная авторизация через заголовок Authorization: Bearer <token>.",
        },
      },
      parameters: {
        Id: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Идентификатор ресурса.",
        },
        PaymentId: {
          in: "path",
          name: "paymentId",
          required: true,
          schema: { type: "integer", minimum: 1 },
        },
        RefundId: {
          in: "path",
          name: "refundId",
          required: true,
          schema: { type: "integer", minimum: 1 },
        },
      },
      responses: {
        BadRequest: {
          description: "Некорректные параметры или ошибка валидации",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        Unauthorized: {
          description: "Пользователь не авторизован или токен недействителен",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        NotFound: {
          description: "Ресурс не найден",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        Conflict: {
          description: "Конфликт данных, например нарушение уникальности email",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        InternalServerError: {
          description: "Внутренняя ошибка сервера",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
      schemas: {
        ApiSuccess: {
          type: "object",
          required: ["success"],
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation completed" },
          },
        },
        ApiError: {
          type: "object",
          required: ["success", "error"],
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Validation error" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string", example: "email" },
                  message: { type: "string", example: "Invalid email address" },
                },
              },
            },
            meta: { type: "object", additionalProperties: true },
          },
        },
        User: {
          type: "object",
          required: ["userId", "fullName", "email", "registrationDate", "role"],
          properties: {
            userId: { type: "integer", example: 1 },
            fullName: { type: "string", example: "Иванов Иван Иванович" },
            email: { type: "string", format: "email", example: "ivan@example.com" },
            phoneNumber: { type: "string", nullable: true, example: "+79001234567" },
            registrationDate: { type: "string", format: "date-time" },
            role: { type: "string", enum: ["admin", "staff", "user"], example: "user" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: { type: "string", minLength: 2, example: "Иванов Иван Иванович" },
            email: { type: "string", format: "email", example: "ivan@example.com" },
            password: {
              type: "string",
              minLength: 8,
              example: "Password123",
              description: "Минимум 8 символов, одна заглавная, одна строчная буква и одна цифра.",
            },
            phoneNumber: { type: "string", example: "+79001234567" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "ivan@example.com" },
            password: { type: "string", example: "Password123" },
          },
        },
        Tokens: {
          type: "object",
          required: ["accessToken", "refreshToken"],
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email", example: "ivan@example.com" },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["token", "password"],
          properties: {
            token: { type: "string", example: "reset-token" },
            password: { type: "string", minLength: 8, example: "NewPassword123" },
          },
        },
        BookableObjectType: {
          type: "string",
          enum: ["cottage", "gazebo", "banquet_hall", "outdoor_venue", "karaoke_bar"],
        },
        BookableObjectDetails: {
          type: "object",
          properties: {
            amenities: { type: "string", example: "мангал, электричество" },
            squareMeters: { type: "integer", minimum: 1 },
            maxTables: { type: "integer", minimum: 1 },
            tablesAmount: { type: "integer", minimum: 1 },
          },
        },
        BookableObjectMenuItem: {
          type: "object",
          properties: {
            menuItemId: { type: "integer", example: 1 },
            isAvailable: { type: "boolean", example: true },
            menuItem: { $ref: "#/components/schemas/MenuItem" },
          },
        },
        BookableObject: {
          type: "object",
          properties: {
            bookableObjectId: { type: "integer", example: 1 },
            name: { type: "string", example: "Домик у озера" },
            capacity: { type: "integer", example: 5 },
            basePrice: { type: "number", example: 5000 },
            isSeasonal: { type: "boolean", example: false },
            seasonStart: { type: "string", format: "date", nullable: true },
            seasonEnd: { type: "string", format: "date", nullable: true },
            description: { type: "string", nullable: true },
            isActive: { type: "boolean", example: true },
            imageUrls: {
              type: "array",
              items: { type: "string", format: "uri" },
            },
            type: { $ref: "#/components/schemas/BookableObjectType" },
            details: { $ref: "#/components/schemas/BookableObjectDetails" },
            menuItems: {
              type: "array",
              items: { $ref: "#/components/schemas/BookableObjectMenuItem" },
            },
          },
        },
        BookableObjectRequest: {
          type: "object",
          required: ["name", "capacity", "basePrice", "type"],
          properties: {
            name: { type: "string", minLength: 2, example: "Домик у озера" },
            capacity: { type: "integer", minimum: 1, example: 5 },
            basePrice: { type: "number", example: 5000 },
            isSeasonal: { type: "boolean", default: false },
            seasonStart: { type: "string", format: "date", nullable: true },
            seasonEnd: { type: "string", format: "date", nullable: true },
            description: { type: "string", nullable: true },
            isActive: { type: "boolean", default: true },
            imageUrls: {
              type: "array",
              items: { type: "string", format: "uri" },
              default: [],
            },
            type: { $ref: "#/components/schemas/BookableObjectType" },
            details: { $ref: "#/components/schemas/BookableObjectDetails" },
          },
        },
        MenuCategory: {
          type: "string",
          enum: ["food", "drink", "snack", "dessert"],
        },
        MenuItem: {
          type: "object",
          properties: {
            menuItemId: { type: "integer", example: 1 },
            name: { type: "string", example: "Плов" },
            price: { type: "number", example: 450 },
            description: { type: "string", nullable: true },
            isAvailable: { type: "boolean", example: true },
            category: {
              allOf: [{ $ref: "#/components/schemas/MenuCategory" }],
              nullable: true,
            },
            availableIn: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bookableObjectId: { type: "integer" },
                  objectName: { type: "string" },
                  objectType: { $ref: "#/components/schemas/BookableObjectType" },
                  isAvailable: { type: "boolean" },
                },
              },
            },
          },
        },
        MenuItemRequest: {
          type: "object",
          required: ["name", "price"],
          properties: {
            name: { type: "string", minLength: 2, example: "Плов" },
            price: { type: "number", example: 450 },
            description: { type: "string", nullable: true },
            isAvailable: { type: "boolean", default: true },
            category: {
              allOf: [{ $ref: "#/components/schemas/MenuCategory" }],
              nullable: true,
            },
          },
        },
        MenuAssignment: {
          type: "object",
          properties: {
            bookableObjectId: { type: "integer", example: 1 },
            menuItemId: { type: "integer", example: 2 },
            isAvailable: { type: "boolean", example: true },
          },
        },
        RentalItem: {
          type: "object",
          properties: {
            rentalItemId: { type: "integer", example: 1 },
            name: { type: "string", example: "Снегоход" },
            description: { type: "string", nullable: true },
            pricePerHour: { type: "number", nullable: true, example: 1500 },
            isSeasonal: { type: "boolean", example: true },
            maxCapacity: { type: "integer", nullable: true, example: 2 },
            imageUrl: { type: "string", format: "uri", nullable: true },
            isActive: { type: "boolean", example: true },
            category: {
              type: "string",
              enum: ["ski", "tube", "snowmobile", "skates"],
            },
            seasonType: {
              type: "string",
              enum: ["winter", "summer", "year"],
              nullable: true,
            },
            priceRules: {
              type: "array",
              items: { $ref: "#/components/schemas/RentalPriceRule" },
            },
          },
        },
        RentalItemRequest: {
          type: "object",
          required: ["name", "category"],
          properties: {
            name: { type: "string", minLength: 2, example: "Снегоход" },
            description: { type: "string", nullable: true },
            pricePerHour: { type: "number", nullable: true, example: 1500 },
            isSeasonal: { type: "boolean" },
            maxCapacity: { type: "integer", nullable: true },
            imageUrl: { type: "string", format: "uri" },
            isActive: { type: "boolean" },
            category: {
              type: "string",
              enum: ["ski", "tube", "snowmobile", "skates"],
            },
            seasonType: {
              type: "string",
              enum: ["winter", "summer", "year"],
              nullable: true,
            },
          },
        },
        RentalPriceRule: {
          type: "object",
          properties: {
            ruleId: { type: "integer", example: 1 },
            rentalPriceRuleId: { type: "integer", example: 1 },
            rentalItemId: { type: "integer", example: 1 },
            pricePerKm: { type: "number", example: 150 },
            minKm: { type: "integer", example: 1 },
            maxKm: { type: "number", nullable: true, example: 2 },
            passengerType: { type: "string", enum: ["adult", "child"] },
          },
        },
        RentalPriceRuleRequest: {
          type: "object",
          required: ["rentalItemId", "pricePerKm", "passengerType"],
          properties: {
            rentalItemId: { type: "integer", minimum: 1 },
            pricePerKm: { type: "number", minimum: 0, exclusiveMinimum: true },
            minKm: { type: "integer", minimum: 1, default: 1 },
            maxKm: { type: "number", nullable: true },
            passengerType: { type: "string", enum: ["adult", "child"] },
          },
        },
        ReservationMenuItemRequest: {
          type: "object",
          required: ["menuItemId", "quantity"],
          properties: {
            menuItemId: { type: "integer", minimum: 1 },
            quantity: { type: "integer", minimum: 1 },
          },
        },
        ReservationMenuItem: {
          type: "object",
          properties: {
            menuItemId: { type: "integer" },
            quantity: { type: "integer" },
            itemCost: { type: "number" },
            menuItem: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
              },
            },
          },
        },
        ReservationRequest: {
          type: "object",
          required: ["userId", "bookableObjectId", "reservationDate", "guestsCount"],
          properties: {
            userId: { type: "integer", minimum: 1 },
            bookableObjectId: { type: "integer", minimum: 1 },
            reservationDate: {
              type: "string",
              format: "date",
              example: "2026-05-15",
            },
            guestsCount: { type: "integer", minimum: 1 },
            notes: { type: "string" },
            menuItems: {
              type: "array",
              items: { $ref: "#/components/schemas/ReservationMenuItemRequest" },
            },
          },
        },
        Reservation: {
          type: "object",
          properties: {
            reservationId: { type: "integer", example: 1 },
            reservationDate: { type: "string", format: "date-time" },
            creationDate: { type: "string", format: "date-time" },
            guestsCount: { type: "integer", example: 4 },
            totalSum: { type: "number", example: 6800 },
            notes: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["pending", "paid", "canceled", "expired", "refunded"],
            },
            paymentDeadline: { type: "string", format: "date-time", nullable: true },
            user: {
              type: "object",
              properties: {
                userId: { type: "integer" },
                fullName: { type: "string" },
                email: { type: "string", format: "email" },
                phoneNumber: { type: "string", nullable: true },
              },
            },
            bookableObject: {
              type: "object",
              properties: {
                bookableObjectId: { type: "integer" },
                name: { type: "string" },
                type: { $ref: "#/components/schemas/BookableObjectType" },
                basePrice: { type: "number" },
              },
            },
            menuItems: {
              type: "array",
              items: { $ref: "#/components/schemas/ReservationMenuItem" },
            },
            payment: {
              allOf: [{ $ref: "#/components/schemas/Payment" }],
              nullable: true,
            },
          },
        },
        CancelReservationResult: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["canceled", "refund_started", "refunded"],
            },
            reservation: { $ref: "#/components/schemas/Reservation" },
            refund: {
              allOf: [{ $ref: "#/components/schemas/Refund" }],
              nullable: true,
            },
          },
        },
        Payment: {
          type: "object",
          properties: {
            paymentId: { type: "integer", example: 1 },
            reservationId: { type: "integer", example: 1 },
            amount: { type: "number", example: 6800 },
            status: { type: "string", enum: ["pending", "succeeded", "canceled"] },
            method: {
              type: "string",
              enum: ["bank_card", "yoo_money", "sberbank", "alfa_pay", "tinkoff_bank", "sbp", "cash"],
              nullable: true,
            },
            kassaPaymentId: { type: "string", nullable: true },
            receipt: {
              allOf: [{ $ref: "#/components/schemas/Receipt" }],
              nullable: true,
            },
            refund: {
              allOf: [{ $ref: "#/components/schemas/Refund" }],
              nullable: true,
            },
          },
        },
        CreatePaymentRequest: {
          type: "object",
          required: ["reservationId"],
          properties: {
            reservationId: { type: "integer", minimum: 1, example: 1 },
          },
        },
        PaymentInitiation: {
          type: "object",
          properties: {
            paymentId: { type: "integer", example: 1 },
            confirmationUrl: {
              type: "string",
              format: "uri",
              example: "https://yoomoney.ru/checkout/payments/v2/contract",
            },
            paymentDeadline: { type: "string", format: "date-time" },
          },
        },
        Refund: {
          type: "object",
          properties: {
            refundId: { type: "integer", example: 1 },
            paymentId: { type: "integer", example: 1 },
            refundAmount: { type: "number", example: 6800 },
            amount: { type: "string", example: "6800" },
            status: { type: "string", enum: ["pending", "succeeded", "canceled"] },
            kassaRefundId: { type: "string", nullable: true },
            receipt: {
              allOf: [{ $ref: "#/components/schemas/Receipt" }],
              nullable: true,
            },
          },
        },
        CreateRefundRequest: {
          type: "object",
          required: ["paymentId"],
          properties: {
            paymentId: { type: "integer", minimum: 1, example: 1 },
            reason: {
              type: "string",
              minLength: 3,
              maxLength: 250,
              example: "Отмена пользователем",
            },
          },
        },
        Receipt: {
          type: "object",
          properties: {
            receiptId: { type: "string" },
            type: { type: "string", enum: ["payment", "refund"] },
            typeLabel: { type: "string" },
            status: { type: "string", nullable: true },
            statusLabel: { type: "string" },
            amount: { type: "string", nullable: true },
            currency: { type: "string", example: "RUB" },
            registeredAt: { type: "string", nullable: true },
            fiscalDocumentNumber: { type: "string", nullable: true },
            fiscalStorageNumber: { type: "string", nullable: true },
            fiscalAttribute: { type: "string", nullable: true },
            fiscalProviderId: { type: "string", nullable: true },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { oneOf: [{ type: "number" }, { type: "string" }] },
                  amount: { type: "string" },
                  currency: { type: "string" },
                },
              },
            },
            canOpenPdf: { type: "boolean" },
            pdfUrl: { type: "string", nullable: true },
          },
        },
        WebhookPayload: {
          type: "object",
          required: ["type", "event", "object"],
          properties: {
            type: { type: "string", example: "notification" },
            event: {
              type: "string",
              enum: [
                "payment.succeeded",
                "payment.canceled",
                "payment.waiting_for_capture",
                "refund.succeeded",
              ],
            },
            object: {
              type: "object",
              required: ["id", "status"],
              properties: {
                id: { type: "string", example: "2e8f0c2a-000f-5000-9000-1d2df3c5c0aa" },
                status: { type: "string", example: "succeeded" },
              },
              additionalProperties: true,
            },
          },
        },
        Health: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            database: { type: "string", example: "connected" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["System"],
          summary: "Проверить состояние backend и подключение к базе данных",
          responses: {
            200: {
              description: "Сервис доступен",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Health" },
                },
              },
            },
            500: { $ref: "#/components/responses/InternalServerError" },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Зарегистрировать пользователя",
          description:
            "Создает пользователя, выпускает access/refresh токены и устанавливает их в HttpOnly cookie.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/User" }, "Пользователь зарегистрирован"),
            ...errorResponses,
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Войти в систему",
          description:
            "Проверяет email и пароль, после чего устанавливает access/refresh токены в HttpOnly cookie.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/User" }, "Вход выполнен"),
            ...errorResponses,
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Обновить access/refresh токены",
          description:
            "Использует refreshToken из HttpOnly cookie. Также поддерживает refreshToken в теле запроса для технических клиентов.",
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/Tokens" }, "Токены обновлены"),
            ...errorResponses,
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Выйти из системы",
          security: authSecurity,
          responses: {
            200: {
              description: "Сессия завершена",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/ApiSuccess" },
                      {
                        type: "object",
                        properties: {
                          message: { type: "string", example: "Successfully logged out" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            ...errorResponses,
          },
        },
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Запросить токен восстановления пароля",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
              },
            },
          },
          responses: {
            200: ok({
              type: "object",
              properties: {
                resetToken: { type: "string", nullable: true },
              },
            }),
            ...errorResponses,
          },
        },
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Установить новый пароль по reset-токену",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Пароль изменен",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiSuccess" },
                },
              },
            },
            ...errorResponses,
          },
        },
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "Получить список пользователей",
          responses: {
            200: ok({ type: "array", items: { $ref: "#/components/schemas/User" } }),
            ...errorResponses,
          },
        },
      },
      "/api/users/profile": {
        get: {
          tags: ["Users"],
          summary: "Получить профиль текущего пользователя",
          security: authSecurity,
          responses: {
            200: ok({ $ref: "#/components/schemas/User" }),
            ...errorResponses,
          },
        },
      },
      "/api/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Получить пользователя по ID",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            200: ok({ $ref: "#/components/schemas/User" }),
            ...errorResponses,
          },
        },
        put: {
          tags: ["Users"],
          summary: "Обновить пользователя",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    fullName: { type: "string", minLength: 2 },
                    email: { type: "string", format: "email" },
                    phoneNumber: { type: "string", example: "+79001234567" },
                  },
                },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/User" }),
            ...errorResponses,
          },
        },
        delete: {
          tags: ["Users"],
          summary: "Удалить пользователя",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            204: { description: "Пользователь удален" },
            ...errorResponses,
          },
        },
      },
      "/api/bookable-objects": {
        get: {
          tags: ["Bookable Objects"],
          summary: "Получить список объектов бронирования",
          parameters: [
            {
              in: "query",
              name: "type",
              schema: { $ref: "#/components/schemas/BookableObjectType" },
              description: "Фильтр по типу объекта.",
            },
            {
              in: "query",
              name: "isActive",
              schema: { type: "string", enum: ["true", "false"] },
              description: "Фильтр по активности объекта.",
            },
          ],
          responses: {
            200: ok({ type: "array", items: { $ref: "#/components/schemas/BookableObject" } }),
            ...errorResponses,
          },
        },
        post: {
          tags: ["Bookable Objects"],
          summary: "Создать объект бронирования",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookableObjectRequest" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/BookableObject" }),
            ...errorResponses,
          },
        },
      },
      "/api/bookable-objects/{id}": {
        get: {
          tags: ["Bookable Objects"],
          summary: "Получить объект бронирования по ID",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            200: ok({ $ref: "#/components/schemas/BookableObject" }),
            ...errorResponses,
          },
        },
        put: {
          tags: ["Bookable Objects"],
          summary: "Обновить объект бронирования",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookableObjectRequest" },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/BookableObject" }),
            ...errorResponses,
          },
        },
        delete: {
          tags: ["Bookable Objects"],
          summary: "Удалить объект бронирования",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            204: { description: "Объект удален" },
            ...errorResponses,
          },
        },
      },
      "/api/menu/items": {
        get: {
          tags: ["Menu"],
          summary: "Получить список позиций меню",
          responses: {
            200: ok({ type: "array", items: { $ref: "#/components/schemas/MenuItem" } }),
            ...errorResponses,
          },
        },
        post: {
          tags: ["Menu"],
          summary: "Создать позицию меню",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MenuItemRequest" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/MenuItem" }),
            ...errorResponses,
          },
        },
      },
      "/api/menu/items/{id}": {
        get: {
          tags: ["Menu"],
          summary: "Получить позицию меню по ID",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            200: ok({ $ref: "#/components/schemas/MenuItem" }),
            ...errorResponses,
          },
        },
        put: {
          tags: ["Menu"],
          summary: "Обновить позицию меню",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MenuItemRequest" },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/MenuItem" }),
            ...errorResponses,
          },
        },
        delete: {
          tags: ["Menu"],
          summary: "Удалить позицию меню",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            204: { description: "Позиция меню удалена" },
            ...errorResponses,
          },
        },
      },
      "/api/menu/assignments": {
        get: {
          tags: ["Menu"],
          summary: "Получить привязки меню к объектам",
          parameters: [
            {
              in: "query",
              name: "bookableObjectId",
              schema: { type: "integer", minimum: 1 },
            },
          ],
          responses: {
            200: ok({ type: "array", items: { $ref: "#/components/schemas/MenuAssignment" } }),
            ...errorResponses,
          },
        },
        post: {
          tags: ["Menu"],
          summary: "Создать или обновить привязку меню к объекту",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MenuAssignment" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/MenuAssignment" }),
            ...errorResponses,
          },
        },
      },
      "/api/menu/assignments/{bookableObjectId}/{menuItemId}": {
        delete: {
          tags: ["Menu"],
          summary: "Удалить привязку меню к объекту",
          parameters: [
            {
              in: "path",
              name: "bookableObjectId",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
            {
              in: "path",
              name: "menuItemId",
              required: true,
              schema: { type: "integer", minimum: 1 },
            },
          ],
          responses: {
            204: { description: "Привязка удалена" },
            ...errorResponses,
          },
        },
      },
      "/api/reservations": {
        get: {
          tags: ["Reservations"],
          summary: "Получить список бронирований",
          security: authSecurity,
          parameters: [
            { in: "query", name: "userId", schema: { type: "integer", minimum: 1 } },
            { in: "query", name: "bookableObjectId", schema: { type: "integer", minimum: 1 } },
            {
              in: "query",
              name: "status",
              schema: {
                type: "string",
                enum: ["pending", "paid", "canceled", "expired", "refunded"],
              },
            },
          ],
          responses: {
            200: ok({ type: "array", items: { $ref: "#/components/schemas/Reservation" } }),
            ...errorResponses,
          },
        },
        post: {
          tags: ["Reservations"],
          summary: "Создать бронирование",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReservationRequest" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/Reservation" }),
            ...errorResponses,
          },
        },
      },
      "/api/reservations/{id}": {
        get: {
          tags: ["Reservations"],
          summary: "Получить бронирование по ID",
          security: authSecurity,
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            200: ok({ $ref: "#/components/schemas/Reservation" }),
            ...errorResponses,
          },
        },
        put: {
          tags: ["Reservations"],
          summary: "Обновить бронирование",
          security: authSecurity,
          parameters: [{ $ref: "#/components/parameters/Id" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReservationRequest" },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/Reservation" }),
            ...errorResponses,
          },
        },
        patch: {
          tags: ["Reservations"],
          summary: "Отменить бронирование или запустить возврат",
          description:
            "Для неоплаченного бронирования выполняет отмену. Для оплаченного бронирования может инициировать возврат через платежный модуль.",
          security: authSecurity,
          parameters: [{ $ref: "#/components/parameters/Id" }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reason: { type: "string", example: "Отмена пользователем" },
                  },
                },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/CancelReservationResult" }),
            ...errorResponses,
          },
        },
        delete: {
          tags: ["Reservations"],
          summary: "Удалить бронирование",
          security: authSecurity,
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            204: { description: "Бронирование удалено" },
            ...errorResponses,
          },
        },
      },
      "/api/rentals/items": {
        get: {
          tags: ["Rentals"],
          summary: "Получить список предметов проката",
          responses: {
            200: ok({ type: "array", items: { $ref: "#/components/schemas/RentalItem" } }),
            ...errorResponses,
          },
        },
        post: {
          tags: ["Rentals"],
          summary: "Создать предмет проката",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RentalItemRequest" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/RentalItem" }),
            ...errorResponses,
          },
        },
      },
      "/api/rentals/items/{id}": {
        get: {
          tags: ["Rentals"],
          summary: "Получить предмет проката по ID",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            200: ok({ $ref: "#/components/schemas/RentalItem" }),
            ...errorResponses,
          },
        },
        put: {
          tags: ["Rentals"],
          summary: "Обновить предмет проката",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RentalItemRequest" },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/RentalItem" }),
            ...errorResponses,
          },
        },
        delete: {
          tags: ["Rentals"],
          summary: "Удалить предмет проката",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            204: { description: "Предмет проката удален" },
            ...errorResponses,
          },
        },
      },
      "/api/rentals/price-rules": {
        get: {
          tags: ["Rentals"],
          summary: "Получить правила расчета цены проката",
          parameters: [
            { in: "query", name: "rentalItemId", schema: { type: "integer", minimum: 1 } },
          ],
          responses: {
            200: ok({ type: "array", items: { $ref: "#/components/schemas/RentalPriceRule" } }),
            ...errorResponses,
          },
        },
        post: {
          tags: ["Rentals"],
          summary: "Создать правило расчета цены проката",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RentalPriceRuleRequest" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/RentalPriceRule" }),
            ...errorResponses,
          },
        },
      },
      "/api/rentals/price-rules/{id}": {
        put: {
          tags: ["Rentals"],
          summary: "Обновить правило расчета цены проката",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RentalPriceRuleRequest" },
              },
            },
          },
          responses: {
            200: ok({ $ref: "#/components/schemas/RentalPriceRule" }),
            ...errorResponses,
          },
        },
        delete: {
          tags: ["Rentals"],
          summary: "Удалить правило расчета цены проката",
          parameters: [{ $ref: "#/components/parameters/Id" }],
          responses: {
            204: { description: "Правило удалено" },
            ...errorResponses,
          },
        },
      },
      "/api/payments": {
        post: {
          tags: ["Payments"],
          summary: "Создать платеж для бронирования",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreatePaymentRequest" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/PaymentInitiation" }, "Платеж создан"),
            ...errorResponses,
          },
        },
      },
      "/api/payments/{paymentId}": {
        get: {
          tags: ["Payments"],
          summary: "Получить платеж по ID",
          security: authSecurity,
          parameters: [{ $ref: "#/components/parameters/PaymentId" }],
          responses: {
            200: ok({ $ref: "#/components/schemas/Payment" }),
            ...errorResponses,
          },
        },
        patch: {
          tags: ["Payments"],
          summary: "Обновить статус платежа из ЮKassa и вернуть актуальные данные",
          security: authSecurity,
          parameters: [{ $ref: "#/components/parameters/PaymentId" }],
          responses: {
            200: ok({ $ref: "#/components/schemas/Payment" }),
            ...errorResponses,
          },
        },
      },
      "/api/payments/receipts/{receiptId}/pdf": {
        get: {
          tags: ["Payments"],
          summary: "Получить PDF-файл чека",
          security: authSecurity,
          parameters: [
            {
              in: "path",
              name: "receiptId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "PDF-файл чека",
              content: {
                "application/pdf": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            ...errorResponses,
          },
        },
      },
      "/api/payments/webhook": {
        post: {
          tags: ["Payments"],
          summary: "Webhook платежей",
          description: "Обрабатывает события платежей от платежного провайдера.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WebhookPayload" },
              },
            },
          },
          responses: {
            200: { description: "Webhook обработан" },
            ...errorResponses,
          },
        },
      },
      "/api/refunds": {
        post: {
          tags: ["Refunds"],
          summary: "Создать возврат по платежу",
          security: authSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateRefundRequest" },
              },
            },
          },
          responses: {
            201: created({ $ref: "#/components/schemas/Refund" }, "Возврат создан"),
            ...errorResponses,
          },
        },
      },
      "/api/refunds/{refundId}": {
        get: {
          tags: ["Refunds"],
          summary: "Получить возврат по ID",
          security: authSecurity,
          parameters: [{ $ref: "#/components/parameters/RefundId" }],
          responses: {
            200: ok({ $ref: "#/components/schemas/Refund" }),
            ...errorResponses,
          },
        },
      },
      "/api/refunds/webhook": {
        post: {
          tags: ["Refunds"],
          summary: "Webhook возвратов",
          description: "Обрабатывает события возвратов от платежного провайдера.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WebhookPayload" },
              },
            },
          },
          responses: {
            200: { description: "Webhook обработан" },
            ...errorResponses,
          },
        },
      },
      "/api/webhooks/yookassa": {
        post: {
          tags: ["Payments", "Refunds"],
          summary: "Единый webhook ЮKassa для платежей и возвратов",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WebhookPayload" },
              },
            },
          },
          responses: {
            200: { description: "Webhook обработан" },
            ...errorResponses,
          },
        },
      },
    },
  },
  apis: [],
};

export const specs = swaggerJsdoc(options);
