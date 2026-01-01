import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationDropdown from '../common/NotificationDropdown';
import MessagingBadge from '../messaging/MessagingBadge';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const navigate = useNavigate();
  const { logout, role, user } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white border-b border-stroke shadow-sm">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          {/* Hamburger Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="z-50 block rounded-lg border border-stroke bg-white p-1.5 shadow-sm lg:hidden"
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out ${
                    !sidebarOpen && '!w-full delay-300'
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out ${
                    !sidebarOpen && '!w-full delay-400'
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out ${
                    !sidebarOpen && '!w-full delay-500'
                  }`}
                ></span>
              </span>
              <span className="absolute right-0 h-full w-full rotate-45">
                <span
                  className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out ${
                    !sidebarOpen && '!h-0 !delay-[0]'
                  }`}
                ></span>
                <span
                  className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out ${
                    !sidebarOpen && '!h-0 !delay-200'
                  }`}
                ></span>
              </span>
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="hidden sm:block">
          <div className="relative">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 pl-4">
              <svg
                className="h-5 w-5 text-bodydark2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full bg-gray-2 py-2 pl-12 pr-4 text-black focus:outline-none xl:w-125 rounded-lg border border-stroke focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          {/* Messaging Badge */}
          <MessagingBadge />

          {/* Notification Dropdown */}
          <NotificationDropdown />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-4"
            >
              <span className="hidden text-right lg:block">
                <span className="block text-sm font-medium text-black">
                  {user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : (role === 'Client' ? 'Client' : role === 'Technicien' ? 'Technicien' : 'Responsable SAV')}
                </span>
                <span className="block text-xs text-bodydark2">
                  {role === 'Client' ? 'Client' : role === 'Technicien' ? 'Technicien' : 'Responsable'}
                </span>
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600">
                <span className="text-sm font-medium text-white">
                  {user?.prenom && user?.nom ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase() : (role === 'Client' ? 'CL' : role === 'Technicien' ? 'TC' : 'RS')}
                </span>
              </span>

              <svg
                className={`hidden fill-current sm:block transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
                width="12"
                height="8"
                viewBox="0 0 12 8"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-4 flex w-64 flex-col rounded-xl border border-stroke bg-white shadow-lg animate-fade-in">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-stroke">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600">
                    <span className="text-lg font-medium text-white">
                      {user?.prenom && user?.nom ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase() : (role === 'Client' ? 'CL' : role === 'Technicien' ? 'TC' : 'RS')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-black">
                      {user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : (role === 'Client' ? 'Client' : role === 'Technicien' ? 'Technicien' : 'Responsable SAV')}
                    </span>
                    <span className="block text-xs text-bodydark2">
                      {role === 'Client' ? 'Client' : role === 'Technicien' ? 'Technicien' : 'Responsable'}
                    </span>
                  </div>
                </div>

                <ul className="flex flex-col gap-1 px-3 py-3">
                  {role === 'Client' && (
                    <>
                      <li>
                        <button
                          onClick={() => {
                            navigate('/client/profile');
                            setDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium text-bodydark2 hover:bg-gray-2 hover:text-primary transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Mon Profil
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            navigate('/client/change-password');
                            setDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium text-bodydark2 hover:bg-gray-2 hover:text-primary transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Changer Password
                        </button>
                      </li>
                    </>
                  )}
                  <li>
                    <button
                      onClick={() => {
                        navigate(role === 'Client' ? '/client/dashboard' : '/responsable/dashboard');
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium text-bodydark2 hover:bg-gray-2 hover:text-primary transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Paramètres
                    </button>
                  </li>
                </ul>

                <div className="border-t border-stroke px-3 py-3">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3.5 rounded-lg px-4 py-2.5 text-sm font-medium text-danger hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
