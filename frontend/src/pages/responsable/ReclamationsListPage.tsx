import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reclamationsApi } from '../../api/reclamations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';

const ReclamationsListPage = () => {
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState<string>('');
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['reclamations', page, statut],
    queryFn: () => reclamationsApi.getAllReclamations(page, pageSize, statut || undefined),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const reclamations = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Réclamations</h1>
        <p className="mt-2 text-gray-600">Gestion des réclamations</p>
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
          <option value="EnAttente">En Attente</option>
          <option value="EnCours">En Cours</option>
          <option value="Resolue">Résolue</option>
          <option value="Rejetee">Rejetée</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {reclamations.map((reclamation) => (
            <li key={reclamation.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <Link to={`/responsable/reclamations/${reclamation.id}`} className="block">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-600">
                      Réclamation #{reclamation.id}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {reclamation.clientPrenom} {reclamation.clientNom} - {reclamation.articleNom}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {reclamation.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(reclamation.dateCreation)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <StatusBadge status={reclamation.statut} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {reclamations.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">Aucune réclamation</div>
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

export default ReclamationsListPage;

