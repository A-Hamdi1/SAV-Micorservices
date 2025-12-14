import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { clientsApi } from '../../api/clients';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';

const ClientsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page],
    queryFn: () => clientsApi.getAllClients(page, pageSize),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsApi.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client supprimé avec succès');
    },
  });

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const clients = data?.data || [];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-gray-600">Gestion des clients</p>
        </div>
        <button
          onClick={() => navigate('/responsable/clients/new')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Nouveau client
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {clients.map((client) => (
            <li key={client.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <Link to={`/responsable/clients/${client.id}`} className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-600">
                        {client.prenom} {client.nom}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <p>{client.telephone}</p>
                        <span className="mx-2">•</span>
                        <p>{client.adresse}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Inscrit le {formatDate(client.createdAt)}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => navigate(`/responsable/clients/${client.id}/edit`)}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => handleDelete(client.id, e)}
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
        {clients.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">Aucun client</div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
        >
          Précédent
        </button>
        <span className="text-sm text-gray-600">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={clients.length < pageSize}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default ClientsListPage;

