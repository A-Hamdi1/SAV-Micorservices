import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { interventionsApi } from '../../api/interventions';
import { paymentsApi, Payment } from '../../api/newFeatures';
import { clientsApi } from '../../api/clients';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';

const PaymentPage = () => {
  const { interventionId } = useParams<{ interventionId: string }>();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientsApi.getMyProfile(),
  });

  const { data: intervention, isLoading: interventionLoading } = useQuery({
    queryKey: ['intervention', interventionId],
    queryFn: () => interventionsApi.getInterventionById(parseInt(interventionId || '0')),
    enabled: !!interventionId,
  });

  const { data: existingPayment, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment', 'intervention', interventionId],
    queryFn: async () => {
      try {
        const response = await paymentsApi.getByInterventionId(parseInt(interventionId || '0'));
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!interventionId,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!intervention?.data || !profile?.data) {
        throw new Error('Données manquantes');
      }
      
      const response = await paymentsApi.createCheckoutSession({
        interventionId: intervention.data.id,
        clientId: profile.data.id,
        montant: intervention.data.montantTotal,
        description: `Paiement intervention #${intervention.data.id}`,
        successUrl: `${window.location.origin}/client/payment/${interventionId}/success`,
        cancelUrl: `${window.location.origin}/client/payment/${interventionId}/cancel`,
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.sessionUrl) {
        window.location.href = data.data.sessionUrl;
      }
    },
    onError: (error) => {
      console.error('Error creating checkout session:', error);
      toast.error('Erreur lors de la création de la session de paiement');
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    await checkoutMutation.mutateAsync();
  };

  if (interventionLoading || paymentLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!intervention?.data) {
    return (
      <div>
        <PageHeader
          title="Paiement"
          breadcrumb={[
            { label: 'Mes réclamations', path: '/client/reclamations' },
            { label: 'Paiement' },
          ]}
        />
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl">
          Intervention non trouvée
        </div>
      </div>
    );
  }

  const interv = intervention.data;
  const payment = existingPayment?.data as Payment | undefined;

  // Vérifier si l'intervention est payable
  const isPayable = interv.statut === 'Terminee' && !interv.estGratuite && interv.montantTotal > 0;
  const isPaid = payment?.statut === 'Reussi';

  return (
    <div>
      <PageHeader
        title="Paiement Intervention"
        subtitle={`Intervention #${interv.id}`}
        breadcrumb={[
          { label: 'Mes réclamations', path: '/client/reclamations' },
          { label: 'Paiement' },
        ]}
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-black">Récapitulatif</h2>
          </CardHeader>
          <CardBody>
            {/* Détails de l'intervention */}
            <dl className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-stroke">
                <dt className="text-sm text-bodydark2">Date d'intervention</dt>
                <dd className="text-sm font-medium text-black">{formatDate(interv.dateIntervention)}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stroke">
                <dt className="text-sm text-bodydark2">Technicien</dt>
                <dd className="text-sm font-medium text-black">{interv.technicienNom}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stroke">
                <dt className="text-sm text-bodydark2">Statut</dt>
                <dd><StatusBadge status={interv.statut} /></dd>
              </div>
              {interv.montantMainOeuvre && interv.montantMainOeuvre > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-stroke">
                  <dt className="text-sm text-bodydark2">Main d'Å“uvre</dt>
                  <dd className="text-sm font-medium text-black">{formatCurrency(interv.montantMainOeuvre)}</dd>
                </div>
              )}
              {interv.piecesUtilisees && interv.piecesUtilisees.length > 0 && (
                <div className="py-3 border-b border-stroke">
                  <dt className="text-sm font-medium text-black mb-3">Pièces utilisées</dt>
                  <div className="space-y-2">
                    {interv.piecesUtilisees.map((piece) => (
                      <div key={piece.id} className="flex justify-between text-sm bg-gray-2 dark:bg-meta-4 rounded-lg px-3 py-2">
                        <span className="text-bodydark2">{piece.pieceNom} x{piece.quantite}</span>
                        <span className="font-medium text-black">{formatCurrency(piece.sousTotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center py-3 bg-primary/5 rounded-xl px-4 -mx-1">
                <dt className="text-lg font-bold text-black">Total à payer</dt>
                <dd className="text-xl font-bold text-primary">{formatCurrency(interv.montantTotal)}</dd>
              </div>
            </dl>

            {/* Statut de paiement */}
            {interv.estGratuite && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-4 mt-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-success mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-success font-medium">Intervention gratuite (sous garantie)</p>
                </div>
              </div>
            )}

            {isPaid && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-4 mt-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-success mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-success font-medium">Paiement effectué</p>
                    {payment?.paidAt && (
                      <p className="text-success/80 text-sm">Le {formatDate(payment.paidAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {payment && payment.statut === 'EnAttente' && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mt-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-warning mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-warning font-medium">Paiement en attente</p>
                </div>
              </div>
            )}

            {payment && payment.statut === 'Echoue' && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 mt-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-danger mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-danger font-medium">Le paiement a échoué. Veuillez réessayer.</p>
                </div>
              </div>
            )}

            {/* Bouton de paiement */}
            {isPayable && !isPaid && (
              <div className="mt-8">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || checkoutMutation.isPending}
                  loading={isProcessing || checkoutMutation.isPending}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  {isProcessing || checkoutMutation.isPending ? (
                    'Redirection vers le paiement...'
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Payer {formatCurrency(interv.montantTotal)} avec Stripe
                    </>
                  )}
                </Button>
                <p className="mt-3 text-center text-sm text-bodydark2">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Paiement sécurisé par Stripe
                </p>
              </div>
            )}

            {interv.statut !== 'Terminee' && (
              <div className="bg-bodydark1/10 border border-stroke rounded-xl p-4 mt-6 text-center">
                <p className="text-bodydark2">
                  Le paiement sera disponible une fois l'intervention terminée.
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;
