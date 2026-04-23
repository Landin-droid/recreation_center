// Пример использования компонентов

import { useState } from "react";
import { Button, Badge, FormInput } from "@components/UI";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { ErrorMessage } from "@components/ErrorMessage";

export const ComponentExamples = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8 p-8">
      {/* Buttons */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Кнопки</h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex gap-4 flex-wrap">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div>
            <Button
              isLoading={isLoading}
              onClick={() => setIsLoading(!isLoading)}>
              {isLoading ? "Загрузка..." : "Нажми меня"}
            </Button>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Бейджи</h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Badge variant="success">Success</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </div>
      </section>

      {/* Form Inputs */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Форма</h2>
        <div className="space-y-4 max-w-md">
          <FormInput label="Email" type="email" placeholder="your@email.com" />
          <FormInput
            label="Password"
            type="password"
            placeholder="••••••••"
            required
          />
          <FormInput label="Phone" type="tel" error="Неверный номер телефона" />
        </div>
      </section>

      {/* Loading Spinner */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Загрузка</h2>
        <div className="space-y-4">
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" text="Загружаем..." />
          <LoadingSpinner size="lg" text="Пожалуйста подождите" />
        </div>
      </section>

      {/* Error Message */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Ошибка</h2>
        <ErrorMessage
          message="Произошла ошибка при загрузке данных"
          onRetry={() => alert("Повтор")}
        />
      </section>
    </div>
  );
};
