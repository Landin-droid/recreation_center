interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmDialog = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  isDangerous = false,
}: ConfirmDialogProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-3">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-white ${
                isDangerous
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary-600 hover:bg-primary-700"
              } transition`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
