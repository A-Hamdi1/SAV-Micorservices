import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { categoriesApi, UpdateCategorieDto } from '../../api/categories';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const EditCategoriePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<UpdateCategorieDto>();

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (category) {
      reset({
        nom: category.nom,
        description: category.description || '',
      });
    }
  }, [category, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCategorieDto) => categoriesApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
      toast.success('Catégorie mise à jour avec succès');
      navigate('/responsable/categories');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour de la catégorie');
    },
  });

  const onSubmit = async (data: UpdateCategorieDto) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!category) {
    return (
      <div className="text-center py-10">
        <p className="text-danger">Catégorie non trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier la catégorie"
        subtitle={category.nom}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Catégories', path: '/responsable/categories' },
          { label: 'Modifier' },
        ]}
      />

      <Card>
        <CardBody className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Nom de la catégorie *
              </label>
              <input
                type="text"
                {...register('nom', { 
                  required: 'Le nom est obligatoire',
                  minLength: { value: 2, message: 'Le nom doit contenir au moins 2 caractères' },
                  maxLength: { value: 100, message: 'Le nom ne doit pas dépasser 100 caractères' }
                })}
                className="form-input w-full"
                placeholder="Ex: Électroménager"
              />
              {errors.nom && (
                <p className="text-danger text-sm mt-1">{errors.nom.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Description
              </label>
              <textarea
                {...register('description', {
                  maxLength: { value: 500, message: 'La description ne doit pas dépasser 500 caractères' }
                })}
                className="form-textarea w-full"
                rows={4}
                placeholder="Description de la catégorie (optionnel)"
              />
              {errors.description && (
                <p className="text-danger text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="p-4 bg-bodydark1/10 rounded-lg">
              <p className="text-sm text-bodydark2">
                <span className="font-medium">Articles associés:</span> {category.articlesCount} article{category.articlesCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-stroke dark:border-strokedark">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/responsable/categories')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || updateMutation.isPending}
              >
                {(isSubmitting || updateMutation.isPending) ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default EditCategoriePage;
