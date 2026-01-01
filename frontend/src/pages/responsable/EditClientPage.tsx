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
      toast.success('Client mis à jour avec succès');
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
          title="Client non trouvé"
          breadcrumb={[
            { label: 'Dashboard', path: '/responsable' },
            { label: 'Clients', path: '/responsable/clients' },
            { label: 'Modifier' }
          ]}
        />
        <Card>
          <CardBody>
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
              Client non trouvé
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
    <div className="space-y-6">
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
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Modifier les informations</h3>
              <p className="text-sm text-slate-500">Mettez à jour les coordonnées du client</p>
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
                Mettre à jour
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default EditClientPage;

