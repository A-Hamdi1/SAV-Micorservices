import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients';
import { CreateClientByResponsableDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/auth';

const CreateClientPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Récupérer la liste des utilisateurs pour sélectionner le userId
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Note: Il faudrait un endpoint pour lister les utilisateurs
      // Pour l'instant, on demande le userId manuellement
      return [];
    },
    enabled: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClientByResponsableDto) => clientsApi.createClient(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client créé avec succès');
      navigate(`/responsable/clients/${response.data?.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClientByResponsableDto>();

  const onSubmit = async (data: CreateClientByResponsableDto) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate('/responsable/clients')}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux clients
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Créer un client</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  ID Utilisateur *
                </label>
                <input
                  {...register('userId', { required: 'ID utilisateur requis' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="ID de l'utilisateur existant"
                />
                {errors.userId && (
                  <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  L'utilisateur doit déjà exister dans le système
                </p>
              </div>

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

              <div className="sm:col-span-2">
                <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
                  Adresse *
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

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/responsable/clients')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Création...' : 'Créer le client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateClientPage;

