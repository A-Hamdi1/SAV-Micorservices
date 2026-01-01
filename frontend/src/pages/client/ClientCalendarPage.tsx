import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { parseISO, format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { reclamationsApi } from '../../api/reclamations';
import { clientsApi } from '../../api/clients';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import Calendar, { CalendarEvent } from '../../components/common/Calendar';
import { Card, CardBody } from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { RECLAMATION_STATUS_LABELS, ReclamationStatut } from '../../types';

const ClientCalendarPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if client profile exists
  const { data: clientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientsApi.getMyProfile(),
  });

  const { data: reclamationsData, isLoading: reclamationsLoading } = useQuery({
    queryKey: ['my-reclamations'],
    queryFn: () => reclamationsApi.getMyReclamations(),
    enabled: !!clientProfile?.data,
  });

  const reclamations = useMemo(() => reclamationsData?.data || [], [reclamationsData?.data]);

  // Convert reclamations to calendar events
  const events: CalendarEvent[] = useMemo(() => reclamations.map((rec) => ({
    id: rec.id,
    title: `Réclamation #${rec.id}`,
    date: parseISO(rec.dateCreation),
    type: 'reclamation' as const,
    status: RECLAMATION_STATUS_LABELS[rec.statut as ReclamationStatut] || rec.statut,
    description: rec.description.substring(0, 100) + (rec.description.length > 100 ? '...' : ''),
  })), [reclamations]);

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
    navigate(`/client/reclamations/${event.id}`);
  };

  if (profileLoading || reclamationsLoading) {
    return <LoadingSpinner />;
  }

  // If no profile, show message to create profile first
  if (!clientProfile?.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mon calendrier"
          breadcrumb={[
            { label: 'Accueil', path: '/client/dashboard' },
            { label: 'Calendrier' },
          ]}
        />
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">Profil requis</h2>
              <p className="text-bodydark2 text-center max-w-md mb-6">
                Vous devez d'abord créer votre profil client avant de pouvoir accéder au calendrier.
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
          { label: 'Accueil', path: '/client/dashboard' },
          { label: 'Calendrier' },
        ]}
      />

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{reclamations.length}</p>
              <p className="text-sm text-gray-500">Total réclamations</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">
                {reclamations.filter(r => r.statut === 'EnAttente').length}
              </p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {reclamations.filter(r => r.statut === 'EnCours').length}
              </p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {reclamations.filter(r => r.statut === 'Resolue').length}
              </p>
              <p className="text-sm text-gray-500">Résolues</p>
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
                {selectedDateEvents.length} réclamation{selectedDateEvents.length > 1 ? 's' : ''} pour cette date
              </p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border border-amber-200 bg-amber-50 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(event)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-amber-800">{event.title}</h4>
                      <StatusBadge status={event.status || ''} type="reclamation" />
                    </div>
                    {event.description && (
                      <p className="text-sm text-amber-700">{event.description}</p>
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
              <svg className="w-16 h-16 mx-auto text-bodydark2 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-bodydark2">Aucun événement pour cette date</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-stroke">
            <button
              onClick={handleCloseModal}
              className="btn btn-outline btn-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientCalendarPage;
