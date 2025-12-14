import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { interventionsApi } from '../../api/interventions';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';

const InterventionsListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState<string>('');
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['interventions', page, statut],
    queryFn: () => interventionsApi.getAllInterventions(page, pageSize, statut || undefined),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const interventions = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interventions</h1>
          <p className="mt-2 text-gray-600">Gestion des interventions</p>
        </div>
        <button
          onClick={() => navigate('/responsable/interventions/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Nouvelle intervention
        </button>
      </div>

      <div className="mb-4">
        <select
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value);
            setPage(1);
          }}
          className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="Planifiee">Planifiée</option>
          <option value="EnCours">En Cours</option>
          <option value="Terminee">Terminée</option>
          <option value="Annulee">Annulée</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {interventions.map((intervention) => (
            <li key={intervention.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <Link to={`/responsable/interventions/${intervention.id}`} className="block">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-600">
                      Intervention #{intervention.id}
                    </p>
                    <p className="text-sm text-gray-600">Technicien: {intervention.technicienNom}</p>
                    <p className="text-sm text-gray-500">
                      Date: {formatDate(intervention.dateIntervention)}
                    </p>
                    {intervention.commentaire && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {intervention.commentaire}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <StatusBadge status={intervention.statut} />
                    <p className="text-sm font-medium text-gray-900 mt-2">
                      {formatCurrency(intervention.montantTotal)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {interventions.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">Aucune intervention</div>
        )}
      </div>

      {totalCount > pageSize && (
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Page {page} sur {Math.ceil(totalCount / pageSize)}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalCount / pageSize)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterventionsListPage;

