import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@store/authStore";
import api from "@services/api";
import { ProtectedRoute } from "@components/ProtectedRoute";
import { HomePage } from "@pages/HomePage";
import { LoginPage } from "@pages/LoginPage";
import { RegisterPage } from "@pages/RegisterPage";
import { ObjectsPage } from "@pages/ObjectsPage";
import { ObjectDetailPage } from "@pages/ObjectDetailPage";
import { ReservationsPage } from "@pages/ReservationsPage";
import { ReservationDetailPage } from "@pages/ReservationDetailPage";
import { ProfilePage } from "@pages/ProfilePage";
import { MenuPage } from "@pages/MenuPage";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const { loadFromStorage, setUser } = useAuthStore();

  // Загрузить токены из localStorage при загрузке приложения
  useEffect(() => {
    loadFromStorage();
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Попытаться загрузить текущего пользователя
      api
        .getCurrentUser()
        .then((user) => setUser(user))
        .catch(() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        });
    }
  }, [loadFromStorage, setUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/menu" element={<MenuPage />} />

          {/* Protected Routes */}
          <Route
            path="/objects"
            element={
              <ProtectedRoute>
                <ObjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/objects/:id"
            element={
              <ProtectedRoute>
                <ObjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservations"
            element={
              <ProtectedRoute>
                <ReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservations/:id"
            element={
              <ProtectedRoute>
                <ReservationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
