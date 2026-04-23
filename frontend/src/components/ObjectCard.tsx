import { BookableObject } from "@types/index";
import { Link } from "react-router-dom";
import clsx from "clsx";

interface ObjectCardProps {
  object: BookableObject;
}

export const ObjectCard = ({ object }: ObjectCardProps) => {
  return (
    <Link
      to={`/objects/${object.bookableObjectId}`}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-48 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl font-bold">{object.capacity}</div>
          <div className="text-sm opacity-90">человек</div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {object.name}
        </h3>
        {object.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {object.description}
          </p>
        )}
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold text-primary-600">
            {object.basePrice} ₽
          </div>
          {object.isSeasonal && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
              Сезонная
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
