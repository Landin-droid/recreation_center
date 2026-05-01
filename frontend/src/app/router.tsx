import { Navigate, Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuthStore } from "@features/auth/model/auth-store";
import { Loader } from "@shared/ui/kit";
import { DashboardPage } from "@views/DashboardPage";
import { HomePage } from "@views/HomePage";
import { LoginPage } from "@views/LoginPage";
import { RegisterPage } from "@views/RegisterPage";

function ProtectedLayout() {
  const { accessToken, isBootstrapping } = useAuthStore();

  if (isBootstrapping) {
    return <Loader label="Проверяем сессию..." />;
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
    element: <ProtectedLayout />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
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
