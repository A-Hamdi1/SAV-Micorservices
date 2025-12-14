import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { articlesApi } from '../../api/articles';
import { clientsApi } from '../../api/clients';
import { CreateArticleAchatDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/formatters';

const MyArticlesPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Check if client profile exists
  const { data: clientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientsApi.getMyProfile(),
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ['my-articles'],
    queryFn: () => articlesAchetesApi.getMyArticles(),
    enabled: !!clientProfile?.data,
  });

  const { data: availableArticles } = useQuery({
    queryKey: ['articles'],
    queryFn: () => articlesApi.getArticles(1, 100),
    enabled: showAddForm,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateArticleAchatDto) => articlesAchetesApi.createArticleAchat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      toast.success('Article enregistré avec succès');
      setShowAddForm(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateArticleAchatDto>();

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
            Vous devez d'abord créer votre profil client avant de pouvoir ajouter des articles.
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

  const onSubmit = async (data: CreateArticleAchatDto) => {
    try {
      await createMutation.mutateAsync(data);
      reset();
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes articles achetés</h1>
          <p className="mt-2 text-gray-600">Gérez vos articles et vérifiez leur garantie</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          {showAddForm ? 'Annuler' : 'Ajouter un article'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ajouter un article acheté</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="articleId" className="block text-sm font-medium text-gray-700">
                  Article
                </label>
                <select
                  {...register('articleId', { required: 'Article requis', valueAsNumber: true })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Sélectionner un article</option>
                  {availableArticles?.data?.items.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.nom} - {article.reference}
                    </option>
                  ))}
                </select>
                {errors.articleId && (
                  <p className="mt-1 text-sm text-red-600">{errors.articleId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="numeroSerie" className="block text-sm font-medium text-gray-700">
                  Numéro de série
                </label>
                <input
                  {...register('numeroSerie', { required: 'Numéro de série requis' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.numeroSerie && (
                  <p className="mt-1 text-sm text-red-600">{errors.numeroSerie.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dateAchat" className="block text-sm font-medium text-gray-700">
                  Date d'achat
                </label>
                <input
                  {...register('dateAchat', { required: "Date d'achat requise" })}
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.dateAchat && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateAchat.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {articles?.data?.map((article) => (
            <li key={article.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-primary-600 truncate">
                      {article.articleNom}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <p>Référence: {article.articleReference}</p>
                    <span className="mx-2">•</span>
                    <p>N° série: {article.numeroSerie}</p>
                    <span className="mx-2">•</span>
                    <p>Acheté le {formatDate(article.dateAchat)}</p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      article.sousGarantie
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {article.sousGarantie ? 'Sous garantie' : 'Hors garantie'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {articles?.data?.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            Aucun article enregistré. Ajoutez votre premier article !
          </div>
        )}
      </div>
    </div>
  );
};

export default MyArticlesPage;

