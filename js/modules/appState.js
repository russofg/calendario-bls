// Application state management
import { APP_STATE_KEYS, VIEWS } from '../config/constants.js';
import { Helpers } from '../utils/helpers.js';

export class AppState {
  constructor() {
    this.state = {
      [APP_STATE_KEYS.CURRENT_USER]: null,
      [APP_STATE_KEYS.EVENTS]: [],
      [APP_STATE_KEYS.TECHNICIANS]: [],
      [APP_STATE_KEYS.IS_LOADING]: false,
      [APP_STATE_KEYS.IS_REGISTERING]: false,
      [APP_STATE_KEYS.CURRENT_VIEW]: VIEWS.HOME,
      [APP_STATE_KEYS.ACTIVE_MODAL]: null,
    };

    this.listeners = new Map();
    this.cache = new Map();
  }

  // Get state value
  get(key) {
    return this.state[key];
  }

  // Set state value
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Notify listeners
    this.notifyListeners(key, value, oldValue);

    // Cache frequently accessed data
    if (key === APP_STATE_KEYS.EVENTS || key === APP_STATE_KEYS.TECHNICIANS) {
      this.updateCache(key, value);
    }
  }

  // Update multiple state values
  setMultiple(updates) {
    const oldValues = {};

    Object.keys(updates).forEach(key => {
      oldValues[key] = this.state[key];
    });

    // Update state
    this.state = { ...this.state, ...updates };

    // Notify listeners for each changed key
    Object.keys(updates).forEach(key => {
      this.notifyListeners(key, updates[key], oldValues[key]);
    });
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // Subscribe to multiple keys
  subscribeMultiple(keys, callback) {
    const unsubscribers = keys.map(key => this.subscribe(key, callback));
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }

  // Notify listeners
  notifyListeners(key, newValue, oldValue) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error('Error in state listener:', error);
        }
      });
    }
  }

  // Cache management
  updateCache(key, value) {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  getCached(key, maxAge = 5 * 60 * 1000) {
    // 5 minutes default
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  }

  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Event-specific methods
  addEvent(event) {
    const events = [...this.get(APP_STATE_KEYS.EVENTS), event];
    this.set(APP_STATE_KEYS.EVENTS, Helpers.sortByDate(events, 'fechaInicio'));
  }

  updateEvent(eventId, updates) {
    const events = this.get(APP_STATE_KEYS.EVENTS).map(event => {
      return event.id === eventId ? { ...event, ...updates } : event;
    });
    this.set(APP_STATE_KEYS.EVENTS, Helpers.sortByDate(events, 'fechaInicio'));
  }

  removeEvent(eventId) {
    const events = this.get(APP_STATE_KEYS.EVENTS).filter(
      event => event.id !== eventId
    );
    this.set(APP_STATE_KEYS.EVENTS, events);
  }

  getEvent(eventId) {
    return this.get(APP_STATE_KEYS.EVENTS).find(event => event.id === eventId);
  }

  // Technician-specific methods
  addTechnician(technician) {
    const technicians = [...this.get(APP_STATE_KEYS.TECHNICIANS), technician];
    this.set(APP_STATE_KEYS.TECHNICIANS, technicians);
  }

  updateTechnician(technicianId, updates) {
    const technicians = this.get(APP_STATE_KEYS.TECHNICIANS).map(technician =>
      technician.id === technicianId
        ? { ...technician, ...updates }
        : technician
    );
    this.set(APP_STATE_KEYS.TECHNICIANS, technicians);
  }

  removeTechnician(technicianId) {
    const technicians = this.get(APP_STATE_KEYS.TECHNICIANS).filter(
      technician => technician.id !== technicianId
    );
    this.set(APP_STATE_KEYS.TECHNICIANS, technicians);
  }

  getTechnician(technicianId) {
    return this.get(APP_STATE_KEYS.TECHNICIANS).find(
      technician => technician.id === technicianId
    );
  }

  // User-specific methods
  setCurrentUser(user) {
    this.set(APP_STATE_KEYS.CURRENT_USER, user);
  }

  getCurrentUser() {
    return this.get(APP_STATE_KEYS.CURRENT_USER);
  }

  clearCurrentUser() {
    this.set(APP_STATE_KEYS.CURRENT_USER, null);
  }

  // View management
  setCurrentView(view) {
    this.set(APP_STATE_KEYS.CURRENT_VIEW, view);
  }

  getCurrentView() {
    return this.get(APP_STATE_KEYS.CURRENT_VIEW);
  }

  // Loading state
  setLoading(isLoading) {
    this.set(APP_STATE_KEYS.IS_LOADING, isLoading);
  }

  isLoading() {
    return this.get(APP_STATE_KEYS.IS_LOADING);
  }

  // Modal management
  setActiveModal(modal) {
    this.set(APP_STATE_KEYS.ACTIVE_MODAL, modal);
  }

  getActiveModal() {
    return this.get(APP_STATE_KEYS.ACTIVE_MODAL);
  }

  clearActiveModal() {
    this.set(APP_STATE_KEYS.ACTIVE_MODAL, null);
  }

  // Auth state
  setRegistering(isRegistering) {
    this.set(APP_STATE_KEYS.IS_REGISTERING, isRegistering);
  }

  isRegistering() {
    return this.get(APP_STATE_KEYS.IS_REGISTERING);
  }

  // Computed properties
  getUpcomingEvents() {
    return this.get(APP_STATE_KEYS.EVENTS).filter(
      event => Helpers.getEventStatus(event) === 'upcoming'
    );
  }

  getOngoingEvents() {
    return this.get(APP_STATE_KEYS.EVENTS).filter(
      event => Helpers.getEventStatus(event) === 'ongoing'
    );
  }

  getCompletedEvents() {
    return this.get(APP_STATE_KEYS.EVENTS).filter(
      event => Helpers.getEventStatus(event) === 'completed'
    );
  }

  getEventsByDateRange(startDate, endDate) {
    return this.get(APP_STATE_KEYS.EVENTS).filter(event => {
      const eventStart = new Date(event.fechaInicio);
      const eventEnd = new Date(event.fechaFin);
      const start = new Date(startDate);
      const end = new Date(endDate);

      return eventStart <= end && eventEnd >= start;
    });
  }

  // Statistics
  getStats() {
    const events = this.get(APP_STATE_KEYS.EVENTS);
    const technicians = this.get(APP_STATE_KEYS.TECHNICIANS);

    return {
      totalEvents: events.length,
      totalTechnicians: technicians.length,
      upcomingEvents: this.getUpcomingEvents().length,
      ongoingEvents: this.getOngoingEvents().length,
      completedEvents: this.getCompletedEvents().length,
    };
  }

  // Reset state
  reset() {
    this.setMultiple({
      [APP_STATE_KEYS.CURRENT_USER]: null,
      [APP_STATE_KEYS.EVENTS]: [],
      [APP_STATE_KEYS.TECHNICIANS]: [],
      [APP_STATE_KEYS.IS_LOADING]: false,
      [APP_STATE_KEYS.IS_REGISTERING]: false,
      [APP_STATE_KEYS.CURRENT_VIEW]: VIEWS.HOME,
      [APP_STATE_KEYS.ACTIVE_MODAL]: null,
    });

    this.clearCache();
  }

  // Debug
  logState() {
    console.log('Current App State:', this.state);
  }
}

// Create singleton instance
export const appState = new AppState();
