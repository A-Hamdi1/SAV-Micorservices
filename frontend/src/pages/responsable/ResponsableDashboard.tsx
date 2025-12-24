import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reclamationsApi } from '../../api/reclamations';
import { interventionsApi } from '../../api/interventions';
import { techniciensApi } from '../../api/techniciens';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import StatCard from '../../components/common/StatCard';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { formatDate } from '../../utils/formatters';

const ResponsableDashboard = () => {
  const { data: reclamations, isLoading: reclamationsLoading } = useQuery({
    queryKey: ['reclamations', 'dashboard'],
    queryFn: () => reclamationsApi.getAllReclamations(1, 10),
  });

  const { data: interventions, isLoading: interventionsLoading } = useQuery({
    queryKey: ['interventions', 'planifiees'],
    queryFn: () => interventionsApi.getInterventionsPlanifiees(),
  });

  const { data: techniciens, isLoading: techniciensLoading } = useQuery({
    queryKey: ['techniciens', 'disponibles'],
    queryFn: () => techniciensApi.getTechniciensDisponibles(),
  });

  if (reclamationsLoading || interventionsLoading || techniciensLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const recentReclamations = reclamations?.data?.items?.slice(0, 5) || [];
  const recentInterventions = interventions?.data?.slice(0, 5) || [];
  const enAttenteCount = reclamations?.data?.items?.filter((r) => r.statut === 'EnAttente').length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-sidebar to-graydark p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Tableau de bord SAV ðŸ“Š</h1>
            <p className="text-bodydark1">Vue d'ensemble du service aprÃ¨s-vente</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link
              to="/responsable/reclamations"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Voir rÃ©clamations
            </Link>
            <Link
              to="/responsable/interventions/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle intervention
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total rÃ©clamations"
          value={reclamations?.data?.totalCount || 0}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="En attente"
          value={enAttenteCount}
          color="warning"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Interventions planifiÃ©es"
          value={interventions?.data?.length || 0}
          color="info"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Techniciens disponibles"
          value={techniciens?.data?.length || 0}
          color="success"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Reclamations */}
        <Card>
          <CardHeader
            title="RÃ©clamations rÃ©centes"
            action={
              <Link
                to="/responsable/reclamations"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Voir tout
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentReclamations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gray-2 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-bodydark2 text-sm">Aucune rÃ©clamation</p>
              </div>
            ) : (
              <div className="divide-y divide-stroke">
                {recentReclamations.map((reclamation) => (
                  <Link
                    key={reclamation.id}
                    to={`/responsable/reclamations/${reclamation.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{reclamation.id}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black">
                            {reclamation.clientPrenom} {reclamation.clientNom}
                          </p>
                          <p className="text-xs text-bodydark2 truncate mt-0.5">
                            {reclamation.articleNom}
                          </p>
                          <p className="text-xs text-bodydark2 mt-1">
                            {formatDate(reclamation.dateCreation)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <StatusBadge status={reclamation.statut} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Interventions */}
        <Card>
          <CardHeader
            title="Interventions planifiÃ©es"
            action={
              <Link
                to="/responsable/interventions"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Voir tout
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentInterventions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gray-2 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <p className="text-bodydark2 text-sm">Aucune intervention planifiÃ©e</p>
              </div>
            ) : (
              <div className="divide-y divide-stroke">
                {recentInterventions.map((intervention) => (
                  <Link
                    key={intervention.id}
                    to={`/responsable/interventions/${intervention.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black">
                            Intervention #{intervention.id}
                          </p>
                          <p className="text-xs text-bodydark2 truncate mt-0.5">
                            {intervention.technicienNom}
                          </p>
                          <p className="text-xs text-bodydark2 mt-1">
                            {formatDate(intervention.dateIntervention)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <StatusBadge status={intervention.statut} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Actions rapides" />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Link
              to="/responsable/reclamations"
              className="flex flex-col items-center gap-3 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-xs font-medium text-black">RÃ©clamations</p>
            </Link>

            <Link
              to="/responsable/interventions"
              className="flex flex-col items-center gap-3 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-black">Interventions</p>
            </Link>

            <Link
              to="/responsable/clients"
              className="flex flex-col items-center gap-3 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-black">Clients</p>
            </Link>

            <Link
              to="/responsable/techniciens"
              className="flex flex-col items-center gap-3 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-black">Techniciens</p>
            </Link>

            <Link
              to="/responsable/stock"
              className="flex flex-col items-center gap-3 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <p className="text-xs font-medium text-black">Stock</p>
            </Link>

            <Link
              to="/responsable/analytics"
              className="flex flex-col items-center gap-3 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-black">Analytics</p>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ResponsableDashboard;

