import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { clientsApi } from '../../api/clients';
import { CreateClientDto, UpdateClientDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';

const ClientProfilePage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientsApi.getMyProfile(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClientDto) => clientsApi.createMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
      toast.success('Profil crÃ©Ã© avec succÃ¨s');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateClientDto) => clientsApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
      toast.success('Profil mis Ã  jour avec succÃ¨s');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClientDto>();

  const profile = data?.data;
  const hasProfile = !!profile;

  // Use useEffect to reset form when profile data is loaded
  React.useEffect(() => {
    if (profile) {
      reset(profile);
    }
  }, [profile, reset]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const onSubmit = async (formData: CreateClientDto) => {
    try {
      if (hasProfile) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        subtitle="GÃ©rez vos informations personnelles"
        breadcrumb={[
          { label: 'Dashboard', path: '/client' },
          { label: 'Mon profil' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardBody className="flex flex-col items-center py-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {profile ? `${profile.prenom?.charAt(0) || ''}${profile.nom?.charAt(0) || ''}` : '?'}
                </span>
              </div>
              {profile ? (
                <>
                  <h3 className="text-lg font-semibold text-black mb-1">
                    {profile.prenom} {profile.nom}
                  </h3>
                  <p className="text-sm text-bodydark2 mb-4">{profile.telephone}</p>
                  <div className="flex items-center gap-2 text-sm text-bodydark2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{profile.adresse}</span>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-bodydark2 mb-2">Aucun profil crÃ©Ã©</p>
                  <p className="text-xs text-bodydark2">Remplissez le formulaire pour crÃ©er votre profil</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Form Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title={hasProfile ? 'Modifier le profil' : 'CrÃ©er votre profil'} />
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nom" className="form-label">
                      Nom
                    </label>
                    <input
                      {...register('nom', { required: 'Nom requis' })}
                      type="text"
                      className="form-input"
                      placeholder="Votre nom"
                    />
                    {errors.nom && (
                      <p className="mt-1 text-sm text-danger">{errors.nom.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="prenom" className="form-label">
                      PrÃ©nom
                    </label>
                    <input
                      {...register('prenom', { required: 'PrÃ©nom requis' })}
                      type="text"
                      className="form-input"
                      placeholder="Votre prÃ©nom"
                    />
                    {errors.prenom && (
                      <p className="mt-1 text-sm text-danger">{errors.prenom.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="telephone" className="form-label">
                      TÃ©lÃ©phone
                    </label>
                    <div className="relative">
                      <input
                        {...register('telephone', { required: 'TÃ©lÃ©phone requis' })}
                        type="tel"
                        className="form-input pl-10"
                        placeholder="06 00 00 00 00"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    {errors.telephone && (
                      <p className="mt-1 text-sm text-danger">{errors.telephone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="adresse" className="form-label">
                      Adresse
                    </label>
                    <div className="relative">
                      <input
                        {...register('adresse', { required: 'Adresse requise' })}
                        type="text"
                        className="form-input pl-10"
                        placeholder="123 Rue Example, 75000 Paris"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    {errors.adresse && (
                      <p className="mt-1 text-sm text-danger">{errors.adresse.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-stroke">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={createMutation.isPending || updateMutation.isPending}
                  >
                    {hasProfile ? 'Mettre Ã  jour' : 'CrÃ©er le profil'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;

