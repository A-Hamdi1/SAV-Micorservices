import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, Payment, PaymentStats } from '../../api/newFeatures';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const PaymentsManagementPage = () => {
  const queryClient = useQueryClient();
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [manualPaymentData, setManualPaymentData] = useState({
    interventionId: '',
    clientId: '',
    montant: '',
    methode: 'Especes',
    description: '',
    numeroTransaction: '',
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await paymentsApi.getAll();
      return response.data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['payments', 'stats'],
    queryFn: async () => {
      const response = await paymentsApi.getStats();
      return response.data;
    },
  });

  const refundMutation = useMutation({
    mutationFn: (paymentId: number) => paymentsApi.refund(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
      toast.success('Remboursement effectué avec succès');
    },
    onError: () => {
      toast.error('Erreur lors du remboursement');
    },
  });

  const manualPaymentMutation = useMutation({
    mutationFn: async () => {
      const data = {
        interventionId: parseInt(manualPaymentData.interventionId),
        clientId: parseInt(manualPaymentData.clientId),
        montant: parseFloat(manualPaymentData.montant),
        methode: manualPaymentData.methode,
        description: manualPaymentData.description || undefined,
        numeroTransaction: manualPaymentData.numeroTransaction || undefined,
      };
      return paymentsApi.recordManualPayment(data.interventionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'stats'] });
      toast.success('Paiement manuel enregistré');
      setShowManualPayment(false);
      setManualPaymentData({
        interventionId: '',
        clientId: '',
        montant: '',
        methode: 'Especes',
        description: '',
        numeroTransaction: '',
      });
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement du paiement');
    },
  });

  const handleRefund = (payment: Payment) => {
    if (window.confirm(`Êtes-vous sûr de vouloir rembourser ${formatCurrency(payment.montant)} ?`)) {
      refundMutation.mutate(payment.id);
    }
  };

  if (paymentsLoading || statsLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const paymentStats = stats?.data as PaymentStats | undefined;
  const paymentsList = (payments?.data as Payment[]) || [];

  const getPaymentStatusBadge = (statut: string) => {
    return <StatusBadge status={statut} />;
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader
        title="Gestion des Paiements"
        breadcrumb={[
          { label: 'Responsable', path: '/responsable' },
          { label: 'Paiements' }
        ]}
        subtitle="Suivi et gestion des paiements clients"
        actions={
          <Button
            variant="primary"
            onClick={() => setShowManualPayment(!showManualPayment)}
          >
            + Paiement manuel
          </Button>
        }
      />

      {/* Statistiques */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)' }}>
            <div className="text-sm opacity-80 mb-1">Revenu total</div>
            <div className="text-3xl font-bold">
              {formatCurrency(paymentStats.totalRevenue || 0)}
            </div>
          </div>

          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
            <div className="text-sm opacity-80 mb-1">Ce mois</div>
            <div className="text-3xl font-bold">
              {formatCurrency(paymentStats.revenueThisMonth || 0)}
            </div>
          </div>

          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
            <div className="text-sm opacity-80 mb-1">Paiements réussis</div>
            <div className="text-3xl font-bold">
              {paymentStats.successfulPayments || 0}
            </div>
          </div>

          <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #eab308, #facc15)' }}>
            <div className="text-sm opacity-80 mb-1">En attente</div>
            <div className="text-3xl font-bold">
              {paymentStats.pendingPayments || 0}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire paiement manuel */}
      {showManualPayment && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-black">Enregistrer un paiement manuel</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">ID Intervention *</label>
                <input
                  type="number"
                  value={manualPaymentData.interventionId}
                  onChange={(e) => setManualPaymentData({ ...manualPaymentData, interventionId: e.target.value })}
                  className="form-input"
                  placeholder="Ex: 1"
                />
              </div>
              <div>
                <label className="form-label">ID Client *</label>
                <input
                  type="number"
                  value={manualPaymentData.clientId}
                  onChange={(e) => setManualPaymentData({ ...manualPaymentData, clientId: e.target.value })}
                  className="form-input"
                  placeholder="Ex: 1"
                />
              </div>
              <div>
                <label className="form-label">Montant ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualPaymentData.montant}
                  onChange={(e) => setManualPaymentData({ ...manualPaymentData, montant: e.target.value })}
                  className="form-input"
                  placeholder="Ex: 150.00"
                />
              </div>
              <div>
                <label className="form-label">Méthode *</label>
                <select
                  value={manualPaymentData.methode}
                  onChange={(e) => setManualPaymentData({ ...manualPaymentData, methode: e.target.value })}
                  className="form-select"
                >
                  <option value="Especes">Espèces</option>
                  <option value="Cheque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="CarteBancaire">Carte bancaire</option>
                </select>
              </div>
              <div>
                <label className="form-label">NÂ° Transaction</label>
                <input
                  type="text"
                  value={manualPaymentData.numeroTransaction}
                  onChange={(e) => setManualPaymentData({ ...manualPaymentData, numeroTransaction: e.target.value })}
                  className="form-input"
                  placeholder="Optionnel"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={manualPaymentData.description}
                  onChange={(e) => setManualPaymentData({ ...manualPaymentData, description: e.target.value })}
                  className="form-input"
                  placeholder="Optionnel"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="primary"
                onClick={() => manualPaymentMutation.mutate()}
                disabled={manualPaymentMutation.isPending || !manualPaymentData.interventionId || !manualPaymentData.clientId || !manualPaymentData.montant}
              >
                {manualPaymentMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowManualPayment(false)}
              >
                Annuler
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-black">Historique des paiements</h2>
        </CardHeader>
        <CardBody className="p-0">
          {paymentsList.length === 0 ? (
            <div className="p-6">
              <p className="text-bodydark2">Aucun paiement enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left">
                    <th className="px-6 py-4 font-medium text-black">ID</th>
                    <th className="px-6 py-4 font-medium text-black">Intervention</th>
                    <th className="px-6 py-4 font-medium text-black">Montant</th>
                    <th className="px-6 py-4 font-medium text-black">Méthode</th>
                    <th className="px-6 py-4 font-medium text-black">Statut</th>
                    <th className="px-6 py-4 font-medium text-black">Date</th>
                    <th className="px-6 py-4 font-medium text-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map((payment) => (
                    <tr key={payment.id} className="border-b border-stroke hover:bg-gray-2">
                      <td className="px-6 py-4 text-sm font-medium text-black">
                        #{payment.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-bodydark2">
                        Intervention #{payment.interventionId}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-black">
                        {formatCurrency(payment.montant)}
                      </td>
                      <td className="px-6 py-4 text-sm text-bodydark2">
                        {payment.methode}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentStatusBadge(payment.statut)}
                      </td>
                      <td className="px-6 py-4 text-sm text-bodydark2">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {payment.statut === 'Reussi' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRefund(payment)}
                            disabled={refundMutation.isPending}
                          >
                            Rembourser
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default PaymentsManagementPage;
