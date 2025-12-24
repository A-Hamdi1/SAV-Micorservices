import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// Icons as SVG components
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ReclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const InterventionIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClientIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ArticleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TechnicienIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PaymentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const EvaluationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const { role } = useAuthStore();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const clientMenuItems: MenuItem[] = [
    { label: 'Tableau de bord', path: '/client/dashboard', icon: <DashboardIcon /> },
    { label: 'Mes articles', path: '/client/articles', icon: <ArticleIcon /> },
    { label: 'Mes réclamations', path: '/client/reclamations', icon: <ReclamationIcon /> },
    { label: 'Mes rendez-vous', path: '/client/rdv', icon: <CalendarIcon /> },
    { label: 'Mon profil', path: '/client/profile', icon: <ProfileIcon /> },
  ];

  const responsableMenuItems: MenuItem[] = [
    { label: 'Tableau de bord', path: '/responsable/dashboard', icon: <DashboardIcon /> },
    { 
      label: 'Réclamations', 
      path: '/responsable/reclamations', 
      icon: <ReclamationIcon />,
    },
    { 
      label: 'Interventions', 
      path: '/responsable/interventions', 
      icon: <InterventionIcon />,
    },
    { 
      label: 'Clients', 
      path: '/responsable/clients', 
      icon: <ClientIcon />,
    },
    { 
      label: 'Articles', 
      path: '/responsable/articles', 
      icon: <ArticleIcon />,
      children: [
        { label: 'Liste des articles', path: '/responsable/articles' },
        { label: 'Articles achetés', path: '/responsable/articles-achetes' },
        { label: 'Gestion stock', path: '/responsable/stock' },
      ],
    },
    { 
      label: 'Techniciens', 
      path: '/responsable/techniciens', 
      icon: <TechnicienIcon />,
    },
    { 
      label: 'Rendez-vous', 
      path: '/responsable/rdv', 
      icon: <CalendarIcon />,
    },
    { 
      label: 'Évaluations', 
      path: '/responsable/evaluations', 
      icon: <EvaluationIcon />,
    },
    { 
      label: 'Paiements', 
      path: '/responsable/payments', 
      icon: <PaymentIcon />,
    },
    { 
      label: 'Analytics', 
      path: '/responsable/analytics', 
      icon: <AnalyticsIcon />,
    },
  ];

  const menuItems = role === 'Client' ? clientMenuItems : responsableMenuItems;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleSubMenu = (label: string) => {
    setOpenSubMenu(openSubMenu === label ? null : label);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-sidebar duration-300 ease-linear lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">SAV Pro</span>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="block lg:hidden text-bodydark1 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Menu */}
        <div className="flex flex-col overflow-y-auto duration-300 ease-linear scrollbar-hide">
          <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
            <div>
              <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2 uppercase tracking-wider">
                Menu
              </h3>

              <ul className="mb-6 flex flex-col gap-1.5">
                {menuItems.map((item) => (
                  <li key={item.label}>
                    {item.children ? (
                      <div>
                        <button
                          onClick={() => toggleSubMenu(item.label)}
                          className={`group relative flex w-full items-center gap-2.5 rounded-lg py-3 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-sidebar-hover ${
                            isActive(item.path) ? 'bg-sidebar-hover' : ''
                          }`}
                        >
                          {item.icon}
                          {item.label}
                          <span className={`ml-auto transition-transform duration-200 ${openSubMenu === item.label ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon />
                          </span>
                        </button>

                        {/* Submenu */}
                        <div
                          className={`overflow-hidden transition-all duration-200 ease-in-out ${
                            openSubMenu === item.label ? 'max-h-40' : 'max-h-0'
                          }`}
                        >
                          <ul className="mb-2 mt-2 flex flex-col gap-1 pl-6">
                            {item.children.map((child) => (
                              <li key={child.path}>
                                <Link
                                  to={child.path}
                                  className={`group relative flex items-center gap-2.5 rounded-lg py-2 px-4 font-medium duration-300 ease-in-out hover:text-white ${
                                    location.pathname === child.path
                                      ? 'text-white'
                                      : 'text-bodydark2'
                                  }`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${location.pathname === child.path ? 'bg-primary-500' : 'bg-bodydark2'}`}></span>
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className={`group relative flex items-center gap-2.5 rounded-lg py-3 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-sidebar-hover ${
                          isActive(item.path) ? 'bg-sidebar-hover text-white' : ''
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto border-t border-strokedark px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600">
              <span className="text-sm font-medium text-white">
                {role === 'Client' ? 'CL' : role === 'Admin' ? 'AD' : 'RS'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {role === 'Admin' ? 'Administrateur' : role === 'Client' ? 'Client' : 'Responsable SAV'}
              </p>
              <p className="text-xs text-bodydark2">Connecté</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
