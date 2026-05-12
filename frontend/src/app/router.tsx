import { Navigate, Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuthStore } from "@features/auth/model/auth-store";
import { Loader } from "@shared/ui/kit";
import { DashboardPage } from "@views/DashboardPage";
import { HomePage } from "@views/HomePage";
import { LoginPage } from "@views/LoginPage";
import { RegisterPage } from "@views/RegisterPage";
import { RentalPage } from "@views/RentalPage";
import { BookingPage } from "@views/BookingPage";
import { ProfilePage } from "@views/ProfilePage";
import { PaymentSuccessPage } from "@views/PaymentSuccessPage";
import { PaymentFailurePage } from "@views/PaymentFailurePage";
import { PasswordResetPage } from "@views/PasswordResetPage";
import { ForgotPasswordPage } from "@views/ForgotPasswordPage";

function ProtectedLayout() {
  const { accessToken, isBootstrapping } = useAuthStore();

  if (isBootstrapping) {
    return <Loader label="Проверка сессии..." />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <PasswordResetPage />,
  },
  {
    path: "/rentals",
    element: <RentalPage />,
  },
  {
    path: "/booking",
    element: <BookingPage />,
  },
  {
    path: "/payment/success",
    element: <PaymentSuccessPage />,
  },
  {
    path: "/payment/failure",
    element: <PaymentFailurePage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
