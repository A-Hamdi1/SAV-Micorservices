import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Card, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const PaymentCancelPage = () => {
  const { interventionId } = useParams<{ interventionId: string }>();

  useEffect(() => {
    toast.warning('Le paiement a été annulé');
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardBody className="py-12 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-warning/10 mb-6">
            <svg className="h-12 w-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-black mb-2">Paiement annulé</h1>
          <p className="text-bodydark2 mb-8">
            Le paiement pour l'intervention #{interventionId} a été annulé.
          </p>

          <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-8">
            <p className="text-warning">
              Aucun montant n'a été débité de votre compte.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to={`/client/payment/${interventionId}`}>
              <Button variant="primary">
                Réessayer le paiement
              </Button>
            </Link>
            <Link to="/client/reclamations">
              <Button variant="outline">
                Retour aux réclamations
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;
