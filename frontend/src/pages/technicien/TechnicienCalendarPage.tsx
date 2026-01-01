import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { parseISO, format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { techniciensApi } from '../../api/techniciens';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import Calendar, { CalendarEvent } from '../../components/common/Calendar';
import { Card, CardBody } from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { INTERVENTION_STATUS_LABELS, InterventionStatut } from '../../types';

const TechnicienCalendarPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['technicien-profile'],
    queryFn: () => techniciensApi.getMyProfile(),
  });

  const { data: interventionsData, isLoading: interventionsLoading } = useQuery({
    queryKey: ['technicien-interventions-calendar'],
    queryFn: () => techniciensApi.getMyInterventions(),
    enabled: !!profileData?.data,
  });

  const interventions = useMemo(() => interventionsData?.data || [], [interventionsData?.data]);

  // Convert interventions to calendar events
  const events: CalendarEvent[] = useMemo(() => interventions.map((intervention) => ({
    id: intervention.id,
    title: `Intervention #${intervention.id}`,
    date: parseISO(intervention.dateIntervention),
    type: 'intervention' as const,
    status: INTERVENTION_STATUS_LABELS[intervention.statut as InterventionStatut] || intervention.statut,
    description: intervention.commentaire || `Réclamation #${intervention.reclamationId}`,
  })), [interventions]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(event => isSameDay(event.date, selectedDate));
  }, [events, selectedDate]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleViewDetails = (event: CalendarEvent) => {
    navigate(`/technicien/interventions/${event.id}`);
  };

  if (profileLoading || interventionsLoading) {
    return <LoadingSpinner />;
  }

  if (!profileData?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mon calendrier"
          breadcrumb={[
            { label: 'Tableau de bord', path: '/technicien/dashboard' },
            { label: 'Calendrier' },
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
                Votre profil technicien n'est pas encore configuré.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon calendrier"
        breadcrumb={[
          { label: 'Tableau de bord', path: '/technicien/dashboard' },
          { label: 'Calendrier' },
        ]}
      />

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{interventions.length}</p>
              <p className="text-sm text-gray-500">Total interventions</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {interventions.filter(i => i.statut === 'Planifiee').length}
              </p>
              <p className="text-sm text-gray-500">Planifiées</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">
                {interventions.filter(i => i.statut === 'EnCours').length}
              </p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {interventions.filter(i => i.statut === 'Terminee').length}
              </p>
              <p className="text-sm text-gray-500">Terminées</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Calendar */}
      <Calendar events={events} onDateClick={handleDateClick} />

      {/* Date Events Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : ''} 
        size="lg"
      >
        <div className="space-y-4">
          {selectedDateEvents.length > 0 ? (
            <>
              <p className="text-sm text-gray-500">
                {selectedDateEvents.length} intervention{selectedDateEvents.length > 1 ? 's' : ''} pour cette date
              </p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(event)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-800">{event.title}</h4>
                      <StatusBadge status={event.status || ''} type="intervention" />
                    </div>
                    {event.description && (
                      <p className="text-sm text-blue-700">{event.description}</p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <button
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(event);
                        }}
                      >
                        Voir les détails →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">Aucune intervention pour cette date</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-stroke">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TechnicienCalendarPage;
