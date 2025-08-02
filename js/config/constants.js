// Application constants
export const APP_STATE_KEYS = {
  CURRENT_USER: 'currentUser',
  EVENTS: 'events',
  TECHNICIANS: 'technicians',
  IS_LOADING: 'isLoading',
  IS_REGISTERING: 'isRegistering',
  CURRENT_VIEW: 'currentView',
  ACTIVE_MODAL: 'activeModal',
};

export const VIEWS = {
  HOME: 'home',
  CALENDAR: 'calendar',
  TECHNICIANS: 'technicians',
};

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
};

export const EVENT_STATUS_TEXT = {
  [EVENT_STATUS.UPCOMING]: 'Próximo',
  [EVENT_STATUS.ONGOING]: 'En curso',
  [EVENT_STATUS.COMPLETED]: 'Completado',
};

export const EVENT_STATUS_COLORS = {
  [EVENT_STATUS.UPCOMING]: '#f59e0b',
  [EVENT_STATUS.ONGOING]: '#22c55e',
  [EVENT_STATUS.COMPLETED]: '#6b7280',
};

export const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'eventos',
  TECHNICIANS: 'tecnicos',
  NOTIFICATIONS: 'notifications',
};

// WhatsApp Notification Configuration
export const WHATSAPP_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_CALLMEBOT_BASE_URL,
  // You need to get your API key from https://www.callmebot.com/blog/free-api-whatsapp-messages/
  API_KEY: import.meta.env.VITE_CALLMEBOT_API_KEY,
  TIMEZONE: 'America/Argentina/Buenos_Aires',
  // Disable notifications in development
  DISABLE_IN_DEVELOPMENT: true,
  NOTIFICATION_TIMES: {
    BEFORE_48H: 48, // hours    VITE_CALLMEBOT_API_KEY=tu_api_key_real
    BEFORE_24H: 24, // hours
  },
  MESSAGE_TEMPLATES: {
    EVENT_CREATED:
      '🎉 *NUEVO EVENTO CREADO*\n\n*{eventName}*\n📍 Lugar: {location}\n🏢 Productora: {productora}\n📞 Contacto: {contacto}\n📅 Fecha: {date}\n\n¡Revisa los detalles en la aplicación!',
    EVENT_UPDATED:
      '✏️ *EVENTO ACTUALIZADO*\n\n*{eventName}*\n📍 Lugar: {location}\n🏢 Productora: {productora}\n📞 Contacto: {contacto}\n📅 Fecha: {date}\n\n¡Revisa los cambios en la aplicación!',
    EVENT_DELETED:
      '🗑️ *EVENTO ELIMINADO*\n\n*{eventName}*\n📅 Fecha: {date}\n\nEl evento ha sido eliminado.',
    EVENT_REMINDER_48H:
      '⏰ *RECORDATORIO - 48 HORAS*\n\n*{eventName}*\n📍 Lugar: {location}\n🏢 Productora: {productora}\n📞 Contacto: {contacto}\n📅 Fecha: {date}\n⏰ Hora: {time}\n\n¡El evento está a 48 horas!',
    EVENT_REMINDER_24H:
      '🚨 *RECORDATORIO - 24 HORAS*\n\n*{eventName}*\n📍 Lugar: {location}\n🏢 Productora: {productora}\n📞 Contacto: {contacto}\n📅 Fecha: {date}\n⏰ Hora: {time}\n\n¡El evento es mañana!',
  },
};

export const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'El correo electrónico ya está en uso',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/user-not-found': 'El usuario no existe',
  'auth/weak-password': 'La contraseña es muy débil',
  'auth/invalid-email': 'Email inválido',
  default: 'Error de autenticación',
};
