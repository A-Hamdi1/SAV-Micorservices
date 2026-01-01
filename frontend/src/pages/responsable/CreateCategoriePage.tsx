import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { categoriesApi, CreateCategorieDto } from '../../api/categories';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';

const CreateCategoriePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateCategorieDto>();

  const createMutation = useMutation({
    mutationFn: (data: CreateCategorieDto) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Catégorie créée avec succès');
      navigate('/responsable/categories');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création de la catégorie');
    },
  });

  const onSubmit = async (data: CreateCategorieDto) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle catégorie"
        subtitle="Créer une nouvelle catégorie d'articles"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Catégories', path: '/responsable/categories' },
          { label: 'Nouvelle catégorie' },
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
                disabled={isSubmitting || createMutation.isPending}
              >
                {(isSubmitting || createMutation.isPending) ? 'Création...' : 'Créer la catégorie'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default CreateCategoriePage;
