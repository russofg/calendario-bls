// Main application entry point
import { appState } from './modules/appState.js';
import { authManager } from './modules/authManager.js';
import { eventManager } from './modules/eventManager.js';
import { technicianManager } from './modules/technicianManager.js';
import { calendarManager } from './modules/calendarManager.js';
import { uiManager } from './modules/uiManager.js';
import { NotificationManager } from './utils/notifications.js';
import { Helpers } from './utils/helpers.js';

class EventProApp {
  constructor() {
    this.isInitialized = false;
    this.modules = {
      appState,
      authManager,
      eventManager,
      technicianManager,
      calendarManager,
      uiManager,
    };
  }

  // Initialize the application
  async initialize() {
    try {
      console.log('🚀 Initializing EventPro Application...');

      // Show loading screen
      uiManager.showLoading();

      // Initialize icons
      uiManager.initIcons();

      // Setup module connections
      this.setupModuleConnections();

      // Setup state listeners
      this.setupStateListeners();

      // Setup custom event listeners
      this.setupCustomEventListeners();

      // Initialize authentication
      await this.initializeAuthentication();

      // Mark as initialized
      this.isInitialized = true;

      console.log('✅ EventPro Application initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing EventPro Application:', error);
      NotificationManager.showError('Error al inicializar la aplicación');
    }
  }

  // Setup connections between modules
  setupModuleConnections() {
    // Connect UI handlers to actual module methods
    this.connectUIHandlers();

    // Initialize managers with Firebase database
    this.initializeManagers();

    // Setup auth state listeners
    authManager.onAuthStateChanged(({ type, user, userData }) => {
      if (type === 'login') {
        this.handleUserLogin(user, userData);
      } else if (type === 'logout') {
        this.handleUserLogout();
      }
    });
  }

  // Initialize managers with Firebase database
  initializeManagers() {
    try {
      // Get Firebase database from authManager
      const firebase = authManager.getFirebase();
      if (firebase && firebase.db) {
        // Initialize EventManager
        eventManager.initialize(firebase.db, appState);

        // Initialize TechnicianManager
        technicianManager.initialize(firebase.db, appState);

        console.log('✅ Managers initialized with Firebase database');
      } else {
        console.warn(
          '⚠️ Firebase not available yet, managers will be initialized later'
        );
      }
    } catch (error) {
      console.error('❌ Error initializing managers:', error);
    }
  }

  // Connect UI handlers to actual module methods
  connectUIHandlers() {
    // Override UI manager handlers with actual implementations
    uiManager.handleAuthSubmit = () => this.handleAuthSubmit();
    uiManager.handleGoogleAuth = () => this.handleGoogleAuth();
    uiManager.handleCreateEvent = () => this.handleCreateEvent();
    uiManager.handleEditEvent = () => this.handleEditEvent();
    uiManager.handleDeleteEvent = () => this.handleDeleteEvent();
    uiManager.handleSaveProfile = () => this.handleSaveProfile();
    uiManager.handleLogout = () => this.handleLogout();
    uiManager.loadProfileData = () => this.loadProfileData();
  }

  // Setup state listeners
  setupStateListeners() {
    // Listen to events changes
    appState.subscribe('events', events => {
      uiManager.renderEvents(events);
      uiManager.updateStats(appState.getStats());
    });

    // Listen to technicians changes
    appState.subscribe('technicians', () => {
      uiManager.updateStats(appState.getStats());

      // Update technician lists in open modals
      this.updateTechnicianLists();
    });

    // Listen to loading state changes
    appState.subscribe('isLoading', isLoading => {
      if (isLoading) {
        uiManager.showLoading();
      } else {
        uiManager.hideLoading();
      }
    });

    // Listen to view changes
    appState.subscribe('currentView', view => {
      if (view === 'calendar') {
        uiManager.showCalendar();
      } else {
        uiManager.hideCalendar();
      }
    });
  }

  // Update technician lists in open modals
  updateTechnicianLists() {
    const elements = uiManager.getElements();

    // Update create event modal technicians
    if (
      elements.createEventModal &&
      elements.createEventModal.style.display === 'flex'
    ) {
      uiManager.loadCreateEventTechnicians();
    }

    // Update event detail modal technicians
    if (
      elements.eventDetailModal &&
      elements.eventDetailModal.style.display === 'flex' &&
      this.currentEventDetail
    ) {
      this.loadEventTechnicians(
        this.currentEventDetail,
        elements.detallePersonalContainer,
        false
      );
    }
  }

  // Setup custom event listeners
  setupCustomEventListeners() {
    // Calendar event click
    document.addEventListener('calendarEventClick', event => {
      const { eventId } = event.detail;
      this.openEventDetail(eventId);
    });

    // Calendar date click
    document.addEventListener('calendarDateClick', event => {
      const { date } = event.detail;
      this.handleCalendarDateClick(date);
    });

    // Calendar date selection
    document.addEventListener('calendarDateSelection', event => {
      const { startDate, endDate } = event.detail;
      this.handleCalendarDateSelection(startDate, endDate);
    });

    // Event card clicks (delegation)
    document.addEventListener('click', e => {
      if (e.target.closest('.event-card .btn-primary')) {
        const eventCard = e.target.closest('.event-card');
        const eventId = eventCard.dataset.eventId;
        this.openEventDetail(eventId);
      }
    });
  }

  // Initialize authentication
  async initializeAuthentication() {
    // Authentication will be handled by the auth manager
    // The auth state listener will handle login/logout
  }

  // Handle user login
  async handleUserLogin(user, userData) {
    try {
      // Asegurarse de que userData.photoURL esté presente si el usuario es de Google
      let mergedUserData = { ...userData };
      if (user && user.photoURL && !userData.avatarBase64) {
        mergedUserData.photoURL = user.photoURL;
      }
      uiManager.updateUserInterface(user, mergedUserData);

      // Load data
      await Promise.all([
        eventManager.loadEvents(),
        technicianManager.loadTechnicians(),
      ]);

      // Hide auth modal
      uiManager.hideModal(uiManager.getElement('authModal'));
    } catch (error) {
      console.error('Error handling user login:', error);
      NotificationManager.showError('Error al cargar los datos del usuario');
    }
  }

  // Handle user logout
  handleUserLogout() {
    // Reset UI
    uiManager.resetUserInterface();

    // Show auth modal
    uiManager.showModal(uiManager.getElement('authModal'));
  }

  // Auth handlers
  async handleAuthSubmit() {
    try {
      const identifier = uiManager.getElement('authEmail').value.trim();
      const password = uiManager.getElement('authPassword').value;
      const username = uiManager.getElement('authUsername')?.value.trim();

      // Validate input
      const authData = { identifier, password, username };
      const validationErrors = authManager.validateAuthData(authData);

      if (validationErrors.length > 0) {
        validationErrors.forEach(error => uiManager.showAuthError(error));
        return;
      }

      uiManager.hideAuthError();

      if (appState.isRegistering()) {
        await authManager.registerUser(identifier, password, username);
      } else {
        await authManager.loginUser(identifier, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Error handling is done in the auth manager
    }
  }

  async handleGoogleAuth() {
    try {
      await authManager.googleAuth();
    } catch (error) {
      console.error('Google auth error:', error);
      // Error handling is done in the auth manager
    }
  }

  async handleLogout() {
    try {
      await authManager.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Error handling is done in the auth manager
    }
  }

  // Event handlers
  async handleCreateEvent() {
    try {
      const eventData = this.getEventFormData('create');

      if (!eventData) return;

      await eventManager.createEvent(eventData);

      // Hide modal and reset form
      uiManager.hideModal(uiManager.getElement('createEventModal'));
      uiManager.resetCreateEventForm();
    } catch (error) {
      console.error('Error creating event:', error);
      // Error handling is done in the event manager
    }
  }

  async handleEditEvent() {
    try {
      const currentEvent = this.getCurrentEventDetail();
      if (!currentEvent) return;

      const btnText = uiManager.getElement('btnEditarEvento').textContent;

      if (btnText.includes('Editar')) {
        // Enable editing
        this.enableEventEditing(currentEvent);
        uiManager.getElement('btnEditarEvento').innerHTML =
          '<i data-lucide="save" class="w-4 h-4 mr-2"></i>Guardar Cambios';
      } else {
        // Save changes
        await this.saveEventChanges(currentEvent);
      }
    } catch (error) {
      console.error('Error editing event:', error);
      NotificationManager.showError('Error al editar el evento');
    }
  }

  async handleDeleteEvent() {
    try {
      const currentEvent = this.getCurrentEventDetail();
      if (!currentEvent) return;

      NotificationManager.showConfirmation(
        '¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.',
        async () => {
          await eventManager.deleteEvent(currentEvent.id);
          uiManager.hideModal(uiManager.getElement('eventDetailModal'));
        }
      );
    } catch (error) {
      console.error('Error deleting event:', error);
      // Error handling is done in the event manager
    }
  }

  // Profile handlers
  async handleSaveProfile() {
    try {
      const profileData = this.getProfileFormData();

      if (!profileData) return;

      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        NotificationManager.showError('Usuario no autenticado');
        return;
      }

      await authManager.updateUserProfile(currentUser.uid, profileData);

      // Hide modal
      uiManager.hideModal(uiManager.getElement('profileModal'));
    } catch (error) {
      console.error('Error saving profile:', error);
      // Error handling is done in the auth manager
    }
  }

  async loadProfileData() {
    try {
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) return;

      const userData = await authManager.getUserProfile(currentUser.uid);
      if (userData) {
        this.populateProfileForm(userData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      NotificationManager.showError('Error al cargar el perfil');
    }
  }

  // Utility methods
  getEventFormData(formType) {
    const elements = uiManager.getElements();

    if (formType === 'create') {
      return {
        nombre: elements.crearNombre?.value.trim(),
        ubicacion: elements.crearUbicacion?.value.trim(),
        fechaInicio: elements.crearFechaInicio?.value,
        fechaFin: elements.crearFechaFin?.value,
        productora: elements.crearProductora?.value.trim(),
        contacto: elements.crearContacto?.value.trim(),
        descripcion: elements.crearDescripcion?.value.trim(),
        personal: this.getSelectedTechnicians(elements.crearPersonalContainer),
      };
    } else if (formType === 'detail') {
      return {
        nombre: elements.detalleNombre?.value.trim(),
        ubicacion: elements.detalleUbicacion?.value.trim(),
        fechaInicio: elements.detalleFechaInicio?.value,
        fechaFin: elements.detalleFechaFin?.value,
        productora: elements.detalleProductora?.value.trim(),
        contacto: elements.detalleContacto?.value.trim(),
        descripcion: elements.detalledescripcion?.value.trim(),
        personal: this.getSelectedTechnicians(
          elements.detallePersonalContainer
        ),
      };
    }

    return null;
  }

  getProfileFormData() {
    const elements = uiManager.getElements();
    let avatarBase64 = '';
    if (elements.profilePhotoPreview && elements.profilePhotoPreview.src) {
      // Si el usuario subió una imagen, guardar el base64
      if (
        elements.profilePhotoPreview.src.startsWith('data:image') &&
        !elements.profilePhotoPreview.src.includes('placeholder.com')
      ) {
        avatarBase64 = elements.profilePhotoPreview.src;
      }
    }
    // Si no hay base64 y el usuario tiene photoURL (Google), usarlo
    if (!avatarBase64 && window.authManager) {
      const currentUser =
        window.authManager.getCurrentUser &&
        window.authManager.getCurrentUser();
      if (currentUser && currentUser.photoURL) {
        avatarBase64 = currentUser.photoURL;
      }
    }

    return {
      name: elements.profileName?.value.trim(),
      lastName: elements.profileLastName?.value.trim(),
      cargo: elements.profileCargo?.value.trim(),
      phone: elements.profilePhone?.value.trim(),
      avatarBase64,
    };
  }

  getSelectedTechnicians(container) {
    if (!container) return [];

    return Array.from(
      container.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);
  }

  // Track current event being viewed/edited
  currentEventDetail = null;

  getCurrentEventDetail() {
    return this.currentEventDetail;
  }

  populateProfileForm(userData) {
    const elements = uiManager.getElements();

    if (elements.profileName) elements.profileName.value = userData.name || '';
    if (elements.profileLastName)
      elements.profileLastName.value = userData.lastName || '';
    if (elements.profileCargo)
      elements.profileCargo.value = userData.cargo || '';
    if (elements.profilePhone)
      elements.profilePhone.value = userData.phone || '';

    if (elements.profilePhotoPreview) {
      if (userData.avatarBase64) {
        elements.profilePhotoPreview.src = userData.avatarBase64;
      } else if (userData.photoURL) {
        elements.profilePhotoPreview.src = userData.photoURL;
      } else {
        // SVG default fallback
        elements.profilePhotoPreview.src =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="%23e5e7eb"/><text x="50%" y="54%" text-anchor="middle" fill="%239ca3af" font-size="28" font-family="Arial" dy=".3em">?</text></svg>';
      }
    }
  }

  enableEventEditing(event) {
    const elements = uiManager.getElements();

    // Make fields editable
    const fields = [
      elements.detalleNombre,
      elements.detalleUbicacion,
      elements.detalleFechaInicio,
      elements.detalleFechaFin,
      elements.detalleProductora,
      elements.detalleContacto,
      elements.detalledescripcion,
    ];

    fields.forEach(field => {
      if (field) {
        field.readOnly = false;
        field.classList.remove('bg-gray-50');
      }
    });

    // Load technicians for editing
    this.loadEventTechnicians(event, elements.detallePersonalContainer, false);
  }

  async saveEventChanges(event) {
    try {
      const eventData = this.getEventFormData('detail');

      if (!eventData) return;

      await eventManager.updateEvent(event.id, eventData);

      // Reset form and button
      uiManager.resetEventDetailForm();
      const btnEditar = uiManager.getElement('btnEditarEvento');
      if (btnEditar) {
        btnEditar.innerHTML =
          '<i data-lucide="edit" class="w-4 h-4 mr-2"></i>Editar';
      }

      // Hide modal
      uiManager.hideModal(uiManager.getElement('eventDetailModal'));
    } catch (error) {
      console.error('Error saving event changes:', error);
      // Error handling is done in the event manager
    }
  }

  openEventDetail(eventId) {
    const event = eventManager.getEventById(eventId);
    if (!event) return;

    // Store current event
    this.currentEventDetail = event;

    // Populate form fields
    const elements = uiManager.getElements();

    if (elements.detalleNombre) elements.detalleNombre.value = event.nombre;
    if (elements.detalleUbicacion)
      elements.detalleUbicacion.value = event.ubicacion;
    if (elements.detalleFechaInicio)
      elements.detalleFechaInicio.value = event.fechaInicio;
    if (elements.detalleFechaFin)
      elements.detalleFechaFin.value = event.fechaFin;
    if (elements.detalleProductora)
      elements.detalleProductora.value = event.productora;
    if (elements.detalleContacto)
      elements.detalleContacto.value = event.contacto;
    if (elements.detalledescripcion)
      elements.detalledescripcion.value = event.descripcion;

    // Load technicians
    this.loadEventTechnicians(event, elements.detallePersonalContainer, true);

    // Reset form to read-only
    uiManager.resetEventDetailForm();

    // Connect edit and delete buttons
    if (elements.btnEditarEvento) {
      // Remove any existing listeners
      const newBtnEditar = elements.btnEditarEvento.cloneNode(true);
      elements.btnEditarEvento.parentNode.replaceChild(
        newBtnEditar,
        elements.btnEditarEvento
      );

      // Add new listener
      newBtnEditar.addEventListener('click', () => this.handleEditEvent());
      newBtnEditar.innerHTML =
        '<i data-lucide="edit" class="w-4 h-4 mr-2"></i>Editar';

      // Update reference
      elements.btnEditarEvento = newBtnEditar;
    }

    if (elements.btnEliminarEvento) {
      // Remove any existing listeners
      const newBtnEliminar = elements.btnEliminarEvento.cloneNode(true);
      elements.btnEliminarEvento.parentNode.replaceChild(
        newBtnEliminar,
        elements.btnEliminarEvento
      );

      // Add new listener
      newBtnEliminar.addEventListener('click', () => this.handleDeleteEvent());

      // Update reference
      elements.btnEliminarEvento = newBtnEliminar;
    }

    // Show modal
    uiManager.showModal(elements.eventDetailModal);
  }

  async loadEventTechnicians(event, container, readOnly = false) {
    if (!container) return;

    container.innerHTML = '';

    const technicians = technicianManager.getAllTechnicians();

    for (const technician of technicians) {
      const isSelected =
        event.personal && event.personal.includes(technician.nombre);

      const checkbox = document.createElement('div');
      checkbox.className = isSelected
        ? 'checkbox-item selected'
        : 'checkbox-item';
      checkbox.innerHTML = `
        <input type="checkbox" value="${technician.nombre}"
               ${isSelected ? 'checked' : ''}
               ${readOnly ? 'disabled' : ''}>
        <span>${technician.nombre}</span>
      `;

      container.appendChild(checkbox);
    }

    // Add new technician button (only in edit mode)
    if (!readOnly) {
      const addButton = document.createElement('button');
      addButton.type = 'button';
      addButton.className = 'btn btn-sm btn-secondary mt-2';
      addButton.innerHTML =
        '<i data-lucide="plus" class="w-4 h-4 mr-2"></i>Agregar técnico';
      addButton.onclick = () => {
        // Show prompt to enter technician name
        const nombre = prompt('Ingresa el nombre del técnico:');
        if (nombre && nombre.trim()) {
          technicianManager.createTechnician({ nombre: nombre.trim() });
        }
      };
      container.appendChild(addButton);
    }
  }

  handleCalendarDateClick(date) {
    // Handle calendar date click - could open create event modal with pre-filled date
    console.log('Calendar date clicked:', date);
  }

  handleCalendarDateSelection(startDate, endDate) {
    // Handle calendar date selection - could filter events or create new event
    console.log('Calendar date selection:', startDate, 'to', endDate);
  }

  // Public API
  getModules() {
    return this.modules;
  }

  isAppInitialized() {
    return this.isInitialized;
  }

  // Debug methods
  logState() {
    appState.logState();
  }

  getStats() {
    return appState.getStats();
  }
}

// Create and export the main application instance
export const eventProApp = new EventProApp();

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  eventProApp.initialize();
});

// Export for global access (if needed)
window.EventProApp = eventProApp;
