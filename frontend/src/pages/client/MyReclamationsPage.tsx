import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { clientsApi } from '../../api/clients';
import { CreateReclamationDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/formatters';

const MyReclamationsPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  // Check if client profile exists
  const { data: clientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientsApi.getMyProfile(),
  });

  const { data: reclamations, isLoading } = useQuery({
    queryKey: ['my-reclamations'],
    queryFn: () => reclamationsApi.getMyReclamations(),
    enabled: !!clientProfile?.data,
  });

  const { data: articles } = useQuery({
    queryKey: ['my-articles'],
    queryFn: () => articlesAchetesApi.getMyArticles(),
    enabled: showAddForm && !!clientProfile?.data,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReclamationDto) => reclamationsApi.createReclamation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reclamations'] });
      toast.success('Réclamation créée avec succès');
      setShowAddForm(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateReclamationDto>();

  if (isLoading || profileLoading) {
    return <LoadingSpinner />;
  }

  // If no profile, show message to create profile first
  if (!clientProfile?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mes réclamations"
          breadcrumb={[
            { label: 'Accueil', path: '/client/dashboard' },
            { label: 'Réclamations' },
          ]}
        />
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">Profil requis</h2>
              <p className="text-bodydark2 text-center max-w-md mb-6">
                Vous devez d'abord créer votre profil client avant de pouvoir créer des réclamations.
              </p>
              <Link to="/client/profile">
                <Button variant="primary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

  const onSubmit = async (data: CreateReclamationDto) => {
    try {
      await createMutation.mutateAsync(data);
      reset();
    } catch (error) {
      console.error('Error creating reclamation:', error);
    }
  };

  const reclamationsList = reclamations?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes réclamations"
        subtitle="Suivez l'état de vos réclamations"
        breadcrumb={[
          { label: 'Accueil', path: '/client/dashboard' },
          { label: 'Réclamations' },
        ]}
        actions={
          <Button
            variant={showAddForm ? 'outline' : 'primary'}
            onClick={() => setShowAddForm(!showAddForm)}
            icon={
              showAddForm ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )
            }
          >
            {showAddForm ? 'Annuler' : 'Nouvelle réclamation'}
          </Button>
        }
      />

      {/* Add Form */}
      {showAddForm && (
        <Card className="animate-fade-in">
          <CardHeader title="Créer une réclamation" subtitle="Décrivez le problème rencontré" />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="articleAchatId" className="form-label">
                  Article concerné
                </label>
                <div className="relative">
                  <select
                    {...register('articleAchatId', { required: 'Article requis' })}
                    className="form-select"
                  >
                    <option value="">Sélectionner un article</option>
                    {articles?.data?.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.articleNom} - {article.numeroSerie}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
                {errors.articleAchatId && (
                  <p className="mt-2 text-sm text-danger">{errors.articleAchatId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="form-label">
                  Description du problème
                </label>
                <textarea
                  {...register('description', { required: 'Description requise' })}
                  rows={4}
                  className="form-textarea"
                  placeholder="Décrivez le problème rencontré avec votre article..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-danger">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={createMutation.isPending}
                >
                  Créer la réclamation
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Reclamations List */}
      <Card>
        <CardBody className="p-0">
          {reclamationsList.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="Aucune réclamation"
              description="Créez votre première réclamation pour signaler un problème avec un article"
              action={
                <Button variant="primary" onClick={() => setShowAddForm(true)}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouvelle réclamation
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-stroke">
              {reclamationsList.map((reclamation) => (
                <Link
                  key={reclamation.id}
                  to={`/client/reclamations/${reclamation.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-gray-2 transition-colors group"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-semibold text-black">
                        Réclamation #{reclamation.id}
                      </p>
                      <span className="text-xs text-bodydark2">'¢</span>
                      <p className="text-sm text-primary font-medium">
                        {reclamation.articleNom}
                      </p>
                    </div>
                    <p className="text-sm text-bodydark2 line-clamp-1">
                      {reclamation.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-bodydark2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(reclamation.dateCreation)}
                      </p>
                      {reclamation.dateResolution && (
                        <p className="text-xs text-success flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Résolue le {formatDate(reclamation.dateResolution)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <StatusBadge status={reclamation.statut} />
                    <svg className="w-5 h-5 text-bodydark2 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default MyReclamationsPage;

