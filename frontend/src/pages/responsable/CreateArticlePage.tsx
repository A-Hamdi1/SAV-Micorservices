import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../../api/articles';
import { categoriesApi } from '../../api/categories';
import { CreateArticleDto } from '../../types';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CreateArticlePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

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
      // Find the category name for backward compatibility
      const selectedCategory = categories.find(c => c.id === Number(data.categorieId));
      const submitData = {
        ...data,
        categorie: selectedCategory?.nom || '',
        categorieId: data.categorieId ? Number(data.categorieId) : undefined,
      };
      await createMutation.mutateAsync(submitData);
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  if (categoriesLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      <PageHeader
        title="Créer un article"
        subtitle="Ajouter un nouvel article au catalogue"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Articles', path: '/responsable/articles' },
          { label: 'Créer' }
        ]}
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="reference" className="form-label">
                  Référence *
                </label>
                <input
                  {...register('reference', { required: 'Référence requise' })}
                  type="text"
                  className="form-input"
                />
                {errors.reference && (
                  <p className="mt-1 text-sm text-danger">{errors.reference.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="nom" className="form-label">
                  Nom *
                </label>
                <input
                  {...register('nom', { required: 'Nom requis' })}
                  type="text"
                  className="form-input"
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-danger">{errors.nom.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="categorieId" className="form-label">
                  Catégorie *
                </label>
                <select
                  {...register('categorieId', { required: 'Catégorie requise' })}
                  className="form-select"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nom}
                    </option>
                  ))}
                </select>
                {errors.categorieId && (
                  <p className="mt-1 text-sm text-danger">{errors.categorieId.message}</p>
                )}
                {categories.length === 0 && (
                  <p className="mt-1 text-sm text-warning">
                    Aucune catégorie disponible. <a href="/responsable/categories/new" className="text-primary hover:underline">Créer une catégorie</a>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="prixVente" className="form-label">
                  Prix de vente ($) *
                </label>
                <input
                  {...register('prixVente', {
                    required: 'Prix de vente requis',
                    min: { value: 0, message: 'Le prix doit être positif' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.01"
                  className="form-input"
                />
                {errors.prixVente && (
                  <p className="mt-1 text-sm text-danger">{errors.prixVente.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dureeGarantie" className="form-label">
                  Durée de garantie (mois) *
                </label>
                <input
                  {...register('dureeGarantie', {
                    required: 'Durée de garantie requise',
                    min: { value: 0, message: 'La durée doit être positive' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  className="form-input"
                />
                {errors.dureeGarantie && (
                  <p className="mt-1 text-sm text-danger">{errors.dureeGarantie.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/responsable/articles')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={createMutation.isPending}
              >
                Créer l'article
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export default CreateArticlePage;

