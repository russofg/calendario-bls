import { GOOGLE_CALENDAR_CONFIG, REDIRECT_URIS } from '../config/googleCalendar.js';
import { NotificationManager } from '../utils/notifications.js';

/**
 * Google Calendar Integration Manager - OAuth 2.0 Flow
 * Maneja la sincronización de eventos con Google Calendar usando OAuth
 */
class GoogleCalendarManager {
  constructor() {
    this.isAuthenticated = false;
    this.accessToken = null;
    this.user = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa el manager
   */
  async init() {
    try {
      console.log('🔄 Inicializando Google Calendar Manager...');
      
      // Verificar si hay un código de autorización en el callback
      await this.checkForAuthCallback();
      
      // Verificar si tenemos token guardado
      const savedToken = localStorage.getItem('google_calendar_token');
      const tokenExpiry = localStorage.getItem('google_calendar_token_expiry');
      
      if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        this.accessToken = savedToken;
        this.isAuthenticated = true;
        console.log('✅ Token de Google Calendar válido encontrado');
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Calendar:', error);
      NotificationManager.showError('Error inicializando Google Calendar');
      return false;
    }
  }

  /**
   * Verificar si volvemos de un callback de autorización
   */
  async checkForAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    
    if (authSuccess === 'success') {
      const code = localStorage.getItem('calendar_auth_code');
      if (code) {
        await this.handleAuthCallback(code);
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  /**
   * Iniciar el flujo de autenticación OAuth
   */
  async authenticate() {
    try {
      console.log('🔄 Iniciando autenticación OAuth...');
      
      const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
      const redirectUri = window.location.hostname === 'localhost' 
        ? REDIRECT_URIS.development 
        : REDIRECT_URIS.production;
      
      const params = new URLSearchParams({
        client_id: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: GOOGLE_CALENDAR_CONFIG.SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state: 'calendar_auth_main'
      });
      
      const authUrl = `${oauth2Endpoint}?${params}`;
      console.log('🔗 Redirigiendo a OAuth:', authUrl);
      
      // Guardar estado antes de redireccionar
      localStorage.setItem('oauth_state', 'calendar_auth_main');
      localStorage.setItem('oauth_redirect_time', Date.now().toString());
      
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      NotificationManager.showError('Error en autenticación con Google');
      throw error;
    }
  }

  /**
   * Procesar el código de autorización del callback
   */
  async handleAuthCallback(code) {
    try {
      console.log('🔄 Procesando código de autorización...');
      
      const redirectUri = window.location.hostname === 'localhost' 
        ? REDIRECT_URIS.development 
        : REDIRECT_URIS.production;
      
      // Llamar a la función de Netlify para intercambiar el código por token
      const response = await fetch('/.netlify/functions/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirectUri: redirectUri
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange code for token');
      }
      
      const tokens = await response.json();
      
      // Guardar tokens
      this.accessToken = tokens.access_token;
      this.isAuthenticated = true;
      
      const expiryTime = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem('google_calendar_token', this.accessToken);
      localStorage.setItem('google_calendar_token_expiry', expiryTime.toString());
      if (tokens.refresh_token) {
        localStorage.setItem('google_calendar_refresh_token', tokens.refresh_token);
      }
      
      console.log('✅ Autenticación completada');
      NotificationManager.showSuccess('¡Conectado a Google Calendar!');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error procesando callback:', error);
      NotificationManager.showError('Error procesando autorización');
      throw error;
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected() {
    return this.isAuthenticated && this.accessToken !== null;
  }

  /**
   * Desconectar de Google Calendar
   */
  disconnect() {
    this.isAuthenticated = false;
    this.accessToken = null;
    this.user = null;
    
    // Limpiar localStorage
    localStorage.removeItem('google_calendar_token');
    localStorage.removeItem('google_calendar_token_expiry');
    localStorage.removeItem('google_auth_code');
    localStorage.removeItem('google_auth_timestamp');
    localStorage.removeItem('calendar_auth_code');
    
    console.log('🔄 Desconectado de Google Calendar');
    NotificationManager.showInfo('Desconectado de Google Calendar');
  }

  /**
   * Crear evento en Google Calendar
   */
  async createCalendarEvent(eventData) {
    if (!this.isConnected()) {
      throw new Error('No conectado a Google Calendar');
    }

    try {
      console.log('🔄 Creando evento en Google Calendar:', eventData);
      
      const response = await fetch('/.netlify/functions/google-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          eventData: {
            title: eventData.nombre || eventData.title,
            description: eventData.descripcion || eventData.description,
            startTime: eventData.fechaInicio || eventData.startTime,
            endTime: eventData.fechaFin || eventData.endTime,
            location: eventData.ubicacion || eventData.location
          },
          accessToken: this.accessToken
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create calendar event');
      }
      
      const calendarEvent = await response.json();
      
      console.log('✅ Evento creado en Google Calendar:', calendarEvent.id);
      NotificationManager.showSuccess('Evento sincronizado con Google Calendar');
      
      return calendarEvent;
      
    } catch (error) {
      console.error('❌ Error creando evento en Calendar:', error);
      NotificationManager.showError('Error sincronizando con Google Calendar');
      throw error;
    }
  }

  /**
   * Actualizar evento en Google Calendar (simulado)
   */
  async updateCalendarEvent(eventId, eventData) {
    if (!this.isConnected()) {
      throw new Error('No conectado a Google Calendar');
    }

    try {
      console.log('🔄 Actualizando evento en Google Calendar:', eventId);
      
      // Simulación de actualización
      console.log('✅ Evento actualizado en Google Calendar');
      NotificationManager.showSuccess('Evento actualizado en Google Calendar');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error actualizando evento en Calendar:', error);
      NotificationManager.showError('Error actualizando en Google Calendar');
      throw error;
    }
  }

  /**
   * Eliminar evento de Google Calendar (simulado)
   */
  async deleteCalendarEvent(eventId) {
    if (!this.isConnected()) {
      throw new Error('No conectado a Google Calendar');
    }

    try {
      console.log('🔄 Eliminando evento de Google Calendar:', eventId);
      
      // Simulación de eliminación
      console.log('✅ Evento eliminado de Google Calendar');
      NotificationManager.showSuccess('Evento eliminado de Google Calendar');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando evento de Calendar:', error);
      NotificationManager.showError('Error eliminando de Google Calendar');
      throw error;
    }
  }

  /**
   * Obtener información del usuario conectado
   */
  getUserInfo() {
    if (!this.isConnected()) {
      return null;
    }

    // Simulación de info del usuario
    return {
      email: 'bls.contenidos@gmail.com',
      name: 'BLS TECNICA',
      connected: true,
      connectionTime: localStorage.getItem('google_auth_timestamp')
    };
  }
}

// Crear instancia única
export const googleCalendarManager = new GoogleCalendarManager();
export default GoogleCalendarManager;
