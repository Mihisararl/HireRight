// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>; // shows spinner or text while auth initializes

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role (case-insensitive)
  if (requiredRole && user.role?.toLowerCase() !== requiredRole.toLowerCase()) {
    return <Navigate to="/login" replace />; // optional: send to login instead of home
  }

  return children;
}
