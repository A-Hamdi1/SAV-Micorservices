import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { clientsApi } from '../../api/clients';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const ArticlesAchetesListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [clientId, setClientId] = useState<number | undefined>(undefined);
  const [sousGarantie, setSousGarantie] = useState<boolean | undefined>(undefined);
  const pageSize = 10;

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles-achetes', page, clientId, sousGarantie],
    queryFn: () =>
      articlesAchetesApi.getAllArticlesAchates(page, pageSize, clientId, sousGarantie),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => clientsApi.getAllClients(1, 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => articlesAchetesApi.deleteArticleAchat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-achetes'] });
      toast.success('Article acheté supprimé avec succès');
    },
  });

  const handleDelete = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article acheté ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting article achat:', error);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const articlesList = articles?.data || [];
  const totalPages = Math.ceil((articles?.data?.length || 0) / pageSize);

  return (
    <>
      <PageHeader
        title="Articles achetés"
        subtitle="Gestion des articles achetés par les clients"
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Articles achetés' }
        ]}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardBody className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="form-label">Client</label>
              <select
                value={clientId || ''}
                onChange={(e) => {
                  setClientId(e.target.value ? parseInt(e.target.value) : undefined);
                  setPage(1);
                }}
                className="form-select"
              >
                <option value="">Tous les clients</option>
                {clients?.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.prenom} {client.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="form-label">Garantie</label>
              <select
                value={sousGarantie === undefined ? '' : sousGarantie.toString()}
                onChange={(e) => {
                  setSousGarantie(e.target.value === '' ? undefined : e.target.value === 'true');
                  setPage(1);
                }}
                className="form-select"
              >
                <option value="">Tous</option>
                <option value="true">Sous garantie</option>
                <option value="false">Hors garantie</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {articlesList.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {articlesList.map((article) => (
                <div key={article.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{article.articleNom}</p>
                          <p className="text-xs text-slate-500">Ref: {article.articleReference}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 ml-13">
                        <span>N° série: {article.numeroSerie}</span>
                        <span>•</span>
                        <span>Acheté le {formatDate(article.dateAchat)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge
                        status={article.sousGarantie ? 'success' : 'danger'}
                        label={article.sousGarantie ? 'Sous garantie' : 'Hors garantie'}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/responsable/articles-achetes/${article.id}`)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(article.id, e)}
                          disabled={deleteMutation.isPending}
                          className="text-danger hover:bg-danger/10"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun article acheté"
              description="Aucun article acheté ne correspond à vos critères de recherche"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
          )}
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
};

export default ArticlesAchetesListPage;

