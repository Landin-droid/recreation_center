interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const LoadingSpinner = ({ size = "md", text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <div className="h-full w-full border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
      </div>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};
