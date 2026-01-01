import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interventionsApi } from '../../api/interventions';
import { techniciensApi } from '../../api/techniciens';
import { reclamationsApi } from '../../api/reclamations';
import { CreateInterventionDto } from '../../types';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

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
    <>
      <PageHeader
        title="Créer une intervention"
        subtitle="Planifier une nouvelle intervention pour une réclamation"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Interventions', path: '/responsable/interventions' },
          { label: 'Créer' }
        ]}
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="reclamationId" className="form-label">
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
                      className="form-input bg-slate-100 text-slate-500"
                    />
                  </>
                ) : (
                  <select
                    {...register('reclamationId', {
                      required: 'Réclamation requise',
                      valueAsNumber: true,
                    })}
                    className="form-select"
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
                  <p className="mt-1 text-sm text-danger">{errors.reclamationId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="technicienId" className="form-label">
                  Technicien *
                </label>
                <select
                  {...register('technicienId', { required: 'Technicien requis', valueAsNumber: true })}
                  className="form-select"
                >
                  <option value="">Sélectionner un technicien</option>
                  {techniciens?.data?.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.nomComplet} - {tech.specialite}
                    </option>
                  ))}
                </select>
                {errors.technicienId && (
                  <p className="mt-1 text-sm text-danger">{errors.technicienId.message}</p>
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
                onClick={() => navigate('/responsable/interventions')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={createMutation.isPending}
              >
                Créer l'intervention
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export default CreateInterventionPage;

