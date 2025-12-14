import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../../api/articles';
import { CreateArticleDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const CreateArticlePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateArticleDto) => articlesApi.createArticle(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article créé avec succès');
      navigate(`/responsable/articles/${response.data?.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateArticleDto>();

  const onSubmit = async (data: CreateArticleDto) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate('/responsable/articles')}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux articles
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Créer un article</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                  Référence *
                </label>
                <input
                  {...register('reference', { required: 'Référence requise' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.reference && (
                  <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
                )}
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
                onClick={() => navigate('/responsable/articles')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Création...' : 'Créer l\'article'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateArticlePage;

