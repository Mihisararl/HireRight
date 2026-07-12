// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import HowItWorks from './pages/HowItWorks';
import BecomeWorker from './pages/BecomeWorker';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import ProviderRegistration from './pages/ProviderRegistration';
import Register from "./pages/Register";
import ServiceRequestPage from './pages/ServiceRequest';
import PaymentPage from './pages/PaymentPage';
import ReportIssue from "./pages/ReportIssue";
import CustomerSettings from "./pages/CustomerSettings";
import ProviderSettings from "./pages/ProviderSettings";
import CompleteProfile from "./pages/CompleteProfile";
import PolicyPage from "./pages/PolicyPage";

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function AppRoutes() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/service-request" element={<ProtectedRoute><ServiceRequestPage /></ProtectedRoute>} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/services" element={<Services />} />
          <Route path="/become-a-worker" element={<BecomeWorker />} />
          <Route path="/provider-registration" element={<ProviderRegistration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/privacy-policy" element={<PolicyPage />} />
          <Route path="/worker-policy" element={<PolicyPage />} />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/customer-dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/payment" element={<PaymentPage />} />

          <Route
            path="/report-issue"
            element={
              <ProtectedRoute>
                <ReportIssue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-settings"
            element={
              <ProtectedRoute>
                <CustomerSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider-settings"
            element={
              <ProtectedRoute>
                <ProviderSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />


          <Route path="/provider-dashboard" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} /></Routes>
      </Router>
  );
}

function App() {
  const content = (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );

  return (
    <I18nextProvider i18n={i18n}>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {content}
        </GoogleOAuthProvider>
      ) : content}
    </I18nextProvider>
  );
}


export default App;
