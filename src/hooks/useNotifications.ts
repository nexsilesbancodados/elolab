import { useState, useEffect, useCallback } from 'react';
import { getAll } from '@/lib/localStorage';
import { Agendamento, Paciente } from '@/types';
import { format, parseISO, differenceInMinutes, isToday } from 'date-fns';

interface NotificationState {
  permission: NotificationPermission;
  supported: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    supported: false,
  });

  useEffect(() => {
    if ('Notification' in window) {
      setState({
        permission: Notification.permission,
        supported: true,
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.supported) return false;
    
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch {
      return false;
    }
  }, [state.supported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.permission !== 'granted') return null;
    
    return new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });
  }, [state.permission]);

  const checkUpcomingAppointments = useCallback(() => {
    if (state.permission !== 'granted') return;

    const agendamentos = getAll<Agendamento>('agendamentos');
    const pacientes = getAll<Paciente>('pacientes');
    const now = new Date();

    agendamentos.forEach(ag => {
      if (!isToday(parseISO(ag.data))) return;
      if (ag.status === 'cancelado' || ag.status === 'finalizado') return;

      const appointmentTime = parseISO(`${ag.data}T${ag.horaInicio}`);
      const minutesUntil = differenceInMinutes(appointmentTime, now);

      // Notify 15 minutes before
      if (minutesUntil > 0 && minutesUntil <= 15) {
        const paciente = pacientes.find(p => p.id === ag.pacienteId);
        const notifiedKey = `notified_${ag.id}_15min`;
        
        if (!sessionStorage.getItem(notifiedKey)) {
          sendNotification('Consulta em breve!', {
            body: `${paciente?.nome || 'Paciente'} às ${ag.horaInicio}`,
            tag: ag.id,
          });
          sessionStorage.setItem(notifiedKey, 'true');
        }
      }
    });
  }, [state.permission, sendNotification]);

  // Check appointments every minute
  useEffect(() => {
    if (state.permission !== 'granted') return;
    
    const interval = setInterval(checkUpcomingAppointments, 60000);
    checkUpcomingAppointments(); // Check immediately
    
    return () => clearInterval(interval);
  }, [state.permission, checkUpcomingAppointments]);

  return {
    ...state,
    requestPermission,
    sendNotification,
    checkUpcomingAppointments,
  };
}
