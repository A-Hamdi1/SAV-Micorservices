import { useQuery } from '@tanstack/react-query';
import { interventionsApi } from '../../api/interventions';
import { techniciensApi } from '../../api/techniciens';
import { articlesApi } from '../../api/articles';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
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
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader
        title="Statistiques"
        subtitle="Vue d'ensemble des performances"
        breadcrumb={[
          { label: 'Responsable', path: '/responsable' },
          { label: 'Statistiques' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-black">Interventions</h3>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Total</dt>
                <dd className="text-sm font-medium text-black">{interventionsStats?.data?.totalInterventions ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Terminées</dt>
                <dd className="text-sm font-medium text-black">
                  {interventionsStats?.data?.interventionsTerminees ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">En cours</dt>
                <dd className="text-sm font-medium text-black">{interventionsStats?.data?.interventionsEnCours ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stroke">
                <dt className="text-sm text-bodydark2">Montant total</dt>
                <dd className="text-sm font-bold text-primary">
                  {formatCurrency(interventionsStats?.data?.chiffreAffairesTotal ?? 0)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-black">Techniciens</h3>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Total</dt>
                <dd className="text-sm font-medium text-black">
                  {techniciensStats?.data?.nombreTechniciensTotal ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Disponibles</dt>
                <dd className="text-sm font-medium text-black">
                  {techniciensStats?.data?.nombreTechniciensDisponibles ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stroke">
                <dt className="text-sm text-bodydark2">Taux de réussite moyen</dt>
                <dd className="text-sm font-bold text-success">
                  {(techniciensStats?.data?.tauxReussiteMoyen ?? 0).toFixed(1)}%
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-black">Articles</h3>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Total</dt>
                <dd className="text-sm font-medium text-black">{articlesStats?.data?.nombreTotalArticles ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Pièces détachées</dt>
                <dd className="text-sm font-medium text-black">{articlesStats?.data?.nombrePiecesDetachees ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stroke">
                <dt className="text-sm text-bodydark2">Valeur stock</dt>
                <dd className="text-sm font-bold text-primary">
                  {formatCurrency(articlesStats?.data?.valeurStockTotal ?? 0)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-black">Garanties</h3>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Articles achetés total</dt>
                <dd className="text-sm font-medium text-black">{garantieStats?.data?.nombreTotalArticles ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Sous garantie</dt>
                <dd className="text-sm font-medium text-success">
                  {garantieStats?.data?.nombreArticlesSousGarantie ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-bodydark2">Hors garantie</dt>
                <dd className="text-sm font-medium text-danger">
                  {garantieStats?.data?.nombreArticlesHorsGarantie ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stroke">
                <dt className="text-sm text-bodydark2">% Sous garantie</dt>
                <dd className="text-sm font-bold text-black">
                  {(garantieStats?.data?.pourcentageSousGarantie ?? 0).toFixed(1)}%
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* Garanties expirant prochainement */}
      {garantieStats?.data?.garantiesExpirantProchainement && garantieStats.data.garantiesExpirantProchainement.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-black">
                Garanties expirant prochainement
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-2 border-b border-stroke">
                      <th className="px-6 py-4 text-left text-xs font-medium text-bodydark2 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-bodydark2 uppercase tracking-wider">
                        Article
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-bodydark2 uppercase tracking-wider">
                        N° Série
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-bodydark2 uppercase tracking-wider">
                        Expiration
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-bodydark2 uppercase tracking-wider">
                        Jours restants
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke">
                    {garantieStats.data.garantiesExpirantProchainement.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-2 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {item.clientNom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {item.articleNom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-bodydark2">
                          {item.numeroSerie}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-bodydark2">
                          {formatDate(item.dateExpiration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge
                            status={
                              item.joursRestants <= 7
                                ? 'danger'
                                : item.joursRestants <= 30
                                ? 'warning'
                                : 'success'
                            }
                            text={`${item.joursRestants} jours`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

    </div>
  );
};

export default StatsPage;

