import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { articlesApi } from '../../api/articles';
import { clientsApi } from '../../api/clients';
import { CreateArticleAchatDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
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
    return <LoadingSpinner fullScreen />;
  }

  // If no profile, show message to create profile first
  if (!clientProfile?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mes articles achetés"
          subtitle="Gérez vos articles et vérifiez leur garantie"
          breadcrumb={[
            { label: 'Dashboard' },
            { label: 'Mes articles' },
          ]}
        />
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Profil requis</h3>
              <p className="text-slate-500 text-center max-w-md mb-6">
                Vous devez d'abord créer votre profil client avant de pouvoir ajouter des articles.
              </p>
              <Link to="/client/profile">
                <Button variant="primary">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Créer mon profil
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
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
    <div className="space-y-6">
      <PageHeader
        title="Mes articles achetés"
        subtitle="Gérez vos articles et vérifiez leur garantie"
        breadcrumb={[
          { label: 'Dashboard', path: '/client' },
          { label: 'Mes articles' },
        ]}
        actions={
          <Button
            variant={showAddForm ? 'outline' : 'primary'}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Annuler
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un article
              </>
            )}
          </Button>
        }
      />

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader title="Ajouter un article acheté" />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="articleId" className="form-label">
                    Article
                  </label>
                  <select
                    {...register('articleId', { required: 'Article requis', valueAsNumber: true })}
                    className="form-select"
                  >
                    <option value="">Sélectionner un article</option>
                    {availableArticles?.data?.items.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.nom} - {article.reference}
                      </option>
                    ))}
                  </select>
                  {errors.articleId && (
                    <p className="mt-1 text-sm text-danger">{errors.articleId.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="numeroSerie" className="form-label">
                    Numéro de série
                  </label>
                  <input
                    {...register('numeroSerie', { required: 'Numéro de série requis' })}
                    type="text"
                    className="form-input"
                    placeholder="SN-XXXXXXXXXX"
                  />
                  {errors.numeroSerie && (
                    <p className="mt-1 text-sm text-danger">{errors.numeroSerie.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateAchat" className="form-label">
                    Date d'achat
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
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  variant="primary"
                  loading={createMutation.isPending}
                >
                  Enregistrer l'article
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Articles List */}
      <Card>
        <CardHeader title="Mes articles" />
        <CardBody className="p-0">
          {articles?.data?.length === 0 ? (
            <EmptyState
              title="Aucun article enregistré"
              description="Ajoutez votre premier article pour commencer à gérer vos garanties."
              icon={
                <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              action={
                <Button variant="primary" onClick={() => setShowAddForm(true)}>
                  Ajouter un article
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {articles?.data?.map((article) => (
                <div key={article.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">
                        {article.articleNom}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {article.articleReference}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {article.numeroSerie}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(article.dateAchat)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        article.sousGarantie
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${article.sousGarantie ? 'bg-success' : 'bg-danger'}`}></span>
                      {article.sousGarantie ? 'Sous garantie' : 'Hors garantie'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default MyArticlesPage;

