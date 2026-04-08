import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation  } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./components/auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import NavBar from "./components/Navbar";
import OnboardingPage from "./components/onboarding/OnboardingPage";

// Protected route components are lazy-loaded so the login bundle stays small.
// DashboardPage is a named export — unwrap it from the module object.
const DashboardPage = lazy(() =>
  import("./components/dashboard/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  }))
);
const QuizPage = lazy(() =>
  import("./components/quiz/QuizPage").then((m) => ({
    default: m.QuizPage,
  }))
);
const RoomPage = lazy(() =>
  import("./components/rooms/RoomPage").then((m) => ({
    default: m.RoomPage,
  }))
);
const RoomsPage = lazy(() =>
  import("./components/rooms/RoomsPage").then((m) => ({
    default: m.RoomsPage,
  }))
);
const JoinRoomPage = lazy(() =>
  import("./components/rooms/JoinRoomPage").then((m) => ({
    default: m.JoinRoomPage,
  }))
);
const UploadPage = lazy(() =>
  import("./components/file-upload/FileUploadPage").then((m) => ({
    default: m.default,
  }))
);
const ToolPlaceholderPage = lazy(() => import("./pages/ToolPlaceholderPage"));

/**
 * Redirects / based on auth state:
 *   authenticated   → /dashboard
 *   unauthenticated → /login
 * Renders a spinner while Firebase resolves the persisted session so there
 * is never a premature redirect before auth state is known.
 */
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function AppLayout() {
  const location = useLocation();

  const hideNavbarRoutes = ["/login"];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <NavBar />}

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute exempt={true}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/file-upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/summaries"
            element={
              <ProtectedRoute>
                <ToolPlaceholderPage title="Summaries" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/study-plan"
            element={
              <ProtectedRoute>
                <ToolPlaceholderPage title="Study Plan Generator" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/qa"
            element={
              <ProtectedRoute>
                <ToolPlaceholderPage title="Q&A" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <RoomsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rooms/:roomId"
            element={
              <ProtectedRoute>
                <RoomPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/join/:code"
            element={
              <ProtectedRoute>
                <JoinRoomPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;