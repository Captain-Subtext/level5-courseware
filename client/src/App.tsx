import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import ProtectedRoute from './components/ProtectedRoute';
import MaintenanceMode from './components/MaintenanceMode'; 
import { useEffect, lazy, Suspense } from 'react';
import { initSecurity } from './lib/security';
import { HelmetProvider } from 'react-helmet-async';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ModulePage = lazy(() => import('./pages/ModulePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const TerminologyPage = lazy(() => import('./pages/TerminologyPage'));
const CommandsPage = lazy(() => import('./pages/CommandsPage'));
const InstallationPage = lazy(() => import('./pages/InstallationPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminContent = lazy(() => import('./pages/admin/Content'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const ModuleEdit = lazy(() => import('./pages/admin/ModuleEdit'));
const SectionEdit = lazy(() => import('./pages/admin/SectionEdit'));
const ContentBackup = lazy(() => import('./pages/admin/ContentBackup'));

// Loading Fallback Component
// You can replace this with a more sophisticated spinner or skeleton UI
function LoadingFallback() {
  return <div className="flex justify-center items-center min-h-screen bg-black text-white">Loading...</div>;
}

// ADD BACK: Component to handle auth redirects
function AuthRedirectHandler() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait until the auth state is confirmed
    if (!isLoading) {
      if (user) {
        // If user is logged in and currently on signin, landing, or home page, redirect to dashboard
        const publicRoutes = ['/home', '/signin'];
        if (publicRoutes.includes(location.pathname)) {
          // console.log('[AuthRedirectHandler] User logged in on public route, redirecting to /dashboard');
          navigate('/dashboard', { replace: true });
        }
      } 
    }
  }, [user, isLoading, navigate, location.pathname]); // Dependencies

  return null; // This component doesn't render anything itself
}

export default function App() {
  // Initialize security measures on application load
  useEffect(() => {
    initSecurity();
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AuthRedirectHandler />
            <MaintenanceMode>
              {/* Wrap Routes with Suspense for lazy loading */}
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/home" element={<LandingPage />} /> 
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/update-password" element={<UpdatePasswordPage />} />
                  <Route path="/terminology" element={<TerminologyPage />} />
                  <Route path="/commands" element={<CommandsPage />} />
                  <Route path="/installation" element={<InstallationPage />} />
                  <Route path="/changelog" element={<ChangelogPage />} />
                  
                  {/* Protected routes */}
                  <Route 
                    path="/account" 
                    element={
                      <ProtectedRoute>
                        <AccountPage />
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
                    path="/module/:id" 
                    element={
                      <ProtectedRoute>
                        <ModulePage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Admin routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/users" 
                    element={
                      <ProtectedRoute>
                        <AdminUsers />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/analytics" 
                    element={
                      <ProtectedRoute>
                        <AdminAnalytics />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/content" 
                    element={
                      <ProtectedRoute>
                        <AdminContent />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/content/backup" 
                    element={
                      <ProtectedRoute>
                        <ContentBackup />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/module/:id" 
                    element={
                      <ProtectedRoute>
                        <ModuleEdit />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/section/:id" 
                    element={
                      <ProtectedRoute>
                        <SectionEdit />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/settings" 
                    element={
                      <ProtectedRoute>
                        <AdminSettings />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* 404 route */}
                  <Route path="/404" element={<NotFoundPage />} />
                  
                  {/* Redirect all other unknown routes to 404 */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
            </MaintenanceMode>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
