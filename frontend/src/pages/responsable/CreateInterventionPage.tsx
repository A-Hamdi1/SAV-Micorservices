import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interventionsApi } from '../../api/interventions';
import { techniciensApi } from '../../api/techniciens';
import { reclamationsApi } from '../../api/reclamations';
import { CreateInterventionDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const CreateInterventionPage = () => {
  const navigate = useNavigate();
  const { reclamationId } = useParams<{ reclamationId?: string }>();
  const queryClient = useQueryClient();

  const { data: techniciens } = useQuery({
    queryKey: ['techniciens', 'disponibles'],
    queryFn: () => techniciensApi.getTechniciensDisponibles(),
  });

  const { data: reclamations } = useQuery({
    queryKey: ['reclamations', 'all'],
    queryFn: () => reclamationsApi.getAllReclamations(1, 100),
    enabled: !reclamationId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateInterventionDto) => interventionsApi.createIntervention(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['interventions'] });
      toast.success('Intervention créée avec succès');
      navigate(`/responsable/interventions/${response.data?.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInterventionDto>({
    defaultValues: {
      reclamationId: reclamationId ? parseInt(reclamationId) : undefined,
    },
  });

  const onSubmit = async (data: CreateInterventionDto) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating intervention:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <button
          onClick={() => navigate('/responsable/interventions')}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux interventions
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Créer une intervention</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="reclamationId" className="block text-sm font-medium text-gray-700">
                  Réclamation ID *
                </label>
                {reclamationId ? (
                  <>
                    <input
                      type="hidden"
                      {...register('reclamationId', { valueAsNumber: true })}
                    />
                    <input
                      type="number"
                      value={reclamationId}
                      disabled
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                    />
                  </>
                ) : (
                  <select
                    {...register('reclamationId', {
                      required: 'Réclamation requise',
                      valueAsNumber: true,
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Sélectionner une réclamation</option>
                    {reclamations?.data?.items?.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        Réclamation #{rec.id} - {rec.clientPrenom} {rec.clientNom} - {rec.articleNom}
                      </option>
                    ))}
                  </select>
                )}
                {errors.reclamationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.reclamationId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="technicienId" className="block text-sm font-medium text-gray-700">
                  Technicien *
                </label>
                <select
                  {...register('technicienId', { required: 'Technicien requis', valueAsNumber: true })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Sélectionner un technicien</option>
                  {techniciens?.data?.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.nomComplet} - {tech.specialite}
                    </option>
                  ))}
                </select>
                {errors.technicienId && (
                  <p className="mt-1 text-sm text-red-600">{errors.technicienId.message}</p>
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
                onClick={() => navigate('/responsable/interventions')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Création...' : 'Créer l\'intervention'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInterventionPage;

