import { GOOGLE_CALENDAR_CONFIG } from '../config/googleCalendar.js';

/**
 * Google Calendar Integration Manager
 * Maneja la sincronización de eventos con Google Calendar
 */
class GoogleCalendarManager {
  constructor() {
    this.isSignedIn = false;
    this.authInstance = null;
    this.calendarId = 'primary'; // Calendario principal del usuario
    this.isInitialized = false;
  }

  /**
   * Cargar dinámicamente la biblioteca de Google API
   */
  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Inicializa la Google Calendar API
   */
  async init() {
    try {
      // Cargar la biblioteca de Google API
      await this.loadGoogleAPI();

      // Inicializar la API
      await window.gapi.load('auth2', () => {
        window.gapi.auth2
          .init({
            client_id: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
            scope: GOOGLE_CALENDAR_CONFIG.SCOPES.join(' '),
          })
          .then(() => {
            this.authInstance = window.gapi.auth2.getAuthInstance();
            this.isSignedIn = this.authInstance.isSignedIn.get();
            this.isInitialized = true;

            console.log('Google Calendar API inicializada correctamente');

            // Escuchar cambios en el estado de autenticación
            this.authInstance.isSignedIn.listen(
              this.onAuthStateChange.bind(this)
            );
          });
      });

      // Cargar la API de Calendar
      await new Promise(resolve => {
        window.gapi.load('client', () => {
          window.gapi.client
            .init({
              apiKey: GOOGLE_CALENDAR_CONFIG.API_KEY,
              clientId: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
              discoveryDocs: [GOOGLE_CALENDAR_CONFIG.DISCOVERY_URL],
              scope: GOOGLE_CALENDAR_CONFIG.SCOPES.join(' '),
            })
            .then(resolve);
        });
      });
    } catch (error) {
      console.error('Error inicializando Google Calendar API:', error);
      throw error;
    }
  }

  /**
   * Manejar cambios en el estado de autenticación
   */
  onAuthStateChange(isSignedIn) {
    this.isSignedIn = isSignedIn;

    if (isSignedIn) {
      console.log('Usuario autorizado para Google Calendar');
      this.showCalendarSyncStatus(true);
    } else {
      console.log('Usuario no autorizado para Google Calendar');
      this.showCalendarSyncStatus(false);
    }
  }

  /**
   * Solicitar autorización del usuario para acceder al calendario
   */
  async requestAuthorization() {
    try {
      if (!this.isInitialized) {
        throw new Error('Google Calendar API no inicializada');
      }

      const authResult = await this.authInstance.signIn();
      return authResult.isSignedIn();
    } catch (error) {
      console.error('Error en autorización:', error);
      throw error;
    }
  }

  /**
   * Verificar si el usuario está autorizado
   */
  isAuthorized() {
    return this.isSignedIn;
  }

  /**
   * Crear evento en Google Calendar
   */
  async createCalendarEvent(eventData) {
    try {
      if (!this.isAuthorized()) {
        throw new Error('Usuario no autorizado para Google Calendar');
      }

      const calendarEvent = {
        summary: eventData.nombre,
        location: eventData.ubicacion,
        description: `${eventData.descripcion}\n\nProductora: ${eventData.productora}\nContacto: ${eventData.contacto}`,
        start: {
          date: eventData.fechaInicio,
          timeZone: 'America/Argentina/Buenos_Aires',
        },
        end: {
          date: eventData.fechaFin,
          timeZone: 'America/Argentina/Buenos_Aires',
        },
        attendees:
          eventData.personal?.map(tech => ({
            email: tech.email || '',
            displayName: tech.nombre,
          })) || [],
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: this.calendarId,
        resource: calendarEvent,
      });

      console.log('Evento creado en Google Calendar:', response.result);
      return response.result.id;
    } catch (error) {
      console.error('Error creando evento en Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Actualizar evento en Google Calendar
   */
  async updateCalendarEvent(googleEventId, eventData) {
    try {
      if (!this.isAuthorized()) {
        throw new Error('Usuario no autorizado para Google Calendar');
      }

      const calendarEvent = {
        summary: eventData.nombre,
        location: eventData.ubicacion,
        description: `${eventData.descripcion}\n\nProductora: ${eventData.productora}\nContacto: ${eventData.contacto}`,
        start: {
          date: eventData.fechaInicio,
          timeZone: 'America/Argentina/Buenos_Aires',
        },
        end: {
          date: eventData.fechaFin,
          timeZone: 'America/Argentina/Buenos_Aires',
        },
        attendees:
          eventData.personal?.map(tech => ({
            email: tech.email || '',
            displayName: tech.nombre,
          })) || [],
      };

      const response = await window.gapi.client.calendar.events.update({
        calendarId: this.calendarId,
        eventId: googleEventId,
        resource: calendarEvent,
      });

      console.log('Evento actualizado en Google Calendar:', response.result);
      return response.result;
    } catch (error) {
      console.error('Error actualizando evento en Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Eliminar evento de Google Calendar
   */
  async deleteCalendarEvent(googleEventId) {
    try {
      if (!this.isAuthorized()) {
        throw new Error('Usuario no autorizado para Google Calendar');
      }

      await window.gapi.client.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: googleEventId,
      });

      console.log('Evento eliminado de Google Calendar:', googleEventId);
    } catch (error) {
      console.error('Error eliminando evento de Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Mostrar estado de sincronización en la UI
   */
  showCalendarSyncStatus(isConnected) {
    // Aquí puedes agregar indicadores visuales en tu interfaz
    const statusElement = document.getElementById('calendarSyncStatus');
    if (statusElement) {
      statusElement.textContent = isConnected
        ? '🟢 Sincronizado con Google Calendar'
        : '🔴 Google Calendar desconectado';
    }
  }

  /**
   * Desconectar de Google Calendar
   */
  async disconnect() {
    try {
      if (this.authInstance) {
        await this.authInstance.signOut();
        this.isSignedIn = false;
        console.log('Desconectado de Google Calendar');
      }
    } catch (error) {
      console.error('Error desconectando de Google Calendar:', error);
    }
  }
}

// Crear instancia global
const googleCalendarManager = new GoogleCalendarManager();

export default googleCalendarManager;
