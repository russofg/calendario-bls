// Event Manager with WhatsApp Notifications
import { COLLECTIONS, APP_STATE_KEYS } from '../config/constants.js';
import { Helpers } from '../utils/helpers.js';
import { NotificationManager } from '../utils/notifications.js';
import { WhatsAppNotificationManager } from './whatsappNotificationManager.js';

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
    console.log('✅ EventManager initialized with Firebase database');
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

      this.appState.set(APP_STATE_KEYS.EVENTS, events);
      console.log(`✅ Loaded ${events.length} events`);
      return events;
    } catch (error) {
      console.error('Error loading events:', error);
      NotificationManager.showError('Error al cargar los eventos');
      return [];
    }
  }

  // Create new event
  async createEvent(eventData) {
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

      // Update local state
      const currentEvents = this.appState.get(APP_STATE_KEYS.EVENTS);
      this.appState.set(APP_STATE_KEYS.EVENTS, [...currentEvents, newEvent]);

      // Send WhatsApp notification
      try {
        const notificationResult =
          await this.whatsappManager.sendEventCreatedNotification(newEvent);
        console.log('📱 WhatsApp notification result:', notificationResult);

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

      // Update local state
      const currentEvents = this.appState.get(APP_STATE_KEYS.EVENTS);
      const updatedEvents = currentEvents.map(event =>
        event.id === eventId
          ? { ...event, ...updates, updatedAt: new Date() }
          : event
      );
      this.appState.set(APP_STATE_KEYS.EVENTS, updatedEvents);

      const updatedEvent = updatedEvents.find(event => event.id === eventId);

      // Send WhatsApp notification
      try {
        const notificationResult =
          await this.whatsappManager.sendEventUpdatedNotification(updatedEvent);
        console.log('📱 WhatsApp notification result:', notificationResult);

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

      // Send WhatsApp notification
      if (eventToDelete) {
        try {
          const notificationResult =
            await this.whatsappManager.sendEventDeletedNotification(
              eventToDelete
            );
          console.log('📱 WhatsApp notification result:', notificationResult);
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
