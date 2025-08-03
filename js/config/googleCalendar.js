// Google Calendar API Configuration
export const GOOGLE_CALENDAR_CONFIG = {
  // ⚠️ IMPORTANTE: Reemplaza con tu Client ID real de Google Cloud Console
  // Ejemplo: '123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com'
  CLIENT_ID:
    '1097397293263-t7jntqr4tsp4np34f63os3221d4c7qkp.apps.googleusercontent.com',

  // ⚠️ IMPORTANTE: Reemplaza con tu API Key real (opcional, para requests públicas)
  // API_KEY: 'TU_API_KEY_AQUI',

  // Scopes necesarios para Google Calendar
  SCOPES: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],

  // Discovery URL para Google Calendar API
  DISCOVERY_URL:
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
};

// URLs para desarrollo y producción
export const REDIRECT_URIS = {
  development: 'http://localhost:3000/auth/callback',
  production: 'https://calendario-bls.netlify.app/auth/callback',
};
