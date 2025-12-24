import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * @deprecated This component is no longer used. 
 * The new design uses Sidebar + Header components instead.
 */
const Navbar = () => {
  const { isAuthenticated, role, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = "border-transparent text-bodydark2 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors";

  return (
    <nav className="bg-white shadow-lg border-b border-stroke">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-primary">
                SAV
              </Link>
            </div>
            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {role === 'Client' && (
                  <>
                    <Link to="/client/dashboard" className={navLinkClass}>Tableau de bord</Link>
                    <Link to="/client/articles" className={navLinkClass}>Mes articles</Link>
                    <Link to="/client/reclamations" className={navLinkClass}>Mes réclamations</Link>
                    <Link to="/client/profile" className={navLinkClass}>Mon profil</Link>
                  </>
                )}
                {(role === 'ResponsableSAV' || role === 'Admin') && (
                  <>
                    <Link to="/responsable/dashboard" className={navLinkClass}>Tableau de bord</Link>
                    <Link to="/responsable/reclamations" className={navLinkClass}>Réclamations</Link>
                    <Link to="/responsable/interventions" className={navLinkClass}>Interventions</Link>
                    <Link to="/responsable/clients" className={navLinkClass}>Clients</Link>
                    <Link to="/responsable/articles" className={navLinkClass}>Articles</Link>
                    <Link to="/responsable/techniciens" className={navLinkClass}>Techniciens</Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-bodydark2 text-sm">{role === 'Admin' ? 'Administrateur' : role}</span>
                <button
                  onClick={handleLogout}
                  className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

