import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clientsApi } from '../../api/clients';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';

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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        {profile?.data && (
          <p className="mt-2 text-gray-600">
            Bienvenue, {profile.data.prenom} {profile.data.nom}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-primary-600">
                  {articles?.data?.length || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Articles achetés</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-primary-600">
                  {reclamations?.data?.length || 0}
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
                <div className="text-2xl font-bold text-primary-600">
                  {reclamations?.data?.filter((r) => r.statut === 'En Cours').length || 0}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En cours</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Mes réclamations récentes
            </h3>
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
                          to={`/client/reclamations/${reclamation.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Réclamation #{reclamation.id}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">{reclamation.description}</p>
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
            <div className="mt-4">
              <Link
                to="/client/reclamations"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Voir toutes les réclamations →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Mes articles récents
            </h3>
            {recentArticles.length === 0 ? (
              <p className="text-gray-500">Aucun article enregistré</p>
            ) : (
              <div className="space-y-4">
                {recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="border-b border-gray-200 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{article.articleNom}</p>
                        <p className="text-sm text-gray-600">Ref: {article.articleReference}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Acheté le {formatDate(article.dateAchat)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          article.sousGarantie
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {article.sousGarantie ? 'Sous garantie' : 'Hors garantie'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link
                to="/client/articles"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Voir tous les articles →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

