// UI Manager - Handles all DOM manipulation and rendering
import DOMUtils from '../utils/dom.js';
import { Helpers } from '../utils/helpers.js';
import { NotificationManager } from '../utils/notifications.js';
import { appState } from './appState.js';

export class UIManager {
  constructor() {
    this.elements = {};
    this.initializeElements();
    this.setupEventListeners();
  }

  // Initialize DOM elements
  initializeElements() {
    const elementIds = [
      // Loading and app containers
      'loadingScreen',
      'appContainer',

      // Navigation
      'sidebarToggle',
      'mobileMenuButton',
      'mobileMenu',
      'mobileMenuClose',

      // Sidebar buttons
      'btnInicioSidebar',
      'btnCalendarSidebar',
      'btnCrearEventoSidebar',
      'btnTecnicosSidebar',
      'btnMetricasSidebar',
      'btnPerfilSidebar',
      'btnCerrarSesionSidebar',

      // Mobile menu buttons
      'mobileBtnInicio',
      'mobileBtnCalendar',
      'mobileBtnCrearEvento',
      'mobileBtnTecnicos',
      'mobileBtnMetricas',
      'mobileBtnPerfil',
      'mobileBtnCerrarSesion',

      // Main content areas
      'mainContent',
      'calendarContainer',
      'techniciansContainer',
      'metricsContainer',
      'eventCards',
      'emptyState',

      // Stats
      'totalEvents',
      'totalTechnicians',
      'upcomingEvents',

      // User info
      'navbarUsername',
      'navbarUserPhoto',

      // Modals
      'authModal',
      'eventDetailModal',
      'createEventModal',
      'profileModal',

      // Modal close buttons
      'closeEventDetailModal',
      'closeCreateEventModal',
      'closeProfileModal',

      // Auth form elements
      'authForm',
      'authEmail',
      'authUsername',
      'authPassword',
      'authError',
      'authEmailContainer',
      'authUsernameContainer',
      'authModalTitle',
      'authEmailLabel',
      'btnAuthSubmit',
      'btnToggleAuth',
      'btnGoogleAuth',

      // Event forms
      'createEventForm',
      'crearNombre',
      'crearUbicacion',
      'crearFechaInicio',
      'crearFechaFin',
      'crearProductora',
      'crearContacto',
      'crearDescripcion',
      'crearPersonalContainer',
      'btnGuardarCrearEvento',
      'btnCancelarCrearEvento',

      // Event detail elements
      'detalleNombre',
      'detalleUbicacion',
      'detalleFechaInicio',
      'detalleFechaFin',
      'detalleProductora',
      'detalleContacto',
      'detalledescripcion',
      'detallePersonalContainer',
      'btnEditarEvento',
      'btnEliminarEvento',

      // Profile elements
      'profileForm',
      'profilePhoto',
      'profilePhotoPreview',
      'profileName',
      'profileLastName',
      'profileCargo',
      'profilePhone',
      'btnSaveProfile',

      // Calendar
      'calendar',

      // Technicians Management
      'techniciansContainer',
      'techniciansManagementList',
      'btnAgregarTecnico',
      'btnSincronizarTecnicos',

      // Empty state
      'btnCreateFirstEvent',
    ];

    this.elements = DOMUtils.getElements(elementIds);
  }

  // Setup event listeners
  setupEventListeners() {
    // Auth form events
    this.setupAuthEvents();

    // Event form events
    this.setupEventFormEvents();

    // Profile form events
    this.setupProfileEvents();

    // Modal events
    this.setupModalEvents();

    // Navigation events
    this.setupNavigationEvents();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Form submissions
    this.setupFormSubmissions();
  }

  // Setup auth events
  setupAuthEvents() {
    if (this.elements.btnAuthSubmit) {
      DOMUtils.addEventListener(this.elements.btnAuthSubmit, 'click', e => {
        e.preventDefault();
        this.handleAuthSubmit();
      });
    }

    if (this.elements.btnToggleAuth) {
      DOMUtils.addEventListener(this.elements.btnToggleAuth, 'click', () => {
        this.toggleAuthMode();
      });
    }

    if (this.elements.btnGoogleAuth) {
      DOMUtils.addEventListener(this.elements.btnGoogleAuth, 'click', () => {
        this.handleGoogleAuth();
      });
    }
  }

  // Setup event form events
  setupEventFormEvents() {
    if (this.elements.btnGuardarCrearEvento) {
      DOMUtils.addEventListener(
        this.elements.btnGuardarCrearEvento,
        'click',
        e => {
          e.preventDefault();
          this.handleCreateEvent();
        }
      );
    }

    if (this.elements.btnCancelarCrearEvento) {
      DOMUtils.addEventListener(
        this.elements.btnCancelarCrearEvento,
        'click',
        () => {
          this.hideModal(this.elements.createEventModal);
        }
      );
    }

    if (this.elements.btnEditarEvento) {
      DOMUtils.addEventListener(this.elements.btnEditarEvento, 'click', () => {
        this.handleEditEvent();
      });
    }

    if (this.elements.btnEliminarEvento) {
      DOMUtils.addEventListener(
        this.elements.btnEliminarEvento,
        'click',
        () => {
          this.handleDeleteEvent();
        }
      );
    }
  }

  // Setup profile events
  setupProfileEvents() {
    if (this.elements.btnSaveProfile) {
      DOMUtils.addEventListener(this.elements.btnSaveProfile, 'click', e => {
        e.preventDefault();
        this.handleSaveProfile();
      });
    }

    if (this.elements.profilePhoto) {
      DOMUtils.addEventListener(this.elements.profilePhoto, 'change', e => {
        this.handleProfilePhotoChange(e);
      });
    }

    // Technicians management buttons
    if (this.elements.btnAgregarTecnico) {
      DOMUtils.addEventListener(
        this.elements.btnAgregarTecnico,
        'click',
        () => {
          this.openAddTechnicianModal();
        }
      );
    }

    if (this.elements.btnSincronizarTecnicos) {
      DOMUtils.addEventListener(
        this.elements.btnSincronizarTecnicos,
        'click',
        () => {
          this.syncTechnicians();
        }
      );
    }
  }

  // Setup modal events
  setupModalEvents() {
    // Setup modal close functionality
    this.setupModalClose(this.elements.authModal);
    this.setupModalClose(
      this.elements.eventDetailModal,
      this.elements.closeEventDetailModal
    );
    this.setupModalClose(
      this.elements.createEventModal,
      this.elements.closeCreateEventModal
    );
    this.setupModalClose(
      this.elements.profileModal,
      this.elements.closeProfileModal
    );
  }

  // Setup navigation events
  setupNavigationEvents() {
    // Sidebar toggle
    if (this.elements.sidebarToggle) {
      DOMUtils.addEventListener(this.elements.sidebarToggle, 'click', () => {
        this.toggleSidebar();
      });
    }

    // Mobile menu toggle
    if (this.elements.mobileMenuButton) {
      DOMUtils.addEventListener(this.elements.mobileMenuButton, 'click', () => {
        this.toggleMobileMenu();
      });
    }

    // Mobile menu close
    if (this.elements.mobileMenuClose) {
      DOMUtils.addEventListener(this.elements.mobileMenuClose, 'click', () => {
        this.closeMobileMenu();
      });
    }

    // Navigation buttons
    this.setupNavigationButtons();
  }

  // Setup navigation buttons
  setupNavigationButtons() {
    const navigationButtons = [
      { element: this.elements.btnInicioSidebar, action: () => this.goHome() },
      {
        element: this.elements.btnCalendarSidebar,
        action: () => this.goCalendar(),
      },
      {
        element: this.elements.btnCrearEventoSidebar,
        action: () => this.openCreateEvent(),
      },
      {
        element: this.elements.btnPerfilSidebar,
        action: () => this.openProfile(),
      },
      {
        element: this.elements.btnCerrarSesionSidebar,
        action: () => this.handleLogout(),
      },
      {
        element: this.elements.btnTecnicosSidebar,
        action: () => this.showTechniciansSection(),
      },
      {
        element: this.elements.btnMetricasSidebar,
        action: () => this.showMetricsSection(),
      },
      // Mobile menu buttons
      { element: this.elements.mobileBtnInicio, action: () => this.goHome() },
      {
        element: this.elements.mobileBtnCalendar,
        action: () => this.goCalendar(),
      },
      {
        element: this.elements.mobileBtnCrearEvento,
        action: () => this.openCreateEvent(),
      },
      {
        element: this.elements.mobileBtnPerfil,
        action: () => this.openProfile(),
      },
      {
        element: this.elements.mobileBtnCerrarSesion,
        action: () => this.handleLogout(),
      },
      {
        element: this.elements.mobileBtnTecnicos,
        action: () => this.showTechniciansSection(),
      },
      {
        element: this.elements.mobileBtnMetricas,
        action: () => this.showMetricsSection(),
      },

      {
        element: this.elements.btnCreateFirstEvent,
        action: () => this.openCreateEvent(),
      },
    ];

    navigationButtons.forEach(({ element, action }) => {
      if (element) {
        DOMUtils.addEventListener(element, 'click', action);
      }
    });
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && appState.getActiveModal()) {
        this.hideModal(appState.getActiveModal());
      }
    });
  }

  // Setup form submissions
  setupFormSubmissions() {
    if (this.elements.authForm) {
      DOMUtils.addEventListener(this.elements.authForm, 'submit', e => {
        e.preventDefault();
        this.handleAuthSubmit();
      });
    }

    if (this.elements.createEventForm) {
      DOMUtils.addEventListener(this.elements.createEventForm, 'submit', e => {
        e.preventDefault();
        this.handleCreateEvent();
      });
    }

    if (this.elements.profileForm) {
      DOMUtils.addEventListener(this.elements.profileForm, 'submit', e => {
        e.preventDefault();
        this.handleSaveProfile();
      });
    }
  }

  // Modal management
  showModal(modalElement) {
    if (modalElement) {
      DOMUtils.showElement(modalElement);
      appState.setActiveModal(modalElement);
      document.body.style.overflow = 'hidden';

      // Focus first input in modal
      const firstInput = modalElement.querySelector('input, textarea, select');
      if (firstInput) {
        DOMUtils.focusElement(firstInput);
      }
    }
  }

  hideModal(modalElement) {
    if (modalElement) {
      DOMUtils.hideElement(modalElement);
      appState.clearActiveModal();
      document.body.style.overflow = 'auto';
    }
  }

  setupModalClose(modalElement, closeButton = null) {
    if (!modalElement) return;

    if (closeButton) {
      DOMUtils.addEventListener(closeButton, 'click', () => {
        this.hideModal(modalElement);
      });
    }

    DOMUtils.addEventListener(modalElement, 'click', e => {
      if (e.target === modalElement) {
        this.hideModal(modalElement);
      }
    });
  }

  // Loading management
  showLoading() {
    DOMUtils.showElement(this.elements.loadingScreen);
    DOMUtils.hideElement(this.elements.appContainer);
  }

  hideLoading() {
    DOMUtils.hideElement(this.elements.loadingScreen);
    DOMUtils.showElement(this.elements.appContainer);
  }

  // Navigation methods
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      DOMUtils.toggleClass(sidebar, 'hidden');
    }
  }

  toggleMobileMenu() {
    const { mobileMenu } = this.elements;
    if (mobileMenu) {
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        DOMUtils.removeClass(mobileMenu, 'open');
        DOMUtils.removeClass(document.body, 'mobile-menu-open');
      } else {
        DOMUtils.addClass(mobileMenu, 'open');
        DOMUtils.addClass(document.body, 'mobile-menu-open');
      }
    }
  }

  closeMobileMenu() {
    const { mobileMenu } = this.elements;
    if (mobileMenu) {
      DOMUtils.removeClass(mobileMenu, 'open');
      DOMUtils.removeClass(document.body, 'mobile-menu-open');
    }
  }

  goHome() {
    this.closeMobileMenu();
    this.hideSections();
    DOMUtils.showElement(this.elements.mainContent);
    appState.setCurrentView('home');
  }

  goCalendar() {
    this.closeMobileMenu();
    this.showCalendar();
    appState.setCurrentView('calendar');
  }

  openCreateEvent() {
    this.resetCreateEventForm();

    // Load technicians for the create event form
    this.loadCreateEventTechnicians();

    this.showModal(this.elements.createEventModal);
    this.closeMobileMenu();
  }

  showTechniciansSection() {
    this.closeMobileMenu();
    this.hideSections();
    this.showSection('techniciansContainer');
    this.loadTechniciansManagement();
    appState.setCurrentView('technicians');
  }

  showMetricsSection() {
    this.closeMobileMenu();
    this.hideSections();
    this.showSection('metricsContainer');

    // Import metrics manager dynamically and show metrics
    import('./metricsManager.js')
      .then(({ metricsManager }) => {
        metricsManager.show();
      })
      .catch(error => {
        console.error('Error loading metrics manager:', error);
      });

    appState.setCurrentView('metrics');
  }

  // Load technicians for create event form
  loadCreateEventTechnicians() {
    const container = this.elements.crearPersonalContainer;
    if (!container) return;

    container.innerHTML = '';

    // Import technician manager dynamically
    import('./technicianManager.js')
      .then(({ technicianManager }) => {
        const technicians = technicianManager.getAllTechnicians();

        technicians.forEach(technician => {
          const checkbox = document.createElement('div');
          checkbox.className = 'checkbox-item';
          checkbox.innerHTML = `
          <input type="checkbox" value="${technician.nombre}">
          <span>${technician.nombre}</span>
        `;
          container.appendChild(checkbox);
        });

        // Add new technician button
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'btn btn-sm btn-secondary mt-2';
        addButton.innerHTML =
          '<i data-lucide="plus" class="w-4 h-4 mr-2"></i>Agregar técnico';
        addButton.onclick = () => {
          // Use the same modal as in technician management
          this.openAddTechnicianModal();
        };
        container.appendChild(addButton);
      })
      .catch(error => {
        console.error('Error loading technicians:', error);
      });
  }

  openProfile() {
    this.showModal(this.elements.profileModal);
    this.closeMobileMenu();

    // Load profile data after modal is shown with a small delay
    setTimeout(() => {
      this.loadProfileData();
    }, 100);
  }

  // Calendar management
  showCalendar() {
    this.hideSections();
    DOMUtils.showElement(this.elements.calendarContainer);

    // Initialize calendar if not already done
    if (this.elements.calendar) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        import('./calendarManager.js').then(({ calendarManager }) => {
          calendarManager.initialize(this.elements.calendar).catch(error => {
            console.error('Error initializing calendar:', error);
            // Fallback: show main content if calendar fails
            this.hideSections();
            DOMUtils.showElement(this.elements.mainContent);
          });
        });
      }, 100);
    }
  }

  hideCalendar() {
    DOMUtils.hideElement(this.elements.calendarContainer);
  }

  // Section management
  hideSections() {
    DOMUtils.hideElement(this.elements.mainContent);
    DOMUtils.hideElement(this.elements.calendarContainer);
    DOMUtils.hideElement(this.elements.techniciansContainer);
    DOMUtils.hideElement(this.elements.metricsContainer);
  }

  showSection(sectionName) {
    const section = this.elements[sectionName];
    if (section) {
      DOMUtils.showElement(section);
    }
  }

  // Load technicians management section
  loadTechniciansManagement() {
    const container = this.elements.techniciansManagementList;
    if (!container) return;

    // Load technicians and events for management
    import('./technicianManager.js')
      .then(({ technicianManager }) => {
        const technicians = technicianManager.getAllTechnicians();
        const events = appState.get('events') || [];

        this.populateTechniciansList(container, technicians, events);
      })
      .catch(error => {
        console.error('Error loading technician manager:', error);
      });
  }

  // Populate technicians list for management
  populateTechniciansList(container, technicians, events) {
    container.innerHTML = '';

    if (technicians.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i data-lucide="users" class="w-12 h-12 mx-auto mb-2 text-gray-300"></i>
          <p>No hay técnicos registrados</p>
        </div>
      `;
      this.initIcons();
      return;
    }

    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.className =
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    technicians.forEach(technician => {
      // Check if technician is assigned to any event
      const assignedEvents = events.filter(
        event => event.personal && event.personal.includes(technician.nombre)
      );

      const isAssigned = assignedEvents.length > 0;

      const technicianCard = document.createElement('div');
      technicianCard.className = `p-6 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow ${isAssigned ? 'bg-yellow-50 border-yellow-200' : 'bg-white hover:border-gray-300'}`;

      technicianCard.innerHTML = `
        <div class="flex flex-col h-full">
          <div class="flex-1">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 text-lg mb-1">${technician.nombre}</h3>
                <p class="text-sm text-gray-600 mb-2">
                  <i data-lucide="briefcase" class="w-4 h-4 inline mr-1"></i>
                  ${technician.especialidad || 'General'}
                </p>
              </div>
              <div class="ml-3 flex space-x-1">
                <button class="edit-technician-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        data-technician-id="${technician.id}"
                        data-technician-name="${technician.nombre}"
                        data-technician-specialty="${technician.especialidad || 'General'}"
                        title="Editar técnico">
                  <i data-lucide="edit" class="w-4 h-4"></i>
                </button>
                ${
                  !isAssigned
                    ? `
                  <button class="delete-technician-btn p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          data-technician-id="${technician.id}"
                          data-technician-name="${technician.nombre}"
                          title="Eliminar técnico">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                `
                    : ''
                }
              </div>
            </div>

            ${
              isAssigned
                ? `
              <div class="mt-auto">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <i data-lucide="calendar" class="w-3 h-3 mr-1"></i>
                  Asignado a ${assignedEvents.length} evento(s)
                </span>
              </div>
            `
                : `
              <div class="mt-auto">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                  Disponible
                </span>
              </div>
            `
            }
          </div>

          ${
            isAssigned
              ? `
            <div class="mt-3 pt-3 border-t border-yellow-200">
              <p class="text-xs text-yellow-700">
                No se puede eliminar mientras esté asignado
              </p>
            </div>
          `
              : ''
          }
        </div>
      `;

      gridContainer.appendChild(technicianCard);
    });

    container.appendChild(gridContainer);

    // Add event listeners for edit buttons
    container.querySelectorAll('.edit-technician-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const { technicianId, technicianName, technicianSpecialty } =
          e.currentTarget.dataset;
        this.openEditTechnicianModal(
          technicianId,
          technicianName,
          technicianSpecialty
        );
      });
    });

    // Add event listeners for delete buttons
    container.querySelectorAll('.delete-technician-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const { technicianId, technicianName } = e.currentTarget.dataset;
        this.deleteTechnician(technicianId, technicianName);
      });
    });

    this.initIcons();
  }

  // Delete technician
  async deleteTechnician(technicianId, technicianName) {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar al técnico "${technicianName}"?`
      )
    ) {
      return;
    }

    try {
      const { technicianManager } = await import('./technicianManager.js');
      await technicianManager.deleteTechnician(technicianId);

      // Reload the technicians list
      this.loadTechniciansManagement();

      // Show success message
      NotificationManager.showSuccess(
        `Técnico "${technicianName}" eliminado correctamente`
      );
    } catch (error) {
      console.error('Error deleting technician:', error);
      NotificationManager.showError('Error al eliminar el técnico');
    }
  }

  // Open add technician modal
  openAddTechnicianModal() {
    // Create modal for adding technician
    const modalOverlay = document.createElement('div');
    modalOverlay.className =
      'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modalOverlay.id = 'addTechnicianModal';

    const modalContent = document.createElement('div');
    modalContent.className =
      'bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in';

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Agregar Técnico</h2>
          <button id="closeAddTechnicianModal" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-600"></i>
          </button>
        </div>

        <form id="addTechnicianForm" class="space-y-4">
          <div>
            <label for="technicianName" class="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Técnico *
            </label>
            <input
              type="text"
              id="technicianName"
              name="nombre"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa el nombre completo"
              required
            />
          </div>

          <div>
            <label for="technicianSpecialty" class="block text-sm font-medium text-gray-700 mb-1">
              Especialidad
            </label>
            <input
              type="text"
              id="technicianSpecialty"
              name="especialidad"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Electricista, Plomero, General..."
            />
          </div>

          <div class="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              id="cancelAddTechnician"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Agregar Técnico
            </button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Event listeners
    document.getElementById('closeAddTechnicianModal').onclick = () => {
      this.closeAddTechnicianModal();
    };

    document.getElementById('cancelAddTechnician').onclick = () => {
      this.closeAddTechnicianModal();
    };

    document.getElementById('addTechnicianForm').onsubmit = async e => {
      e.preventDefault();
      await this.handleAddTechnician(e);
    };

    // Close on backdrop click
    modalOverlay.onclick = e => {
      if (e.target === modalOverlay) {
        this.closeAddTechnicianModal();
      }
    };

    // Focus on name input
    setTimeout(() => {
      document.getElementById('technicianName').focus();
    }, 100);

    this.initIcons();
  }

  // Close add technician modal
  closeAddTechnicianModal() {
    const modal = document.getElementById('addTechnicianModal');
    if (modal) {
      modal.remove();
    }
  }

  // Handle add technician form submission
  async handleAddTechnician(e) {
    const formData = new FormData(e.target);
    const technicianData = {
      nombre: formData.get('nombre').trim(),
      especialidad: formData.get('especialidad').trim() || 'General',
    };

    try {
      const { technicianManager } = await import('./technicianManager.js');
      await technicianManager.createTechnician(technicianData);

      // Close modal
      this.closeAddTechnicianModal();

      // Update technicians management if visible
      if (
        this.elements.techniciansContainer &&
        this.elements.techniciansContainer.style.display !== 'none'
      ) {
        this.loadTechniciansManagement();
      }

      // Update create event form if open
      if (
        this.elements.createEventModal &&
        this.elements.createEventModal.style.display === 'flex'
      ) {
        this.loadCreateEventTechnicians();
      }

      // Update event detail modal if open
      const eventDetailModal = document.getElementById('eventDetailModal');
      if (eventDetailModal && eventDetailModal.style.display === 'flex') {
        // Re-load technicians in event detail
        const technicianContainer = document.getElementById(
          'detallePersonalContainer'
        );
        if (
          technicianContainer &&
          window.EventProApp &&
          window.EventProApp.currentEventDetail
        ) {
          window.EventProApp.loadEventTechnicians(
            window.EventProApp.currentEventDetail,
            technicianContainer,
            true
          );
        }
      }

      NotificationManager.showSuccess(
        `Técnico "${technicianData.nombre}" agregado correctamente`
      );
    } catch (error) {
      console.error('Error adding technician:', error);
      NotificationManager.showError('Error al agregar el técnico');
    }
  }

  // Open edit technician modal
  openEditTechnicianModal(technicianId, currentName, currentSpecialty) {
    // Create modal for editing technician
    const modalOverlay = document.createElement('div');
    modalOverlay.className =
      'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modalOverlay.id = 'editTechnicianModal';

    const modalContent = document.createElement('div');
    modalContent.className =
      'bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in';

    modalContent.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Editar Técnico</h2>
          <button id="closeEditTechnicianModal" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5 text-gray-600"></i>
          </button>
        </div>

        <form id="editTechnicianForm" class="space-y-4">
          <div>
            <label for="editTechnicianName" class="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Técnico *
            </label>
            <input
              type="text"
              id="editTechnicianName"
              name="nombre"
              value="${currentName}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa el nombre completo"
              required
            />
          </div>

          <div>
            <label for="editTechnicianSpecialty" class="block text-sm font-medium text-gray-700 mb-1">
              Especialidad
            </label>
            <input
              type="text"
              id="editTechnicianSpecialty"
              name="especialidad"
              value="${currentSpecialty}"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Electricista, Plomero, General..."
            />
          </div>

          <div class="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              id="cancelEditTechnician"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Event listeners
    document.getElementById('closeEditTechnicianModal').onclick = () => {
      this.closeEditTechnicianModal();
    };

    document.getElementById('cancelEditTechnician').onclick = () => {
      this.closeEditTechnicianModal();
    };

    document.getElementById('editTechnicianForm').onsubmit = async e => {
      e.preventDefault();
      await this.handleEditTechnician(e, technicianId);
    };

    // Close on backdrop click
    modalOverlay.onclick = e => {
      if (e.target === modalOverlay) {
        this.closeEditTechnicianModal();
      }
    };

    // Focus on name input
    setTimeout(() => {
      document.getElementById('editTechnicianName').focus();
    }, 100);

    this.initIcons();
  }

  // Close edit technician modal
  closeEditTechnicianModal() {
    const modal = document.getElementById('editTechnicianModal');
    if (modal) {
      modal.remove();
    }
  }

  // Handle edit technician form submission
  async handleEditTechnician(e, technicianId) {
    const formData = new FormData(e.target);
    const updatedData = {
      nombre: formData.get('nombre').trim(),
      especialidad: formData.get('especialidad').trim() || 'General',
    };

    try {
      const { technicianManager } = await import('./technicianManager.js');
      await technicianManager.updateTechnician(technicianId, updatedData);

      // Close modal
      this.closeEditTechnicianModal();

      // Update technicians management if visible
      if (
        this.elements.techniciansContainer &&
        this.elements.techniciansContainer.style.display !== 'none'
      ) {
        this.loadTechniciansManagement();
      }

      // Update create event form if open
      if (
        this.elements.createEventModal &&
        this.elements.createEventModal.style.display === 'flex'
      ) {
        this.loadCreateEventTechnicians();
      }

      // Update event detail modal if open
      const eventDetailModal = document.getElementById('eventDetailModal');
      if (eventDetailModal && eventDetailModal.style.display === 'flex') {
        // Re-load technicians in event detail
        const technicianContainer = document.getElementById(
          'detallePersonalContainer'
        );
        if (
          technicianContainer &&
          window.EventProApp &&
          window.EventProApp.currentEventDetail
        ) {
          // Reload the event data to get updated technician references
          const { eventManager } = await import('./eventManager.js');
          const updatedEvent = await eventManager.getEvent(
            window.EventProApp.currentEventDetail.id
          );
          if (updatedEvent) {
            window.EventProApp.currentEventDetail = updatedEvent;
          }
          window.EventProApp.loadEventTechnicians(
            window.EventProApp.currentEventDetail,
            technicianContainer,
            true
          );
        }
      }

      // Reload events list in home view to reflect changes
      if (
        this.elements.mainContent &&
        this.elements.mainContent.style.display !== 'none'
      ) {
        this.renderEvents(appState.get('events'));
      }

      NotificationManager.showSuccess(
        `Técnico "${updatedData.nombre}" actualizado correctamente`
      );
    } catch (error) {
      console.error('Error updating technician:', error);
      NotificationManager.showError('Error al actualizar el técnico');
    }
  }

  // Sync technicians (reload the list)
  syncTechnicians() {
    this.loadTechniciansManagement();
    NotificationManager.showSuccess('Lista de técnicos sincronizada');
  }

  // Event rendering
  renderEvents(events) {
    if (!events || events.length === 0) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();
    const eventsHTML = events
      .map(event => this.createEventCard(event))
      .join('');
    DOMUtils.setInnerHTML(this.elements.eventCards, eventsHTML);

    // Reinitialize icons
    this.initIcons();
  }

  createEventCard(event) {
    const status = Helpers.getEventStatus(event);
    const statusText = {
      upcoming: 'Próximo',
      ongoing: 'En curso',
      completed: 'Completado',
    };

    return `
      <div class="event-card animate-slide-up" data-event-id="${event.id}">
        <div class="event-card-header">
          <h3 class="event-card-title">${event.nombre}</h3>
          <div class="event-card-meta">
            <div class="event-card-meta-item">
              <i data-lucide="map-pin" class="w-4 h-4"></i>
              <span>${event.ubicacion}</span>
            </div>
            <div class="event-card-meta-item">
              <i data-lucide="calendar" class="w-4 h-4"></i>
              <span>${Helpers.formatDate(event.fechaInicio)}</span>
            </div>
          </div>
        </div>
        <div class="event-card-body">
          <p class="event-card-description">${event.descripcion || 'Sin descripción'}</p>
        </div>
        <div class="event-card-footer">
          <span class="event-card-status ${status}">${statusText[status]}</span>
          <button class="btn btn-sm btn-primary" data-event-id="${event.id}">
            <i data-lucide="eye" class="w-4 h-4"></i>
            Ver detalles
          </button>
        </div>
      </div>
    `;
  }

  // Empty state management
  showEmptyState() {
    DOMUtils.clearElement(this.elements.eventCards);
    DOMUtils.showElement(this.elements.emptyState);
  }

  hideEmptyState() {
    DOMUtils.hideElement(this.elements.emptyState);
  }

  // Stats rendering
  updateStats(stats) {
    if (this.elements.totalEvents) {
      DOMUtils.setTextContent(this.elements.totalEvents, stats.totalEvents);
    }
    if (this.elements.totalTechnicians) {
      DOMUtils.setTextContent(
        this.elements.totalTechnicians,
        stats.totalTechnicians
      );
    }
    if (this.elements.upcomingEvents) {
      DOMUtils.setTextContent(
        this.elements.upcomingEvents,
        stats.upcomingEvents
      );
    }
  }

  // User interface updates
  updateUserInterface(user, userData) {
    const username =
      userData.name && userData.lastName
        ? `${userData.name} ${userData.lastName}`
        : userData.username || user.email;

    if (this.elements.navbarUsername) {
      DOMUtils.setTextContent(
        this.elements.navbarUsername,
        `Bienvenido ${username}`
      );
    }

    if (this.elements.navbarUserPhoto) {
      let avatarSrc = '';
      if (userData.avatarBase64 && userData.avatarBase64.trim()) {
        avatarSrc = userData.avatarBase64;
      } else if (userData.photoURL && userData.photoURL.trim()) {
        avatarSrc = userData.photoURL;
      } else {
        // SVG fallback para evitar error de red
        avatarSrc =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" font-size="16" text-anchor="middle" fill="%236b7280" dy=".3em">👤</text></svg>';
      }
      this.elements.navbarUserPhoto.src = avatarSrc;
    }
  }

  resetUserInterface() {
    if (this.elements.navbarUsername) {
      DOMUtils.setTextContent(this.elements.navbarUsername, '');
    }
    if (this.elements.navbarUserPhoto) {
      this.elements.navbarUserPhoto.src = 'https://via.placeholder.com/32';
    }
    this.showEmptyState();
    this.updateStats({
      totalEvents: 0,
      totalTechnicians: 0,
      upcomingEvents: 0,
    });
  }

  // Form management
  resetCreateEventForm() {
    if (this.elements.createEventForm) {
      this.elements.createEventForm.reset();

      // Set default dates
      const today = Helpers.getTodayISO();
      if (this.elements.crearFechaInicio) {
        this.elements.crearFechaInicio.value = today;
      }
      if (this.elements.crearFechaFin) {
        this.elements.crearFechaFin.value = today;
      }
    }
  }

  resetEventDetailForm() {
    const fields = [
      this.elements.detalleNombre,
      this.elements.detalleUbicacion,
      this.elements.detalleFechaInicio,
      this.elements.detalleFechaFin,
      this.elements.detalleProductora,
      this.elements.detalleContacto,
      this.elements.detalledescripcion,
    ];

    fields.forEach(field => {
      if (field) {
        field.readOnly = true;
        DOMUtils.addClass(field, 'bg-gray-50');
      }
    });
  }

  // Auth mode toggle
  toggleAuthMode() {
    const isRegistering = !appState.isRegistering();
    appState.setRegistering(isRegistering);

    if (isRegistering) {
      DOMUtils.setTextContent(this.elements.authModalTitle, 'Registrarse');
      DOMUtils.setTextContent(this.elements.btnAuthSubmit, 'Registrarse');
      DOMUtils.setTextContent(
        this.elements.btnToggleAuth,
        '¿Ya tienes cuenta? Inicia sesión'
      );
      DOMUtils.setTextContent(this.elements.authEmailLabel, 'Email');
      DOMUtils.removeClass(this.elements.authUsernameContainer, 'hidden');
    } else {
      DOMUtils.setTextContent(this.elements.authModalTitle, 'Iniciar Sesión');
      DOMUtils.setTextContent(this.elements.btnAuthSubmit, 'Iniciar Sesión');
      DOMUtils.setTextContent(
        this.elements.btnToggleAuth,
        '¿No tienes cuenta? Regístrate'
      );
      DOMUtils.setTextContent(this.elements.authEmailLabel, 'Email o usuario');
      DOMUtils.addClass(this.elements.authUsernameContainer, 'hidden');
    }

    if (this.elements.authForm) {
      this.elements.authForm.reset();
    }
    this.hideAuthError();
  }

  // Error handling
  showAuthError(message) {
    if (this.elements.authError) {
      DOMUtils.setTextContent(this.elements.authError, message);
      DOMUtils.removeClass(this.elements.authError, 'hidden');
    }
  }

  hideAuthError() {
    if (this.elements.authError) {
      DOMUtils.setTextContent(this.elements.authError, '');
      DOMUtils.addClass(this.elements.authError, 'hidden');
    }
  }

  // Icon initialization
  initIcons() {
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // Event handlers (to be implemented by other modules)
  handleAuthSubmit() {
    // This will be implemented by the auth module
    console.log('Auth submit handled by auth module');
  }

  handleGoogleAuth() {
    // This will be implemented by the auth module
    console.log('Google auth handled by auth module');
  }

  handleCreateEvent() {
    // This will be implemented by the event module
    console.log('Create event handled by event module');
  }

  handleEditEvent() {
    // This will be implemented by the event module
    console.log('Edit event handled by event module');
  }

  handleDeleteEvent() {
    // This will be implemented by the event module
    console.log('Delete event handled by event module');
  }

  handleSaveProfile() {
    // Import and use the auth manager to save profile data
    import('./authManager.js').then(({ authManager }) => {
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        console.error('No user logged in');
        return;
      }

      // Get profile form data
      const profileData = this.getProfileFormData();
      if (!profileData) {
        console.error('No profile data to save');
        return;
      }

      // Validate profile data
      const validationErrors = this.validateProfileFormData(profileData);
      if (validationErrors.length > 0) {
        this.showAuthError(validationErrors.join('\n'));
        return;
      }

      // Save profile data
      authManager
        .updateUserProfile(currentUser.uid, profileData)
        .then(() => {
          // Hide modal after successful save
          this.hideModal(this.elements.profileModal);
        })
        .catch(error => {
          console.error('Error saving profile:', error);
        });
    });
  }

  // Helper method to get profile form data
  getProfileFormData() {
    // Get base64 from profilePhotoPreview if available
    let avatarBase64 = '';
    if (
      this.elements.profilePhotoPreview &&
      this.elements.profilePhotoPreview.src
    ) {
      // Only save if it's not the default placeholder
      if (!this.elements.profilePhotoPreview.src.includes('placeholder.com')) {
        avatarBase64 = this.elements.profilePhotoPreview.src;
      }
    }
    return {
      name: this.elements.profileName?.value.trim() || '',
      lastName: this.elements.profileLastName?.value.trim() || '',
      cargo: this.elements.profileCargo?.value.trim() || '',
      phone: this.elements.profilePhone?.value.trim() || '',
      avatarBase64,
    };
  }

  // Validate profile form data
  validateProfileFormData(profileData) {
    const errors = [];

    // Import PhoneValidator for validation
    import('../utils/phoneValidator.js')
      .then(({ PhoneValidator }) => {
        // Validate phone number
        if (profileData.phone) {
          const phoneValidation = PhoneValidator.validatePhone(
            profileData.phone
          );
          if (!phoneValidation.isValid) {
            errors.push(`Teléfono: ${phoneValidation.error}`);
          }
        }

        // Validate other fields
        if (!profileData.name.trim()) {
          errors.push('El nombre es requerido');
        }

        if (!profileData.lastName.trim()) {
          errors.push('El apellido es requerido');
        }

        if (!profileData.cargo.trim()) {
          errors.push('El cargo es requerido');
        }
      })
      .catch(error => {
        console.error('Error importing PhoneValidator:', error);
        errors.push('Error de validación');
      });

    return errors;
  }

  handleProfilePhotoChange(event) {
    const file = event.target.files[0];
    if (file && this.elements.profilePhotoPreview) {
      const reader = new FileReader();
      reader.onload = e => {
        this.elements.profilePhotoPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  handleLogout() {
    // This will be implemented by the auth module
    console.log('Logout handled by auth module');
  }

  loadProfileData() {
    console.log('🔄 Loading profile data...');

    // Import and use the auth manager to get user profile data
    import('./authManager.js')
      .then(({ authManager }) => {
        console.log('✅ AuthManager imported successfully');

        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
          console.error('❌ No user logged in');
          return;
        }

        console.log('✅ Current user found:', currentUser.uid);

        // Get user profile data
        authManager
          .getUserProfile(currentUser.uid)
          .then(userData => {
            if (userData) {
              console.log('✅ User profile data loaded:', userData);
              this.populateProfileForm(userData);
            } else {
              console.log('ℹ️ No profile data found for user, using auth data');
              // Use data from current user if available
              const authUserData = {
                name: currentUser.name || currentUser.displayName || '',
                lastName: currentUser.lastName || '',
                cargo: currentUser.cargo || '',
                phone: currentUser.phone || '',
                avatarBase64:
                  currentUser.avatarBase64 || currentUser.photoURL || '',
              };
              console.log('📝 Using auth user data:', authUserData);
              this.populateProfileForm(authUserData);
            }
          })
          .catch(error => {
            console.error('❌ Error loading profile data:', error);
            // Use data from current user as fallback
            const authUserData = {
              name: currentUser.name || currentUser.displayName || '',
              lastName: currentUser.lastName || '',
              cargo: currentUser.cargo || '',
              phone: currentUser.phone || '',
              avatarBase64:
                currentUser.avatarBase64 || currentUser.photoURL || '',
            };
            console.log('📝 Using auth user data as fallback:', authUserData);
            this.populateProfileForm(authUserData);
          });
      })
      .catch(error => {
        console.error('❌ Error importing AuthManager:', error);
      });
  }

  // Helper method to populate profile form
  populateProfileForm(userData) {
    console.log('📝 Populating profile form with data:', userData);

    if (this.elements.profileName) {
      this.elements.profileName.value = userData.name || '';
      console.log(
        `✅ Set profileName to: "${this.elements.profileName.value}"`
      );
    } else {
      console.log('❌ profileName element not found');
    }

    if (this.elements.profileLastName) {
      this.elements.profileLastName.value = userData.lastName || '';
      console.log(
        `✅ Set profileLastName to: "${this.elements.profileLastName.value}"`
      );
    } else {
      console.log('❌ profileLastName element not found');
    }

    if (this.elements.profileCargo) {
      this.elements.profileCargo.value = userData.cargo || '';
      console.log(
        `✅ Set profileCargo to: "${this.elements.profileCargo.value}"`
      );
    } else {
      console.log('❌ profileCargo element not found');
    }

    if (this.elements.profilePhone) {
      this.elements.profilePhone.value = userData.phone || '';
      console.log(
        `✅ Set profilePhone to: "${this.elements.profilePhone.value}"`
      );
    } else {
      console.log('❌ profilePhone element not found');
    }

    if (userData.avatarBase64 && this.elements.profilePhotoPreview) {
      this.elements.profilePhotoPreview.src = userData.avatarBase64;
      console.log('✅ Set profile photo');
    } else if (this.elements.profilePhotoPreview) {
      console.log('ℹ️ No avatar data, using default photo');
    } else {
      console.log('❌ profilePhotoPreview element not found');
    }

    console.log('✅ Profile form population completed');
  }

  // Get elements
  getElements() {
    return this.elements;
  }

  // Get specific element
  getElement(id) {
    return this.elements[id];
  }
}

// Create singleton instance
export const uiManager = new UIManager();
