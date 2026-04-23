import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "error" | "warning" | "info" | "default";
  size?: "sm" | "md";
}

export const Badge = ({
  children,
  variant = "default",
  size = "md",
}: BadgeProps) => {
  const variants = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    default: "bg-gray-100 text-gray-800",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 rounded-full text-sm",
  };

  return (
    <span
      className={clsx("font-semibold rounded", variants[variant], sizes[size])}>
      {children}
    </span>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = ({
  variant = "primary",
  size = "md",
  isLoading,
  children,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-700 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      disabled={isLoading || props.disabled}
      className={clsx(
        "font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
      )}
      {...props}>
      {isLoading ? "Загрузка..." : children}
    </button>
  );
};

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            error ? "border-red-300" : "border-gray-300",
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";