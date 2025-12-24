import { useState, useEffect } from 'react';
import { stockApi, StockStats, MouvementStock } from '../../api/newFeatures';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

interface PieceDetachee {
  id: number;
  articleId: number;
  nom: string;
  reference: string;
  prix: number;
  stock: number;
  estEnAlerte?: boolean; // Calculé par le backend
}

const StockManagementPage = () => {
  const [pieces, setPieces] = useState<PieceDetachee[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [lowStockPieces, setLowStockPieces] = useState<PieceDetachee[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<PieceDetachee | null>(null);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addStockModal, setAddStockModal] = useState(false);
  const [addQuantite, setAddQuantite] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'stats'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [piecesRes, statsRes, lowStockRes] = await Promise.all([
        stockApi.getAllPieces(),
        stockApi.getStats(),
        stockApi.getLowStock(10)
      ]);
      
      setPieces(piecesRes.data.data || []);
      setStats(statsRes.data.data);
      setLowStockPieces(lowStockRes.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewMouvements = async (piece: PieceDetachee) => {
    try {
      setSelectedPiece(piece);
      const response = await stockApi.getMouvements(piece.id);
      setMouvements(response.data.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des mouvements');
    }
  };

  const handleAddStock = async () => {
    if (!selectedPiece) return;
    
    try {
      await stockApi.addStock(selectedPiece.id, addQuantite);
      setAddStockModal(false);
      setAddQuantite(1);
      setSelectedPiece(null);
      await fetchData();
    } catch (err) {
      setError('Erreur lors de l\'ajout de stock');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader
        title="Gestion du Stock"
        breadcrumb={[
          { label: 'Responsable', path: '/responsable' },
          { label: 'Stock' }
        ]}
        subtitle="Gérez les pièces détachées et le stock"
      />

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
            <div className="text-sm opacity-80 mb-1">Total Pièces</div>
            <div className="text-3xl font-bold">{stats.totalPieces}</div>
          </div>
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)' }}>
            <div className="text-sm opacity-80 mb-1">Items en Stock</div>
            <div className="text-3xl font-bold">{stats.totalStockItems}</div>
          </div>
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
            <div className="text-sm opacity-80 mb-1">Valeur Stock</div>
            <div className="text-3xl font-bold">
              {stats.valeurTotaleStock.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #eab308, #facc15)' }}>
            <div className="text-sm opacity-80 mb-1">En Alerte</div>
            <div className="text-3xl font-bold">{stats.piecesEnAlerte}</div>
          </div>
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)' }}>
            <div className="text-sm opacity-80 mb-1">Rupture</div>
            <div className="text-3xl font-bold">{stats.piecesRuptureStock}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stroke mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          Toutes les Pièces ({pieces.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'alerts' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          ⚠️ Alertes Stock ({lowStockPieces.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'stats' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          📊 Statistiques
        </button>
      </div>

      {/* All Pieces Tab */}
      {activeTab === 'all' && (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left">
                    <th className="px-6 py-4 font-medium text-black">Référence</th>
                    <th className="px-6 py-4 font-medium text-black">Nom</th>
                    <th className="px-6 py-4 font-medium text-black text-center">Stock</th>
                    <th className="px-6 py-4 font-medium text-black text-right">Prix</th>
                    <th className="px-6 py-4 font-medium text-black text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pieces.map((piece) => (
                    <tr key={piece.id} className="border-b border-stroke hover:bg-gray-2">
                      <td className="px-6 py-4 text-sm font-medium text-black">
                        {piece.reference}
                      </td>
                      <td className="px-6 py-4 text-sm text-bodydark2">
                        {piece.nom}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge 
                          status={piece.stock === 0 ? 'Rupture' : piece.estEnAlerte ? 'Alerte' : 'OK'} 
                        />
                        <span className="ml-2 font-medium">{piece.stock}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-bodydark2">
                        {piece.prix.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => { setSelectedPiece(piece); setAddStockModal(true); }}
                        >
                          + Stock
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleViewMouvements(piece)}
                        >
                          Historique
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {lowStockPieces.length === 0 ? (
            <Card>
              <CardBody>
                <div className="bg-meta-3/10 border border-meta-3/20 rounded-xl p-6 text-center">
                  <span className="text-4xl mb-2 block">✓</span>
                  <p className="text-meta-3 font-medium">Aucune pièce en alerte stock</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            lowStockPieces.map((piece) => (
              <Card key={piece.id} className="border-l-4 border-warning">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-black">{piece.nom}</div>
                      <div className="text-sm text-bodydark2">Réf: {piece.reference}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-warning">{piece.stock}</div>
                        <div className="text-xs text-bodydark2">en stock</div>
                      </div>
                      <Button
                        variant="success"
                        onClick={() => { setSelectedPiece(piece); setAddStockModal(true); }}
                      >
                        Réapprovisionner
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pièces les plus utilisées */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-black">🔥 Pièces les Plus Utilisées</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {stats.piecesLesPlusUtilisees.map((piece, idx) => (
                  <div key={piece.id} className="flex items-center justify-between border-b border-stroke pb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        idx === 0 ? 'bg-warning' : idx === 1 ? 'bg-bodydark' : idx === 2 ? 'bg-warning/70' : 'bg-bodydark2'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-medium text-black">{piece.nom}</div>
                        <div className="text-xs text-bodydark2">{piece.reference}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-black">{piece.nombreUtilisations} utilisations</div>
                      <div className="text-xs text-bodydark2">Stock: {piece.stockActuel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Mouvements récents */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-black">📋 Mouvements Récents</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {stats.mouvementsRecents.map((mvt) => (
                  <div key={mvt.id} className="flex items-center justify-between border-b border-stroke pb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                        mvt.typeMouvement === 'Entree' ? 'bg-meta-3' : mvt.typeMouvement === 'Sortie' ? 'bg-meta-1' : 'bg-primary'
                      }`}>
                        {mvt.typeMouvement === 'Entree' ? '+' : mvt.typeMouvement === 'Sortie' ? '-' : '~'}
                      </span>
                      <div>
                        <div className="font-medium text-black">{mvt.pieceNom}</div>
                        <div className="text-xs text-bodydark2">
                          {new Date(mvt.dateMouvement).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      mvt.typeMouvement === 'Entree' ? 'text-meta-3' : mvt.typeMouvement === 'Sortie' ? 'text-meta-1' : 'text-primary'
                    }`}>
                      {mvt.typeMouvement === 'Entree' ? '+' : mvt.typeMouvement === 'Sortie' ? '-' : ''}{mvt.quantite}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Add Stock Modal */}
      {addStockModal && selectedPiece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <h2 className="text-xl font-bold text-black">Ajouter du Stock</h2>
            </CardHeader>
            <CardBody>
              <p className="text-bodydark2 mb-4">
                Pièce: <strong className="text-black">{selectedPiece.nom}</strong> ({selectedPiece.reference})
              </p>
              <p className="text-bodydark2 mb-4">Stock actuel: <strong className="text-black">{selectedPiece.stock}</strong></p>
              
              <div className="mb-4">
                <label className="form-label">Quantité à ajouter</label>
                <input
                  type="number"
                  min="1"
                  value={addQuantite}
                  onChange={(e) => setAddQuantite(parseInt(e.target.value) || 1)}
                  className="form-input"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={handleAddStock}
                >
                  Confirmer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setAddStockModal(false); setSelectedPiece(null); }}
                >
                  Annuler
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Mouvements Modal */}
      {selectedPiece && mouvements.length > 0 && !addStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">Historique des Mouvements</h2>
                <button
                  onClick={() => { setSelectedPiece(null); setMouvements([]); }}
                  className="text-bodydark2 hover:text-black"
                >
                  ❌
                </button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <p className="text-bodydark2 px-6 py-4">
                Pièce: <strong className="text-black">{selectedPiece.nom}</strong>
              </p>
              
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left">
                    <th className="px-4 py-3 font-medium text-black">Date</th>
                    <th className="px-4 py-3 font-medium text-black text-center">Type</th>
                    <th className="px-4 py-3 font-medium text-black text-center">Qté</th>
                    <th className="px-4 py-3 font-medium text-black text-center">Avant</th>
                    <th className="px-4 py-3 font-medium text-black text-center">Après</th>
                    <th className="px-4 py-3 font-medium text-black">Raison</th>
                  </tr>
                </thead>
                <tbody>
                  {mouvements.map((mvt) => (
                    <tr key={mvt.id} className="border-b border-stroke">
                      <td className="px-4 py-3 text-sm text-bodydark2">
                        {new Date(mvt.dateMouvement).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={mvt.typeMouvement} />
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-black">
                        {mvt.typeMouvement === 'Entree' ? '+' : '-'}{mvt.quantite}
                      </td>
                      <td className="px-4 py-3 text-center text-bodydark2">{mvt.stockAvant}</td>
                      <td className="px-4 py-3 text-center text-black font-medium">{mvt.stockApres}</td>
                      <td className="px-4 py-3 text-sm text-bodydark2">{mvt.raison || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StockManagementPage;
