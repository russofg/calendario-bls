// Event Manager with WhatsApp Notifications and Google Calendar Sync
import { COLLECTIONS, APP_STATE_KEYS } from '../config/constants.js';
import { Helpers } from '../utils/helpers.js';
import { NotificationManager } from '../utils/notifications.js';
import { WhatsAppNotificationManager } from './whatsappNotificationManager.js';
import { googleCalendarManager } from './googleCalendarManager.js';

export class EventManager {
  constructor() {
    this.db = null;
    this.appState = null;
    this.whatsappManager = null;
    this.isInitialized = false;
  }

  // Initialize with Firebase database and app state
  initialize(db, appState) {
    this.db = db;
    this.appState = appState;
    this.whatsappManager = new WhatsAppNotificationManager(db);
    this.isInitialized = true;

    // Inicializar Google Calendar Manager
    this.initializeGoogleCalendar();
  }

  // Initialize Google Calendar integration
  async initializeGoogleCalendar() {
    try {
      await googleCalendarManager.init();
      console.log('Google Calendar Manager inicializado');
    } catch (error) {
      console.warn('Google Calendar no disponible:', error);
    }
  }

  // Check if manager is initialized
  checkInitialization() {
    if (!this.isInitialized || !this.db) {
      console.error(
        '❌ EventManager not initialized. Call initialize() first.'
      );
      throw new Error('EventManager not initialized');
    }
  }

  // Load events from Firestore
  async loadEvents() {
    try {
      this.checkInitialization();

      const snapshot = await this.db.collection(COLLECTIONS.EVENTS).get();
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar eventos por fecha de inicio (más recientes primero)
      const sortedEvents = events.sort((a, b) => {
        const dateA = new Date(a.fechaInicio);
        const dateB = new Date(b.fechaInicio);
        return dateA - dateB; // Orden ascendente (próximos eventos primero)
      });

      this.appState.set(APP_STATE_KEYS.EVENTS, sortedEvents);
      return sortedEvents;
    } catch (error) {
      console.error('Error loading events:', error);
      NotificationManager.showError('Error al cargar los eventos');
      return [];
    }
  }

  // Create new event
  async createEvent(eventData, syncWithGoogleCalendar = false) {
    try {
      // Add event to Firestore
      const docRef = await this.db.collection(COLLECTIONS.EVENTS).add({
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newEvent = {
        id: docRef.id,
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Google Calendar sync if enabled and authorized
      if (syncWithGoogleCalendar && googleCalendarManager.isConnected()) {
        try {
          const googleEvent =
            await googleCalendarManager.createCalendarEvent(newEvent);
          // Update event with Google Calendar ID (solo el ID, no el objeto completo)
          const googleEventId = googleEvent.id;
          await this.db.collection(COLLECTIONS.EVENTS).doc(docRef.id).update({
            googleCalendarId: googleEventId,
          });
          newEvent.googleCalendarId = googleEventId;
          console.log(
            'Evento sincronizado con Google Calendar:',
            googleEventId
          );
        } catch (calendarError) {
          console.error(
            'Error sincronizando con Google Calendar:',
            calendarError
          );
          NotificationManager.showWarning(
            'Evento creado, pero no se pudo sincronizar con Google Calendar'
          );
        }
      }

      // Update local state - mantener orden por fecha
      const currentEvents = this.appState.get(APP_STATE_KEYS.EVENTS);
      const allEvents = [...currentEvents, newEvent];

      // Ordenar por fecha de inicio
      const sortedEvents = allEvents.sort((a, b) => {
        const dateA = new Date(a.fechaInicio);
        const dateB = new Date(b.fechaInicio);
        return dateA - dateB;
      });

      this.appState.set(APP_STATE_KEYS.EVENTS, sortedEvents);

      // Send WhatsApp notification
      try {
        await this.whatsappManager.sendEventCreatedNotification(newEvent);

        // Schedule reminders
        await this.whatsappManager.scheduleEventReminders(newEvent);
      } catch (notificationError) {
        console.error(
          '❌ Error sending WhatsApp notification:',
          notificationError
        );
      }

      NotificationManager.showSuccess('Evento creado exitosamente');
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      NotificationManager.showError('Error al crear el evento');
      throw error;
    }
  }

  // Update existing event
  async updateEvent(eventId, updates) {
    try {
      // Update in Firestore
      await this.db
        .collection(COLLECTIONS.EVENTS)
        .doc(eventId)
        .update({
          ...updates,
          updatedAt: new Date(),
        });

      // Update local state - mantener orden por fecha
      const currentEvents = this.appState.get(APP_STATE_KEYS.EVENTS);
      const updatedEvents = currentEvents.map(event =>
        event.id === eventId
          ? { ...event, ...updates, updatedAt: new Date() }
          : event
      );

      // Ordenar por fecha de inicio
      const sortedEvents = updatedEvents.sort((a, b) => {
        const dateA = new Date(a.fechaInicio);
        const dateB = new Date(b.fechaInicio);
        return dateA - dateB;
      });

      this.appState.set(APP_STATE_KEYS.EVENTS, sortedEvents);

      const updatedEvent = sortedEvents.find(event => event.id === eventId);

      // Google Calendar sync if event has Google Calendar ID
      if (updatedEvent.googleCalendarId && googleCalendarManager.isConnected()) {
        try {
          await googleCalendarManager.updateCalendarEvent(
            updatedEvent.googleCalendarId,
            updatedEvent
          );
        } catch (googleError) {
          console.error('❌ Error updating in Google Calendar:', googleError);
          // No fallar la actualización por error de Google Calendar
        }
      }

      // Send WhatsApp notification
      try {
        const notificationResult =
          await this.whatsappManager.sendEventUpdatedNotification(updatedEvent);

        // Update reminders if date changed
        if (updates.fechaInicio) {
          await this.whatsappManager.scheduleEventReminders(updatedEvent);
        }
      } catch (notificationError) {
        console.error(
          '❌ Error sending WhatsApp notification:',
          notificationError
        );
      }

      NotificationManager.showSuccess('Evento actualizado exitosamente');
      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      NotificationManager.showError('Error al actualizar el evento');
      throw error;
    }
  }

  // Delete event
  async deleteEvent(eventId) {
    try {
      // Get event data before deletion for notification
      const eventToDelete = this.appState
        .get(APP_STATE_KEYS.EVENTS)
        .find(event => event.id === eventId);

      // Delete from Firestore
      await this.db.collection(COLLECTIONS.EVENTS).doc(eventId).delete();

      // Update local state
      const currentEvents = this.appState.get(APP_STATE_KEYS.EVENTS);
      const filteredEvents = currentEvents.filter(
        event => event.id !== eventId
      );
      this.appState.set(APP_STATE_KEYS.EVENTS, filteredEvents);

      // Google Calendar sync if event has Google Calendar ID
      if (eventToDelete && eventToDelete.googleCalendarId && googleCalendarManager.isConnected()) {
        try {
          await googleCalendarManager.deleteCalendarEvent(eventToDelete.googleCalendarId);
        } catch (googleError) {
          console.error('❌ Error deleting from Google Calendar:', googleError);
          // No fallar la eliminación por error de Google Calendar
        }
      }

      // Send WhatsApp notification
      if (eventToDelete) {
        try {
          const notificationResult =
            await this.whatsappManager.sendEventDeletedNotification(
              eventToDelete
            );
        } catch (notificationError) {
          console.error(
            '❌ Error sending WhatsApp notification:',
            notificationError
          );
        }
      }

      NotificationManager.showSuccess('Evento eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting event:', error);
      NotificationManager.showError('Error al eliminar el evento');
      throw error;
    }
  }

  // Get event by ID
  getEventById(eventId) {
    return this.appState
      .get(APP_STATE_KEYS.EVENTS)
      .find(event => event.id === eventId);
  }

  // Get events by status
  getEventsByStatus(status) {
    return this.appState
      .get(APP_STATE_KEYS.EVENTS)
      .filter(event => Helpers.getEventStatus(event) === status);
  }

  // Update stats
  updateStats() {
    const events = this.appState.get(APP_STATE_KEYS.EVENTS);
    const stats = {
      total: events.length,
      upcoming: this.getEventsByStatus('upcoming').length,
      ongoing: this.getEventsByStatus('ongoing').length,
      completed: this.getEventsByStatus('completed').length,
    };

    this.appState.setStats(stats);
    return stats;
  }

  // Check and send reminders (to be called periodically)
  async checkReminders() {
    try {
      await this.whatsappManager.checkAndSendReminders();
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }
}

// Create singleton instance
export const eventManager = new EventManager();
