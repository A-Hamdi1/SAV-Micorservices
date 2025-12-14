import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionsApi } from '../../api/interventions';
import { techniciensApi } from '../../api/techniciens';
import { UpdateInterventionDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const EditInterventionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const interventionId = parseInt(id || '0');
  const queryClient = useQueryClient();

  const { data: intervention, isLoading } = useQuery({
    queryKey: ['intervention', interventionId],
    queryFn: () => interventionsApi.getInterventionById(interventionId),
    enabled: !!interventionId,
  });

  const { data: techniciens } = useQuery({
    queryKey: ['techniciens'],
    queryFn: () => techniciensApi.getAllTechniciens(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateInterventionDto) =>
      interventionsApi.updateIntervention(interventionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention', interventionId] });
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      toast.success('Intervention mise à jour avec succès');
      navigate(`/responsable/interventions/${interventionId}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateInterventionDto>();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!intervention?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Intervention non trouvée
        </div>
      </div>
    );
  }

  const interv = intervention.data;
  const dateIntervention = new Date(interv.dateIntervention);
  const formattedDate = `${dateIntervention.toISOString().slice(0, 16)}`;

  useEffect(() => {
    if (interv) {
      reset({
        technicienNom: interv.technicienNom,
        dateIntervention: formattedDate,
        montantMainOeuvre: interv.montantMainOeuvre,
        commentaire: interv.commentaire || '',
      });
    }
  }, [interv, formattedDate, reset]);

  const onSubmit = async (data: UpdateInterventionDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating intervention:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/responsable/interventions/${interventionId}`)}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour à l'intervention
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Modifier l'intervention</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="technicienNom" className="block text-sm font-medium text-gray-700">
                  Technicien *
                </label>
                <select
                  {...register('technicienNom', { required: 'Technicien requis' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Sélectionner un technicien</option>
                  {techniciens?.data?.map((tech) => (
                    <option key={tech.id} value={tech.nomComplet}>
                      {tech.nomComplet} - {tech.specialite}
                    </option>
                  ))}
                </select>
                {errors.technicienNom && (
                  <p className="mt-1 text-sm text-red-600">{errors.technicienNom.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dateIntervention"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date d'intervention *
                </label>
                <input
                  {...register('dateIntervention', { required: 'Date requise' })}
                  type="datetime-local"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.dateIntervention && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateIntervention.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="montantMainOeuvre"
                  className="block text-sm font-medium text-gray-700"
                >
                  Main d'œuvre (€)
                </label>
                <input
                  {...register('montantMainOeuvre', {
                    min: { value: 0, message: 'Le montant doit être positif' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.montantMainOeuvre && (
                  <p className="mt-1 text-sm text-red-600">{errors.montantMainOeuvre.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700">
                  Commentaire
                </label>
                <textarea
                  {...register('commentaire')}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/responsable/interventions/${interventionId}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditInterventionPage;

