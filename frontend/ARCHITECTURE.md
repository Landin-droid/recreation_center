# Архитектура фронтенда

## 🏗️ Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Router (React Router)                   │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │           Pages (Page Components)              │  │  │
│  │  │ (HomePage, LoginPage, ObjectsPage, etc)        │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Components (Reusable UI)                    │  │
│  │ (Navbar, Layout, Card, Form, etc)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Data Layer (Hooks & State Management)           │  │
│  │                                                      │  │
│  │  useAuth() ──┐                                       │  │
│  │  useApi()  ──┼─→ TanStack Query (Server State)      │  │
│  │  Store    ──┴─→ Zustand (Client State)              │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            API Client (Axios)                        │  │
│  │  • Интерцепторы                                      │  │
│  │  • Добавление токенов                                │  │
│  │  • Обработка ошибок                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Backend API Server                         │  │
│  │  (localhost:3000/api)                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### Authentication Flow

```
1. User enters credentials
   ↓
2. LoginPage/RegisterForm
   ↓
3. useAuth hook calls api.login() or api.register()
   ↓
4. API Client sends request with interceptors
   ↓
5. Backend returns accessToken + refreshToken + user
   ↓
6. Tokens stored in localStorage
   ↓
7. useAuthStore updates user state
   ↓
8. Navigate to /objects or main page
```

### API Request Flow

```
1. Component calls useQuery/useMutation
   ↓
2. TanStack Query executes queryFn
   ↓
3. API Client (api.ts) makes HTTP request
   ↓
4. Request Interceptor adds Authorization header
   ↓
5. Backend processes request
   ↓
6. Response returns to client
   ↓
7. Response Interceptor handles errors (401, etc)
   ↓
8. TanStack Query caches data and updates component
   ↓
9. Component re-renders with new data
```

## 🔄 State Management Strategy

### Zustand (Client State)

- **Что**: Глобальное состояние приложения
- **Где**: `src/store/authStore.ts`
- **Использование**: Только для аутентификации
- **Синхронизация**: Сохранение в localStorage

```tsx
// Use in components
const { user, isAuthenticated } = useAuthStore();
```

### TanStack Query (Server State)

- **Что**: Состояние данных с сервера
- **Где**: `src/hooks/useApi.ts`
- **Использование**: Для всех API запросов
- **Функции**: Кеширование, синхронизация, обновление

```tsx
// Use in components
const { data, isLoading, isError } = useBookableObjects();
const mutation = useCreateReservation();
```

### Local State (React State)

- **Что**: Состояние компонента
- **Использование**: Для UI состояний, форм, фильтров
- **Пример**: `const [isOpen, setIsOpen] = useState(false);`

## 🔐 Authentication Architecture

### Token Management

```
┌─────────────────────┐
│   Backend Server    │
│  (JWT Tokens)       │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ↓             ↓
accessToken  refreshToken
(short-lived) (long-lived)
    │             │
    ↓             ↓
┌──────────────────────────┐
│  localStorage            │
│  - accessToken (session) │
│  - refreshToken (persist)│
└──────────────────────────┘
```

### Interceptor Logic

```
1. Request Interceptor
   └─ Add Authorization: Bearer {accessToken}

2. Response Interceptor
   ├─ 401 Error?
   │  ├─ Clear tokens
   │  └─ Redirect to /login
   └─ Other Error?
      └─ Propagate error
```

## 📱 Component Hierarchy

```
App
├── Router
│   ├── HomePage
│   ├── LoginPage
│   │   └── Layout
│   │       └── LoginForm
│   ├── ObjectsPage
│   │   └── Layout
│   │       ├── ObjectCard
│   │       ├── LoadingSpinner
│   │       └── ErrorMessage
│   └── ...
└── QueryClientProvider
```

## 🎯 Page Structure

```
Page Component
├── Layout
│   ├── Navbar
│   └── Main Content
│       ├── Data Fetching (useQuery)
│       ├── UI Components
│       │   ├── Cards
│       │   ├── Forms
│       │   ├── Buttons
│       │   └── Spinners
│       └── State Management
└── ProtectedRoute (if needed)
```

## 📦 API Integration

### Request Structure

```
api/
├── login (POST /users/login)
├── register (POST /users/register)
├── getCurrentUser (GET /users/me)
├── getBookableObjects (GET /bookable-objects)
├── getReservations (GET /reservations)
├── createReservation (POST /reservations)
├── createPayment (POST /payments)
└── ...
```

### Error Handling

```
Try/Catch
    ↓
API Error Response
    ↓
Error Boundary (future)
    ↓
Display to User
├─ 401 → Redirect to login
├─ 404 → Show not found
├─ 500 → Show error message
└─ Network → Show retry button
```

## 🎨 Styling Strategy

### Tailwind CSS Layers

```
@tailwind base;      ← Reset & defaults
@tailwind components; ← Component classes
@tailwind utilities;  ← Utility classes
```

### Custom Colors

```js
primary: {
  50: '#f0f9ff',
  ...
  600: '#0284c7',
  ...
}
```

### Component Styling Pattern

```tsx
<div className="
  // Layout
  flex gap-4
  // Spacing
  p-6 mb-4
  // Colors
  bg-white text-gray-900
  // States
  hover:shadow-lg
  disabled:opacity-50
  // Responsive
  md:flex-row
">
```

## 🔄 Validation Flow

```
Form Input
    ↓
React Hook Form
    ↓
Zod Schema Validation
    ↓
Real-time Errors
    ↓
User Correction
    ↓
Submit Button (enabled)
    ↓
API Request
    ↓
Backend Validation
    ↓
Success/Error Response
```

## 🚀 Deployment Considerations

### Build Process

```
npm run build
    ↓
TypeScript Compilation
    ↓
Vite Bundle
    ↓
dist/ folder
    ↓
Ready for deployment
```

### Environment Variables

```
VITE_API_BASE_URL=https://api.example.com
VITE_APP_NAME=Pobeda
```

### Performance

- Code splitting by route
- Tree shaking unused code
- CSS purging with Tailwind
- Image optimization
- Lazy loading components

## 📈 Scalability

### Adding New Pages

```
1. Create page component in src/pages/
2. Define types in src/types/
3. Add API methods in src/services/api.ts
4. Create hooks in src/hooks/useApi.ts
5. Add route in src/App.tsx
6. Create components if needed in src/components/
```

### Adding New Features

```
1. Define types
2. Add API methods
3. Create hooks
4. Create components
5. Create pages
6. Add routes
7. Add navigation links
```

## 🧪 Testing Strategy

```
Unit Tests
├── Utility functions (formatters, validators)
└── Hooks (useAuth, useApi)

Component Tests
├── Form validation
├── User interactions
└── State management

Integration Tests
├── Full user flows
├── API integration
└── Navigation

E2E Tests
├── Complete scenarios
└── Cross-browser testing
```

## 📊 Monitoring & Analytics (Optional)

```
Error Tracking: Sentry
Analytics: Google Analytics / Mixpanel
Performance: Lighthouse
Logging: Console / Remote logging
```

## 🔮 Future Architecture

- Error Boundary for error handling
- Suspense for code splitting
- Context API for theme switching
- Redux DevTools for debugging
- Service Workers for offline support
- WebSocket for real-time updates
