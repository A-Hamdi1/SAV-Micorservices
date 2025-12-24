import { useState, useEffect } from 'react';
import { rdvApi, DemandeRdv, CreneauDisponible } from '../../api/newFeatures';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const RdvManagementPage = () => {
  const [demandes, setDemandes] = useState<DemandeRdv[]>([]);
  const [historique, setHistorique] = useState<DemandeRdv[]>([]);
  const [creneaux, setCreneaux] = useState<CreneauDisponible[]>([]);
  const [creneauxStats, setCreneauxStats] = useState({
    totalCount: 0,
    totalLibres: 0,
    totalReserves: 0,
    totalPages: 1
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'demandes' | 'historique' | 'creneaux' | 'generer'>('demandes');
  const [refusRaison, setRefusRaison] = useState('');
  const [showRefusModal, setShowRefusModal] = useState(false);
  const [demandeToRefuse, setDemandeToRefuse] = useState<DemandeRdv | null>(null);
  
  // Génération de créneaux
  const [genTechnicienId, setGenTechnicienId] = useState<number>(1);
  const [genDateDebut, setGenDateDebut] = useState<string>(new Date().toISOString().split('T')[0]);
  const [genDateFin, setGenDateFin] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [genHeureDebut, setGenHeureDebut] = useState(8);
  const [genHeureFin, setGenHeureFin] = useState(18);
  const [genDuree, setGenDuree] = useState(60);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Demandes en attente
      const demandesRes = await rdvApi.getDemandesEnAttente();
      setDemandes(demandesRes.data.data || []);
      
      // Toutes les demandes (pour l'historique)
      const allDemandesRes = await rdvApi.getDemandesRdv();
      const allDemandes = allDemandesRes.data.data || [];
      // Filtrer pour n'avoir que les demandes non en attente (historique)
      setHistorique(allDemandes.filter((d: DemandeRdv) => d.statut !== 'EnAttente'));
      
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // Récupérer tous les créneaux avec pagination pour les stats et l'affichage
      const creneauxRes = await rdvApi.getAllCreneaux(today, nextMonth.toISOString().split('T')[0], currentPage, pageSize);
      const result = creneauxRes.data.data;
      setCreneaux(result.creneaux || []);
      setCreneauxStats({
        totalCount: result.totalCount,
        totalLibres: result.totalLibres,
        totalReserves: result.totalReserves,
        totalPages: result.totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreneauxPage = async (page: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const creneauxRes = await rdvApi.getAllCreneaux(today, nextMonth.toISOString().split('T')[0], page, pageSize);
      const result = creneauxRes.data.data;
      setCreneaux(result.creneaux || []);
      setCreneauxStats({
        totalCount: result.totalCount,
        totalLibres: result.totalLibres,
        totalReserves: result.totalReserves,
        totalPages: result.totalPages
      });
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccepterDemande = async (demande: DemandeRdv) => {
    if (!demande.creneauId) {
      setError('Cette demande n\'a pas de créneau sélectionné');
      return;
    }
    
    try {
      await rdvApi.accepterDemande(demande.id, demande.creneauId);
      await fetchData();
    } catch (err) {
      setError('Erreur lors de l\'acceptation');
    }
  };

  const handleRefuserDemande = async () => {
    if (!demandeToRefuse) return;
    
    try {
      await rdvApi.refuserDemande(demandeToRefuse.id, refusRaison);
      setShowRefusModal(false);
      setDemandeToRefuse(null);
      setRefusRaison('');
      await fetchData();
    } catch (err) {
      setError('Erreur lors du refus');
    }
  };

  const handleGenererCreneaux = async () => {
    try {
      const result = await rdvApi.genererCreneaux(
        genTechnicienId,
        genDateDebut,
        genDateFin,
        genHeureDebut,
        genHeureFin,
        genDuree
      );
      alert(`${result.data.data} créneaux générés avec succès !`);
      await fetchData();
    } catch (err) {
      setError('Erreur lors de la génération');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader
        title="Gestion des Rendez-vous"
        breadcrumb={[
          { label: 'Responsable', path: '/responsable' },
          { label: 'Rendez-vous' }
        ]}
        subtitle="Gérez les demandes de rendez-vous et les créneaux disponibles"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #eab308, #facc15)' }}>
          <div className="text-sm opacity-80 mb-1">Demandes en attente</div>
          <div className="text-3xl font-bold">{demandes.length}</div>
        </div>
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)' }}>
          <div className="text-sm opacity-80 mb-1">Créneaux libres</div>
          <div className="text-3xl font-bold">{creneauxStats.totalLibres}</div>
        </div>
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
          <div className="text-sm opacity-80 mb-1">Créneaux réservés</div>
          <div className="text-3xl font-bold">{creneauxStats.totalReserves}</div>
        </div>
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
          <div className="text-sm opacity-80 mb-1">Total créneaux</div>
          <div className="text-3xl font-bold">{creneauxStats.totalCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stroke mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('demandes')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'demandes' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          📨 Demandes ({demandes.length})
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'historique' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          📋 Historique ({historique.length})
        </button>
        <button
          onClick={() => setActiveTab('creneaux')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'creneaux' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          📆 Créneaux
        </button>
        <button
          onClick={() => setActiveTab('generer')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'generer' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          ⚙️ Générer Créneaux
        </button>
      </div>

      {/* Demandes Tab */}
      {activeTab === 'demandes' && (
        <div className="space-y-4">
          {demandes.length === 0 ? (
            <Card>
              <CardBody>
                <div className="bg-meta-3/10 border border-meta-3/20 rounded-xl p-6 text-center">
                  <span className="text-4xl mb-2 block">✅</span>
                  <p className="text-meta-3 font-medium">Aucune demande en attente</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            demandes.map((demande) => (
              <Card key={demande.id}>
                <CardBody>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-black text-lg">
                        {demande.motif || 'Service SAV'}
                      </div>
                      <div className="text-sm text-bodydark2 mt-1">
                        {demande.reclamationId ? (
                          <span>🔗 Lié à la réclamation #{demande.reclamationId}</span>
                        ) : (
                          <span className="text-primary">📅 RDV indépendant</span>
                        )}
                        <span className="mx-2">•</span>
                        Client ID: {demande.clientId}
                      </div>
                      
                      {/* Affichage du créneau sélectionné par le client */}
                      {demande.creneau ? (
                        <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                          <div className="text-sm font-medium text-success mb-1">📅 Créneau sélectionné par le client</div>
                          <div className="text-sm text-black">
                            <strong>{new Date(demande.creneau.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                          </div>
                          <div className="text-sm text-bodydark2">
                            🕐 {new Date(demande.creneau.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(demande.creneau.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-sm text-bodydark2">
                            👨‍🔧 Technicien: {demande.creneau.technicienNom || `Tech #${demande.creneau.technicienId}`}
                          </div>
                        </div>
                      ) : demande.creneauId ? (
                        <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                          <div className="text-sm text-warning">⚠️ Créneau ID #{demande.creneauId} (détails non chargés)</div>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                          <div className="text-sm text-danger">❌ Aucun créneau sélectionné</div>
                        </div>
                      )}
                      
                      {demande.commentaire && (
                        <div className="text-sm text-bodydark2 mt-2 italic">
                          💬 "{demande.commentaire}"
                        </div>
                      )}
                      <div className="text-xs text-bodydark2 mt-2">
                        Créée le {new Date(demande.createdAt || demande.dateCreation || '').toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="success"
                        onClick={() => handleAccepterDemande(demande)}
                        disabled={!demande.creneauId}
                      >
                        ✓ Accepter
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => { setDemandeToRefuse(demande); setShowRefusModal(true); }}
                      >
                        ✗ Refuser
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Historique Tab */}
      {activeTab === 'historique' && (
        <div className="space-y-4">
          {historique.length === 0 ? (
            <Card>
              <CardBody>
                <div className="bg-bodydark1/20 border border-bodydark1/30 rounded-xl p-6 text-center">
                  <span className="text-4xl mb-2 block">📭</span>
                  <p className="text-bodydark2 font-medium">Aucun historique de RDV</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            historique.map((demande) => (
              <Card key={demande.id}>
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-black text-lg">
                          {demande.motif || 'Service SAV'}
                        </span>
                        <StatusBadge status={demande.statut} />
                      </div>
                      <div className="text-sm text-bodydark2 mt-1">
                        {demande.reclamationId ? (
                          <span>🔗 Réclamation #{demande.reclamationId}</span>
                        ) : (
                          <span className="text-primary">📅 RDV indépendant</span>
                        )}
                        <span className="mx-2">•</span>
                        Client ID: {demande.clientId}
                      </div>
                      <div className="text-sm text-bodydark2 mt-2">
                        <strong>Date souhaitée:</strong> {new Date(demande.dateSouhaitee || demande.datePreferee || '').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      {demande.creneau && (
                        <div className="text-sm text-success mt-1">
                          ✅ Créneau: {new Date(demande.creneau.dateDebut).toLocaleString('fr-FR')} avec {demande.creneau.technicienNom}
                        </div>
                      )}
                      {demande.commentaire && (
                        <div className="text-sm text-bodydark2 mt-1 italic">
                          💬 "{demande.commentaire}"
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-bodydark2">
                      <div>Créée: {new Date(demande.createdAt || '').toLocaleDateString('fr-FR')}</div>
                      {demande.traiteeAt && (
                        <div>Traitée: {new Date(demande.traiteeAt).toLocaleDateString('fr-FR')}</div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Créneaux Tab */}
      {activeTab === 'creneaux' && (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left">
                    <th className="px-6 py-4 font-medium text-black">Date/Heure</th>
                    <th className="px-6 py-4 font-medium text-black text-center">Technicien</th>
                    <th className="px-6 py-4 font-medium text-black text-center">Fin</th>
                    <th className="px-6 py-4 font-medium text-black text-center">Statut</th>
                    <th className="px-6 py-4 font-medium text-black text-center">Intervention</th>
                  </tr>
                </thead>
                <tbody>
                  {creneaux.map((creneau) => (
                    <tr key={creneau.id} className="border-b border-stroke hover:bg-gray-2">
                      <td className="px-6 py-4 text-sm font-medium text-black">
                        {new Date(creneau.dateDebut).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-bodydark2">
                        {creneau.technicienNom || `Tech #${creneau.technicienId}`}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-bodydark2">
                        {new Date(creneau.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={creneau.estReserve ? 'Réservé' : 'Libre'} />
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-bodydark2">
                        {creneau.interventionId || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {creneauxStats.totalPages > 1 && (
              <div className="p-4 border-t border-stroke flex items-center justify-between">
                <div className="text-sm text-bodydark2">
                  Page {currentPage} sur {creneauxStats.totalPages} ({creneauxStats.totalCount} créneaux)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCreneauxPage(1)}
                    disabled={currentPage === 1}
                  >
                    ⏮ Début
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCreneauxPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Précédent
                  </Button>
                  <span className="px-4 py-2 text-sm font-medium">
                    {currentPage} / {creneauxStats.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCreneauxPage(currentPage + 1)}
                    disabled={currentPage >= creneauxStats.totalPages}
                  >
                    Suivant →
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCreneauxPage(creneauxStats.totalPages)}
                    disabled={currentPage >= creneauxStats.totalPages}
                  >
                    Fin ⏭
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Générer Tab */}
      {activeTab === 'generer' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <h2 className="text-lg font-semibold text-black">Générer des Créneaux Automatiquement</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">Technicien ID</label>
                <input
                  type="number"
                  min="1"
                  value={genTechnicienId}
                  onChange={(e) => setGenTechnicienId(parseInt(e.target.value))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Durée créneau (min)</label>
                <select
                  value={genDuree}
                  onChange={(e) => setGenDuree(parseInt(e.target.value))}
                  className="form-select"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={90}>1h30</option>
                  <option value={120}>2 heures</option>
                </select>
              </div>
              <div>
                <label className="form-label">Date début</label>
                <input
                  type="date"
                  value={genDateDebut}
                  onChange={(e) => setGenDateDebut(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Date fin</label>
                <input
                  type="date"
                  value={genDateFin}
                  onChange={(e) => setGenDateFin(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Heure début</label>
                <select
                  value={genHeureDebut}
                  onChange={(e) => setGenHeureDebut(parseInt(e.target.value))}
                  className="form-select"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 6).map((h) => (
                    <option key={h} value={h}>{h}h00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Heure fin</label>
                <select
                  value={genHeureFin}
                  onChange={(e) => setGenHeureFin(parseInt(e.target.value))}
                  className="form-select"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 12).map((h) => (
                    <option key={h} value={h}>{h}h00</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleGenererCreneaux}
            >
              Générer les Créneaux
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Modal Refus */}
      {showRefusModal && demandeToRefuse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <h2 className="text-xl font-bold text-black">Refuser la Demande</h2>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <p className="text-bodydark2">Demande #{demandeToRefuse.id}</p>
                <p className="text-sm text-black font-medium mt-1">{demandeToRefuse.motif}</p>
              </div>
              
              <div className="mb-4">
                <label className="form-label">Raison du refus *</label>
                <textarea
                  value={refusRaison}
                  onChange={(e) => setRefusRaison(e.target.value)}
                  className="form-input"
                  rows={3}
                  placeholder="Expliquer la raison du refus..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleRefuserDemande}
                  disabled={!refusRaison.trim()}
                >
                  Confirmer le Refus
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowRefusModal(false); setDemandeToRefuse(null); setRefusRaison(''); }}
                >
                  Annuler
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RdvManagementPage;
