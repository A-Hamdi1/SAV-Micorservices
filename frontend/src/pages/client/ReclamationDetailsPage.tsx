import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { reclamationsApi } from '../../api/reclamations';
import { interventionsApi } from '../../api/interventions';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const ReclamationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const reclamationId = parseInt(id || '0');

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

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!reclamation?.data) {
    return (
      <>
        <PageHeader
          title="RÃ©clamation non trouvÃ©e"
          breadcrumb={[
            { label: 'Dashboard', path: '/client' },
            { label: 'Mes rÃ©clamations', path: '/client/reclamations' },
            { label: 'DÃ©tails' }
          ]}
        />
        <Card>
          <CardBody>
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
              RÃ©clamation non trouvÃ©e
            </div>
          </CardBody>
        </Card>
      </>
    );
  }

  const rec = reclamation.data;

  return (
    <>
      <PageHeader
        title={`RÃ©clamation #${rec.id}`}
        subtitle={rec.articleNom}
        breadcrumb={[
          { label: 'Dashboard', path: '/client' },
          { label: 'Mes rÃ©clamations', path: '/client/reclamations' },
          { label: `RÃ©clamation #${rec.id}` }
        ]}
        actions={
          <StatusBadge status={rec.statut} size="lg" />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Informations" />
          <CardBody>
            <dl className="space-y-4">
              <div className="flex justify-between py-3 border-b border-stroke">
                <dt className="text-sm font-medium text-bodydark2">Article</dt>
                <dd className="text-sm text-black font-semibold">{rec.articleNom}</dd>
              </div>
              <div className="py-3 border-b border-stroke">
                <dt className="text-sm font-medium text-bodydark2 mb-2">Description</dt>
                <dd className="text-sm text-black">{rec.description}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-stroke">
                <dt className="text-sm font-medium text-bodydark2">Date de crÃ©ation</dt>
                <dd className="text-sm text-black">{formatDate(rec.dateCreation)}</dd>
              </div>
              {rec.dateResolution && (
                <div className="flex justify-between py-3 border-b border-stroke">
                  <dt className="text-sm font-medium text-bodydark2">Date de rÃ©solution</dt>
                  <dd className="text-sm text-success">{formatDate(rec.dateResolution)}</dd>
                </div>
              )}
              {rec.commentaireResponsable && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-bodydark2 mb-2">Commentaire responsable</dt>
                  <dd className="text-sm text-black bg-bodydark/5 p-3 rounded-lg">{rec.commentaireResponsable}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Interventions"
            action={
              rec.statut !== 'Resolue' && rec.statut !== 'Rejetee' && (
                <Link to={`/client/demande-rdv/${rec.id}`}>
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Demander RDV
                  </Button>
                </Link>
              )
            }
          />
          <CardBody>
            {interventions?.data && interventions.data.length > 0 ? (
              <div className="space-y-4">
                {interventions.data.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="border border-stroke rounded-xl p-4 hover:bg-bodydark/5 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                          #{intervention.id}
                        </span>
                        <span className="text-sm font-semibold text-black">
                          Intervention
                        </span>
                      </div>
                      <StatusBadge status={intervention.statut} size="sm" />
                    </div>
                    
                    <div className="ml-10 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-bodydark2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{intervention.technicienNom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-bodydark2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(intervention.dateIntervention)}</span>
                      </div>
                      {intervention.montantTotal > 0 && (
                        <div className="flex items-center gap-2 text-sm font-bold text-primary">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatCurrency(intervention.montantTotal)}</span>
                        </div>
                      )}
                      {intervention.commentaire && (
                        <p className="text-sm text-bodydark2 bg-bodydark/5 p-2 rounded mt-2">
                          {intervention.commentaire}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    {intervention.statut === 'Terminee' && (
                      <div className="mt-4 ml-10 flex flex-wrap gap-2">
                        {!intervention.estGratuite && intervention.montantTotal > 0 && (
                          <Link to={`/client/payment/${intervention.id}`}>
                            <Button variant="success" size="sm">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Payer
                            </Button>
                          </Link>
                        )}
                        <Link to={`/client/evaluation/${intervention.id}`}>
                          <Button variant="warning" size="sm">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Ã‰valuer
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Aucune intervention"
                description="Aucune intervention pour le moment. Vous pouvez demander un rendez-vous."
                icon={
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                }
              />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default ReclamationDetailsPage;

