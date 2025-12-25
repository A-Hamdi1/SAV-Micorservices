import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clientsApi } from '../../api/clients';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import StatCard from '../../components/common/StatCard';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { formatDate } from '../../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const ClientDashboard = () => {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientsApi.getMyProfile(),
  });

  const { data: reclamations, isLoading: reclamationsLoading } = useQuery({
    queryKey: ['my-reclamations'],
    queryFn: () => reclamationsApi.getMyReclamations(),
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['my-articles'],
    queryFn: () => articlesAchetesApi.getMyArticles(),
  });

  if (profileLoading || reclamationsLoading || articlesLoading) {
    return <LoadingSpinner />;
  }

  const recentReclamations = reclamations?.data?.slice(0, 5) || [];
  const recentArticles = articles?.data?.slice(0, 5) || [];
  const articlesEnGarantie = articles?.data?.filter((a) => a.sousGarantie).length || 0;
  const reclamationsEnCours = reclamations?.data?.filter((r) => r.statut === 'EnCours' || r.statut === 'EnAttente').length || 0;

  // Données pour le PieChart - Répartition des réclamations par statut
  const reclamationsByStatus = [
    { name: 'En attente', value: reclamations?.data?.filter((r) => r.statut === 'EnAttente').length || 0, color: '#F59E0B' },
    { name: 'En cours', value: reclamations?.data?.filter((r) => r.statut === 'EnCours').length || 0, color: '#3B82F6' },
    { name: 'Résolues', value: reclamations?.data?.filter((r) => r.statut === 'Resolue').length || 0, color: '#10B981' },
    { name: 'Rejetées', value: reclamations?.data?.filter((r) => r.statut === 'Rejetee').length || 0, color: '#EF4444' },
  ].filter(item => item.value > 0);

  // Données pour l'AreaChart - Historique des réclamations par mois (6 derniers mois)
  const getMonthlyReclamations = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      const year = date.getFullYear();
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = reclamations?.data?.filter((r) => {
        const recDate = new Date(r.dateCreation);
        return recDate >= monthStart && recDate <= monthEnd;
      }).length || 0;

      months.push({
        name: `${monthName} ${year}`,
        reclamations: count,
      });
    }
    return months;
  };

  const monthlyData = getMonthlyReclamations();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Bienvenue{profile?.data ? `, ${profile.data.prenom}` : ''} ! 👋
            </h1>
            <p className="text-primary-100">
              Voici un aperçu de votre activité sur SAV Pro
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link
              to="/client/reclamations"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle réclamation
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Articles achetés"
          value={articles?.data?.length || 0}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          title="Sous garantie"
          value={articlesEnGarantie}
          color="success"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatCard
          title="Réclamations"
          value={reclamations?.data?.length || 0}
          color="info"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="En cours"
          value={reclamationsEnCours}
          color="warning"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart - Répartition des réclamations */}
        <Card>
          <CardHeader title="Répartition de vos réclamations" />
          <CardBody>
            {reclamationsByStatus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-2 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <p className="text-bodydark2 text-sm">Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reclamationsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {reclamationsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number, name: string) => [`${value} réclamation(s)`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => <span className="text-sm text-black">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Area Chart - Évolution des réclamations */}
        <Card>
          <CardHeader title="Évolution de vos réclamations" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReclamations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [`${value} réclamation(s)`, 'Total']}
                  />
                  <Area
                    type="monotone"
                    dataKey="reclamations"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReclamations)"
                    name="Réclamations"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Reclamations */}
        <Card>
          <CardHeader
            title="Réclamations récentes"
            action={
              <Link
                to="/client/reclamations"
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
                <p className="text-bodydark2 text-sm">Aucune réclamation</p>
                <Link
                  to="/client/reclamations"
                  className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Créer une réclamation
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-stroke">
                {recentReclamations.map((reclamation) => (
                  <Link
                    key={reclamation.id}
                    to={`/client/reclamations/${reclamation.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">
                            Réclamation #{reclamation.id}
                          </p>
                          <p className="text-xs text-bodydark2 truncate mt-0.5">
                            {reclamation.description}
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

        {/* Recent Articles */}
        <Card>
          <CardHeader
            title="Articles récents"
            action={
              <Link
                to="/client/articles"
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
            {recentArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gray-2 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-bodydark2 text-sm">Aucun article enregistré</p>
              </div>
            ) : (
              <div className="divide-y divide-stroke">
                {recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-2 flex items-center justify-center">
                        <svg className="w-5 h-5 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">
                          {article.articleNom}
                        </p>
                        <p className="text-xs text-bodydark2 mt-0.5">
                          Ref: {article.articleReference}
                        </p>
                        <p className="text-xs text-bodydark2 mt-1">
                          Acheté le {formatDate(article.dateAchat)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          article.sousGarantie
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {article.sousGarantie ? '✔ Garantie' : '✗ Hors garantie'}
                      </span>
                    </div>
                  </div>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/client/reclamations"
              className="flex items-center gap-4 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Nouvelle réclamation</p>
                <p className="text-xs text-bodydark2">Signaler un problème</p>
              </div>
            </Link>

            <Link
              to="/client/articles"
              className="flex items-center gap-4 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Mes articles</p>
                <p className="text-xs text-bodydark2">Consulter mes produits</p>
              </div>
            </Link>

            <Link
              to="/client/profile"
              className="flex items-center gap-4 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Mon profil</p>
                <p className="text-xs text-bodydark2">Modifier mes infos</p>
              </div>
            </Link>

            <div className="flex items-center gap-4 rounded-xl border border-stroke bg-white p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Aide & Support</p>
                <p className="text-xs text-bodydark2">Besoin d'assistance ?</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ClientDashboard;

