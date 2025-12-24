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
  const [creneaux, setCreneaux] = useState<CreneauDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'demandes' | 'creneaux' | 'generer'>('demandes');
  const [selectedDemande, setSelectedDemande] = useState<DemandeRdv | null>(null);
  const [selectedCreneau, setSelectedCreneau] = useState<number | null>(null);
  const [refusRaison, setRefusRaison] = useState('');
  const [showRefusModal, setShowRefusModal] = useState(false);
  
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
      
      const demandesRes = await rdvApi.getDemandesEnAttente();
      setDemandes(demandesRes.data.data || []);
      
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const creneauxRes = await rdvApi.getCreneauxDisponibles(today, nextMonth.toISOString().split('T')[0]);
      setCreneaux(creneauxRes.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccepterDemande = async () => {
    if (!selectedDemande || !selectedCreneau) return;
    
    try {
      await rdvApi.accepterDemande(selectedDemande.id, selectedCreneau);
      setSelectedDemande(null);
      setSelectedCreneau(null);
      await fetchData();
    } catch (err) {
      setError('Erreur lors de l\'acceptation');
    }
  };

  const handleRefuserDemande = async () => {
    if (!selectedDemande) return;
    
    try {
      await rdvApi.refuserDemande(selectedDemande.id, refusRaison);
      setShowRefusModal(false);
      setSelectedDemande(null);
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

  const creneauxLibres = creneaux.filter(c => !c.estReserve);
  const creneauxReserves = creneaux.filter(c => c.estReserve);

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
          <div className="text-3xl font-bold">{creneauxLibres.length}</div>
        </div>
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
          <div className="text-sm opacity-80 mb-1">Créneaux réservés</div>
          <div className="text-3xl font-bold">{creneauxReserves.length}</div>
        </div>
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
          <div className="text-sm opacity-80 mb-1">Total créneaux</div>
          <div className="text-3xl font-bold">{creneaux.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stroke mb-6">
        <button
          onClick={() => setActiveTab('demandes')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'demandes' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          📨 Demandes ({demandes.length})
        </button>
        <button
          onClick={() => setActiveTab('creneaux')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'creneaux' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
        >
          📆 Créneaux
        </button>
        <button
          onClick={() => setActiveTab('generer')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'generer' ? 'border-b-2 border-primary text-primary' : 'text-bodydark2 hover:text-black'}`}
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
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-black">
                        Demande #{demande.id} - Réclamation #{demande.reclamationId}
                      </div>
                      <div className="text-sm text-bodydark2 mt-1">
                        Client ID: {demande.clientId}
                      </div>
                      <div className="text-sm text-bodydark2 mt-2">
                        <strong>Date préférée:</strong> {new Date(demande.dateSouhaitee || demande.datePreferee || '').toLocaleDateString('fr-FR')}
                      </div>
                      {(demande.preferenceMoment || demande.creneauPreference) && (
                        <div className="text-sm text-bodydark2">
                          <strong>Préférence:</strong> {demande.preferenceMoment || demande.creneauPreference}
                        </div>
                      )}
                      {demande.commentaire && (
                        <div className="text-sm text-bodydark2 mt-1">
                          <strong>Commentaire:</strong> {demande.commentaire}
                        </div>
                      )}
                      <div className="text-xs text-bodydark2 mt-2">
                        Créée le {new Date(demande.createdAt || demande.dateCreation || '').toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        onClick={() => setSelectedDemande(demande)}
                      >
                        Accepter
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => { setSelectedDemande(demande); setShowRefusModal(true); }}
                      >
                        Refuser
                      </Button>
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
                  {creneaux.slice(0, 50).map((creneau) => (
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
            {creneaux.length > 50 && (
              <div className="p-4 text-center text-bodydark2 border-t border-stroke">
                Affichage limité aux 50 premiers créneaux
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

      {/* Modal Sélection Créneau */}
      {selectedDemande && !showRefusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-auto">
            <CardHeader>
              <h2 className="text-xl font-bold text-black">Attribuer un Créneau</h2>
            </CardHeader>
            <CardBody>
              <p className="text-bodydark2 mb-4">
                Demande #{selectedDemande.id} - Date préférée: {new Date(selectedDemande.dateSouhaitee || selectedDemande.datePreferee || '').toLocaleDateString('fr-FR')}
              </p>
              
              <div className="space-y-2 mb-4">
                <label className="form-label">Sélectionner un créneau libre</label>
                {creneauxLibres.length === 0 ? (
                  <p className="text-meta-1">Aucun créneau libre disponible</p>
                ) : (
                  <select
                    value={selectedCreneau || ''}
                    onChange={(e) => setSelectedCreneau(parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value="">-- Choisir un créneau --</option>
                    {creneauxLibres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {new Date(c.dateDebut).toLocaleString('fr-FR')} - {c.technicienNom || `Tech #${c.technicienId}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={handleAccepterDemande}
                  disabled={!selectedCreneau}
                >
                  Confirmer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setSelectedDemande(null); setSelectedCreneau(null); }}
                >
                  Annuler
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Modal Refus */}
      {showRefusModal && selectedDemande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <h2 className="text-xl font-bold text-black">Refuser la Demande</h2>
            </CardHeader>
            <CardBody>
              <p className="text-bodydark2 mb-4">Demande #{selectedDemande.id}</p>
              
              <div className="mb-4">
                <label className="form-label">Raison du refus</label>
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
                  onClick={() => { setShowRefusModal(false); setSelectedDemande(null); setRefusRaison(''); }}
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
