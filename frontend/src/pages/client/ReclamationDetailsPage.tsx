import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { reclamationsApi } from '../../api/reclamations';
import { interventionsApi } from '../../api/interventions';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';

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
    return <LoadingSpinner />;
  }

  if (!reclamation?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Réclamation non trouvée
        </div>
      </div>
    );
  }

  const rec = reclamation.data;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          to="/client/reclamations"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux réclamations
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Réclamation #{rec.id}</h1>
        <div className="mt-2 flex items-center">
          <StatusBadge status={rec.statut} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Article</dt>
                <dd className="mt-1 text-sm text-gray-900">{rec.articleNom}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{rec.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(rec.dateCreation)}</dd>
              </div>
              {rec.dateResolution && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date de résolution</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(rec.dateResolution)}</dd>
                </div>
              )}
              {rec.commentaireResponsable && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Commentaire responsable</dt>
                  <dd className="mt-1 text-sm text-gray-900">{rec.commentaireResponsable}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Interventions</h2>
            {interventions?.data && interventions.data.length > 0 ? (
              <div className="space-y-4">
                {interventions.data.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Intervention #{intervention.id}
                      </span>
                      <StatusBadge status={intervention.statut} />
                    </div>
                    <p className="text-sm text-gray-600">
                      Technicien: {intervention.technicienNom}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {formatDate(intervention.dateIntervention)}
                    </p>
                    {intervention.commentaire && (
                      <p className="text-sm text-gray-600 mt-2">
                        {intervention.commentaire}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune intervention pour le moment</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReclamationDetailsPage;

