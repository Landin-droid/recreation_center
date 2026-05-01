# Гайд по разработке фронтенда

## 📂 Структура проекта

### `src/components/`

Переиспользуемые компоненты UI, которые не привязаны к конкретной странице.

**Структура компонента:**

```tsx
interface ComponentProps {
  // Props description
}

export const Component = ({ prop1, prop2 }: ComponentProps) => {
  return <div>Component</div>;
};
```

**Примеры компонентов:**

- `Navbar.tsx` - навигационная панель
- `Layout.tsx` - основной макет
- `ObjectCard.tsx` - карточка объекта
- `LoadingSpinner.tsx` - индикатор загрузки
- `ErrorMessage.tsx` - отображение ошибок
- `FormElements.tsx` - элементы формы
- `UI.tsx` - базовые UI компоненты

### `src/pages/`

Страницы приложения, которые маршрутизируются через React Router.

**Структура страницы:**

```tsx
export const PageName = () => {
  const { data, isLoading, isError } = useQuery();

  return <Layout>Content</Layout>;
};
```

**Основные страницы:**

- `HomePage.tsx` - главная страница
- `LoginPage.tsx` - страница входа
- `RegisterPage.tsx` - страница регистрации
- `ObjectsPage.tsx` - каталог объектов
- `ObjectDetailPage.tsx` - детали объекта
- `ReservationsPage.tsx` - список бронирований
- `ReservationDetailPage.tsx` - детали бронирования
- `ProfilePage.tsx` - профиль пользователя
- `MenuPage.tsx` - меню услуг

### `src/services/`

API клиент для взаимодействия с сервером.

**Использование:**

```tsx
import api from "@services/api";

await api.login(credentials);
const data = await api.getBookableObjects();
```

### `src/hooks/`

Кастомные React хуки для логики приложения.

**`useAuth.ts`** - хук для работы с аутентификацией

```tsx
const { user, isAuthenticated, login, register, logout } = useAuth();
```

**`useApi.ts`** - хуки для работы с API через TanStack Query

```tsx
const { data, isLoading, isError } = useBookableObjects();
const createReservation = useCreateReservation();
```

### `src/store/`

Глобальное состояние приложения через Zustand.

**`authStore.ts`** - хранилище аутентификации

```tsx
const { user, setUser, logout } = useAuthStore();
```

### `src/types/`

TypeScript типы для всего приложения.

**Типы включают:**

- User типы
- Reservation типы
- Payment типы
- API Response типы

### `src/utils/`

Вспомогательные функции и утилиты.

**`formatters.ts`** - функции форматирования

```tsx
formatCurrency(100); // "100,00 ₽"
formatDate(new Date()); // "23 апреля 2026 г."
getDaysDifference(start, end); // Количество дней
```

## 🎯 Основные практики

### Компоненты

1. **Функциональные компоненты** - используем стрелочные функции

```tsx
export const MyComponent = () => {
  return <div>Component</div>;
};
```

2. **Props типизация** - всегда используем TypeScript интерфейсы

```tsx
interface MyComponentProps {
  title: string;
  onClick: () => void;
  isLoading?: boolean;
}

export const MyComponent = ({
  title,
  onClick,
  isLoading,
}: MyComponentProps) => {
  // ...
};
```

3. **Обработка состояний** - используем стандартные состояния

```tsx
const { data, isLoading, isError, error } = useQuery();

if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage message={error?.message} />;
return <div>{data}</div>;
```

### API запросы

1. **Используем TanStack Query** для кеширования и управления состоянием

```tsx
const { data } = useQuery({
  queryKey: ["key"],
  queryFn: () => api.fetch(),
});
```

2. **Используем Zustand** для глобального состояния (только для аутентификации)

```tsx
const { user } = useAuthStore();
```

3. **Интерцепторы** автоматически добавляют токен и обрабатывают 401 ошибки

### Формы

1. **React Hook Form + Zod** для валидации

```tsx
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(schema),
});
```

2. **Одна форма - один компонент**

```tsx
export const LoginForm = ({ onSubmit }: LoginFormProps) => {
  // ...
};
```

### Стили

1. **Tailwind CSS** для всех стилей

```tsx
<div className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
  Button
</div>
```

2. **Кастомные цвета** в `tailwind.config.js`

```js
colors: {
  primary: { /* ... */ },
}
```

3. **Глобальные стили** в `src/index.css`

## 🔄 Лучшие практики

### 1. Файловая структура

```
src/
├── components/
│   ├── Navbar.tsx
│   ├── UI.tsx
│   └── ...
├── pages/
│   ├── HomePage.tsx
│   └── ...
└── ...
```

### 2. Импорты используют alias

```tsx
// ✅ Хорошо
import { Component } from "@components/Component";
import { useAuth } from "@hooks/useAuth";
import { User } from "@types/index";

// ❌ Плохо
import Component from "../../../components/Component";
```

### 3. Обработка ошибок

```tsx
try {
  await api.login(data);
} catch (error) {
  setError(error.response?.data?.message || "Error");
}
```

### 4. Loading состояния

```tsx
<button disabled={isLoading} className="disabled:opacity-50">
  {isLoading ? "Загрузка..." : "Отправить"}
</button>
```

### 5. Валидация

```tsx
const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 chars"),
});
```

### 6. Типизация событий

```tsx
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // ...
};
```

## 📚 Используемые библиотеки

### React Router

```tsx
import { useNavigate, useParams } from "react-router-dom";

const navigate = useNavigate();
const { id } = useParams();
```

### TanStack Query

```tsx
const { data, isLoading, error } = useQuery({ ... });
const mutation = useMutation({ ... });
```

### React Hook Form

```tsx
const { register, handleSubmit } = useForm();
```

### Zod

```tsx
const schema = z.object({
  /* ... */
});
```

### Zustand

```tsx
const { user } = useAuthStore();
```

### Tailwind CSS

```tsx
<div className="flex gap-4 p-6 bg-white rounded-lg shadow-md">
```

## 🚀 Запуск и сборка

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Проверка типов
npm run type-check

# Линтинг
npm run lint
```

## 🧪 Тестирование компонентов

Примеры использования компонентов находятся в `src/pages/ComponentExamples.tsx`

## 📝 Именование

- **Компоненты**: PascalCase (`MyComponent.tsx`)
- **Файлы функций**: camelCase (`useAuth.ts`, `formatters.ts`)
- **Переменные**: camelCase (`const userName`)
- **Константы**: UPPER_SNAKE_CASE (`const API_BASE_URL`)

## 🔍 Debugging

1. **React DevTools** - установить расширение браузера
2. **Redux DevTools** - для Zustand
3. **Network tab** - для отладки API
4. **Console** - для логирования

## 📦 Добавление новых зависимостей

```bash
npm install package-name
```

После добавления обновить типы если необходимо:

```bash
npm install --save-dev @types/package-name
```

## 🎨 Цветовая схема

```
Primary: #0ea5e9 (Sky Blue)
Success: #22c55e (Green)
Warning: #eab308 (Yellow)
Error: #ef4444 (Red)
Gray: #6b7280 (Gray)
```

## 🔐 Безопасность

- ✅ XSS защита через React
- ✅ CSRF токены (если требуется)
- ✅ Валидация на клиенте и сервере
- ✅ Безопасное хранение токенов
- ✅ HTTPS в production

## 🌐 Интернационализация (i18n)

Можно добавить i18next для многоязычности:

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

## 🎯 Следующие шаги

1. Добавить unit тесты (Jest + React Testing Library)
2. Добавить e2e тесты (Cypress или Playwright)
3. Оптимизировать производительность (code splitting)
4. Добавить error boundary
5. Добавить PWA функциональность
6. Настроить CI/CD pipeline
