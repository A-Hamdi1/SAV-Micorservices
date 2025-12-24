import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from './LoadingSpinner';

interface ClientProfileCheckProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that checks if the client has a profile.
 * Redirects to the profile page if no profile exists.
 */
const ClientProfileCheck = ({ children }: ClientProfileCheckProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, setUser, user } = useAuthStore();
  const [hasChecked, setHasChecked] = useState(false);

  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['client-profile-check'],
    queryFn: () => clientsApi.getMyProfile(),
    enabled: role === 'Client',
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (role !== 'Client' || isLoading) return;

    // Check if profile exists
    const hasProfile = profileData?.success && profileData?.data;
    
    if (hasProfile && profileData?.data && user) {
      // Update authStore with clientId if not already set
      if (!user.clientId) {
        setUser({
          ...user,
          clientId: profileData.data.id
        });
      }
    }

    // If no profile and not already on profile page, redirect to profile
    const isOnProfilePage = location.pathname === '/client/profile';
    
    if (!hasProfile && !isOnProfilePage && !isLoading) {
      navigate('/client/profile', { replace: true });
    }

    setHasChecked(true);
  }, [profileData, isLoading, error, role, location.pathname, navigate, setUser, user]);

  // Show loading while checking profile
  if (role === 'Client' && isLoading && !hasChecked) {
    return <LoadingSpinner fullScreen />;
  }

  return <>{children}</>;
};

export default ClientProfileCheck;
