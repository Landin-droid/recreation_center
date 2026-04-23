import { Layout } from "@components/Layout";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { useMenuItems } from "@hooks/useApi";

export const MenuPage = () => {
  const { data: items, isLoading } = useMenuItems();

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Меню услуг</h1>
      <p className="text-gray-600 mb-8">
        Дополнительные услуги для вашего проживания
      </p>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Загрузка меню..." />
        </div>
      )}

      {items && items.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item: any) => (
            <div
              key={item.menuItemId}
              className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              {item.description && (
                <p className="text-gray-600 mb-3">{item.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary-600">
                  {item.price} ₽
                </span>
                {item.isAvailable ? (
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                    Заказать
                  </button>
                ) : (
                  <span className="text-gray-500">Недоступно</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Услуги недоступны</p>
        </div>
      )}
    </Layout>
  );
};
