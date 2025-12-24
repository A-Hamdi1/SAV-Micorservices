import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { techniciensApi } from '../../api/techniciens';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';

const TechnicienDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const technicienId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => techniciensApi.deleteTechnicien(technicienId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniciens'] });
      toast.success('Technicien supprimÃ© avec succÃ¨s');
      navigate('/responsable/techniciens');
    },
  });

  const toggleDisponibiliteMutation = useMutation({
    mutationFn: (estDisponible: boolean) =>
      techniciensApi.updateDisponibilite(technicienId, { estDisponible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicien', technicienId] });
      toast.success('DisponibilitÃ© mise Ã  jour');
    },
  });

  const handleDelete = async () => {
    if (window.confirm('ÃŠtes-vous sÃ»r de vouloir supprimer ce technicien ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting technicien:', error);
      }
    }
  };

  const { data: technicien, isLoading } = useQuery({
    queryKey: ['technicien', technicienId],
    queryFn: () => techniciensApi.getTechnicienById(technicienId),
    enabled: !!technicienId,
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!technicien?.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-lg">
          Technicien non trouvÃ©
        </div>
      </div>
    );
  }

  const tech = technicien.data;

  const handleToggleDisponibilite = async () => {
    try {
      await toggleDisponibiliteMutation.mutateAsync(!tech.estDisponible);
    } catch (error) {
      console.error('Error toggling disponibilite:', error);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title={tech.nomComplet}
        subtitle={
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                tech.estDisponible ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'
              }`}
            >
              {tech.estDisponible ? 'Disponible' : 'Non disponible'}
            </span>
            <button
              onClick={handleToggleDisponibilite}
              disabled={toggleDisponibiliteMutation.isPending}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium disabled:opacity-50"
            >
              {tech.estDisponible ? 'Rendre indisponible' : 'Rendre disponible'}
            </button>
          </div>
        }
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Techniciens', path: '/responsable/techniciens' },
          { label: tech.nomComplet },
        ]}
        actions={
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/responsable/techniciens/${technicienId}/edit`)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Informations" />
          <CardBody>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-bodydark2">Email</dt>
                <dd className="mt-1 text-sm text-black">{tech.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-bodydark2">TÃ©lÃ©phone</dt>
                <dd className="mt-1 text-sm text-black">{tech.telephone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-bodydark2">SpÃ©cialitÃ©</dt>
                <dd className="mt-1 text-sm text-black">{tech.specialite}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-bodydark2">Date d'embauche</dt>
                <dd className="mt-1 text-sm text-black">{formatDate(tech.dateEmbauche)}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {tech.stats && (
          <Card>
            <CardHeader title="Statistiques" />
            <CardBody>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Interventions totales</dt>
                  <dd className="mt-1 text-sm text-black">{tech.stats.nombreInterventionsTotal}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Interventions terminÃ©es</dt>
                  <dd className="mt-1 text-sm text-black">
                    {tech.stats.nombreInterventionsTerminees}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Taux de rÃ©ussite</dt>
                  <dd className="mt-1 text-sm text-black">
                    {tech.stats.tauxReussite.toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-bodydark2">Chiffre d'affaires total</dt>
                  <dd className="mt-1 text-sm font-bold text-black">
                    {tech.stats.chiffreAffaireTotal.toFixed(2)} â‚¬
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        )}

        {tech.interventions && tech.interventions.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader title="Interventions" />
            <CardBody>
              <div className="space-y-4">
                {tech.interventions.map((intervention) => (
                  <div key={intervention.id} className="border border-stroke rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        to={`/responsable/interventions/${intervention.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Intervention #{intervention.id}
                      </Link>
                      <StatusBadge status={intervention.statut} />
                    </div>
                    <p className="text-sm text-bodydark2">
                      Date: {formatDate(intervention.dateIntervention)}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TechnicienDetailsPage;

