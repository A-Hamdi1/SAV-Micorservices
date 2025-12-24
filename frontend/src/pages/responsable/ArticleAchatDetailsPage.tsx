import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { UpdateArticleAchatDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
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
      toast.success('Article achetÃ© mis Ã  jour avec succÃ¨s');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => articlesAchetesApi.deleteArticleAchat(articleAchatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-achetes'] });
      toast.success('Article achetÃ© supprimÃ© avec succÃ¨s');
      navigate('/responsable/articles-achetes');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateArticleAchatDto>();

  useEffect(() => {
    if (article?.data) {
      reset({
        dateAchat: article.data.dateAchat.split('T')[0],
        numeroSerie: article.data.numeroSerie,
        dureeGarantieJours: article.data.dureeGarantieJours,
      });
    }
  }, [article?.data, reset]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!article?.data) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl">
          Article achetÃ© non trouvÃ©
        </div>
      </div>
    );
  }

  const articleData = article.data;

  const onSubmit = async (data: UpdateArticleAchatDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating article achat:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('ÃŠtes-vous sÃ»r de vouloir supprimer cet article achetÃ© ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting article achat:', error);
      }
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader
        title={articleData.articleNom}
        subtitle={
          <StatusBadge
            status={articleData.sousGarantie ? 'success' : 'danger'}
            text={articleData.sousGarantie ? 'Sous garantie' : 'Hors garantie'}
          />
        }
        breadcrumb={[
          { label: 'Responsable', path: '/responsable' },
          { label: 'Articles AchetÃ©s', path: '/responsable/articles-achetes' },
          { label: articleData.articleNom },
        ]}
        actions={
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-black">Informations</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-bodydark2">Client ID</dt>
                <dd className="mt-1 text-sm text-black">{articleData.clientId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-bodydark2">Article</dt>
                <dd className="mt-1 text-sm text-black">{articleData.articleNom}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-bodydark2">RÃ©fÃ©rence</dt>
                <dd className="mt-1 text-sm text-black">{articleData.articleReference}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-bodydark2">NumÃ©ro de sÃ©rie</dt>
                <dd className="mt-1 text-sm text-black">{articleData.numeroSerie}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-bodydark2">Date d'achat</dt>
                <dd className="mt-1 text-sm text-black">{formatDate(articleData.dateAchat)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-bodydark2">DurÃ©e de garantie</dt>
                <dd className="mt-1 text-sm text-black">{articleData.dureeGarantieJours} jours</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-black">Modifier</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="dateAchat" className="form-label">
                  Date d'achat *
                </label>
                <input
                  {...register('dateAchat', { required: "Date d'achat requise" })}
                  type="date"
                  className="form-input"
                />
                {errors.dateAchat && (
                  <p className="mt-1 text-sm text-danger">{errors.dateAchat.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="numeroSerie" className="form-label">
                  NumÃ©ro de sÃ©rie *
                </label>
                <input
                  {...register('numeroSerie', { required: 'NumÃ©ro de sÃ©rie requis' })}
                  type="text"
                  className="form-input"
                />
                {errors.numeroSerie && (
                  <p className="mt-1 text-sm text-danger">{errors.numeroSerie.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dureeGarantieJours"
                  className="form-label"
                >
                  DurÃ©e de garantie (jours) *
                </label>
                <input
                  {...register('dureeGarantieJours', {
                    required: 'DurÃ©e de garantie requise',
                    min: { value: 0, message: 'La durÃ©e doit Ãªtre positive' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  className="form-input"
                />
                {errors.dureeGarantieJours && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.dureeGarantieJours.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Mise Ã  jour...' : 'Mettre Ã  jour'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ArticleAchatDetailsPage;

