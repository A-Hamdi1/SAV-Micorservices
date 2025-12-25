import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { paymentsApi } from '../../api/newFeatures';

const PaymentSuccessPage = () => {
  const { interventionId } = useParams<{ interventionId: string }>();
  const [isConfirming, setIsConfirming] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const confirmPayment = async () => {
      if (!interventionId) {
        setIsConfirming(false);
        return;
      }

      try {
        await paymentsApi.confirmPayment(parseInt(interventionId));
        setConfirmed(true);
        toast.success('Paiement effectué avec succès !');
      } catch (error) {
        console.error('Erreur lors de la confirmation:', error);
        // Même en cas d'erreur, on affiche la page de succès
        // car Stripe a confirmé le paiement côté client
        toast.success('Paiement effectué avec succès !');
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [interventionId]);

  if (isConfirming) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardBody className="py-12 text-center">
            <LoadingSpinner />
            <p className="mt-4 text-bodydark2">Confirmation du paiement en cours...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardBody className="py-12 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-success/10 mb-6">
            <svg className="h-12 w-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-black mb-2">Paiement réussi !</h1>
          <p className="text-bodydark2 mb-8">
            Votre paiement pour l'intervention #{interventionId} a été effectué avec succès.
          </p>

          <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-8">
            <p className="text-success">
              {confirmed 
                ? 'Votre paiement a été confirmé. Vous recevrez un email de confirmation avec votre facture.'
                : 'Vous recevrez un email de confirmation avec votre facture.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/client/reclamations">
              <Button variant="primary">
                Voir mes réclamations
              </Button>
            </Link>
            <Link to="/client/dashboard">
              <Button variant="outline">
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
