// Main application entry point
import { appState } from './modules/appState.js';
import { authManager } from './modules/authManager.js';
import { eventManager } from './modules/eventManager.js';
import { technicianManager } from './modules/technicianManager.js';
import { calendarManager } from './modules/calendarManager.js';
import { uiManager } from './modules/uiManager.js';
import { metricsManager } from './modules/metricsManager.js';
import { googleCalendarManager } from './modules/googleCalendarManager.js';
import googleCalendarUIManager from './modules/googleCalendarUIManager.js';
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
      metricsManager,
      googleCalendarManager,
      googleCalendarUIManager,
    };
  }

  // Initialize the application
  async initialize() {
    try {
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

        // Initialize MetricsManager
        metricsManager.init();

        // Initialize Google Calendar Manager
        googleCalendarManager
          .init()
          .then(() => {
            console.log('✅ Google Calendar Manager inicializado');
          })
          .catch(error => {
            console.error(
              '❌ Error inicializando Google Calendar Manager:',
              error
            );
          });

        // Initialize Google Calendar UI Manager
        googleCalendarUIManager.init();
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
      // This listener handles view-specific logic that's not handled by the UI manager
      // The UI manager methods (goHome, showCalendar, showTechniciansSection) handle
      // the actual showing/hiding of sections
      console.log('View changed to:', view);
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

      // Sincronización automática: usar null para que eventManager decida automáticamente
      // basado en si Google Calendar está conectado
      await eventManager.createEvent(eventData, null);

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

    // Re-initialize Lucide icons for dynamically added content
    if (window.lucide) {
      window.lucide.createIcons();
    }

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

    if (readOnly) {
      // Modo solo lectura: mostrar solo técnicos asignados
      const assignedTechnicians = technicians.filter(
        technician =>
          event.personal && event.personal.includes(technician.nombre)
      );

      if (assignedTechnicians.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-gray-500 text-sm italic py-2';
        emptyMessage.textContent = 'No hay técnicos asignados a este evento';
        container.appendChild(emptyMessage);
      } else {
        assignedTechnicians.forEach(technician => {
          const technicianItem = document.createElement('div');
          technicianItem.className = 'technician-assigned-item';
          technicianItem.innerHTML = `
            <i data-lucide="user-check" class="w-4 h-4"></i>
            <span>${technician.nombre}</span>
          `;
          container.appendChild(technicianItem);
        });
      }

      // Botón para editar técnicos
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'btn btn-sm btn-secondary mt-3 w-full';
      editButton.innerHTML =
        '<i data-lucide="edit" class="w-4 h-4 mr-2"></i>Editar Técnicos Asignados';
      editButton.onclick = () => {
        // Cambiar a modo edición
        this.loadEventTechnicians(event, container, false);
      };
      container.appendChild(editButton);
    } else {
      // Modo edición: mostrar todos los técnicos con checkboxes
      for (const technician of technicians) {
        const isSelected =
          event.personal && event.personal.includes(technician.nombre);

        const checkbox = document.createElement('div');
        checkbox.className = isSelected
          ? 'checkbox-item selected'
          : 'checkbox-item';
        checkbox.innerHTML = `
          <input type="checkbox" value="${technician.nombre}"
                 ${isSelected ? 'checked' : ''}>
          <span>${technician.nombre}</span>
        `;

        container.appendChild(checkbox);
      }

      // Botón para agregar nuevo técnico
      const addButton = document.createElement('button');
      addButton.type = 'button';
      addButton.className = 'btn btn-sm btn-secondary w-full mb-2';
      addButton.innerHTML =
        '<i data-lucide="plus" class="w-4 h-4 mr-2"></i>Agregar Técnico';
      addButton.onclick = () => {
        // Use the same modal as in technician management
        uiManager.openAddTechnicianModal();
      };

      // Botón para guardar cambios
      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.className = 'btn btn-sm btn-primary w-full';
      saveButton.innerHTML =
        '<i data-lucide="save" class="w-4 h-4 mr-2"></i>Guardar Cambios';
      saveButton.onclick = () => {
        // Guardar los cambios de técnicos y volver al modo de solo lectura
        this.saveTechnicianChanges(event, container);
      };

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex flex-col gap-2 mt-3';
      buttonContainer.appendChild(addButton);
      buttonContainer.appendChild(saveButton);
      container.appendChild(buttonContainer);
    }
  }

  // Guardar cambios de técnicos y volver al modo de solo lectura
  saveTechnicianChanges(event, container) {
    if (!container) return;

    // Obtener técnicos seleccionados
    const selectedTechnicians = Array.from(
      container.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    // Actualizar el evento con los nuevos técnicos
    const updatedEvent = { ...event, personal: selectedTechnicians };

    // Actualizar en Firebase
    eventManager.updateEvent(event.id, { personal: selectedTechnicians });

    // Volver al modo de solo lectura
    this.loadEventTechnicians(updatedEvent, container, true);

    // Re-initialize Lucide icons for dynamically added content
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Actualizar la referencia del evento actual
    this.currentEventDetail = updatedEvent;
  }

  // Mostrar modal de gestión de técnicos
  showTechnicianManagementModal() {
    const technicians = technicianManager.getAllTechnicians();
    const events = appState.get('events');

    // Crear modal dinámicamente
    const modalOverlay = document.createElement('div');
    modalOverlay.className =
      'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modalOverlay.id = 'technicianManagementModal';

    const modalContent = document.createElement('div');
    modalContent.className =
      'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in';

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Gestionar Técnicos</h2>
          <button id="closeTechnicianModal" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-600"></i>
          </button>
        </div>

        <div class="mb-4">
          <p class="text-gray-600 text-sm mb-4">
            <i data-lucide="info" class="w-4 h-4 inline mr-1"></i>
            Solo puedes eliminar técnicos que no estén asignados a ningún evento.
          </p>
        </div>

        <div id="techniciansList" class="space-y-3">
          <!-- Técnicos se cargarán aquí -->
        </div>

        <div class="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <button id="cancelTechnicianManagement" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
            Cerrar
          </button>
        </div>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Poblar lista de técnicos
    this.populateTechniciansList(technicians, events);

    // Event listeners
    document.getElementById('closeTechnicianModal').onclick = () => {
      this.closeTechnicianManagementModal();
    };

    document.getElementById('cancelTechnicianManagement').onclick = () => {
      this.closeTechnicianManagementModal();
    };

    // Cerrar al hacer clic fuera del modal
    modalOverlay.onclick = e => {
      if (e.target === modalOverlay) {
        this.closeTechnicianManagementModal();
      }
    };

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Poblar lista de técnicos con opciones de eliminar
  populateTechniciansList(technicians, events) {
    const container = document.getElementById('techniciansList');
    if (!container) return;

    container.innerHTML = '';

    if (technicians.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i data-lucide="users" class="w-12 h-12 mx-auto mb-2 text-gray-300"></i>
          <p>No hay técnicos registrados</p>
        </div>
      `;
      return;
    }

    technicians.forEach(technician => {
      // Verificar si el técnico está asignado a algún evento
      const assignedEvents = events.filter(
        event => event.personal && event.personal.includes(technician.nombre)
      );

      const isAssigned = assignedEvents.length > 0;

      const technicianItem = document.createElement('div');
      technicianItem.className = `p-4 border border-gray-200 rounded-lg ${isAssigned ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`;

      technicianItem.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <i data-lucide="user" class="w-5 h-5 text-gray-600"></i>
            <div>
              <h3 class="font-medium text-gray-900">${technician.nombre}</h3>
              ${
                isAssigned
                  ? `<p class="text-sm text-yellow-700">
                  <i data-lucide="alert-triangle" class="w-3 h-3 inline mr-1"></i>
                  Asignado a ${assignedEvents.length} evento(s): ${assignedEvents.map(e => e.nombre).join(', ')}
                </p>`
                  : `<p class="text-sm text-gray-500">
                  <i data-lucide="check-circle" class="w-3 h-3 inline mr-1"></i>
                  Disponible para eliminar
                </p>`
              }
            </div>
          </div>

          <div class="flex items-center space-x-2">
            ${
              !isAssigned
                ? `<button
                class="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                onclick="window.EventProApp.deleteTechnician('${technician.id}', '${technician.nombre}')"
              >
                <i data-lucide="trash-2" class="w-3 h-3 inline mr-1"></i>
                Eliminar
              </button>`
                : `<span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-lg">
                <i data-lucide="lock" class="w-3 h-3 inline mr-1"></i>
                Protegido
              </span>`
            }
          </div>
        </div>
      `;

      container.appendChild(technicianItem);
    });

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Cerrar modal de gestión de técnicos
  closeTechnicianManagementModal() {
    const modal = document.getElementById('technicianManagementModal');
    if (modal) {
      modal.remove();
    }
  }

  // Eliminar técnico con confirmación
  async deleteTechnician(technicianId, technicianName) {
    const confirmation = await this.showConfirmationDialog(
      `¿Estás seguro de que quieres eliminar al técnico "${technicianName}"?`,
      'Esta acción no se puede deshacer.',
      'Eliminar',
      'Cancelar'
    );

    if (confirmation) {
      try {
        await technicianManager.deleteTechnician(technicianId);

        // Refrescar la lista
        const technicians = technicianManager.getAllTechnicians();
        const events = appState.get('events');
        this.populateTechniciansList(technicians, events);

        // Si hay un modal de evento abierto, actualizar la lista de técnicos
        const eventDetailModal = document.getElementById('eventDetailModal');
        const createEventModal = document.getElementById('createEventModal');

        if (eventDetailModal && eventDetailModal.style.display === 'flex') {
          const container = document.getElementById('detallePersonalContainer');
          if (container && this.currentEventDetail) {
            this.loadEventTechnicians(this.currentEventDetail, container, true);
          }
        }

        if (createEventModal && createEventModal.style.display === 'flex') {
          uiManager.loadCreateEventTechnicians();
        }
      } catch (error) {
        console.error('Error deleting technician:', error);
      }
    }
  }

  // Mostrar diálogo de confirmación personalizado
  showConfirmationDialog(
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ) {
    return new Promise(resolve => {
      // Usar SweetAlert2 si está disponible, sino usar confirm nativo
      if (window.Swal) {
        window.Swal.fire({
          title: title,
          text: message,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#6b7280',
          confirmButtonText: confirmText,
          cancelButtonText: cancelText,
          reverseButtons: true,
        }).then(result => {
          resolve(result.isConfirmed);
        });
      } else {
        // Fallback a confirm nativo
        const result = confirm(`${title}\n\n${message}`);
        resolve(result);
      }
    });
  }

  handleCalendarDateClick(date) {
    // Handle calendar date click - could open create event modal with pre-filled date
  }

  handleCalendarDateSelection(startDate, endDate) {
    // Handle calendar date selection - could filter events or create new event
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

// Export for global access (needed for dynamic modal buttons)
window.EventProApp = eventProApp;
