import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <NavBar />
        {/* Suspense catches the lazy-load suspend of protected route components. */}
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Root — redirect based on auth state */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
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
              path="/qa"
              element={
                <ProtectedRoute>
                  <ToolPlaceholderPage title="Q&A" />
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
              path="/rooms"
              element={
                <ProtectedRoute>
                  <RoomPage title="Study Rooms" />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
