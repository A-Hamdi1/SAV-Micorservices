import { 
  RECLAMATION_STATUS_LABELS, 
  INTERVENTION_STATUS_LABELS, 
  PAYMENT_STATUS_LABELS 
} from '../../types';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  label?: string;
  type?: 'reclamation' | 'intervention' | 'payment' | 'general';
}

const StatusBadge = ({ status, size = 'md', text, label, type = 'general' }: StatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    // Success states
    if (['success', 'succès', 'reussi', 'terminee', 'resolue', 'paye', 'libre', 'confirmee', 'confirme'].some(s => statusLower.includes(s))) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    // Danger states
    if (['danger', 'error', 'erreur', 'annulee', 'rejetee', 'echoue', 'rembourse', 'refusee', 'refuse'].some(s => statusLower.includes(s))) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    // Warning states
    if (['warning', 'avertissement', 'enattente', 'attente'].some(s => statusLower.includes(s))) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    // Progress states
    if (['encours', 'cours', 'reserve', 'réservé'].some(s => statusLower.includes(s))) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    // Planned states
    if (['planifiee', 'planifié'].some(s => statusLower.includes(s))) {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    return 'bg-gray-2 text-bodydark2 border-stroke';
  };

  const getStatusLabel = (status: string): string => {
    // Try to get label from type-specific maps
    if (type === 'reclamation' && status in RECLAMATION_STATUS_LABELS) {
      return RECLAMATION_STATUS_LABELS[status as keyof typeof RECLAMATION_STATUS_LABELS];
    }
    if (type === 'intervention' && status in INTERVENTION_STATUS_LABELS) {
      return INTERVENTION_STATUS_LABELS[status as keyof typeof INTERVENTION_STATUS_LABELS];
    }
    if (type === 'payment' && status in PAYMENT_STATUS_LABELS) {
      return PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS];
    }
    
    // Fallback to manual mapping
    const statusMap: Record<string, string> = {
      enattente: 'En Attente',
      encours: 'En Cours',
      terminee: 'Terminée',
      resolue: 'Résolue',
      annulee: 'Annulée',
      rejetee: 'Rejetée',
      planifiee: 'Planifiée',
      paye: 'Payé',
      reussi: 'Réussi',
      echoue: 'Échoué',
      rembourse: 'Remboursé',
    };
    
    return statusMap[status.toLowerCase()] || status;
  };

  const getDotColor = (status: string) => {
    const colorClass = getStatusColor(status);
    if (colorClass.includes('amber')) return 'bg-amber-500';
    if (colorClass.includes('blue')) return 'bg-blue-500';
    if (colorClass.includes('green') || colorClass.includes('emerald')) return 'bg-green-500';
    if (colorClass.includes('red')) return 'bg-red-500';
    if (colorClass.includes('purple')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  // Use text or label if provided, otherwise use status label
  const displayText = text || label || getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getStatusColor(status)} ${sizeClasses[size]}`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getDotColor(status)}`}></span>
      {displayText}
    </span>
  );
};

export default StatusBadge;

