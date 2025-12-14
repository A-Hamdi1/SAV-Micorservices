import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../../api/articles';
import { UpdateArticleDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const EditArticlePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || '0');
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => articlesApi.getArticleById(articleId),
    enabled: !!articleId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateArticleDto) => articlesApi.updateArticle(articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article mis à jour avec succès');
      navigate(`/responsable/articles/${articleId}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateArticleDto>();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  useEffect(() => {
    if (article?.data) {
      reset({
        nom: article.data.nom,
        categorie: article.data.categorie,
        prixVente: article.data.prixVente,
        dureeGarantie: article.data.dureeGarantie,
      });
    }
  }, [article?.data, reset]);

  if (!article?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Article non trouvé
        </div>
      </div>
    );
  }

  const onSubmit = async (data: UpdateArticleDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/responsable/articles/${articleId}`)}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour à l'article
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Modifier l'article</h1>
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
                <label htmlFor="categorie" className="block text-sm font-medium text-gray-700">
                  Catégorie *
                </label>
                <input
                  {...register('categorie', { required: 'Catégorie requise' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.categorie && (
                  <p className="mt-1 text-sm text-red-600">{errors.categorie.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="prixVente" className="block text-sm font-medium text-gray-700">
                  Prix de vente (€) *
                </label>
                <input
                  {...register('prixVente', {
                    required: 'Prix de vente requis',
                    min: { value: 0, message: 'Le prix doit être positif' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.prixVente && (
                  <p className="mt-1 text-sm text-red-600">{errors.prixVente.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dureeGarantie" className="block text-sm font-medium text-gray-700">
                  Durée de garantie (mois) *
                </label>
                <input
                  {...register('dureeGarantie', {
                    required: 'Durée de garantie requise',
                    min: { value: 0, message: 'La durée doit être positive' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.dureeGarantie && (
                  <p className="mt-1 text-sm text-red-600">{errors.dureeGarantie.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/responsable/articles/${articleId}`)}
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

export default EditArticlePage;

