import { lazy, Suspense } from "react";
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuthStore } from "@features/auth/model/auth-store";
import { Loader } from "@shared/ui/kit";

// Lazy loading views
const HomePage = lazy(() => import("@views/HomePage").then(m => ({ default: m.HomePage })));
const DashboardPage = lazy(() => import("@views/DashboardPage").then(m => ({ default: m.DashboardPage })));
const LoginPage = lazy(() => import("@views/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@views/RegisterPage").then(m => ({ default: m.RegisterPage })));
const RentalPage = lazy(() => import("@views/RentalPage").then(m => ({ default: m.RentalPage })));
const BookingPage = lazy(() => import("@views/BookingPage").then(m => ({ default: m.BookingPage })));
const ProfilePage = lazy(() => import("@views/ProfilePage").then(m => ({ default: m.ProfilePage })));
const PaymentSuccessPage = lazy(() => import("@views/PaymentSuccessPage").then(m => ({ default: m.PaymentSuccessPage })));
const PaymentFailurePage = lazy(() => import("@views/PaymentFailurePage").then(m => ({ default: m.PaymentFailurePage })));
const PasswordResetPage = lazy(() => import("@views/PasswordResetPage").then(m => ({ default: m.PasswordResetPage })));
const ForgotPasswordPage = lazy(() => import("@views/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const AdminPage = lazy(() => import("@views/AdminPage").then(m => ({ default: m.AdminPage })));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader label="Загрузка страницы..." />
    </div>
  );
}

function ProtectedLayout() {
  const { user, isBootstrapping } = useAuthStore();

  if (isBootstrapping) {
    return <Loader label="Проверка сессии..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <Suspense fallback={<PageLoader />}>
        <PasswordResetPage />
      </Suspense>
    ),
  },
  {
    path: "/rentals",
    element: (
      <Suspense fallback={<PageLoader />}>
        <RentalPage />
      </Suspense>
    ),
  },
  {
    path: "/booking",
    element: (
      <Suspense fallback={<PageLoader />}>
        <BookingPage />
      </Suspense>
    ),
  },
  {
    path: "/payment/success",
    element: (
      <Suspense fallback={<PageLoader />}>
        <PaymentSuccessPage />
      </Suspense>
    ),
  },
  {
    path: "/payment/failure",
    element: (
      <Suspense fallback={<PageLoader />}>
        <PaymentFailurePage />
      </Suspense>
    ),
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "/profile",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: "/admin",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPage />
          </Suspense>
        ),
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
