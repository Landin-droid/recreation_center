import { Layout } from "@components/Layout";
import { ObjectCard } from "@components/ObjectCard";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { ErrorMessage } from "@components/ErrorMessage";
import { useBookableObjects } from "@hooks/useApi";
import { BookableObject } from "@/types";

export const ObjectsPage = () => {
  const {
    data: objects,
    isLoading,
    isError,
    error,
    refetch,
  } = useBookableObjects();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Доступные объекты</h1>
        <p className="text-gray-600 mt-2">Выберите объект для бронирования</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Загрузка объектов..." />
        </div>
      )}

      {isError && (
        <ErrorMessage
          message={error?.message || "Ошибка при загрузке объектов"}
          onRetry={() => refetch()}
        />
      )}

      {objects && objects.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objects.map((object: BookableObject) => (
            <ObjectCard key={object.bookableObjectId} object={object} />
          ))}
        </div>
      )}

      {objects && objects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Объектов не найдено</p>
        </div>
      )}
    </Layout>
  );
};
