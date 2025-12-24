import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientsApi } from '../../api/clients';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
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
      toast.success('Client supprimÃ© avec succÃ¨s');
      navigate('/responsable/clients');
    },
  });

  const handleDelete = async () => {
    if (window.confirm('ÃŠtes-vous sÃ»r de vouloir supprimer ce client ?')) {
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
    return <LoadingSpinner fullScreen />;
  }

  if (!client?.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-lg">
          Client non trouvÃ©
        </div>
      </div>
    );
  }

  const clientData = client.data;

  return (
    <div className="p-6">
      <PageHeader
        title={`${clientData.prenom} ${clientData.nom}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Clients', path: '/responsable/clients' },
          { label: `${clientData.prenom} ${clientData.nom}` },
        ]}
        actions={
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/responsable/clients/${clientId}/edit`)}
            >
              Modifier
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              loading={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Informations" />
            <CardBody>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-bodydark2">TÃ©lÃ©phone</dt>
                  <dd className="mt-1 text-sm text-black">{clientData.telephone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Adresse</dt>
                  <dd className="mt-1 text-sm text-black">{clientData.adresse}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Date d'inscription</dt>
                  <dd className="mt-1 text-sm text-black">{formatDate(clientData.createdAt)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="RÃ©clamations" />
            <CardBody>
              {reclamations?.data && reclamations.data.length > 0 ? (
                <div className="space-y-4">
                  {reclamations.data.map((reclamation) => (
                    <div
                      key={reclamation.id}
                      className="border border-stroke rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link
                          to={`/responsable/reclamations/${reclamation.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          RÃ©clamation #{reclamation.id}
                        </Link>
                        <StatusBadge status={reclamation.statut} />
                      </div>
                      <p className="text-sm text-bodydark2">{reclamation.articleNom}</p>
                      <p className="text-sm text-bodydark2 mt-1">{reclamation.description}</p>
                      <p className="text-xs text-bodydark2 mt-2">
                        {formatDate(reclamation.dateCreation)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-bodydark2 text-sm">Aucune rÃ©clamation</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Articles achetÃ©s" />
            <CardBody>
              {articles?.data && articles.data.length > 0 ? (
                <div className="space-y-4">
                  {articles.data.map((article) => (
                    <div
                      key={article.id}
                      className="border border-stroke rounded-lg p-4"
                    >
                      <p className="text-sm font-medium text-black">{article.articleNom}</p>
                      <p className="text-sm text-bodydark2">Ref: {article.articleReference}</p>
                      <p className="text-sm text-bodydark2">NÂ° sÃ©rie: {article.numeroSerie}</p>
                      <div className="mt-2 flex items-center">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            article.sousGarantie
                              ? 'bg-green-100 text-success'
                              : 'bg-red-100 text-danger'
                          }`}
                        >
                          {article.sousGarantie ? 'Sous garantie' : 'Hors garantie'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-bodydark2 text-sm">Aucun article achetÃ©</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsPage;

