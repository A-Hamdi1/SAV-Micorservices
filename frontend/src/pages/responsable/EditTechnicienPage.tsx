import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { techniciensApi } from '../../api/techniciens';
import { UpdateTechnicienDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const EditTechnicienPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const technicienId = parseInt(id || '0');
  const queryClient = useQueryClient();

  const { data: technicien, isLoading } = useQuery({
    queryKey: ['technicien', technicienId],
    queryFn: () => techniciensApi.getTechnicienById(technicienId),
    enabled: !!technicienId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTechnicienDto) =>
      techniciensApi.updateTechnicien(technicienId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicien', technicienId] });
      queryClient.invalidateQueries({ queryKey: ['techniciens'] });
      toast.success('Technicien mis Ã  jour avec succÃ¨s');
      navigate(`/responsable/techniciens/${technicienId}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTechnicienDto>();

  useEffect(() => {
    if (technicien?.data) {
      reset({
        nom: technicien.data.nom,
        prenom: technicien.data.prenom,
        email: technicien.data.email,
        telephone: technicien.data.telephone,
        specialite: technicien.data.specialite,
        estDisponible: technicien.data.estDisponible,
      });
    }
  }, [technicien?.data, reset]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!technicien?.data) {
    return (
      <>
        <PageHeader
          title="Technicien non trouvÃ©"
          breadcrumb={[
            { label: 'Dashboard', path: '/responsable' },
            { label: 'Techniciens', path: '/responsable/techniciens' },
            { label: 'Modifier' }
          ]}
        />
        <Card>
          <CardBody>
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
              Technicien non trouvÃ©
            </div>
          </CardBody>
        </Card>
      </>
    );
  }

  const onSubmit = async (data: UpdateTechnicienDto) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error updating technicien:', error);
    }
  };

  return (
    <>
      <PageHeader
        title="Modifier le technicien"
        subtitle={`Modification de ${technicien.data.prenom} ${technicien.data.nom}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Techniciens', path: '/responsable/techniciens' },
          { label: `${technicien.data.prenom} ${technicien.data.nom}`, path: `/responsable/techniciens/${technicienId}` },
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
                <label htmlFor="specialite" className="form-label">
                  SpÃ©cialitÃ© *
                </label>
                <input
                  {...register('specialite', { required: 'SpÃ©cialitÃ© requise' })}
                  type="text"
                  className="form-input"
                />
                {errors.specialite && (
                  <p className="mt-1 text-sm text-danger">{errors.specialite.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    {...register('estDisponible')}
                    type="checkbox"
                    className="w-5 h-5 rounded border-stroke text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-black">Disponible</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/responsable/techniciens/${technicienId}`)}
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

export default EditTechnicienPage;

