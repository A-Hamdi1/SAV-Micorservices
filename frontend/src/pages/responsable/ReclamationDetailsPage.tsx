import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { reclamationsApi } from '../../api/reclamations';
import { interventionsApi } from '../../api/interventions';
import { UpdateReclamationStatutDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/formatters';

const ReclamationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const reclamationId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => reclamationsApi.deleteReclamation(reclamationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reclamations'] });
      toast.success('Réclamation supprimée avec succès');
      navigate('/responsable/reclamations');
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réclamation ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting reclamation:', error);
      }
    }
  };

  const { data: reclamation, isLoading } = useQuery({
    queryKey: ['reclamation', reclamationId],
    queryFn: () => reclamationsApi.getReclamationById(reclamationId),
    enabled: !!reclamationId,
  });

  const { data: interventions } = useQuery({
    queryKey: ['interventions', 'reclamation', reclamationId],
    queryFn: () => interventionsApi.getInterventionsByReclamation(reclamationId),
    enabled: !!reclamationId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateReclamationStatutDto) =>
      reclamationsApi.updateReclamationStatut(reclamationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reclamation', reclamationId] });
      toast.success('Statut mis à jour');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateReclamationStatutDto>();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!reclamation?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Réclamation non trouvée
        </div>
      </div>
    );
  }

  const rec = reclamation.data;

  const onSubmit = async (data: UpdateReclamationStatutDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          to="/responsable/reclamations"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux réclamations
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Réclamation #{rec.id}</h1>
          <div className="mt-2 flex items-center">
            <StatusBadge status={rec.statut} />
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {rec.clientPrenom} {rec.clientNom}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Article</dt>
                  <dd className="mt-1 text-sm text-gray-900">{rec.articleNom}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{rec.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(rec.dateCreation)}</dd>
                </div>
                {rec.dateResolution && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date de résolution</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(rec.dateResolution)}</dd>
                  </div>
                )}
                {rec.commentaireResponsable && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Commentaire</dt>
                    <dd className="mt-1 text-sm text-gray-900">{rec.commentaireResponsable}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

              <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Interventions</h2>
                <Link
                  to={`/responsable/interventions/new/${rec.id}`}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-xs font-medium"
                >
                  + Créer intervention
                </Link>
              </div>
              {interventions?.data && interventions.data.length > 0 ? (
                <div className="space-y-4">
                  {interventions.data.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
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
                        Technicien: {intervention.technicienNom}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {formatDate(intervention.dateIntervention)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune intervention</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Mettre à jour le statut</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="statut" className="block text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <select
                    {...register('statut', { required: 'Statut requis' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="EnAttente">En Attente</option>
                    <option value="EnCours">En Cours</option>
                    <option value="Resolue">Résolue</option>
                    <option value="Rejetee">Rejetée</option>
                  </select>
                  {errors.statut && (
                    <p className="mt-1 text-sm text-red-600">{errors.statut.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="commentaireResponsable"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    {...register('commentaireResponsable')}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReclamationDetailsPage;

