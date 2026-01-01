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
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10';
    }
    // Danger states
    if (['danger', 'error', 'erreur', 'annulee', 'rejetee', 'echoue', 'rembourse', 'refusee', 'refuse'].some(s => statusLower.includes(s))) {
      return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-600/10';
    }
    // Warning states
    if (['warning', 'avertissement', 'enattente', 'attente'].some(s => statusLower.includes(s))) {
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10';
    }
    // Progress states
    if (['encours', 'cours', 'reserve', 'réservé'].some(s => statusLower.includes(s))) {
      return 'bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-600/10';
    }
    // Planned states
    if (['planifiee', 'planifié'].some(s => statusLower.includes(s))) {
      return 'bg-violet-50 text-violet-700 border-violet-200 ring-1 ring-violet-600/10';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200 ring-1 ring-slate-600/10';
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
    if (colorClass.includes('sky')) return 'bg-sky-500';
    if (colorClass.includes('emerald')) return 'bg-emerald-500';
    if (colorClass.includes('red')) return 'bg-red-500';
    if (colorClass.includes('violet')) return 'bg-violet-500';
    return 'bg-slate-400';
  };

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  // Use text or label if provided, otherwise use status label
  const displayText = text || label || getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${getStatusColor(status)} ${sizeClasses[size]}`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getDotColor(status)} animate-pulse`}></span>
      {displayText}
    </span>
  );
};

export default StatusBadge;

