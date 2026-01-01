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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
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
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          }
        />
        <StatCard
          title="Sous garantie"
          value={articlesEnGarantie}
          color="success"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
        />
        <StatCard
          title="Réclamations"
          value={reclamations?.data?.length || 0}
          color="info"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          }
        />
        <StatCard
          title="En cours"
          value={reclamationsEnCours}
          color="warning"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">Aucune donnée disponible</p>
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
                      formatter={(value: string) => <span className="text-sm text-slate-900">{value}</span>}
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
                    strokeWidth={1.5}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentReclamations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">Aucune réclamation</p>
                <Link
                  to="/client/reclamations"
                  className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Créer une réclamation
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReclamations.map((reclamation) => (
                  <Link
                    key={reclamation.id}
                    to={`/client/reclamations/${reclamation.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            Réclamation #{reclamation.id}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {reclamation.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">Aucun article enregistré</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {article.articleNom}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ref: {article.articleReference}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
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
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Nouvelle réclamation</p>
                <p className="text-xs text-slate-500">Signaler un problème</p>
              </div>
            </Link>

            <Link
              to="/client/articles"
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Mes articles</p>
                <p className="text-xs text-slate-500">Consulter mes produits</p>
              </div>
            </Link>

            <Link
              to="/client/profile"
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Mon profil</p>
                <p className="text-xs text-slate-500">Modifier mes infos</p>
              </div>
            </Link>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Aide & Support</p>
                <p className="text-xs text-slate-500">Besoin d'assistance ?</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ClientDashboard;

