import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { UpdateArticleAchatDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/formatters';

const ArticleAchatDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const articleAchatId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article-achat', articleAchatId],
    queryFn: () => articlesAchetesApi.getArticleAchatById(articleAchatId),
    enabled: !!articleAchatId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateArticleAchatDto) =>
      articlesAchetesApi.updateArticleAchat(articleAchatId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-achat', articleAchatId] });
      toast.success('Article acheté mis à jour avec succès');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => articlesAchetesApi.deleteArticleAchat(articleAchatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-achetes'] });
      toast.success('Article acheté supprimé avec succès');
      navigate('/responsable/articles-achetes');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateArticleAchatDto>();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!article?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Article acheté non trouvé
        </div>
      </div>
    );
  }

  const articleData = article.data;

  useEffect(() => {
    if (articleData) {
      reset({
        dateAchat: articleData.dateAchat.split('T')[0],
        numeroSerie: articleData.numeroSerie,
        dureeGarantieJours: articleData.dureeGarantieJours,
      });
    }
  }, [articleData, reset]);

  const onSubmit = async (data: UpdateArticleAchatDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating article achat:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article acheté ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting article achat:', error);
      }
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          to="/responsable/articles-achetes"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux articles achetés
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{articleData.articleNom}</h1>
          <div className="mt-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                articleData.sousGarantie
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {articleData.sousGarantie ? 'Sous garantie' : 'Hors garantie'}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Client ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{articleData.clientId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Article</dt>
                <dd className="mt-1 text-sm text-gray-900">{articleData.articleNom}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Référence</dt>
                <dd className="mt-1 text-sm text-gray-900">{articleData.articleReference}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Numéro de série</dt>
                <dd className="mt-1 text-sm text-gray-900">{articleData.numeroSerie}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date d'achat</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(articleData.dateAchat)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Durée de garantie</dt>
                <dd className="mt-1 text-sm text-gray-900">{articleData.dureeGarantieJours} jours</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Modifier</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="dateAchat" className="block text-sm font-medium text-gray-700">
                  Date d'achat *
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

              <div>
                <label htmlFor="numeroSerie" className="block text-sm font-medium text-gray-700">
                  Numéro de série *
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
                <label
                  htmlFor="dureeGarantieJours"
                  className="block text-sm font-medium text-gray-700"
                >
                  Durée de garantie (jours) *
                </label>
                <input
                  {...register('dureeGarantieJours', {
                    required: 'Durée de garantie requise',
                    min: { value: 0, message: 'La durée doit être positive' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.dureeGarantieJours && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dureeGarantieJours.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleAchatDetailsPage;

