import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients';
import { CreateClientByResponsableDto } from '../../types';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const CreateClientPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateClientByResponsableDto) => clientsApi.createClient(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client créé avec succès');
      navigate(`/responsable/clients/${response.data?.id}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClientByResponsableDto>();

  const onSubmit = async (data: CreateClientByResponsableDto) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Créer un client"
        subtitle="Ajouter un nouveau client au système"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Clients', path: '/responsable/clients' },
          { label: 'Créer' }
        ]}
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="userId" className="form-label">
                  ID Utilisateur *
                </label>
                <input
                  {...register('userId', { required: 'ID utilisateur requis' })}
                  type="text"
                  className="form-input"
                  placeholder="ID de l'utilisateur existant"
                />
                {errors.userId && (
                  <p className="mt-1 text-sm text-danger">{errors.userId.message}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  L'utilisateur doit déjà exister dans le système
                </p>
              </div>

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

              <div className="sm:col-span-2">
                <label htmlFor="adresse" className="form-label">
                  Adresse *
                </label>
                <input
                  {...register('adresse', { required: 'Adresse requise' })}
                  type="text"
                  className="form-input"
                />
                {errors.adresse && (
                  <p className="mt-1 text-sm text-danger">{errors.adresse.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/responsable/clients')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={createMutation.isPending}
              >
                Créer le client
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default CreateClientPage;

