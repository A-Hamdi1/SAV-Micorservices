import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reclamationsApi } from '../../api/reclamations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';

const ReclamationsListPage = () => {
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState<string>('');
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['reclamations', page, statut],
    queryFn: () => reclamationsApi.getAllReclamations(page, pageSize, statut || undefined),
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const reclamations = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réclamations"
        subtitle="Gestion des réclamations clients"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Réclamations' },
        ]}
      />

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={statut}
                  onChange={(e) => {
                    setStatut(e.target.value);
                    setPage(1);
                  }}
                  className="form-select pr-10 min-w-[180px]"
                >
                  <option value="">Tous les statuts</option>
                  <option value="EnAttente">En Attente</option>
                  <option value="EnCours">En Cours</option>
                  <option value="Resolue">Résolue</option>
                  <option value="Rejetee">Rejetée</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{totalCount} réclamation(s)</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Reclamations List */}
      <Card>
        <CardBody className="p-0">
          {reclamations.length === 0 ? (
            <EmptyState
              title="Aucune réclamation"
              description="Il n'y a pas de réclamations correspondant à vos critères."
              icon={
                <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
          ) : (
            <div className="divide-y divide-slate-200">
              {reclamations.map((reclamation) => (
                <Link
                  key={reclamation.id}
                  to={`/responsable/reclamations/${reclamation.id}`}
                  className="flex items-start justify-between p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-bold text-white">#{reclamation.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {reclamation.clientPrenom} {reclamation.clientNom}
                        </h3>
                        <StatusBadge status={reclamation.statut} size="sm" />
                      </div>
                      <p className="text-sm text-slate-500 mb-2">
                        {reclamation.articleNom}
                      </p>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {reclamation.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(reclamation.dateCreation)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default ReclamationsListPage;

