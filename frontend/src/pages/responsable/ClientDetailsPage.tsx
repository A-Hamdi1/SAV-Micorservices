import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientsApi } from '../../api/clients';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';

const ClientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprimé avec succès');
      navigate('/responsable/clients');
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getClientById(clientId),
    enabled: !!clientId,
  });

  const { data: reclamations, isLoading: reclamationsLoading } = useQuery({
    queryKey: ['reclamations', 'client', clientId],
    queryFn: () => reclamationsApi.getReclamationsByClientId(clientId),
    enabled: !!clientId,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles', 'client', clientId],
    queryFn: () => articlesAchetesApi.getArticlesByClientId(clientId),
    enabled: !!clientId,
  });

  if (clientLoading || reclamationsLoading || articlesLoading) {
    return <LoadingSpinner />;
  }

  if (!client?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Client non trouvé
        </div>
      </div>
    );
  }

  const clientData = client.data;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          to="/responsable/clients"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux clients
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {clientData.prenom} {clientData.nom}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/responsable/clients/${clientId}/edit`)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Modifier
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{clientData.telephone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                  <dd className="mt-1 text-sm text-gray-900">{clientData.adresse}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date d'inscription</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(clientData.createdAt)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Réclamations</h2>
              {reclamations?.data && reclamations.data.length > 0 ? (
                <div className="space-y-4">
                  {reclamations.data.map((reclamation) => (
                    <div
                      key={reclamation.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link
                          to={`/responsable/reclamations/${reclamation.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Réclamation #{reclamation.id}
                        </Link>
                        <StatusBadge status={reclamation.statut} />
                      </div>
                      <p className="text-sm text-gray-600">{reclamation.articleNom}</p>
                      <p className="text-sm text-gray-500 mt-1">{reclamation.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(reclamation.dateCreation)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune réclamation</p>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Articles achetés</h2>
              {articles?.data && articles.data.length > 0 ? (
                <div className="space-y-4">
                  {articles.data.map((article) => (
                    <div
                      key={article.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <p className="text-sm font-medium text-gray-900">{article.articleNom}</p>
                      <p className="text-sm text-gray-600">Ref: {article.articleReference}</p>
                      <p className="text-sm text-gray-600">N° série: {article.numeroSerie}</p>
                      <div className="mt-2 flex items-center">
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
              ) : (
                <p className="text-gray-500 text-sm">Aucun article acheté</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsPage;

