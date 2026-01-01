import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthInitializer from './components/common/AuthInitializer';
import ClientProfileCheck from './components/common/ClientProfileCheck';
import NotificationProvider from './components/common/NotificationProvider';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import ClientProfilePage from './pages/client/ClientProfilePage';
import ChangePasswordPage from './pages/client/ChangePasswordPage';
import MyArticlesPage from './pages/client/MyArticlesPage';
import MyReclamationsPage from './pages/client/MyReclamationsPage';
import ReclamationDetailsPage from './pages/client/ReclamationDetailsPage';
import EvaluationPage from './pages/client/EvaluationPage';
import DemandeRdvPage from './pages/client/DemandeRdvPage';
import PaymentPage from './pages/client/PaymentPage';
import PaymentSuccessPage from './pages/client/PaymentSuccessPage';
import PaymentCancelPage from './pages/client/PaymentCancelPage';

// Responsable Pages
import ResponsableDashboard from './pages/responsable/ResponsableDashboard';
import ClientsListPage from './pages/responsable/ClientsListPage';
import ClientDetailsPage from './pages/responsable/ClientDetailsPage';
import ReclamationsListPage from './pages/responsable/ReclamationsListPage';
import ReclamationDetailsPageResponsable from './pages/responsable/ReclamationDetailsPage';
import ArticlesListPage from './pages/responsable/ArticlesListPage';
import ArticleDetailsPage from './pages/responsable/ArticleDetailsPage';
import CreateArticlePage from './pages/responsable/CreateArticlePage';
import EditArticlePage from './pages/responsable/EditArticlePage';
import InterventionsListPage from './pages/responsable/InterventionsListPage';
import InterventionDetailsPage from './pages/responsable/InterventionDetailsPage';
import CreateInterventionPage from './pages/responsable/CreateInterventionPage';
import EditInterventionPage from './pages/responsable/EditInterventionPage';
import TechniciensListPage from './pages/responsable/TechniciensListPage';
import TechnicienDetailsPage from './pages/responsable/TechnicienDetailsPage';
import CreateTechnicienPage from './pages/responsable/CreateTechnicienPage';
import EditTechnicienPage from './pages/responsable/EditTechnicienPage';
import ArticlesAchetesListPage from './pages/responsable/ArticlesAchetesListPage';
import ArticleAchatDetailsPage from './pages/responsable/ArticleAchatDetailsPage';
import StatsPage from './pages/responsable/StatsPage';
import AnalyticsDashboardPage from './pages/responsable/AnalyticsDashboardPage';
import StockManagementPage from './pages/responsable/StockManagementPage';
import RdvManagementPage from './pages/responsable/RdvManagementPage';
import PaymentsManagementPage from './pages/responsable/PaymentsManagementPage';
import EvaluationsListPage from './pages/responsable/EvaluationsListPage';
import CategoriesListPage from './pages/responsable/CategoriesListPage';
import CreateCategoriePage from './pages/responsable/CreateCategoriePage';
import EditCategoriePage from './pages/responsable/EditCategoriePage';

// Client Calendar
import ClientCalendarPage from './pages/client/ClientCalendarPage';

// Technicien Pages
import TechnicienDashboard from './pages/technicien/TechnicienDashboard';
import TechnicienInterventionsPage from './pages/technicien/TechnicienInterventionsPage';
import TechnicienInterventionDetailsPage from './pages/technicien/TechnicienInterventionDetailsPage';
import TechnicienCalendarPage from './pages/technicien/TechnicienCalendarPage';
import TechnicienProfilePage from './pages/technicien/TechnicienProfilePage';

// Responsable Calendar
import ResponsableCalendarPage from './pages/responsable/ResponsableCalendarPage';

// Common Pages
import NotificationsPage from './pages/common/NotificationsPage';
import MessagingPage from './pages/common/MessagingPage';

// Composant pour la redirection par défaut
const DefaultRedirect = () => {
  const { isAuthenticated, role } = useAuthStore();
  
  if (isAuthenticated) {
    if (role === 'Client') {
      return <Navigate to="/client/dashboard" replace />;
    } else if (role === 'Technicien') {
      return <Navigate to="/technicien/dashboard" replace />;
    } else if (role === 'ResponsableSAV') {
      return <Navigate to="/responsable/dashboard" replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthInitializer>
      <NotificationProvider>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Client Routes */}
      <Route
        path="/client/*"
        element={
          <ProtectedRoute requiredRole="Client">
            <Layout>
              <ClientProfileCheck>
                <Routes>
                  <Route path="dashboard" element={<ClientDashboard />} />
                  <Route path="profile" element={<ClientProfilePage />} />
                  <Route path="change-password" element={<ChangePasswordPage />} />
                  <Route path="articles" element={<MyArticlesPage />} />
                  <Route path="reclamations" element={<MyReclamationsPage />} />
                  <Route path="reclamations/:id" element={<ReclamationDetailsPage />} />
                  <Route path="evaluation/:interventionId" element={<EvaluationPage />} />
                  <Route path="calendrier" element={<ClientCalendarPage />} />
                  <Route path="rdv" element={<DemandeRdvPage />} />
                  <Route path="payment/:interventionId" element={<PaymentPage />} />
                  <Route path="payment/:interventionId/success" element={<PaymentSuccessPage />} />
                  <Route path="payment/:interventionId/cancel" element={<PaymentCancelPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="messages" element={<MessagingPage />} />
                  <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
                </Routes>
              </ClientProfileCheck>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Responsable Routes */}
      <Route
        path="/responsable/*"
        element={
          <ProtectedRoute requiredRole="ResponsableSAV">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<ResponsableDashboard />} />
                <Route path="clients" element={<ClientsListPage />} />
                <Route path="clients/:id" element={<ClientDetailsPage />} />
                <Route path="reclamations" element={<ReclamationsListPage />} />
                <Route path="reclamations/:id" element={<ReclamationDetailsPageResponsable />} />
                <Route path="articles" element={<ArticlesListPage />} />
                <Route path="articles/new" element={<CreateArticlePage />} />
                <Route path="articles/:id" element={<ArticleDetailsPage />} />
                <Route path="articles/:id/edit" element={<EditArticlePage />} />
                <Route path="categories" element={<CategoriesListPage />} />
                <Route path="categories/new" element={<CreateCategoriePage />} />
                <Route path="categories/:id/edit" element={<EditCategoriePage />} />
                <Route path="interventions" element={<InterventionsListPage />} />
                <Route path="interventions/new" element={<CreateInterventionPage />} />
                <Route path="interventions/new/:reclamationId" element={<CreateInterventionPage />} />
                <Route path="interventions/:id" element={<InterventionDetailsPage />} />
                <Route path="interventions/:id/edit" element={<EditInterventionPage />} />
                <Route path="techniciens" element={<TechniciensListPage />} />
                <Route path="techniciens/new" element={<CreateTechnicienPage />} />
                <Route path="techniciens/:id" element={<TechnicienDetailsPage />} />
                <Route path="techniciens/:id/edit" element={<EditTechnicienPage />} />
                <Route path="articles-achetes" element={<ArticlesAchetesListPage />} />
                <Route path="articles-achetes/:id" element={<ArticleAchatDetailsPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="analytics" element={<AnalyticsDashboardPage />} />
                <Route path="stock" element={<StockManagementPage />} />
                <Route path="rdv" element={<RdvManagementPage />} />
                <Route path="calendrier" element={<ResponsableCalendarPage />} />
                <Route path="payments" element={<PaymentsManagementPage />} />
                <Route path="evaluations" element={<EvaluationsListPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="messages" element={<MessagingPage />} />
                <Route path="*" element={<Navigate to="/responsable/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Technicien Routes */}
      <Route
        path="/technicien/*"
        element={
          <ProtectedRoute requiredRole="Technicien">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<TechnicienDashboard />} />
                <Route path="interventions" element={<TechnicienInterventionsPage />} />
                <Route path="interventions/:id" element={<TechnicienInterventionDetailsPage />} />
                <Route path="calendrier" element={<TechnicienCalendarPage />} />
                <Route path="profile" element={<TechnicienProfilePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="messages" element={<MessagingPage />} />
                <Route path="*" element={<Navigate to="/technicien/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<DefaultRedirect />} />
        </Routes>
      </NotificationProvider>
    </AuthInitializer>
  );
}

export default App;

