// Technician manager
import { initializeFirebase } from '../config/firebase.js';
import { APP_STATE_KEYS, COLLECTIONS } from '../config/constants.js';
import { appState } from './appState.js';
import { NotificationManager } from '../utils/notifications.js';
import { Helpers } from '../utils/helpers.js';

export class TechnicianManager {
  constructor() {
    this.db = null;
    this.appState = null;
    this.isInitialized = false;
  }

  // Initialize with Firebase database and app state
  initialize(db, appState) {
    this.db = db;
    this.appState = appState;
    this.isInitialized = true;
  }

  // Check if manager is initialized
  checkInitialization() {
    if (!this.isInitialized || !this.db) {
      console.error(
        '❌ TechnicianManager not initialized. Call initialize() first.'
      );
      throw new Error('TechnicianManager not initialized');
    }
  }

  // Load technicians from Firebase
  async loadTechnicians() {
    try {
      this.checkInitialization();

      const querySnapshot = await this.db
        .collection(COLLECTIONS.TECHNICIANS)
        .get();
      const technicians = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort technicians by name
      const sortedTechnicians = technicians.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );

      this.appState.set(APP_STATE_KEYS.TECHNICIANS, sortedTechnicians);

      // Cache technicians
      Helpers.setLocalStorage('cached_technicians', sortedTechnicians);

      return sortedTechnicians;
    } catch (error) {
      console.error('Error loading technicians:', error);
      NotificationManager.showError('Error al cargar los técnicos');

      // Try to load from cache
      const cachedTechnicians = Helpers.getLocalStorage(
        'cached_technicians',
        []
      );
      if (cachedTechnicians.length > 0) {
        this.appState.set(APP_STATE_KEYS.TECHNICIANS, cachedTechnicians);
        NotificationManager.showWarning('Mostrando técnicos en caché');
      }

      throw error;
    }
  }

  // Create new technician
  async createTechnician(technicianData) {
    try {
      // Validate technician data
      const validationErrors = this.validateTechnicianData(technicianData);
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => NotificationManager.showError(error));
        return null;
      }

      const newTechnician = {
        ...technicianData,
        nombre: technicianData.nombre.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.db
        .collection(COLLECTIONS.TECHNICIANS)
        .add(newTechnician);
      const createdTechnician = { ...newTechnician, id: docRef.id };

      // Add to state
      this.appState.addTechnician(createdTechnician);

      NotificationManager.showSuccess('Técnico agregado correctamente');

      // Emit custom event
      this.emitTechnicianChange('created', createdTechnician);

      return createdTechnician;
    } catch (error) {
      console.error('Error creating technician:', error);
      NotificationManager.showError('Error al agregar el técnico');
      throw error;
    }
  }

  // Update existing technician
  async updateTechnician(technicianId, updates) {
    try {
      const technician = this.appState.getTechnician(technicianId);
      if (!technician) {
        throw new Error('Técnico no encontrado');
      }

      // Validate updated data
      const updatedData = { ...technician, ...updates };
      const validationErrors = this.validateTechnicianData(updatedData);
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => NotificationManager.showError(error));
        return null;
      }

      const technicianToUpdate = {
        ...updates,
        updatedAt: new Date(),
      };

      // Check if name is being changed
      const isNameChanged =
        updates.nombre && updates.nombre !== technician.nombre;

      await this.db
        .collection(COLLECTIONS.TECHNICIANS)
        .doc(technicianId)
        .update(technicianToUpdate);

      // Update in state
      this.appState.updateTechnician(technicianId, technicianToUpdate);

      // If name changed, update all events that reference this technician
      if (isNameChanged) {
        await this.updateTechnicianReferencesInEvents(
          technician.nombre,
          updates.nombre
        );
      }

      NotificationManager.showSuccess('Técnico actualizado correctamente');

      // Emit custom event
      this.emitTechnicianChange('updated', {
        ...technician,
        ...technicianToUpdate,
      });

      return { ...technician, ...technicianToUpdate };
    } catch (error) {
      console.error('Error updating technician:', error);
      NotificationManager.showError('Error al actualizar el técnico');
      throw error;
    }
  }

  // Update technician references in all events
  async updateTechnicianReferencesInEvents(oldName, newName) {
    try {
      const events = this.appState.get(APP_STATE_KEYS.EVENTS);
      const eventsToUpdate = events.filter(
        event => event.personal && event.personal.includes(oldName)
      );

      // Update each event in Firebase
      for (const event of eventsToUpdate) {
        const updatedPersonal = event.personal.map(technicianName =>
          technicianName === oldName ? newName : technicianName
        );

        await this.db
          .collection(COLLECTIONS.EVENTS)
          .doc(event.id)
          .update({ personal: updatedPersonal });

        // Update in app state
        this.appState.updateEvent(event.id, { personal: updatedPersonal });
      }

      if (eventsToUpdate.length > 0) {
        console.log(
          `Updated technician reference from "${oldName}" to "${newName}" in ${eventsToUpdate.length} event(s)`
        );
      }
    } catch (error) {
      console.error('Error updating technician references in events:', error);
      NotificationManager.showError(
        'Error al actualizar las referencias del técnico en los eventos'
      );
      throw error;
    }
  }

  // Delete technician
  async deleteTechnician(technicianId) {
    try {
      const technician = this.appState.getTechnician(technicianId);
      if (!technician) {
        throw new Error('Técnico no encontrado');
      }

      // Check if technician is assigned to any events
      const events = this.appState.get(APP_STATE_KEYS.EVENTS);
      const assignedEvents = events.filter(
        event => event.personal && event.personal.includes(technician.nombre)
      );

      if (assignedEvents.length > 0) {
        const eventNames = assignedEvents.map(event => event.nombre).join(', ');
        NotificationManager.showError(
          `No se puede eliminar el técnico porque está asignado a los siguientes eventos: ${eventNames}`
        );
        return null;
      }

      await this.db
        .collection(COLLECTIONS.TECHNICIANS)
        .doc(technicianId)
        .delete();

      // Remove from state
      this.appState.removeTechnician(technicianId);

      NotificationManager.showSuccess('Técnico eliminado correctamente');

      // Emit custom event
      this.emitTechnicianChange('deleted', technician);

      return technician;
    } catch (error) {
      console.error('Error deleting technician:', error);
      NotificationManager.showError('Error al eliminar el técnico');
      throw error;
    }
  }

  // Get technician by ID
  getTechnician(technicianId) {
    return this.appState.getTechnician(technicianId);
  }

  // Get all technicians
  getAllTechnicians() {
    return this.appState.get(APP_STATE_KEYS.TECHNICIANS);
  }

  // Get technicians by name
  getTechniciansByName(name) {
    const technicians = this.getAllTechnicians();
    const searchTerm = name.toLowerCase().trim();

    if (!searchTerm) return technicians;

    return technicians.filter(technician =>
      technician.nombre.toLowerCase().includes(searchTerm)
    );
  }

  // Get available technicians for a date range
  getAvailableTechnicians(startDate, endDate) {
    const technicians = this.getAllTechnicians();
    const events = this.appState.get(APP_STATE_KEYS.EVENTS);

    return technicians.filter(technician => {
      // Check if technician is available during the specified date range
      const conflictingEvents = events.filter(event => {
        const eventStart = new Date(event.fechaInicio);
        const eventEnd = new Date(event.fechaFin);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Check if date ranges overlap
        const hasConflict = eventStart <= end && eventEnd >= start;

        // Check if technician is assigned to this event
        const isAssigned =
          event.personal && event.personal.includes(technician.nombre);

        return hasConflict && isAssigned;
      });

      return conflictingEvents.length === 0;
    });
  }

  // Get technician workload
  getTechnicianWorkload(technicianId, startDate = null, endDate = null) {
    const technician = this.getTechnician(technicianId);
    if (!technician) return { events: [], count: 0 };

    const events = this.appState.get(APP_STATE_KEYS.EVENTS);
    let assignedEvents = events.filter(
      event => event.personal && event.personal.includes(technician.nombre)
    );

    // Filter by date range if provided
    if (startDate && endDate) {
      assignedEvents = assignedEvents.filter(event => {
        const eventStart = new Date(event.fechaInicio);
        const eventEnd = new Date(event.fechaFin);
        const start = new Date(startDate);
        const end = new Date(endDate);

        return eventStart <= end && eventEnd >= start;
      });
    }

    return {
      events: assignedEvents,
      count: assignedEvents.length,
      technician,
    };
  }

  // Get technician statistics
  getTechnicianStats() {
    const technicians = this.getAllTechnicians();
    const events = this.appState.get(APP_STATE_KEYS.EVENTS);

    const stats = technicians.map(technician => {
      const assignedEvents = events.filter(
        event => event.personal && event.personal.includes(technician.nombre)
      );

      const upcomingEvents = assignedEvents.filter(
        event => Helpers.getEventStatus(event) === 'upcoming'
      );

      const ongoingEvents = assignedEvents.filter(
        event => Helpers.getEventStatus(event) === 'ongoing'
      );

      const completedEvents = assignedEvents.filter(
        event => Helpers.getEventStatus(event) === 'completed'
      );

      return {
        technician,
        totalEvents: assignedEvents.length,
        upcomingEvents: upcomingEvents.length,
        ongoingEvents: ongoingEvents.length,
        completedEvents: completedEvents.length,
      };
    });

    return stats.sort((a, b) => b.totalEvents - a.totalEvents);
  }

  // Bulk operations
  async bulkCreateTechnicians(techniciansData) {
    try {
      const createdTechnicians = [];

      for (const technicianData of techniciansData) {
        const createdTechnician = await this.createTechnician(technicianData);
        if (createdTechnician) {
          createdTechnicians.push(createdTechnician);
        }
      }

      NotificationManager.showSuccess(
        `${createdTechnicians.length} técnicos creados correctamente`
      );
      return createdTechnicians;
    } catch (error) {
      console.error('Error in bulk create:', error);
      NotificationManager.showError('Error al crear técnicos');
      throw error;
    }
  }

  async bulkDeleteTechnicians(technicianIds) {
    try {
      const deletedTechnicians = [];

      for (const technicianId of technicianIds) {
        const deletedTechnician = await this.deleteTechnician(technicianId);
        if (deletedTechnician) {
          deletedTechnicians.push(deletedTechnician);
        }
      }

      NotificationManager.showSuccess(
        `${deletedTechnicians.length} técnicos eliminados correctamente`
      );
      return deletedTechnicians;
    } catch (error) {
      console.error('Error in bulk delete:', error);
      NotificationManager.showError('Error al eliminar técnicos');
      throw error;
    }
  }

  // Import technicians
  async importTechnicians(techniciansData) {
    try {
      const technicians = Array.isArray(techniciansData)
        ? techniciansData
        : [techniciansData];
      const createdTechnicians = [];

      for (const technicianData of technicians) {
        const createdTechnician = await this.createTechnician(technicianData);
        if (createdTechnician) {
          createdTechnicians.push(createdTechnician);
        }
      }

      NotificationManager.showSuccess(
        `${createdTechnicians.length} técnicos importados correctamente`
      );
      return createdTechnicians;
    } catch (error) {
      console.error('Error importing technicians:', error);
      NotificationManager.showError('Error al importar técnicos');
      throw error;
    }
  }

  // Export technicians
  exportTechnicians(format = 'json') {
    const technicians = this.getAllTechnicians();

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(technicians, null, 2);

      case 'csv':
        return this.convertToCSV(technicians);

      default:
        throw new Error(`Formato de exportación no soportado: ${format}`);
    }
  }

  // Convert technicians to CSV
  convertToCSV(technicians) {
    const headers = [
      'ID',
      'Nombre',
      'Especialidad',
      'Teléfono',
      'Email',
      'Fecha Creación',
    ];
    const rows = technicians.map(technician => [
      technician.id,
      technician.nombre,
      technician.especialidad || '',
      technician.telefono || '',
      technician.email || '',
      technician.createdAt
        ? new Date(technician.createdAt).toLocaleDateString()
        : '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Validation
  validateTechnicianData(technicianData) {
    const errors = [];

    if (!Helpers.isRequired(technicianData.nombre)) {
      errors.push('El nombre del técnico es requerido');
    }

    // Check for duplicate names
    const technicians = this.getAllTechnicians();
    const existingTechnician = technicians.find(
      tech =>
        tech.nombre.toLowerCase() === technicianData.nombre.toLowerCase() &&
        tech.id !== technicianData.id
    );

    if (existingTechnician) {
      errors.push('Ya existe un técnico con ese nombre');
    }

    // Validate email if provided
    if (technicianData.email && !Helpers.isValidEmail(technicianData.email)) {
      errors.push('El email no tiene un formato válido');
    }

    return errors;
  }

  // Technician change emitter
  emitTechnicianChange(type, technician) {
    const customEvent = new CustomEvent('technicianChanged', {
      detail: { type, technician, timestamp: new Date() },
    });
    document.dispatchEvent(customEvent);
  }

  // Listen to technician changes
  onTechnicianChange(callback) {
    document.addEventListener('technicianChanged', event => {
      callback(event.detail);
    });
  }

  // Remove technician change listener
  removeTechnicianChangeListener(callback) {
    document.removeEventListener('technicianChanged', callback);
  }

  // Sync with server
  async syncTechnicians() {
    try {
      await this.loadTechnicians();
      NotificationManager.showSuccess('Técnicos sincronizados correctamente');
    } catch (error) {
      console.error('Error syncing technicians:', error);
      NotificationManager.showError('Error al sincronizar técnicos');
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    Helpers.removeLocalStorage('cached_technicians');
  }
}

// Create singleton instance
export const technicianManager = new TechnicianManager();
