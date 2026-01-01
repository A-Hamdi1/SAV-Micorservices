import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interventionsApi } from '../../api/interventions';
import { techniciensApi } from '../../api/techniciens';
import { UpdateInterventionDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

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

  useEffect(() => {
    if (intervention?.data) {
      const dateInterv = new Date(intervention.data.dateIntervention);
      const formatted = dateInterv.toISOString().slice(0, 16);
      reset({
        technicienNom: intervention.data.technicienNom,
        dateIntervention: formatted,
        montantMainOeuvre: intervention.data.montantMainOeuvre,
        commentaire: intervention.data.commentaire || '',
      });
    }
  }, [intervention?.data, reset]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!intervention?.data) {
    return (
      <>
        <PageHeader
          title="Intervention non trouvée"
          breadcrumb={[
            { label: 'Dashboard', path: '/responsable' },
            { label: 'Interventions', path: '/responsable/interventions' },
            { label: 'Modifier' }
          ]}
        />
        <Card>
          <CardBody>
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
              Intervention non trouvée
            </div>
          </CardBody>
        </Card>
      </>
    );
  }

  const onSubmit = async (data: UpdateInterventionDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating intervention:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier l'intervention"
        subtitle={`Intervention #${interventionId}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Interventions', path: '/responsable/interventions' },
          { label: `Intervention #${interventionId}`, path: `/responsable/interventions/${interventionId}` },
          { label: 'Modifier' }
        ]}
      />

      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Modifier l'intervention</h3>
              <p className="text-sm text-slate-500">Mettez à jour les détails de l'intervention</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="technicienNom" className="form-label">
                  Technicien *
                </label>
                <select
                  {...register('technicienNom', { required: 'Technicien requis' })}
                  className="form-select"
                >
                  <option value="">Sélectionner un technicien</option>
                  {techniciens?.data?.map((tech) => (
                    <option key={tech.id} value={tech.nomComplet}>
                      {tech.nomComplet} - {tech.specialite}
                    </option>
                  ))}
                </select>
                {errors.technicienNom && (
                  <p className="mt-1 text-sm text-danger">{errors.technicienNom.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dateIntervention"
                  className="form-label"
                >
                  Date d'intervention *
                </label>
                <input
                  {...register('dateIntervention', { required: 'Date requise' })}
                  type="datetime-local"
                  className="form-input"
                />
                {errors.dateIntervention && (
                  <p className="mt-1 text-sm text-danger">{errors.dateIntervention.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="montantMainOeuvre"
                  className="form-label"
                >
                  Main d'œuvre ($)
                </label>
                <input
                  {...register('montantMainOeuvre', {
                    min: { value: 0, message: 'Le montant doit être positif' },
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.01"
                  className="form-input"
                />
                {errors.montantMainOeuvre && (
                  <p className="mt-1 text-sm text-danger">{errors.montantMainOeuvre.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="commentaire" className="form-label">
                  Commentaire
                </label>
                <textarea
                  {...register('commentaire')}
                  rows={4}
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/responsable/interventions/${interventionId}`)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={updateMutation.isPending}
              >
                Mettre à jour
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default EditInterventionPage;

