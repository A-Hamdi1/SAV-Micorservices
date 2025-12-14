import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { articlesApi } from '../../api/articles';
import { CreatePieceDetacheeDto } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';

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
      toast.success('Article supprimé avec succès');
      navigate('/responsable/articles');
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
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
      toast.success('Pièce détachée créée avec succès');
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
    return <LoadingSpinner />;
  }

  if (!article?.data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Article non trouvé
        </div>
      </div>
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
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          to="/responsable/articles"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          ← Retour aux articles
        </Link>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{articleData.nom}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/responsable/articles/${articleId}/edit`)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Modifier
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Référence</dt>
                <dd className="mt-1 text-sm text-gray-900">{articleData.reference}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Catégorie</dt>
                <dd className="mt-1 text-sm text-gray-900">{articleData.categorie}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Prix de vente</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(articleData.prixVente)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Durée de garantie</dt>
                <dd className="mt-1 text-sm text-gray-900">{articleData.dureeGarantie} mois</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(articleData.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Pièces détachées</h2>
              <button
                onClick={() => setShowAddPiece(!showAddPiece)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-xs font-medium"
              >
                + Ajouter
              </button>
            </div>

            {showAddPiece && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <form onSubmit={handleSubmitPiece(onSubmitPiece)} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom *</label>
                    <input
                      {...registerPiece('nom', { required: 'Nom requis' })}
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {errorsPiece.nom && (
                      <p className="mt-1 text-sm text-red-600">{errorsPiece.nom.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Référence *</label>
                    <input
                      {...registerPiece('reference', { required: 'Référence requise' })}
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {errorsPiece.reference && (
                      <p className="mt-1 text-sm text-red-600">{errorsPiece.reference.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prix (€) *</label>
                      <input
                        {...registerPiece('prix', {
                          required: 'Prix requis',
                          min: { value: 0, message: 'Le prix doit être positif' },
                          valueAsNumber: true,
                        })}
                        type="number"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {errorsPiece.prix && (
                        <p className="mt-1 text-sm text-red-600">{errorsPiece.prix.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock *</label>
                      <input
                        {...registerPiece('stock', {
                          required: 'Stock requis',
                          min: { value: 0, message: 'Le stock doit être positif' },
                          valueAsNumber: true,
                        })}
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {errorsPiece.stock && (
                        <p className="mt-1 text-sm text-red-600">{errorsPiece.stock.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={createPieceMutation.isPending}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50"
                    >
                      {createPieceMutation.isPending ? 'Création...' : 'Créer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPiece(false);
                        resetPiece();
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-xs font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {pieces?.data && pieces.data.length > 0 ? (
              <div className="space-y-4">
                {pieces.data.map((piece) => (
                  <div key={piece.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900">{piece.nom}</p>
                    <p className="text-sm text-gray-600">Ref: {piece.reference}</p>
                    <div className="mt-2 flex justify-between">
                      <p className="text-sm text-gray-600">Stock: {piece.stock}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(piece.prix)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune pièce détachée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailsPage;

