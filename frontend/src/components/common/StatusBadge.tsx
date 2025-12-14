interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    // En Attente / EnAttente
    if (statusLower === 'enattente' || statusLower.includes('attente')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    // En Cours / EnCours
    if (statusLower === 'encours' || statusLower.includes('cours')) {
      return 'bg-blue-100 text-blue-800';
    }
    // Terminée / Terminee
    if (statusLower === 'terminee' || statusLower.includes('terminé')) {
      return 'bg-green-100 text-green-800';
    }
    // Resolue
    if (statusLower === 'resolue' || statusLower.includes('résolu')) {
      return 'bg-green-100 text-green-800';
    }
    // Annulée / Annulee
    if (statusLower === 'annulee' || statusLower.includes('annulé')) {
      return 'bg-red-100 text-red-800';
    }
    // Rejetée / Rejetee
    if (statusLower === 'rejetee' || statusLower.includes('rejeté')) {
      return 'bg-red-100 text-red-800';
    }
    // Planifiée / Planifiee
    if (statusLower === 'planifiee' || statusLower.includes('planifié')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
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
    return status;
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;

