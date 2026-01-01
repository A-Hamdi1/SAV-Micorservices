import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { techniciensApi } from '../../api/techniciens';
import { CreateTechnicienDto } from '../../types';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const CreateTechnicienPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateTechnicienDto) => techniciensApi.createTechnicien(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['techniciens'] });
      toast.success('Technicien créé avec succès');
      navigate(`/responsable/techniciens/${response.data?.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTechnicienDto>();

  const onSubmit = async (data: CreateTechnicienDto) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating technicien:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Créer un technicien"
        subtitle="Ajouter un nouveau technicien à l'équipe"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Techniciens', path: '/responsable/techniciens' },
          { label: 'Créer' }
        ]}
      />

      <Card>
        <CardBody>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Informations du technicien</h3>
              <p className="text-sm text-slate-500">Remplissez les informations ci-dessous</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="nom" className="form-label">
                  Nom *
                </label>
                <input
                  {...register('nom', { required: 'Nom requis' })}
                  type="text"
                  className="form-input"
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-danger">{errors.nom.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="prenom" className="form-label">
                  Prénom *
                </label>
                <input
                  {...register('prenom', { required: 'Prénom requis' })}
                  type="text"
                  className="form-input"
                />
                {errors.prenom && (
                  <p className="mt-1 text-sm text-danger">{errors.prenom.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="form-label">
                  Email *
                </label>
                <input
                  {...register('email', {
                    required: 'Email requis',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email invalide',
                    },
                  })}
                  type="email"
                  className="form-input"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="telephone" className="form-label">
                  Téléphone *
                </label>
                <input
                  {...register('telephone', { required: 'Téléphone requis' })}
                  type="tel"
                  className="form-input"
                />
                {errors.telephone && (
                  <p className="mt-1 text-sm text-danger">{errors.telephone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="specialite" className="form-label">
                  Spécialité *
                </label>
                <input
                  {...register('specialite', { required: 'Spécialité requise' })}
                  type="text"
                  className="form-input"
                />
                {errors.specialite && (
                  <p className="mt-1 text-sm text-danger">{errors.specialite.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dateEmbauche" className="form-label">
                  Date d'embauche
                </label>
                <input
                  {...register('dateEmbauche')}
                  type="date"
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/responsable/techniciens')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={createMutation.isPending}
              >
                Créer le technicien
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default CreateTechnicienPage;

