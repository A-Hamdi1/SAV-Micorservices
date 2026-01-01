import { useState, useEffect } from 'react';
import { analyticsApi, AnalyticsData, exportApi } from '../../api/newFeatures';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import PageHeader from '../../components/common/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';

const AnalyticsDashboardPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateDebut, setDateDebut] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState<string>(new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await analyticsApi.getAnalytics(dateDebut, dateFin);
        setAnalytics(response.data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateDebut, dateFin]);

  const handleExport = async (type: 'interventions' | 'reclamations' | 'factures' | 'rapport') => {
    try {
      setExporting(true);
      let response;
      let filename;
      
      switch (type) {
        case 'interventions':
          response = await exportApi.exportInterventions(dateDebut, dateFin);
          filename = `Interventions_${dateDebut}_${dateFin}.xlsx`;
          break;
        case 'reclamations':
          response = await exportApi.exportReclamations(dateDebut, dateFin);
          filename = `Reclamations_${dateDebut}_${dateFin}.xlsx`;
          break;
        case 'factures':
          response = await exportApi.exportFactures(dateDebut, dateFin);
          filename = `Factures_${dateDebut}_${dateFin}.xlsx`;
          break;
        case 'rapport': {
          const date = new Date(dateFin);
          response = await exportApi.exportRapportMensuel(date.getFullYear(), date.getMonth() + 1);
          filename = `Rapport_Mensuel_${date.getFullYear()}_${date.getMonth() + 1}.xlsx`;
          break;
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorMessage message={error} />;
  if (!analytics) return <ErrorMessage message="Aucune donnée disponible" />;

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader
        title="Dashboard Analytics"
        breadcrumb={[
          { label: 'Responsable', path: '/responsable' },
          { label: 'Analytics' }
        ]}
        subtitle="Vue d'ensemble des performances et statistiques"
        actions={
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">Du:</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="form-input py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">Au:</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="form-input py-1.5 text-sm"
              />
            </div>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
          <div className="text-sm opacity-80 mb-1">Taux de Résolution</div>
          <div className="text-3xl font-bold">{(analytics.interventionStats?.tauxResolution || analytics.tauxResolutionPremierPassage || 0).toFixed(1)}%</div>
        </div>
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)' }}>
          <div className="text-sm opacity-80 mb-1">Délai Moyen Intervention</div>
          <div className="text-3xl font-bold">{(analytics.interventionStats?.tempsMoyenResolution || analytics.delaiMoyenIntervention || 0).toFixed(1)} j</div>
        </div>
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
          <div className="text-sm opacity-80 mb-1">Total Interventions</div>
          <div className="text-3xl font-bold">{analytics.interventionStats?.totalInterventions || 0}</div>
        </div>
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
          <div className="text-sm opacity-80 mb-1">CA Total</div>
          <div className="text-3xl font-bold">
            {(analytics.interventionStats?.chiffreAffairesTotal || analytics.chiffreAffairesMensuel.reduce((acc, ca) => acc + (ca.montant || ca.montantTTC || 0), 0)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Interventions par Statut */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Interventions par Statut</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {analytics.interventionsParStatut.map((item) => (
                <div key={item.statut} className="flex items-center">
                  <div className="w-28 text-sm text-slate-500">{item.statut}</div>
                  <div className="flex-1 mx-3">
                    <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${item.pourcentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="font-semibold text-slate-900">{item.nombre}</span>
                    <span className="text-slate-500 text-sm ml-1">({item.pourcentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* CA Mensuel */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Chiffre d'Affaires Mensuel</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {analytics.chiffreAffairesMensuel.map((ca) => (
                <div key={`${ca.annee}-${ca.mois}`} className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">
                    {ca.moisNom || new Date(ca.annee, ca.mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                  <div className="text-right">
                    <div className="font-semibold text-meta-3">
                      {(ca.montant || ca.montantTTC || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div className="text-xs text-slate-500">{ca.nombreInterventions || ca.nombreFactures || 0} interventions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Performance Techniciens */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">🔧 Performance des Techniciens</h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-4 font-medium text-slate-900">Technicien</th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-center">Interventions</th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-center">Terminées</th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-center">Taux Réussite</th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-center">Durée Moy.</th>
                  <th className="px-6 py-4 font-medium text-slate-900 text-center">Note</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.topTechniciens || analytics.technicienPerformances || []).map((tech) => (
                  <tr key={tech.technicienId} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{tech.technicienNom}</td>
                    <td className="text-center px-6 py-4 text-slate-500">{tech.nombreInterventions}</td>
                    <td className="text-center px-6 py-4 text-slate-500">{tech.interventionsTerminees}</td>
                    <td className="text-center px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        (tech.tauxReussite || 0) >= 80 ? 'bg-meta-3/10 text-meta-3' :
                        (tech.tauxReussite || 0) >= 60 ? 'bg-warning/10 text-warning' :
                        'bg-meta-1/10 text-meta-1'
                      }`}>
                        {(tech.tauxReussite || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 text-slate-500">{(tech.dureeMoyenne || 0).toFixed(0)} min</td>
                    <td className="text-center px-6 py-4">
                      <span className="text-warning">★</span> {(tech.noteMoyenne || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Articles Problématiques */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">🛏 Articles Problématiques</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(analytics.topArticlesProblemes || analytics.articlesProblematiques || []).map((article) => (
              <div key={article.articleId} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="font-medium text-slate-900">{article.articleNom}</div>
                <div className="text-sm text-slate-500 mt-1">{article.nombreReclamations} réclamations</div>
                <div className="mt-2">
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-full bg-meta-1 rounded-full"
                      style={{ width: `${Math.min((article.tauxProbleme || 0.1) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">📥 Exporter les Données</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="primary"
              onClick={() => handleExport('interventions')}
              disabled={exporting}
            >
              <span className="mr-2">📋</span> Interventions (Excel)
            </Button>
            <Button
              variant="success"
              onClick={() => handleExport('reclamations')}
              disabled={exporting}
            >
              <span className="mr-2">📝</span> Réclamations (Excel)
            </Button>
            <Button
              variant="warning"
              onClick={() => handleExport('factures')}
              disabled={exporting}
            >
              <span className="mr-2">💰</span> Factures (Excel)
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('rapport')}
              disabled={exporting}
            >
              <span className="mr-2">📊</span> Rapport Mensuel (Excel)
            </Button>
          </div>
          {exporting && <p className="text-sm text-slate-500 mt-2">Export en cours...</p>}
        </CardBody>
      </Card>
    </div>
  );
};

export default AnalyticsDashboardPage;
