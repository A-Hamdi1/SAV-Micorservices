import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { articlesApi } from '../../api/articles';
import { CreatePieceDetacheeDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const ArticleDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const articleId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddPiece, setShowAddPiece] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => articlesApi.deleteArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article supprimÃ© avec succÃ¨s');
      navigate('/responsable/articles');
    },
  });

  const handleDelete = async () => {
    if (window.confirm('ÃŠtes-vous sÃ»r de vouloir supprimer cet article ?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => articlesApi.getArticleById(articleId),
    enabled: !!articleId,
  });

  const { data: pieces, isLoading: piecesLoading } = useQuery({
    queryKey: ['pieces', articleId],
    queryFn: () => articlesApi.getPiecesDetachees(articleId),
    enabled: !!articleId,
  });

  const createPieceMutation = useMutation({
    mutationFn: (data: CreatePieceDetacheeDto) => articlesApi.createPieceDetachee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces', articleId] });
      toast.success('PiÃ¨ce dÃ©tachÃ©e crÃ©Ã©e avec succÃ¨s');
      setShowAddPiece(false);
      resetPiece();
    },
  });

  const {
    register: registerPiece,
    handleSubmit: handleSubmitPiece,
    formState: { errors: errorsPiece },
    reset: resetPiece,
  } = useForm<CreatePieceDetacheeDto>({
    defaultValues: {
      articleId: articleId,
    },
  });

  if (articleLoading || piecesLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!article?.data) {
    return (
      <>
        <PageHeader
          title="Article non trouvÃ©"
          breadcrumb={[
            { label: 'Dashboard', path: '/responsable' },
            { label: 'Articles', path: '/responsable/articles' },
            { label: 'DÃ©tails' }
          ]}
        />
        <Card>
          <CardBody>
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg">
              Article non trouvÃ©
            </div>
          </CardBody>
        </Card>
      </>
    );
  }

  const articleData = article.data;

  const onSubmitPiece = async (data: CreatePieceDetacheeDto) => {
    try {
      await createPieceMutation.mutateAsync({ ...data, articleId });
    } catch (error) {
      console.error('Error creating piece:', error);
    }
  };

  return (
    <>
      <PageHeader
        title={articleData.nom}
        subtitle={`RÃ©fÃ©rence: ${articleData.reference}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/responsable' },
          { label: 'Articles', path: '/responsable/articles' },
          { label: articleData.nom }
        ]}
        actions={
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/responsable/articles/${articleId}/edit`)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Informations" />
          <CardBody>
            <dl className="space-y-4">
              <div className="flex justify-between py-3 border-b border-stroke">
                <dt className="text-sm font-medium text-bodydark2">RÃ©fÃ©rence</dt>
                <dd className="text-sm text-black font-semibold">{articleData.reference}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-stroke">
                <dt className="text-sm font-medium text-bodydark2">CatÃ©gorie</dt>
                <dd className="text-sm text-black">{articleData.categorie}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-stroke">
                <dt className="text-sm font-medium text-bodydark2">Prix de vente</dt>
                <dd className="text-sm text-primary font-bold">{formatCurrency(articleData.prixVente)}</dd>
              </div>
              <div className="flex justify-between py-3 border-b border-stroke">
                <dt className="text-sm font-medium text-bodydark2">DurÃ©e de garantie</dt>
                <dd className="text-sm text-black">{articleData.dureeGarantie} mois</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt className="text-sm font-medium text-bodydark2">Date de crÃ©ation</dt>
                <dd className="text-sm text-black">{formatDate(articleData.createdAt)}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="PiÃ¨ces dÃ©tachÃ©es"
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddPiece(!showAddPiece)}
              >
                + Ajouter
              </Button>
            }
          />
          <CardBody>
            {showAddPiece && (
              <div className="mb-4 p-4 bg-bodydark/5 rounded-lg border border-stroke">
                <form onSubmit={handleSubmitPiece(onSubmitPiece)} className="space-y-3">
                  <div>
                    <label className="form-label">Nom *</label>
                    <input
                      {...registerPiece('nom', { required: 'Nom requis' })}
                      type="text"
                      className="form-input"
                    />
                    {errorsPiece.nom && (
                      <p className="mt-1 text-sm text-danger">{errorsPiece.nom.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">RÃ©fÃ©rence *</label>
                    <input
                      {...registerPiece('reference', { required: 'RÃ©fÃ©rence requise' })}
                      type="text"
                      className="form-input"
                    />
                    {errorsPiece.reference && (
                      <p className="mt-1 text-sm text-danger">{errorsPiece.reference.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Prix (â‚¬) *</label>
                      <input
                        {...registerPiece('prix', {
                          required: 'Prix requis',
                          min: { value: 0, message: 'Le prix doit Ãªtre positif' },
                          valueAsNumber: true,
                        })}
                        type="number"
                        step="0.01"
                        className="form-input"
                      />
                      {errorsPiece.prix && (
                        <p className="mt-1 text-sm text-danger">{errorsPiece.prix.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Stock *</label>
                      <input
                        {...registerPiece('stock', {
                          required: 'Stock requis',
                          min: { value: 0, message: 'Le stock doit Ãªtre positif' },
                          valueAsNumber: true,
                        })}
                        type="number"
                        className="form-input"
                      />
                      {errorsPiece.stock && (
                        <p className="mt-1 text-sm text-danger">{errorsPiece.stock.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={createPieceMutation.isPending}
                    >
                      CrÃ©er
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddPiece(false);
                        resetPiece();
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {pieces?.data && pieces.data.length > 0 ? (
              <div className="space-y-4">
                {pieces.data.map((piece) => (
                  <div key={piece.id} className="border border-stroke rounded-lg p-4 hover:bg-bodydark/5 transition-colors">
                    <p className="text-sm font-semibold text-black">{piece.nom}</p>
                    <p className="text-sm text-bodydark2">Ref: {piece.reference}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${piece.stock > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        Stock: {piece.stock}
                      </span>
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(piece.prix)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Aucune piÃ¨ce dÃ©tachÃ©e"
                description="Ajoutez des piÃ¨ces dÃ©tachÃ©es pour cet article"
                icon={
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                }
              />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default ArticleDetailsPage;

