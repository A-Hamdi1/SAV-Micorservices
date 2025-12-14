import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { techniciensApi } from '../../api/techniciens';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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
    return <LoadingSpinner />;
  }

  const techniciens = data?.data || [];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Techniciens</h1>
          <p className="mt-2 text-gray-600">Gestion des techniciens</p>
        </div>
        <button
          onClick={() => navigate('/responsable/techniciens/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Nouveau technicien
        </button>
      </div>

      <div className="mb-4">
        <select
          value={disponible === undefined ? '' : disponible.toString()}
          onChange={(e) => {
            const value = e.target.value;
            setDisponible(value === '' ? undefined : value === 'true');
          }}
          className="block w-full sm:w-auto border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="">Tous</option>
          <option value="true">Disponibles</option>
          <option value="false">Non disponibles</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {techniciens.map((technicien) => (
            <li key={technicien.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <Link to={`/responsable/techniciens/${technicien.id}`} className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-600">
                        {technicien.nomComplet}
                      </p>
                      <p className="text-sm text-gray-600">{technicien.specialite}</p>
                      <p className="text-sm text-gray-500">{technicien.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {technicien.nombreInterventions} intervention(s)
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          technicien.estDisponible
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {technicien.estDisponible ? 'Disponible' : 'Non disponible'}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={(e) => handleToggleDisponibilite(technicien.id, technicien.estDisponible, e)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    disabled={toggleDisponibiliteMutation.isPending}
                  >
                    {technicien.estDisponible ? 'Indisponible' : 'Disponible'}
                  </button>
                  <button
                    onClick={() => navigate(`/responsable/techniciens/${technicien.id}/edit`)}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => handleDelete(technicien.id, e)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    disabled={deleteMutation.isPending}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {techniciens.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">Aucun technicien</div>
        )}
      </div>
    </div>
  );
};

export default TechniciensListPage;

