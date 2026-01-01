import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { interventionsApi } from '../../api/interventions';
import { articlesApi } from '../../api/articles';
import { reclamationsApi } from '../../api/reclamations';
import { articlesAchetesApi } from '../../api/articlesAchetes';
import { pdfApi } from '../../api/newFeatures';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { AddPieceUtiliseeDto } from '../../types';
import { toast } from 'react-toastify';
import { Calendar, User, FileText, Package, ArrowLeft, CheckCircle, Download, Wrench } from 'lucide-react';

const TechnicienInterventionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const interventionId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddPiece, setShowAddPiece] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { data: intervention, isLoading } = useQuery({
    queryKey: ['intervention', interventionId],
    queryFn: () => interventionsApi.getInterventionById(interventionId),
    enabled: !!interventionId,
  });

  // Get the reclamation to find client info and article
  const { data: reclamation } = useQuery({
    queryKey: ['reclamation', intervention?.data?.reclamationId],
    queryFn: () => reclamationsApi.getReclamationById(intervention!.data!.reclamationId),
    enabled: !!intervention?.data?.reclamationId,
  });

  // Get the article achat to find the article ID
  const { data: articleAchat } = useQuery({
    queryKey: ['article-achat', reclamation?.data?.articleAchatId],
    queryFn: () => articlesAchetesApi.getArticleAchatById(reclamation!.data!.articleAchatId),
    enabled: !!reclamation?.data?.articleAchatId,
  });

  const { data: facture } = useQuery({
    queryKey: ['facture', interventionId],
    queryFn: () => interventionsApi.genererFacture(interventionId),
    enabled: !!interventionId && intervention?.data?.statut === 'Terminee',
  });

  // Fetch pieces from the specific article
  const { data: piecesDetachees } = useQuery({
    queryKey: ['pieces-detachees', articleAchat?.data?.articleId],
    queryFn: () => articlesApi.getPiecesDetachees(articleAchat!.data!.articleId),
    enabled: showAddPiece && !!articleAchat?.data?.articleId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (statut: string) =>
      interventionsApi.updateInterventionStatut(interventionId, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention', interventionId] });
      queryClient.invalidateQueries({ queryKey: ['technicien-interventions'] });
      toast.success('Intervention marquée comme terminée');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });

  const addPieceMutation = useMutation({
    mutationFn: (data: AddPieceUtiliseeDto) =>
      interventionsApi.addPieceUtilisee(interventionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intervention', interventionId] });
      toast.success('Pièce ajoutée avec succès');
      setShowAddPiece(false);
      resetPiece();
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout de la pièce');
    },
  });

  const {
    register: registerPiece,
    handleSubmit: handleSubmitPiece,
    formState: { errors: errorsPiece },
    reset: resetPiece,
  } = useForm<AddPieceUtiliseeDto>();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!intervention?.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-xl">
          Intervention non trouvée
        </div>
      </div>
    );
  }

  const interv = intervention.data;
  const isInterventionClosed = interv.statut === 'Terminee' || interv.statut === 'Annulee';

  const onSubmitPiece = async (data: AddPieceUtiliseeDto) => {
    try {
      await addPieceMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error adding piece:', error);
    }
  };

  const handleCompleteIntervention = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir marquer cette intervention comme terminée ?')) {
      try {
        await updateStatusMutation.mutateAsync('Terminee');
      } catch (error) {
        console.error('Error completing intervention:', error);
      }
    }
  };

  const handleDownloadRapportPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const response = await pdfApi.downloadRapportIntervention(interventionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-intervention-${interventionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Rapport PDF téléchargé');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement du rapport PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title={`Intervention #${interv.id}`}
        subtitle={<StatusBadge status={interv.statut} />}
        breadcrumb={[
          { label: 'Dashboard', path: '/technicien/dashboard' },
          { label: 'Mes Interventions', path: '/technicien/interventions' },
          { label: `Intervention #${interv.id}` },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/technicien/interventions')}
            icon={<ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
          >
            Retour
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Intervention Info */}
          <Card>
            <CardHeader title="Informations de l'intervention" />
            <CardBody>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Date d'intervention</dt>
                    <dd className="mt-1 text-sm text-slate-900">{formatDate(interv.dateIntervention)}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Réclamation</dt>
                    <dd className="mt-1 text-sm text-slate-900">#{interv.reclamationId}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Type d'intervention</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {interv.estGratuite ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Gratuite (Sous garantie)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Payante
                        </span>
                      )}
                    </dd>
                  </div>
                </div>
                {interv.montantMainOeuvre && (
                  <div className="flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Main d'œuvre</dt>
                      <dd className="mt-1 text-sm text-slate-900">{formatCurrency(interv.montantMainOeuvre)}</dd>
                    </div>
                  </div>
                )}
              </dl>
              {interv.commentaire && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <dt className="text-sm font-medium text-slate-500 mb-2">Commentaire</dt>
                  <dd className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">{interv.commentaire}</dd>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Client Info */}
          {reclamation?.data && (
            <Card>
              <CardHeader title="Informations du client" />
              <CardBody>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Nom du client</dt>
                      <dd className="mt-1 text-sm text-slate-900">{reclamation.data.clientNom}</dd>
                    </div>
                  </div>
                </dl>
                {reclamation.data.description && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <dt className="text-sm font-medium text-slate-500 mb-2">Description du problème</dt>
                    <dd className="text-sm text-slate-900 bg-amber-50 p-3 rounded-lg border border-amber-100">
                      {reclamation.data.description}
                    </dd>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Pieces utilisées */}
          <Card>
            <CardHeader
              title="Pièces utilisées"
              action={
                !isInterventionClosed && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAddPiece(!showAddPiece)}
                  >
                    + Ajouter une pièce
                  </Button>
                )
              }
            />
            <CardBody>
              {!isInterventionClosed && showAddPiece && (
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <form onSubmit={handleSubmitPiece(onSubmitPiece)} className="space-y-4">
                    <div>
                      <label className="form-label">Pièce détachée</label>
                      <select
                        {...registerPiece('pieceDetacheeId', {
                          required: 'Pièce requise',
                          valueAsNumber: true,
                        })}
                        className="form-select"
                      >
                        <option value="">Sélectionner une pièce</option>
                        {piecesDetachees?.data?.map((piece) => (
                          <option key={piece.id} value={piece.id}>
                            {piece.nom} - {piece.reference} ({formatCurrency(piece.prix)}) - Stock: {piece.stock}
                          </option>
                        ))}
                      </select>
                      {(!piecesDetachees?.data || piecesDetachees.data.length === 0) && (
                        <p className="mt-1 text-sm text-warning">
                          Aucune pièce détachée disponible pour cet article
                        </p>
                      )}
                      {errorsPiece.pieceDetacheeId && (
                        <p className="mt-1 text-sm text-danger">{errorsPiece.pieceDetacheeId.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Quantité</label>
                      <input
                        {...registerPiece('quantite', {
                          required: 'Quantité requise',
                          min: { value: 1, message: 'La quantité doit être au moins 1' },
                          valueAsNumber: true,
                        })}
                        type="number"
                        className="form-input"
                        defaultValue={1}
                      />
                      {errorsPiece.quantite && (
                        <p className="mt-1 text-sm text-danger">{errorsPiece.quantite.message}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={addPieceMutation.isPending}
                        loading={addPieceMutation.isPending}
                      >
                        Ajouter
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

              {interv.piecesUtilisees && interv.piecesUtilisees.length > 0 ? (
                <div className="space-y-3">
                  {interv.piecesUtilisees.map((piece) => (
                    <div key={piece.id} className="flex items-center justify-between border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{piece.pieceNom}</p>
                        <p className="text-xs text-slate-500">Ref: {piece.pieceReference}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Qté: {piece.quantite}</p>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(piece.sousTotal)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Total pièces</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(interv.piecesUtilisees.reduce((acc, p) => acc + p.sousTotal, 0))}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">Aucune pièce utilisée pour le moment</p>
              )}
            </CardBody>
          </Card>

          {/* Facture */}
          {interv.statut === 'Terminee' && facture?.data && (
            <Card>
              <CardHeader 
                title="Facture" 
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadRapportPdf}
                    disabled={isDownloadingPdf}
                    loading={isDownloadingPdf}
                    icon={<Download className="w-4 h-4" strokeWidth={1.5} />}
                  >
                    Télécharger PDF
                  </Button>
                }
              />
              <CardBody>
                <pre className="whitespace-pre-wrap text-sm text-slate-600 bg-slate-50 p-4 rounded-xl font-mono">
                  {facture.data}
                </pre>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader title="Récapitulatif" />
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Main d'œuvre</span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatCurrency(interv.montantMainOeuvre || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Pièces</span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatCurrency(interv.piecesUtilisees?.reduce((acc, p) => acc + p.sousTotal, 0) || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 bg-primary/5 px-3 -mx-3 rounded-lg">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(interv.montantTotal)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          {!isInterventionClosed && (
            <Card>
              <CardHeader title="Actions" />
              <CardBody>
                <Button
                  variant="success"
                  fullWidth
                  onClick={handleCompleteIntervention}
                  disabled={updateStatusMutation.isPending}
                  loading={updateStatusMutation.isPending}
                  icon={<CheckCircle className="w-5 h-5" strokeWidth={1.5} />}
                >
                  Marquer comme terminée
                </Button>
              </CardBody>
            </Card>
          )}

          {isInterventionClosed && (
            <Card>
              <CardBody>
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-lg font-semibold text-slate-900">
                    {interv.statut === 'Terminee' ? 'Intervention terminée' : 'Intervention annulée'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Cette intervention est clôturée
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicienInterventionDetailsPage;
