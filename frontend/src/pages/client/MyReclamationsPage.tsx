import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { clientsApi } from '../../api/clients';
import { CreateReclamationDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/formatters';

const MyReclamationsPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Check if client profile exists
  const { data: clientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientsApi.getMyProfile(),
  });

  const { data: reclamations, isLoading } = useQuery({
    queryKey: ['my-reclamations'],
    queryFn: () => reclamationsApi.getMyReclamations(),
    enabled: !!clientProfile?.data,
  });

  const { data: articles } = useQuery({
    queryKey: ['my-articles'],
    queryFn: () => articlesAchetesApi.getMyArticles(),
    enabled: showAddForm && !!clientProfile?.data,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReclamationDto) => reclamationsApi.createReclamation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reclamations'] });
      toast.success('Réclamation créée avec succès');
      setShowAddForm(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateReclamationDto>();

  if (isLoading || profileLoading) {
    return <LoadingSpinner />;
  }

  // If no profile, show message to create profile first
  if (!clientProfile?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">Profil requis</h2>
          <p className="text-yellow-700 mb-4">
            Vous devez d'abord créer votre profil client avant de pouvoir créer des réclamations.
          </p>
          <Link
            to="/client/profile"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Créer mon profil
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CreateReclamationDto) => {
    try {
      await createMutation.mutateAsync(data);
      reset();
    } catch (error) {
      console.error('Error creating reclamation:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes réclamations</h1>
          <p className="mt-2 text-gray-600">Suivez l'état de vos réclamations</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          {showAddForm ? 'Annuler' : 'Nouvelle réclamation'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Créer une réclamation</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="articleAchatId" className="block text-sm font-medium text-gray-700">
                  Article concerné
                </label>
                <select
                  {...register('articleAchatId', { required: 'Article requis' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Sélectionner un article</option>
                  {articles?.data?.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.articleNom} - {article.numeroSerie}
                    </option>
                  ))}
                </select>
                {errors.articleAchatId && (
                  <p className="mt-1 text-sm text-red-600">{errors.articleAchatId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description du problème
                </label>
                <textarea
                  {...register('description', { required: 'Description requise' })}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Décrivez le problème rencontré avec votre article..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Création...' : 'Créer la réclamation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {reclamations?.data?.map((reclamation) => (
            <li key={reclamation.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Link
                    to={`/client/reclamations/${reclamation.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-800"
                  >
                    Réclamation #{reclamation.id} - {reclamation.articleNom}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {reclamation.description}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-gray-400">
                    <p>Créée le {formatDate(reclamation.dateCreation)}</p>
                    {reclamation.dateResolution && (
                      <>
                        <span className="mx-2">•</span>
                        <p>Résolue le {formatDate(reclamation.dateResolution)}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <StatusBadge status={reclamation.statut} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        {reclamations?.data?.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            Aucune réclamation. Créez votre première réclamation !
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReclamationsPage;

