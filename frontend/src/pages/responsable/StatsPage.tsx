import { useQuery } from '@tanstack/react-query';
import { interventionsApi } from '../../api/interventions';
import { techniciensApi } from '../../api/techniciens';
import { articlesApi } from '../../api/articles';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

const StatsPage = () => {
  const { data: interventionsStats, isLoading: interventionsLoading } = useQuery({
    queryKey: ['interventions-stats'],
    queryFn: () => interventionsApi.getInterventionsStats(),
  });

  const { data: techniciensStats, isLoading: techniciensLoading } = useQuery({
    queryKey: ['techniciens-stats'],
    queryFn: () => techniciensApi.getTechniciensStatsGlobales(),
  });

  const { data: articlesStats, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles-stats'],
    queryFn: () => articlesApi.getArticlesStats(),
  });

  const { data: garantieStats, isLoading: garantieLoading } = useQuery({
    queryKey: ['garantie-stats'],
    queryFn: () => articlesAchetesApi.getGarantieStats(),
  });

  if (interventionsLoading || techniciensLoading || articlesLoading || garantieLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
        <p className="mt-2 text-gray-600">Vue d'ensemble des performances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Interventions</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total</dt>
              <dd className="text-sm font-medium">{interventionsStats?.data?.nombreTotal ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Terminées</dt>
              <dd className="text-sm font-medium">
                {interventionsStats?.data?.nombreTerminees ?? 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">En cours</dt>
              <dd className="text-sm font-medium">{interventionsStats?.data?.nombreEnCours ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Montant total</dt>
              <dd className="text-sm font-bold">
                {formatCurrency(interventionsStats?.data?.montantTotalGenere ?? 0)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Techniciens</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total</dt>
              <dd className="text-sm font-medium">
                {techniciensStats?.data?.nombreTechniciensTotal ?? 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Disponibles</dt>
              <dd className="text-sm font-medium">
                {techniciensStats?.data?.nombreTechniciensDisponibles ?? 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Taux de réussite moyen</dt>
              <dd className="text-sm font-medium">
                {(techniciensStats?.data?.tauxReussiteMoyen ?? 0).toFixed(1)}%
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Articles</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total</dt>
              <dd className="text-sm font-medium">{articlesStats?.data?.nombreTotalArticles ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Pièces détachées</dt>
              <dd className="text-sm font-medium">{articlesStats?.data?.nombrePiecesDetachees ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Valeur stock</dt>
              <dd className="text-sm font-bold">
                {formatCurrency(articlesStats?.data?.valeurStockTotal ?? 0)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Garanties</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Articles achetés total</dt>
              <dd className="text-sm font-medium">{garantieStats?.data?.nombreTotalArticles ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Sous garantie</dt>
              <dd className="text-sm font-medium text-green-600">
                {garantieStats?.data?.nombreArticlesSousGarantie ?? 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Hors garantie</dt>
              <dd className="text-sm font-medium text-red-600">
                {garantieStats?.data?.nombreArticlesHorsGarantie ?? 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">% Sous garantie</dt>
              <dd className="text-sm font-bold">
                {(garantieStats?.data?.pourcentageSousGarantie ?? 0).toFixed(1)}%
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Garanties expirant prochainement */}
      {garantieStats?.data?.garantiesExpirantProchainement && garantieStats.data.garantiesExpirantProchainement.length > 0 && (
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Garanties expirant prochainement
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Article
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Série
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jours restants
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {garantieStats.data.garantiesExpirantProchainement.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.clientNom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.articleNom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.numeroSerie}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.dateExpiration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.joursRestants <= 7
                              ? 'bg-red-100 text-red-800'
                              : item.joursRestants <= 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.joursRestants} jours
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Interventions par mois */}
      {interventionsStats?.data?.parMois && interventionsStats.data.parMois.length > 0 && (
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Interventions par mois
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mois
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interventionsStats.data.parMois.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.moisNom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPage;

