import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { techniciensApi } from '../../api/techniciens';
import { UpdateTechnicienDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const EditTechnicienPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const technicienId = parseInt(id || '0');
  const queryClient = useQueryClient();

  const { data: technicien, isLoading } = useQuery({
    queryKey: ['technicien', technicienId],
    queryFn: () => techniciensApi.getTechnicienById(technicienId),
    enabled: !!technicienId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTechnicienDto) =>
      techniciensApi.updateTechnicien(technicienId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicien', technicienId] });
      queryClient.invalidateQueries({ queryKey: ['techniciens'] });
      toast.success('Technicien mis à jour avec succès');
      navigate(`/responsable/techniciens/${technicienId}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTechnicienDto>();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  useEffect(() => {
    if (technicien?.data) {
      reset({
        nom: technicien.data.nom,
        prenom: technicien.data.prenom,
        email: technicien.data.email,
        telephone: technicien.data.telephone,
        specialite: technicien.data.specialite,
        estDisponible: technicien.data.estDisponible,
      });
    }
  }, [technicien?.data, reset]);

  if (!technicien?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Technicien non trouvé
        </div>
      </div>
    );
  }

  const onSubmit = async (data: UpdateTechnicienDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating technicien:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/responsable/techniciens/${technicienId}`)}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour au technicien
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Modifier le technicien</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom *
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
                  Prénom *
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  {...register('email', {
                    required: 'Email requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email invalide',
                    },
                  })}
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                  Téléphone *
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
                <label htmlFor="specialite" className="block text-sm font-medium text-gray-700">
                  Spécialité *
                </label>
                <input
                  {...register('specialite', { required: 'Spécialité requise' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.specialite && (
                  <p className="mt-1 text-sm text-red-600">{errors.specialite.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    {...register('estDisponible')}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Disponible</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/responsable/techniciens/${technicienId}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTechnicienPage;

