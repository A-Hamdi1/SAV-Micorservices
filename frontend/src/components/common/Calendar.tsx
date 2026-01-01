import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';

export interface CalendarEvent {
  id: number | string;
  title: string;
  date: Date;
  type: 'reclamation' | 'intervention' | 'rdv';
  status?: string;
  description?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const eventTypeColors = {
  reclamation: {
    bg: 'bg-amber-100',
    border: 'border-amber-400',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  intervention: {
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  rdv: {
    bg: 'bg-green-100',
    border: 'border-green-400',
    text: 'text-green-800',
    dot: 'bg-green-500',
  },
};

const Calendar = ({ events, onEventClick, onDateClick }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = format(event.date, 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const selectedDateEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-primary-600 text-white">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={dateKey}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[80px] p-1 border rounded-lg cursor-pointer transition-all
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isSelected ? 'ring-2 ring-primary-500 border-primary-500' : 'border-gray-200'}
                  ${isDayToday ? 'border-primary-400' : ''}
                  hover:bg-gray-50
                `}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                  ${isDayToday ? 'text-primary-600' : ''}
                `}>
                  <span className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-full
                    ${isDayToday ? 'bg-primary-600 text-white' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className={`
                        text-xs px-1 py-0.5 rounded truncate cursor-pointer
                        ${eventTypeColors[event.type].bg}
                        ${eventTypeColors[event.type].text}
                        hover:opacity-80
                      `}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayEvents.length - 2} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected date events panel */}
      {selectedDate && (
        <div className="border-t px-6 py-4">
          <h3 className="font-semibold text-gray-700 mb-3">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </h3>
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                    ${eventTypeColors[event.type].bg}
                    ${eventTypeColors[event.type].border}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${eventTypeColors[event.type].dot}`} />
                    <span className={`font-medium ${eventTypeColors[event.type].text}`}>
                      {event.title}
                    </span>
                    {event.status && (
                      <span className="ml-auto text-xs bg-white/50 px-2 py-0.5 rounded">
                        {event.status}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className={`text-sm mt-1 ${eventTypeColors[event.type].text} opacity-80`}>
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucun événement pour cette date</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="border-t px-6 py-3 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-gray-600">Réclamations</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">Interventions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">Rendez-vous</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
