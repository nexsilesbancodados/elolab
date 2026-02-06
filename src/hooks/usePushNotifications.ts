import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador não suporta notificações push');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      toast.success('Notificações ativadas!');
      await subscribeToNotifications();
      return true;
    } else {
      toast.error('Permissão de notificação negada');
      return false;
    }
  };

  const subscribeToNotifications = async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker não suportado');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Para funcionar em produção, seria necessário um VAPID key
      // Por enquanto, usamos apenas notificações locais
      console.log('Service Worker registrado para notificações');
    } catch (error) {
      console.error('Erro ao registrar para notificações:', error);
    }
  };

  const sendLocalNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn('Permissão de notificação não concedida');
      return;
    }

    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });
  };

  const scheduleNotification = (title: string, options: NotificationOptions & { delay: number }) => {
    const { delay, ...notificationOptions } = options;
    
    setTimeout(() => {
      sendLocalNotification(title, notificationOptions);
    }, delay);
  };

  return {
    permission,
    isSupported: 'Notification' in window,
    requestPermission,
    sendLocalNotification,
    scheduleNotification,
  };
}

// Tipos de notificações do sistema
export type NotificationType = 
  | 'appointment_reminder'
  | 'appointment_confirmation'
  | 'exam_result'
  | 'stock_alert'
  | 'payment_due'
  | 'birthday';

export function getNotificationContent(type: NotificationType, data: Record<string, unknown>) {
  switch (type) {
    case 'appointment_reminder':
      return {
        title: '⏰ Lembrete de Consulta',
        body: `Você tem uma consulta agendada para ${data.time} com ${data.doctor}`,
        tag: 'appointment-reminder',
      };
    case 'appointment_confirmation':
      return {
        title: '✅ Consulta Confirmada',
        body: `Sua consulta foi confirmada para ${data.date} às ${data.time}`,
        tag: 'appointment-confirmation',
      };
    case 'exam_result':
      return {
        title: '📋 Resultado de Exame Disponível',
        body: `O resultado do seu exame ${data.examType} está disponível`,
        tag: 'exam-result',
      };
    case 'stock_alert':
      return {
        title: '⚠️ Alerta de Estoque',
        body: `O item "${data.itemName}" está com estoque baixo`,
        tag: 'stock-alert',
      };
    case 'payment_due':
      return {
        title: '💰 Pagamento Pendente',
        body: `Você tem um pagamento de ${data.amount} vencendo em ${data.dueDate}`,
        tag: 'payment-due',
      };
    case 'birthday':
      return {
        title: '🎂 Aniversário de Paciente',
        body: `${data.patientName} faz aniversário hoje!`,
        tag: 'birthday',
      };
    default:
      return {
        title: 'Notificação',
        body: 'Você tem uma nova notificação',
        tag: 'default',
      };
  }
}
