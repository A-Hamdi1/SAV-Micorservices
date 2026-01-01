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
    <div className="space-y-6">
      <PageHeader
        title="Statistiques"
        subtitle="Vue d'ensemble des performances"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Statistiques' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Interventions" />
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Total</dt>
                <dd className="text-sm font-medium text-slate-900">{interventionsStats?.data?.totalInterventions ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Terminées</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {interventionsStats?.data?.interventionsTerminees ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">En cours</dt>
                <dd className="text-sm font-medium text-slate-900">{interventionsStats?.data?.interventionsEnCours ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <dt className="text-sm text-slate-500">Montant total</dt>
                <dd className="text-sm font-bold text-primary-600">
                  {formatCurrency(interventionsStats?.data?.chiffreAffairesTotal ?? 0)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Techniciens" />
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Total</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {techniciensStats?.data?.nombreTechniciensTotal ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Disponibles</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {techniciensStats?.data?.nombreTechniciensDisponibles ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <dt className="text-sm text-slate-500">Taux de réussite moyen</dt>
                <dd className="text-sm font-bold text-success">
                  {(techniciensStats?.data?.tauxReussiteMoyen ?? 0).toFixed(1)}%
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Articles" />
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Total</dt>
                <dd className="text-sm font-medium text-slate-900">{articlesStats?.data?.nombreTotalArticles ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Pièces détachées</dt>
                <dd className="text-sm font-medium text-slate-900">{articlesStats?.data?.nombrePiecesDetachees ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <dt className="text-sm text-slate-500">Valeur stock</dt>
                <dd className="text-sm font-bold text-primary-600">
                  {formatCurrency(articlesStats?.data?.valeurStockTotal ?? 0)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Garanties" />
          <CardBody>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Articles achetés total</dt>
                <dd className="text-sm font-medium text-slate-900">{garantieStats?.data?.nombreTotalArticles ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Sous garantie</dt>
                <dd className="text-sm font-medium text-success">
                  {garantieStats?.data?.nombreArticlesSousGarantie ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-slate-500">Hors garantie</dt>
                <dd className="text-sm font-medium text-danger">
                  {garantieStats?.data?.nombreArticlesHorsGarantie ?? 0}
                </dd>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <dt className="text-sm text-slate-500">% Sous garantie</dt>
                <dd className="text-sm font-bold text-slate-900">
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
            <CardHeader title="Garanties expirant prochainement" />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Article
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        N° Série
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Expiration
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Jours restants
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {garantieStats.data.garantiesExpirantProchainement.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {item.clientNom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {item.articleNom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {item.numeroSerie}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
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

