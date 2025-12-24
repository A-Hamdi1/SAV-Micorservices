interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  label?: string;
}

const StatusBadge = ({ status, size = 'md', text, label }: StatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    // Success
    if (statusLower === 'success' || statusLower === 'succès') {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    // Danger
    if (statusLower === 'danger' || statusLower === 'error' || statusLower === 'erreur') {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    // Warning
    if (statusLower === 'warning' || statusLower === 'avertissement') {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    // En Attente / EnAttente
    if (statusLower === 'enattente' || statusLower.includes('attente')) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    // En Cours / EnCours
    if (statusLower === 'encours' || statusLower.includes('cours')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    // Terminée / Terminee
    if (statusLower === 'terminee' || statusLower.includes('terminé')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    // Resolue
    if (statusLower === 'resolue' || statusLower.includes('résolu')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    // Annulée / Annulee
    if (statusLower === 'annulee' || statusLower.includes('annulé')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    // Rejetée / Rejetee
    if (statusLower === 'rejetee' || statusLower.includes('rejeté')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    // Planifiée / Planifiee
    if (statusLower === 'planifiee' || statusLower.includes('planifié')) {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    // Payé / Payee
    if (statusLower === 'paye' || statusLower.includes('payé')) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    return 'bg-gray-2 text-bodydark2 border-stroke';
  };

  const getStatusLabel = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'enattente') return 'En Attente';
    if (statusLower === 'encours') return 'En Cours';
    if (statusLower === 'terminee') return 'Terminée';
    if (statusLower === 'resolue') return 'Résolue';
    if (statusLower === 'annulee') return 'Annulée';
    if (statusLower === 'rejetee') return 'Rejetée';
    if (statusLower === 'planifiee') return 'Planifiée';
    if (statusLower === 'paye') return 'Payé';
    return status;
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

