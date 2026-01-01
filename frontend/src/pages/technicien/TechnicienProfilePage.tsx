import { useQuery } from '@tanstack/react-query';
import { techniciensApi } from '../../api/techniciens';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';

const TechnicienProfilePage = () => {
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['technicien-profile'],
    queryFn: () => techniciensApi.getMyProfile(),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['technicien-stats'],
    queryFn: () => techniciensApi.getMyStats(),
    enabled: !!profileData?.data,
  });

  if (profileLoading) {
    return <LoadingSpinner />;
  }

  if (!profileData?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mon profil"
          breadcrumb={[
            { label: 'Tableau de bord', path: '/technicien/dashboard' },
            { label: 'Profil' },
          ]}
        />
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">Profil non configuré</h2>
              <p className="text-bodydark2 text-center max-w-md">
                Votre profil technicien n'est pas encore configuré. Veuillez contacter le responsable SAV.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const profile = profileData.data;
  const stats = statsData?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        breadcrumb={[
          { label: 'Tableau de bord', path: '/technicien/dashboard' },
          { label: 'Profil' },
        ]}
      />

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-black">Informations personnelles</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-600 text-white text-3xl font-bold">
                {profile.prenom.charAt(0)}{profile.nom.charAt(0)}
              </div>
              <div className="mt-3">
                <StatusBadge
                  status={profile.estDisponible ? 'success' : 'warning'}
                  label={profile.estDisponible ? 'Disponible' : 'Non disponible'}
                />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-bodydark2">Nom complet</label>
                <p className="font-medium text-black">{profile.nomComplet}</p>
              </div>
              <div>
                <label className="text-sm text-bodydark2">Email</label>
                <p className="font-medium text-black">{profile.email}</p>
              </div>
              <div>
                <label className="text-sm text-bodydark2">Téléphone</label>
                <p className="font-medium text-black">{profile.telephone}</p>
              </div>
              <div>
                <label className="text-sm text-bodydark2">Spécialité</label>
                <p className="font-medium text-black">{profile.specialite}</p>
              </div>
              <div>
                <label className="text-sm text-bodydark2">Date d'embauche</label>
                <p className="font-medium text-black">{formatDate(profile.dateEmbauche)}</p>
              </div>
              <div>
                <label className="text-sm text-bodydark2">Inscrit depuis</label>
                <p className="font-medium text-black">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader title="Statistiques" />
        <CardBody>
          {statsLoading ? (
            <LoadingSpinner />
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-gray-2 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{stats.nombreInterventionsTotal}</p>
                <p className="text-sm text-bodydark2">Total interventions</p>
              </div>
              <div className="text-center p-4 bg-gray-2 rounded-lg">
                <p className="text-2xl font-bold text-success">{stats.nombreInterventionsTerminees}</p>
                <p className="text-sm text-bodydark2">Terminées</p>
              </div>
              <div className="text-center p-4 bg-gray-2 rounded-lg">
                <p className="text-2xl font-bold text-warning">{stats.nombreInterventionsEnCours}</p>
                <p className="text-sm text-bodydark2">En cours</p>
              </div>
              <div className="text-center p-4 bg-gray-2 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{stats.tauxReussite}%</p>
                <p className="text-sm text-bodydark2">Taux de réussite</p>
              </div>
              <div className="text-center p-4 bg-gray-2 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{stats.chiffreAffaireTotal.toFixed(2)} €</p>
                <p className="text-sm text-bodydark2">CA Total</p>
              </div>
              <div className="text-center p-4 bg-gray-2 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{stats.chiffreAffaireMoyen.toFixed(2)} €</p>
                <p className="text-sm text-bodydark2">CA Moyen</p>
              </div>
            </div>
          ) : (
            <p className="text-bodydark2 text-center py-4">Statistiques non disponibles</p>
          )}
        </CardBody>
      </Card>

      {/* Recent Interventions */}
      <Card>
        <CardHeader title="Dernières interventions" />
        <CardBody>
          {profile.interventions && profile.interventions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-bodydark2 border-b">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.interventions.slice(0, 10).map((intervention) => (
                    <tr key={intervention.id} className="border-b last:border-0">
                      <td className="py-3">#{intervention.id}</td>
                      <td className="py-3">{formatDate(intervention.dateIntervention)}</td>
                      <td className="py-3">
                        <StatusBadge
                          status={
                            intervention.statut === 'Terminee'
                              ? 'success'
                              : intervention.statut === 'EnCours'
                              ? 'warning'
                              : intervention.statut === 'Annulee'
                              ? 'danger'
                              : 'primary'
                          }
                          label={intervention.statut}
                        />
                      </td>
                      <td className="py-3">
                        {intervention.estGratuite ? (
                          <span className="text-success">Gratuite</span>
                        ) : (
                          `${intervention.montantTotal.toFixed(2)} €`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-bodydark2 text-center py-4">Aucune intervention récente</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TechnicienProfilePage;
