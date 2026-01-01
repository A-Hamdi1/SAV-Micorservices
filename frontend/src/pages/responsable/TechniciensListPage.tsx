import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { techniciensApi } from '../../api/techniciens';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';

const TechniciensListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [disponible, setDisponible] = useState<boolean | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['techniciens', disponible],
    queryFn: () => techniciensApi.getAllTechniciens(disponible),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => techniciensApi.deleteTechnicien(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniciens'] });
      toast.success('Technicien supprimé avec succès');
    },
  });

  const toggleDisponibiliteMutation = useMutation({
    mutationFn: ({ id, estDisponible }: { id: number; estDisponible: boolean }) =>
      techniciensApi.updateDisponibilite(id, { estDisponible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['techniciens'] });
      toast.success('Disponibilité mise à jour');
    },
  });

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce technicien ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting technicien:', error);
      }
    }
  };

  const handleToggleDisponibilite = async (id: number, currentStatus: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleDisponibiliteMutation.mutateAsync({ id, estDisponible: !currentStatus });
    } catch (error) {
      console.error('Error toggling disponibilite:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const techniciens = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Techniciens"
        subtitle="Gestion des techniciens"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Techniciens' },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/responsable/techniciens/new')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau technicien
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={disponible === undefined ? '' : disponible.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDisponible(value === '' ? undefined : value === 'true');
                  }}
                  className="form-select pr-10 min-w-[180px]"
                >
                  <option value="">Tous les techniciens</option>
                  <option value="true">Disponibles</option>
                  <option value="false">Non disponibles</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{techniciens.length} technicien(s)</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Techniciens List */}
      <Card>
        <CardBody className="p-0">
          {techniciens.length === 0 ? (
            <EmptyState
              title="Aucun technicien"
              description="Commencez par ajouter votre premier technicien."
              icon={
                <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              action={
                <Button variant="primary" onClick={() => navigate('/responsable/techniciens/new')}>
                  Ajouter un technicien
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {techniciens.map((technicien) => (
                <div
                  key={technicien.id}
                  className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                >
                  <Link
                    to={`/responsable/techniciens/${technicien.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
                      <span className="text-lg font-bold text-white">
                        {technicien.nomComplet?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {technicien.nomComplet}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            technicien.estDisponible
                              ? 'bg-success/10 text-success'
                              : 'bg-danger/10 text-danger'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${technicien.estDisponible ? 'bg-success' : 'bg-danger'}`}></span>
                          {technicien.estDisponible ? 'Disponible' : 'Non disponible'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-1">{technicien.specialite}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {technicien.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                          {technicien.nombreInterventions} intervention(s)
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => handleToggleDisponibilite(technicien.id, technicien.estDisponible, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        technicien.estDisponible
                          ? 'text-warning hover:bg-warning/10'
                          : 'text-success hover:bg-success/10'
                      }`}
                      disabled={toggleDisponibiliteMutation.isPending}
                      title={technicien.estDisponible ? 'Marquer indisponible' : 'Marquer disponible'}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {technicien.estDisponible ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => navigate(`/responsable/techniciens/${technicien.id}/edit`)}
                      className="p-2 rounded-xl text-primary hover:bg-primary-50 transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(technicien.id, e)}
                      className="p-2 rounded-xl text-danger hover:bg-danger/10 transition-colors"
                      disabled={deleteMutation.isPending}
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <Link
                      to={`/responsable/techniciens/${technicien.id}`}
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TechniciensListPage;

