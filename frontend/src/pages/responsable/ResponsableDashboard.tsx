import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reclamationsApi } from '../../api/reclamations';
import { interventionsApi } from '../../api/interventions';
import { techniciensApi } from '../../api/techniciens';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
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
    return <LoadingSpinner />;
  }

  const recentReclamations = reclamations?.data?.items?.slice(0, 5) || [];
  const recentInterventions = interventions?.data?.slice(0, 5) || [];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-gray-600">Vue d'ensemble du service après-vente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-primary-600">
                  {reclamations?.data?.totalCount || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Réclamations</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-yellow-600">
                  {reclamations?.data?.items?.filter((r) => r.statut === 'EnAttente').length || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-blue-600">
                  {interventions?.data?.length || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Interventions</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-green-600">
                  {techniciens?.data?.length || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Techniciens disponibles</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Réclamations récentes
              </h3>
              <Link
                to="/responsable/reclamations"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Voir tout →
              </Link>
            </div>
            {recentReclamations.length === 0 ? (
              <p className="text-gray-500">Aucune réclamation</p>
            ) : (
              <div className="space-y-4">
                {recentReclamations.map((reclamation) => (
                  <div
                    key={reclamation.id}
                    className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to={`/responsable/reclamations/${reclamation.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Réclamation #{reclamation.id}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          {reclamation.clientPrenom} {reclamation.clientNom} - {reclamation.articleNom}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(reclamation.dateCreation)}
                        </p>
                      </div>
                      <StatusBadge status={reclamation.statut} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Interventions planifiées
              </h3>
              <Link
                to="/responsable/interventions"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Voir tout →
              </Link>
            </div>
            {recentInterventions.length === 0 ? (
              <p className="text-gray-500">Aucune intervention planifiée</p>
            ) : (
              <div className="space-y-4">
                {recentInterventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <Link
                          to={`/responsable/interventions/${intervention.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Intervention #{intervention.id}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          {intervention.technicienNom}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(intervention.dateIntervention)}
                        </p>
                      </div>
                      <StatusBadge status={intervention.statut} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsableDashboard;

