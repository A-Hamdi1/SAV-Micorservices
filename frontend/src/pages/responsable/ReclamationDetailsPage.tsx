import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reclamationsApi } from '../../api/reclamations';
import { interventionsApi } from '../../api/interventions';
import { UpdateReclamationStatutDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/formatters';

const ReclamationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const reclamationId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => reclamationsApi.deleteReclamation(reclamationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reclamations'] });
      toast.success('Réclamation supprimée avec succès');
      navigate('/responsable/reclamations');
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réclamation ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting reclamation:', error);
      }
    }
  };

  const { data: reclamation, isLoading } = useQuery({
    queryKey: ['reclamation', reclamationId],
    queryFn: () => reclamationsApi.getReclamationById(reclamationId),
    enabled: !!reclamationId,
  });

  const { data: interventions } = useQuery({
    queryKey: ['interventions', 'reclamation', reclamationId],
    queryFn: () => interventionsApi.getInterventionsByReclamation(reclamationId),
    enabled: !!reclamationId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateReclamationStatutDto) =>
      reclamationsApi.updateReclamationStatut(reclamationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reclamation', reclamationId] });
      toast.success('Statut mis à jour');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateReclamationStatutDto>();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!reclamation?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Réclamation non trouvée"
          breadcrumb={[
            { label: 'Dashboard', path: '/responsable' },
            { label: 'Réclamations', path: '/responsable/reclamations' },
            { label: 'Détails' },
          ]}
        />
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-bodydark2 mb-4">La réclamation demandée n'existe pas.</p>
              <Button variant="primary" onClick={() => navigate('/responsable/reclamations')}>
                Retour aux réclamations
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const rec = reclamation.data;

  const onSubmit = async (data: UpdateReclamationStatutDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Réclamation #${rec.id}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Réclamations', path: '/responsable/reclamations' },
          { label: `#${rec.id}` },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={rec.statut} />
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations Card */}
          <Card>
            <CardHeader title="Informations de la réclamation" />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-bodydark2 uppercase tracking-wider">Client</label>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {rec.clientPrenom?.charAt(0)}{rec.clientNom?.charAt(0)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-black">
                        {rec.clientPrenom} {rec.clientNom}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-bodydark2 uppercase tracking-wider">Article</label>
                    <p className="mt-1 text-sm text-black">{rec.articleNom}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-bodydark2 uppercase tracking-wider">Date de création</label>
                    <p className="mt-1 text-sm text-black">{formatDate(rec.dateCreation)}</p>
                  </div>
                  {rec.dateResolution && (
                    <div>
                      <label className="text-xs font-medium text-bodydark2 uppercase tracking-wider">Date de résolution</label>
                      <p className="mt-1 text-sm text-black">{formatDate(rec.dateResolution)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-bodydark2 uppercase tracking-wider">Description</label>
                    <p className="mt-1 text-sm text-black bg-gray-2 rounded-lg p-3">{rec.description}</p>
                  </div>
                  {rec.commentaireResponsable && (
                    <div>
                      <label className="text-xs font-medium text-bodydark2 uppercase tracking-wider">Commentaire responsable</label>
                      <p className="mt-1 text-sm text-black bg-primary-50 rounded-lg p-3">{rec.commentaireResponsable}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Interventions Card */}
          <Card>
            <CardHeader
              title="Interventions"
              action={
                <Link
                  to={`/responsable/interventions/new/${rec.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer intervention
                </Link>
              }
            />
            <CardBody className="p-0">
              {interventions?.data && interventions.data.length > 0 ? (
                <div className="divide-y divide-stroke">
                  {interventions.data.map((intervention) => (
                    <Link
                      key={intervention.id}
                      to={`/responsable/interventions/${intervention.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-2 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">
                            Intervention #{intervention.id}
                          </p>
                          <p className="text-xs text-bodydark2">
                            {intervention.technicienNom} · {formatDate(intervention.dateIntervention)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={intervention.statut} size="sm" />
                        <svg className="w-5 h-5 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-2 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                  </div>
                  <p className="text-bodydark2 text-sm mb-4">Aucune intervention pour cette réclamation</p>
                  <Link
                    to={`/responsable/interventions/new/${rec.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Créer une intervention
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Mettre à jour le statut" />
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="statut" className="form-label">
                    Statut
                  </label>
                  <select
                    {...register('statut', { required: 'Statut requis' })}
                    className="form-select"
                  >
                    <option value="EnAttente">En Attente</option>
                    <option value="EnCours">En Cours</option>
                    <option value="Resolue">Résolue</option>
                    <option value="Rejetee">Rejetée</option>
                  </select>
                  {errors.statut && (
                    <p className="mt-1 text-sm text-danger">{errors.statut.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="commentaireResponsable"
                    className="form-label"
                  >
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    {...register('commentaireResponsable')}
                    rows={4}
                    className="form-input"
                    placeholder="Ajoutez un commentaire..."
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={updateMutation.isPending}
                >
                  Mettre à jour
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReclamationDetailsPage;

