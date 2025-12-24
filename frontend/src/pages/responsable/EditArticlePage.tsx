import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi } from '../../api/articles';
import { UpdateArticleDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

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

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!article?.data) {
    return (
      <>
        <PageHeader
          title="Article non trouvé"
          breadcrumb={[
            { label: 'Dashboard', path: '/responsable' },
            { label: 'Articles', path: '/responsable/articles' },
            { label: 'Modifier' }
          ]}
        />
        <Card>
          <CardBody>
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
              Article non trouvé
            </div>
          </CardBody>
        </Card>
      </>
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
    <>
      <PageHeader
        title="Modifier l'article"
        subtitle={`Modification de ${article.data.nom}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Articles', path: '/responsable/articles' },
          { label: article.data.nom, path: `/responsable/articles/${articleId}` },
          { label: 'Modifier' }
        ]}
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                <label htmlFor="categorie" className="form-label">
                  Catégorie *
                </label>
                <input
                  {...register('categorie', { required: 'Catégorie requise' })}
                  type="text"
                  className="form-input"
                />
                {errors.categorie && (
                  <p className="mt-1 text-sm text-danger">{errors.categorie.message}</p>
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
                onClick={() => navigate(`/responsable/articles/${articleId}`)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={updateMutation.isPending}
              >
                Mettre à jour
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export default EditArticlePage;

