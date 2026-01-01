import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { techniciensApi } from '../../api/techniciens';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';
import { InterventionDto, INTERVENTION_STATUS_LABELS, InterventionStatut } from '../../types';

const TechnicienInterventionsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: interventionsData, isLoading } = useQuery({
    queryKey: ['technicien-interventions', statusFilter],
    queryFn: () => techniciensApi.getMyInterventions(statusFilter || undefined),
  });

  const updateStatutMutation = useMutation({
    mutationFn: ({ interventionId, statut }: { interventionId: number; statut: string }) =>
      techniciensApi.updateMyInterventionStatut(interventionId, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicien-interventions'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const interventions = interventionsData?.data || [];

  const handleStartIntervention = (intervention: InterventionDto) => {
    if (intervention.statut === 'Planifiee') {
      updateStatutMutation.mutate({ interventionId: intervention.id, statut: 'EnCours' });
    }
  };

  const handleCompleteIntervention = (intervention: InterventionDto) => {
    if (intervention.statut === 'EnCours') {
      updateStatutMutation.mutate({ interventionId: intervention.id, statut: 'Terminee' });
    }
  };

  const getStatusBadgeStatus = (statut: string) => {
    switch (statut) {
      case 'Terminee':
        return 'success';
      case 'EnCours':
        return 'warning';
      case 'Annulee':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes interventions"
        breadcrumb={[
          { label: 'Tableau de bord', path: '/technicien/dashboard' },
          { label: 'Mes interventions' },
        ]}
      />

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="form-label mb-0">Filtrer par statut:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select min-w-[180px]"
              >
                <option value="">Tous les statuts</option>
                <option value="Planifiee">Planifiée</option>
                <option value="EnCours">En cours</option>
                <option value="Terminee">Terminée</option>
                <option value="Annulee">Annulée</option>
              </select>
            </div>
            <span className="text-sm text-slate-500">
              {interventions.length} intervention(s) trouvée(s)
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {interventions.filter(i => i.statut === 'Planifiee').length}
              </p>
              <p className="text-sm text-slate-500">Planifiées</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">
                {interventions.filter(i => i.statut === 'EnCours').length}
              </p>
              <p className="text-sm text-slate-500">En cours</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {interventions.filter(i => i.statut === 'Terminee').length}
              </p>
              <p className="text-sm text-slate-500">Terminées</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-2xl font-bold text-danger">
                {interventions.filter(i => i.statut === 'Annulee').length}
              </p>
              <p className="text-sm text-slate-500">Annulées</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Interventions list */}
      {interventions.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">Aucune intervention</h3>
              <p className="mt-1 text-sm text-slate-500">
                Vous n'avez pas encore d'intervention assignée.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {interventions.map((intervention) => (
            <Card key={intervention.id}>
              <CardBody>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/technicien/interventions/${intervention.id}`}
                        className="text-lg font-semibold text-primary-600 hover:underline"
                      >
                        Intervention #{intervention.id}
                      </Link>
                      <StatusBadge
                        status={getStatusBadgeStatus(intervention.statut)}
                        label={INTERVENTION_STATUS_LABELS[intervention.statut as InterventionStatut] || intervention.statut}
                      />
                      {intervention.estGratuite && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                          Sous garantie
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Date:</span>{' '}
                        {formatDate(intervention.dateIntervention)}
                      </div>
                      <div>
                        <span className="font-medium">Réclamation:</span> #{intervention.reclamationId}
                      </div>
                      <div>
                        <span className="font-medium">Montant:</span>{' '}
                        {intervention.estGratuite ? 'Gratuit' : `${intervention.montantTotal.toFixed(2)} €`}
                      </div>
                      {intervention.commentaire && (
                        <div className="col-span-2 md:col-span-4">
                          <span className="font-medium">Commentaire:</span> {intervention.commentaire}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {intervention.statut === 'Planifiee' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartIntervention(intervention)}
                        disabled={updateStatutMutation.isPending}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Démarrer
                      </Button>
                    )}
                    {intervention.statut === 'EnCours' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleCompleteIntervention(intervention)}
                        disabled={updateStatutMutation.isPending}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Terminer
                      </Button>
                    )}
                    <Link to={`/technicien/interventions/${intervention.id}`}>
                      <Button variant="outline" size="sm">
                        Détails
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicienInterventionsPage;
