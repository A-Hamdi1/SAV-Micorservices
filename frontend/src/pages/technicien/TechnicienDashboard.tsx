import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { techniciensApi } from '../../api/techniciens';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { formatDate } from '../../utils/formatters';

const TechnicienDashboard = () => {
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['technicien-profile'],
    queryFn: () => techniciensApi.getMyProfile(),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['technicien-stats'],
    queryFn: () => techniciensApi.getMyStats(),
    enabled: !!profileData?.data,
  });

  const { data: interventionsData, isLoading: interventionsLoading } = useQuery({
    queryKey: ['technicien-interventions'],
    queryFn: () => techniciensApi.getMyInterventions(),
    enabled: !!profileData?.data,
  });

  if (profileLoading) {
    return <LoadingSpinner />;
  }

  if (!profileData?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tableau de bord"
          breadcrumb={[{ label: 'Tableau de bord' }]}
        />
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Profil non configuré</h2>
              <p className="text-slate-500 text-center max-w-md mb-6">
                Votre profil technicien n'est pas encore configuré. Veuillez contacter le responsable SAV.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const profile = profileData.data;
  const stats = statsData?.data;
  const interventions = interventionsData?.data || [];
  
  // Filter recent and upcoming interventions
  const interventionsPlanifiees = interventions.filter(i => i.statut === 'Planifiee');
  const interventionsEnCours = interventions.filter(i => i.statut === 'EnCours');
  const recentInterventions = interventions.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenue, ${profile.prenom} ${profile.nom}`}
        breadcrumb={[{ label: 'Tableau de bord' }]}
      />

      {/* Profile Card */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl font-bold shadow-lg shadow-primary-500/25">
              {profile.prenom.charAt(0)}{profile.nom.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900">{profile.nomComplet}</h2>
              <p className="text-slate-600">{profile.specialite}</p>
              <p className="text-sm text-slate-400">{profile.email} • {profile.telephone}</p>
            </div>
            <div>
              <StatusBadge 
                status={profile.estDisponible ? 'success' : 'warning'} 
                label={profile.estDisponible ? 'Disponible' : 'Non disponible'} 
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      {statsLoading ? (
        <LoadingSpinner />
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total interventions"
            value={stats.nombreInterventionsTotal.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            }
            color="primary"
          />
          <StatCard
            title="En cours"
            value={stats.nombreInterventionsEnCours.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="warning"
          />
          <StatCard
            title="Terminées"
            value={stats.nombreInterventionsTerminees.toString()}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="success"
          />
          <StatCard
            title="Taux de réussite"
            value={`${stats.tauxReussite}%`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            }
            color="primary"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interventions en cours */}
        <Card>
          <CardHeader 
            title="Interventions en cours"
            action={
              <span className="badge badge-warning">
                {interventionsEnCours.length}
              </span>
            }
          />
          <CardBody>
            {interventionsLoading ? (
              <LoadingSpinner />
            ) : interventionsEnCours.length > 0 ? (
              <div className="space-y-3">
                {interventionsEnCours.map((intervention) => (
                  <Link
                    key={intervention.id}
                    to={`/technicien/interventions/${intervention.id}`}
                    className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          Intervention #{intervention.id}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDate(intervention.dateIntervention)}
                        </p>
                      </div>
                      <StatusBadge status="warning" label="En cours" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">Aucune intervention en cours</p>
            )}
          </CardBody>
        </Card>

        {/* Interventions planifiées */}
        <Card>
          <CardHeader 
            title="Interventions planifiées"
            action={
              <span className="badge badge-info">
                {interventionsPlanifiees.length}
              </span>
            }
          />
          <CardBody>
            {interventionsLoading ? (
              <LoadingSpinner />
            ) : interventionsPlanifiees.length > 0 ? (
              <div className="space-y-3">
                {interventionsPlanifiees.slice(0, 5).map((intervention) => (
                  <Link
                    key={intervention.id}
                    to={`/technicien/interventions/${intervention.id}`}
                    className="block p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          Intervention #{intervention.id}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDate(intervention.dateIntervention)}
                        </p>
                      </div>
                      <StatusBadge status="primary" label="Planifiée" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">Aucune intervention planifiée</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Interventions */}
      <Card>
        <CardHeader 
          title="Dernières interventions"
          action={
            <Link
              to="/technicien/interventions"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Voir tout →
            </Link>
          }
        />
        <CardBody>
          {interventionsLoading ? (
            <LoadingSpinner />
          ) : recentInterventions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInterventions.map((intervention) => (
                    <tr key={intervention.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3">
                        <Link
                          to={`/technicien/interventions/${intervention.id}`}
                          className="text-primary-600 hover:underline font-medium"
                        >
                          #{intervention.id}
                        </Link>
                      </td>
                      <td className="py-3">{formatDate(intervention.dateIntervention)}</td>
                      <td className="py-3">
                        <StatusBadge
                          status={
                            intervention.statut === 'Terminee'
                              ? 'success'
                              : intervention.statut === 'EnCours'
                              ? 'warning'
                              : intervention.statut === 'Annulee'
                              ? 'danger'
                              : 'primary'
                          }
                          label={intervention.statut}
                        />
                      </td>
                      <td className="py-3">
                        {intervention.estGratuite ? (
                          <span className="text-green-600">Gratuite</span>
                        ) : (
                          `${intervention.montantTotal.toFixed(2)} €`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">Aucune intervention récente</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TechnicienDashboard;
