import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    // Admin peut accéder aux routes ResponsableSAV
    if (requiredRole === 'ResponsableSAV' && (role === 'ResponsableSAV' || role === 'Admin')) {
      return <>{children}</>;
    }
    // Technicien accède à ses routes
    if (requiredRole === 'Technicien' && role === 'Technicien') {
      return <>{children}</>;
    }
    // Client accède à ses routes
    if (requiredRole === 'Client' && role === 'Client') {
      return <>{children}</>;
    }
    // Vérification exacte pour les autres rôles
    if (role !== requiredRole) {
      // Rediriger vers le dashboard approprié selon le rôle
      if (role === 'Client') {
        return <Navigate to="/client/dashboard" replace />;
      } else if (role === 'Technicien') {
        return <Navigate to="/technicien/dashboard" replace />;
      } else if (role === 'ResponsableSAV' || role === 'Admin') {
        return <Navigate to="/responsable/dashboard" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

