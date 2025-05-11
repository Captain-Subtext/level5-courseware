import { useEffect /*, useState, lazy, Suspense*/ } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import DashboardPage from './pages/DashboardPage';
import ModulePage from './pages/ModulePage';
import AccountPage from './pages/AccountPage';
import SignInPage from './pages/SignInPage';
// Remove supabase import
// import { supabase } from './lib/supabase'; 
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
// Remove admin imports for now, can be added back later if needed
// import AdminLayout from './components/admin/AdminLayout';
// import AdminDashboard from './pages/admin/Dashboard';
// import AdminContent from './pages/admin/Content';
// import AdminUsers from './pages/admin/Users';
// import AdminSettings from './pages/admin/Settings';
// import AdminAnalytics from './pages/admin/Analytics';
// import ModuleEdit from './pages/admin/ModuleEdit';
// import SectionEdit from './pages/admin/SectionEdit';
import NotFoundPage from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import LandingPage from './pages/LandingPage';
import { Toaster } from '@/components/ui/sonner';
// Remove MaintenanceMode import for now
// import MaintenanceMode from './components/MaintenanceMode';

function App() {
  const location = useLocation();

  useEffect(() => {
    // Simple page view tracking (replace with your analytics)
    console.log(`Page view: ${location.pathname}${location.search}`);

    // You might fetch global settings or check auth status here if needed

  }, [location]);

  // Basic Maintenance Mode Check (replace with actual logic if needed)
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  // if (isMaintenanceMode) {
  //   return <MaintenanceMode />;
  // }

  return (
    <div className="App flex flex-col min-h-screen bg-background text-foreground">
      {/* Navbar might be conditionally rendered based on route if needed */}
      {/* <Navbar /> */}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* <Route path="/old-index" element={<Index />} /> */}

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/module/:id" element={<ProtectedRoute><ModulePage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          
          {/* Admin Routes (Consider a nested structure) */}
          {/* 
          <Route path="/admin" element={<ProtectedRoute adminRequired><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="modules/:moduleId/edit" element={<ModuleEdit />} />
            <Route path="sections/:sectionId/edit" element={<SectionEdit />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          */}

          {/* Catch All / 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {/* Footer might be conditionally rendered */}
      {/* <Footer /> */}
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App; 