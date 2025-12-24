import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { clientsApi } from '../../api/clients';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
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
    return <LoadingSpinner fullScreen />;
  }

  const clients = data?.data || [];
  const hasMorePages = clients.length === pageSize;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Gestion des clients"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Clients' },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/responsable/clients/new')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau client
          </Button>
        }
      />

      {/* Clients List */}
      <Card>
        <CardBody className="p-0">
          {clients.length === 0 ? (
            <EmptyState
              title="Aucun client"
              description="Commencez par ajouter votre premier client."
              icon={
                <svg className="w-12 h-12 text-bodydark2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              action={
                <Button variant="primary" onClick={() => navigate('/responsable/clients/new')}>
                  Ajouter un client
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-stroke">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-5 hover:bg-gray-2 transition-colors"
                >
                  <Link
                    to={`/responsable/clients/${client.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                      <span className="text-lg font-bold text-white">
                        {client.prenom?.charAt(0)}{client.nom?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-black">
                        {client.prenom} {client.nom}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-bodydark2">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {client.telephone}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {client.adresse}
                        </span>
                      </div>
                      <p className="text-xs text-bodydark2 mt-1">
                        Inscrit le {formatDate(client.createdAt)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/responsable/clients/${client.id}/edit`)}
                      className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(client.id, e)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      disabled={deleteMutation.isPending}
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <Link
                      to={`/responsable/clients/${client.id}`}
                      className="p-2 rounded-lg text-bodydark2 hover:bg-gray-2 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {(page > 1 || hasMorePages) && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={hasMorePages ? page + 1 : page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default ClientsListPage;

