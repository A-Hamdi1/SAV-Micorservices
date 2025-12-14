import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { clientsApi } from '../../api/clients';
import { CreateClientDto, UpdateClientDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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
      toast.success('Profil créé avec succès');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateClientDto) => clientsApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
      toast.success('Profil mis à jour avec succès');
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
    return <LoadingSpinner />;
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
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
        <p className="mt-2 text-gray-600">Gérez vos informations personnelles</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  {...register('nom', { required: 'Nom requis' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input
                  {...register('prenom', { required: 'Prénom requis' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.prenom && (
                  <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  {...register('telephone', { required: 'Téléphone requis' })}
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.telephone && (
                  <p className="mt-1 text-sm text-red-600">{errors.telephone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
                  Adresse
                </label>
                <input
                  {...register('adresse', { required: 'Adresse requise' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.adresse && (
                  <p className="mt-1 text-sm text-red-600">{errors.adresse.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Enregistrement...'
                  : hasProfile
                  ? 'Mettre à jour'
                  : 'Créer le profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;

