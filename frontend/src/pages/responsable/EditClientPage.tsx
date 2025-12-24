import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api/clients';
import { UpdateClientDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const EditClientPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || '0');
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getClientById(clientId),
    enabled: !!clientId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateClientDto) => clientsApi.updateClient(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client mis Ã  jour avec succÃ¨s');
      navigate(`/responsable/clients/${clientId}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateClientDto>();

  useEffect(() => {
    if (client?.data) {
      reset({
        nom: client.data.nom,
        prenom: client.data.prenom,
        telephone: client.data.telephone,
        adresse: client.data.adresse,
      });
    }
  }, [client?.data, reset]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!client?.data) {
    return (
      <>
        <PageHeader
          title="Client non trouvÃ©"
          breadcrumb={[
            { label: 'Dashboard', path: '/responsable' },
            { label: 'Clients', path: '/responsable/clients' },
            { label: 'Modifier' }
          ]}
        />
        <Card>
          <CardBody>
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
              Client non trouvÃ©
            </div>
          </CardBody>
        </Card>
      </>
    );
  }

  const onSubmit = async (data: UpdateClientDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  return (
    <>
      <PageHeader
        title="Modifier le client"
        subtitle={`Modification de ${client.data.prenom} ${client.data.nom}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Clients', path: '/responsable/clients' },
          { label: `${client.data.prenom} ${client.data.nom}`, path: `/responsable/clients/${clientId}` },
          { label: 'Modifier' }
        ]}
      />

      <Card>
        <CardBody>
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
                  PrÃ©nom *
                </label>
                <input
                  {...register('prenom', { required: 'PrÃ©nom requis' })}
                  type="text"
                  className="form-input"
                />
                {errors.prenom && (
                  <p className="mt-1 text-sm text-danger">{errors.prenom.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="telephone" className="form-label">
                  TÃ©lÃ©phone *
                </label>
                <input
                  {...register('telephone', { required: 'TÃ©lÃ©phone requis' })}
                  type="tel"
                  className="form-input"
                />
                {errors.telephone && (
                  <p className="mt-1 text-sm text-danger">{errors.telephone.message}</p>
                )}
              </div>

              <div>
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
                onClick={() => navigate(`/responsable/clients/${clientId}`)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={updateMutation.isPending}
              >
                Mettre Ã  jour
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
};

export default EditClientPage;

