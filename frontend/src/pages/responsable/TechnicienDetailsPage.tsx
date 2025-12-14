import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { techniciensApi } from '../../api/techniciens';
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
      toast.success('Technicien supprimé avec succès');
      navigate('/responsable/techniciens');
    },
  });

  const toggleDisponibiliteMutation = useMutation({
    mutationFn: (estDisponible: boolean) =>
      techniciensApi.updateDisponibilite(technicienId, { estDisponible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicien', technicienId] });
      toast.success('Disponibilité mise à jour');
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce technicien ?')) {
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
    return <LoadingSpinner />;
  }

  if (!technicien?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Technicien non trouvé
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
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          to="/responsable/techniciens"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux techniciens
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tech.nomComplet}</h1>
          <div className="mt-2 flex items-center space-x-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                tech.estDisponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {tech.estDisponible ? 'Disponible' : 'Non disponible'}
            </span>
            <button
              onClick={handleToggleDisponibilite}
              disabled={toggleDisponibiliteMutation.isPending}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              {tech.estDisponible ? 'Rendre indisponible' : 'Rendre disponible'}
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/responsable/techniciens/${technicienId}/edit`)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{tech.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                <dd className="mt-1 text-sm text-gray-900">{tech.telephone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Spécialité</dt>
                <dd className="mt-1 text-sm text-gray-900">{tech.specialite}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date d'embauche</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(tech.dateEmbauche)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {tech.stats && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Interventions totales</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tech.stats.nombreInterventionsTotal}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Interventions terminées</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {tech.stats.nombreInterventionsTerminees}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Taux de réussite</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {tech.stats.tauxReussite.toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Chiffre d'affaires total</dt>
                  <dd className="mt-1 text-sm font-bold text-gray-900">
                    {tech.stats.chiffreAffaireTotal.toFixed(2)} €
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {tech.interventions && tech.interventions.length > 0 && (
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Interventions</h2>
              <div className="space-y-4">
                {tech.interventions.map((intervention) => (
                  <div key={intervention.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        to={`/responsable/interventions/${intervention.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Intervention #{intervention.id}
                      </Link>
                      <StatusBadge status={intervention.statut} />
                    </div>
                    <p className="text-sm text-gray-600">
                      Date: {formatDate(intervention.dateIntervention)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicienDetailsPage;

