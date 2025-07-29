/* ===== EVENTPRO - MODERN JAVASCRIPT APPLICATION ===== */

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyA6zViTnvHVZkTkD9IKLw4PJ6uMIFJTPsI",
  authDomain: "event-v1-1d99c.firebaseapp.com",
  projectId: "event-v1-1d99c",
  storageBucket: "event-v1-1d99c.firebasestorage.app",
  messagingSenderId: "158233437300",
  appId: "1:158233437300:web:381fc4c38a2efc19b25d21",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== GLOBAL STATE =====
const AppState = {
  currentUser: null,
  events: [],
  technicians: [],
  isLoading: false,
  isRegistering: false,
  currentView: "home", // 'home', 'calendar'
  activeModal: null,
};

// ===== DOM ELEMENTS =====
const elements = {
  // Loading and app containers
  loadingScreen: document.getElementById("loadingScreen"),
  appContainer: document.getElementById("appContainer"),

  // Navigation
  sidebarToggle: document.getElementById("sidebarToggle"),
  mobileMenuButton: document.getElementById("mobileMenuButton"),
  mobileMenu: document.getElementById("mobileMenu"),

  // Sidebar buttons
  btnInicioSidebar: document.getElementById("btnInicioSidebar"),
  btnCalendarSidebar: document.getElementById("btnCalendarSidebar"),
  btnCrearEventoSidebar: document.getElementById("btnCrearEventoSidebar"),
  btnPerfilSidebar: document.getElementById("btnPerfilSidebar"),
  btnCerrarSesionSidebar: document.getElementById("btnCerrarSesionSidebar"),

          // Mobile menu buttons
        mobileBtnInicio: document.getElementById("mobileBtnInicio"),
        mobileBtnCalendar: document.getElementById("mobileBtnCalendar"),
        mobileBtnCrearEvento: document.getElementById("mobileBtnCrearEvento"),
        mobileBtnPerfil: document.getElementById("mobileBtnPerfil"),
        mobileBtnCerrarSesion: document.getElementById("mobileBtnCerrarSesion"),



  // Main content areas
  mainContent: document.getElementById("mainContent"),
  calendarContainer: document.getElementById("calendarContainer"),
  eventCards: document.getElementById("eventCards"),
  emptyState: document.getElementById("emptyState"),

  // Stats
  totalEvents: document.getElementById("totalEvents"),
  totalTechnicians: document.getElementById("totalTechnicians"),
  upcomingEvents: document.getElementById("upcomingEvents"),

  // User info
  navbarUsername: document.getElementById("navbarUsername"),
  navbarUserPhoto: document.getElementById("navbarUserPhoto"),

  // Modals
  authModal: document.getElementById("authModal"),
  eventDetailModal: document.getElementById("eventDetailModal"),
  createEventModal: document.getElementById("createEventModal"),
  profileModal: document.getElementById("profileModal"),

  // Modal close buttons
  closeEventDetailModal: document.getElementById("closeEventDetailModal"),
  closeCreateEventModal: document.getElementById("closeCreateEventModal"),
  closeProfileModal: document.getElementById("closeProfileModal"),

  // Auth form elements
  authForm: document.getElementById("authForm"),
  authEmail: document.getElementById("authEmail"),
  authUsername: document.getElementById("authUsername"),
  authPassword: document.getElementById("authPassword"),
  authError: document.getElementById("authError"),
  authEmailContainer: document.getElementById("authEmailContainer"),
  authUsernameContainer: document.getElementById("authUsernameContainer"),
  authModalTitle: document.getElementById("authModalTitle"),
  authEmailLabel: document.getElementById("authEmailLabel"),
  btnAuthSubmit: document.getElementById("btnAuthSubmit"),
  btnToggleAuth: document.getElementById("btnToggleAuth"),
  btnGoogleAuth: document.getElementById("btnGoogleAuth"),

  // Event forms
  createEventForm: document.getElementById("createEventForm"),
  crearNombre: document.getElementById("crearNombre"),
  crearUbicacion: document.getElementById("crearUbicacion"),
  crearFechaInicio: document.getElementById("crearFechaInicio"),
  crearFechaFin: document.getElementById("crearFechaFin"),
  crearProductora: document.getElementById("crearProductora"),
  crearContacto: document.getElementById("crearContacto"),
  crearDescripcion: document.getElementById("crearDescripcion"),
  crearPersonalContainer: document.getElementById("crearPersonalContainer"),
  btnGuardarCrearEvento: document.getElementById("btnGuardarCrearEvento"),
  btnCancelarCrearEvento: document.getElementById("btnCancelarCrearEvento"),

  // Event detail elements
  detalleNombre: document.getElementById("detalleNombre"),
  detalleUbicacion: document.getElementById("detalleUbicacion"),
  detalleFechaInicio: document.getElementById("detalleFechaInicio"),
  detalleFechaFin: document.getElementById("detalleFechaFin"),
  detalleProductora: document.getElementById("detalleProductora"),
  detalleContacto: document.getElementById("detalleContacto"),
  detalledescripcion: document.getElementById("detalledescripcion"),
  detallePersonalContainer: document.getElementById("detallePersonalContainer"),
  btnEditarEvento: document.getElementById("btnEditarEvento"),
  btnEliminarEvento: document.getElementById("btnEliminarEvento"),

  // Profile elements
  profileForm: document.getElementById("profileForm"),
  profilePhoto: document.getElementById("profilePhoto"),
  profilePhotoPreview: document.getElementById("profilePhotoPreview"),
  profileName: document.getElementById("profileName"),
  profileLastName: document.getElementById("profileLastName"),
  profileCargo: document.getElementById("profileCargo"),
  profilePhone: document.getElementById("profilePhone"),
  btnSaveProfile: document.getElementById("btnSaveProfile"),

  // Calendar
  calendar: document.getElementById("calendar"),

  // Empty state
  btnCreateFirstEvent: document.getElementById("btnCreateFirstEvent"),
};

// ===== UTILITY FUNCTIONS =====
const utils = {
  // Show loading screen
  showLoading() {
    elements.loadingScreen.style.display = "flex";
    elements.appContainer.style.display = "none";
  },

  // Hide loading screen
  hideLoading() {
    elements.loadingScreen.style.display = "none";
    elements.appContainer.style.display = "flex";
  },

  // Show modal
  showModal(modalElement) {
    if (modalElement) {
      modalElement.style.display = "flex";
      AppState.activeModal = modalElement;
      document.body.style.overflow = "hidden";
    }
  },

  // Hide modal
  hideModal(modalElement) {
    if (modalElement) {
      modalElement.style.display = "none";
      AppState.activeModal = null;
      document.body.style.overflow = "auto";
    }
  },

  // Close modal when clicking outside
  setupModalClose(modalElement, closeButton) {
    if (!modalElement) return;

    if (closeButton) {
      closeButton.addEventListener("click", () =>
        utils.hideModal(modalElement)
      );
    }

    modalElement.addEventListener("click", (e) => {
      if (e.target === modalElement) {
        utils.hideModal(modalElement);
      }
    });
  },

  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Get event status
  getEventStatus(event) {
    const now = new Date();
    const startDate = new Date(event.fechaInicio);
    const endDate = new Date(event.fechaFin);

    if (now < startDate) return "upcoming";
    if (now >= startDate && now <= endDate) return "ongoing";
    return "completed";
  },

  // Show success notification
  showSuccess(message) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: message,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } else {
      console.log('Success:', message);
    }
  },

  // Show error notification
  showError(message) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        toast: true,
        position: "top-end",
      });
    } else {
      console.error('Error:', message);
      alert('Error: ' + message);
    }
  },

  // Show confirmation dialog
  showConfirmation(message, callback) {
    Swal.fire({
      title: "¿Estás seguro?",
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        callback();
      }
    });
  },

  // Initialize Lucide icons
  initIcons() {
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// ===== AUTHENTICATION FUNCTIONS =====
const authManager = {
  // Initialize auth state listener
  init() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        AppState.currentUser = user;
        this.handleUserLogin(user);
      } else {
        AppState.currentUser = null;
        this.handleUserLogout();
      }
    });
  },

  // Handle user login
  async handleUserLogin(user) {
    try {
      utils.hideLoading();
      if (elements.authModal) {
        utils.hideModal(elements.authModal);
      }

      const userDoc = await db.collection("users").doc(user.uid).get();
      let userData = {};

      if (userDoc.exists) {
        userData = userDoc.data();
      }

      this.updateUserInterface(user, userData);
      await eventManager.loadEvents();
      await technicianManager.loadTechnicians();
      eventManager.updateStats();
    } catch (error) {
      console.error("Error loading user data:", error);
      utils.showError("Error al cargar los datos del usuario");
    }
  },

  // Handle user logout
  handleUserLogout() {
    utils.showModal(elements.authModal);
    this.resetUserInterface();
  },

  // Update user interface
  updateUserInterface(user, userData) {
    const username =
      userData.name && userData.lastName
        ? `${userData.name} ${userData.lastName}`
        : userData.username || user.email;

    if (elements.navbarUsername) {
      elements.navbarUsername.textContent = `Bienvenido ${username}`;
    }

    if (elements.navbarUserPhoto) {
      if (userData.avatarBase64 && userData.avatarBase64.trim()) {
        elements.navbarUserPhoto.src = userData.avatarBase64;
      } else {
        elements.navbarUserPhoto.src = "https://via.placeholder.com/32";
      }
    }
  },

  // Reset user interface
  resetUserInterface() {
    if (elements.navbarUsername) {
      elements.navbarUsername.textContent = "";
    }
    if (elements.navbarUserPhoto) {
      elements.navbarUserPhoto.src = "https://via.placeholder.com/32";
    }
    if (elements.eventCards) {
      elements.eventCards.innerHTML = "";
    }
    if (elements.totalEvents) {
      elements.totalEvents.textContent = "0";
    }
    if (elements.totalTechnicians) {
      elements.totalTechnicians.textContent = "0";
    }
    if (elements.upcomingEvents) {
      elements.upcomingEvents.textContent = "0";
    }
  },

  // Toggle auth mode (login/register)
  toggleAuthMode() {
    AppState.isRegistering = !AppState.isRegistering;

    if (AppState.isRegistering) {
      elements.authModalTitle.textContent = "Registrarse";
      elements.btnAuthSubmit.textContent = "Registrarse";
      elements.btnToggleAuth.textContent = "¿Ya tienes cuenta? Inicia sesión";
      elements.authEmailLabel.textContent = "Email";
      elements.authUsernameContainer.classList.remove("hidden");
    } else {
      elements.authModalTitle.textContent = "Iniciar Sesión";
      elements.btnAuthSubmit.textContent = "Iniciar Sesión";
      elements.btnToggleAuth.textContent = "¿No tienes cuenta? Regístrate";
      elements.authEmailLabel.textContent = "Email o usuario";
      elements.authUsernameContainer.classList.add("hidden");
    }

    elements.authForm.reset();
    elements.authError.classList.add("hidden");
    elements.authError.textContent = "";
  },

  // Submit auth form
  async submitAuth() {
    const identifier = elements.authEmail.value.trim();
    const password = elements.authPassword.value;

    // Clear previous errors
    elements.authError.classList.add("hidden");
    elements.authError.textContent = "";

    // Validation
    if (!identifier || !password) {
      elements.authError.textContent = "Todos los campos son requeridos";
      elements.authError.classList.remove("hidden");
      return;
    }

    if (AppState.isRegistering) {
      const username = elements.authUsername.value.trim();
      if (!username) {
        elements.authError.textContent = "El nombre de usuario es requerido";
        elements.authError.classList.remove("hidden");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(identifier)) {
        elements.authError.textContent = "El email no tiene un formato válido";
        elements.authError.classList.remove("hidden");
        return;
      }

      await this.registerUser(identifier, password, username);
    } else {
      await this.loginUser(identifier, password);
    }
  },

  // Register user
  async registerUser(email, password, username) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      const userId = userCredential.user.uid;

      await db.collection("users").doc(userId).set({
        username: username,
        email: email,
        createdAt: new Date(),
      });

      utils.showSuccess("Usuario registrado exitosamente");
    } catch (error) {
      this.handleAuthError(error);
    }
  },

  // Login user
  async loginUser(identifier, password) {
    try {
      if (identifier.includes("@")) {
        // Login with email
        await auth.signInWithEmailAndPassword(identifier, password);
      } else {
        // Login with username
        const userQuery = await db
          .collection("users")
          .where("username", "==", identifier)
          .get();

        if (userQuery.empty) {
          throw new Error("El usuario no existe. Por favor, regístrate.");
        }

        const userDoc = userQuery.docs[0];
        const userEmail = userDoc.data().email;
        await auth.signInWithEmailAndPassword(userEmail, password);
      }

      utils.showSuccess("Sesión iniciada exitosamente");
    } catch (error) {
      this.handleAuthError(error);
    }
  },

  // Handle auth errors
  handleAuthError(error) {
    let errorMessage = "Error de autenticación";

    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "El correo electrónico ya está en uso";
        break;
      case "auth/wrong-password":
        errorMessage = "Contraseña incorrecta";
        break;
      case "auth/user-not-found":
        errorMessage = "El usuario no existe";
        break;
      case "auth/weak-password":
        errorMessage = "La contraseña es muy débil";
        break;
      case "auth/invalid-email":
        errorMessage = "Email inválido";
        break;
      default:
        errorMessage = error.message;
    }

    elements.authError.textContent = errorMessage;
    elements.authError.classList.remove("hidden");
  },

  // Google auth
  async googleAuth() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      utils.showSuccess("Sesión iniciada con Google");
    } catch (error) {
      this.handleAuthError(error);
    }
  },

  // Logout
  async logout() {
    try {
      await auth.signOut();
      utils.showSuccess("Sesión cerrada exitosamente");
    } catch (error) {
      utils.showError("Error al cerrar sesión");
    }
  },
};

// ===== EVENT MANAGER =====
const eventManager = {
  // Load events
  async loadEvents() {
    try {
      AppState.isLoading = true;
      const querySnapshot = await db.collection("eventos").get();

      AppState.events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Ordenar eventos por fecha de inicio de más próxima a más lejana
      AppState.events.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));

      this.renderEvents();
      this.updateStats();
    } catch (error) {
      console.error("Error loading events:", error);
      utils.showError("Error al cargar los eventos");
    } finally {
      AppState.isLoading = false;
    }
  },

  // Render events
  renderEvents() {
    if (AppState.events.length === 0) {
      elements.eventCards.innerHTML = "";
      elements.emptyState.style.display = "block";
      return;
    }

    elements.emptyState.style.display = "none";

    const eventsHTML = AppState.events
      .map((event) => this.createEventCard(event))
      .join("");
    elements.eventCards.innerHTML = eventsHTML;

    // Reinitialize icons
    utils.initIcons();
  },

  // Create event card
  createEventCard(event) {
    const status = utils.getEventStatus(event);
    const statusText = {
      upcoming: "Próximo",
      ongoing: "En curso",
      completed: "Completado",
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
              <span>${utils.formatDate(event.fechaInicio)}</span>
            </div>
          </div>
        </div>
        <div class="event-card-body">
          <p class="event-card-description">${
            event.descripcion || "Sin descripción"
          }</p>
        </div>
        <div class="event-card-footer">
          <span class="event-card-status ${status}">${statusText[status]}</span>
          <button class="btn btn-sm btn-primary" onclick="eventManager.openEventDetail('${
            event.id
          }')">
            <i data-lucide="eye" class="w-4 h-4"></i>
            Ver detalles
          </button>
        </div>
      </div>
    `;
  },

  // Open event detail
  async openEventDetail(eventId) {
    const event = AppState.events.find((e) => e.id === eventId);
    if (!event) return;

    // Populate form fields
    elements.detalleNombre.value = event.nombre;
    elements.detalleUbicacion.value = event.ubicacion;
    elements.detalleFechaInicio.value = event.fechaInicio;
    elements.detalleFechaFin.value = event.fechaFin;
    elements.detalleProductora.value = event.productora;
    elements.detalleContacto.value = event.contacto;
    elements.detalledescripcion.value = event.descripcion;

    // Load technicians
    await this.loadEventTechnicians(
      event,
      elements.detallePersonalContainer,
      true
    );

    // Setup buttons
    elements.btnEditarEvento.onclick = () => this.editEvent(event);
    elements.btnEliminarEvento.onclick = () => this.deleteEvent(event);

    utils.showModal(elements.eventDetailModal);
  },

  // Edit event
  editEvent(event) {
    const btnText = elements.btnEditarEvento.textContent;

    if (btnText.includes("Editar")) {
      // Enable editing
      this.enableEventEditing(event);
      elements.btnEditarEvento.innerHTML =
        '<i data-lucide="save" class="w-4 h-4 mr-2"></i>Guardar Cambios';
    } else {
      // Save changes
      this.saveEventChanges(event);
    }
  },

  // Enable event editing
  async enableEventEditing(event) {
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

    fields.forEach((field) => {
      field.readOnly = false;
      field.classList.remove("bg-gray-50");
    });

    // Load technicians for editing
    await this.loadEventTechnicians(
      event,
      elements.detallePersonalContainer,
      false
    );
  },

  // Save event changes
  async saveEventChanges(event) {
    // Validaciones de campos obligatorios
    const nombreEdit = elements.detalleNombre.value.trim();
    const ubicacionEdit = elements.detalleUbicacion.value.trim();
    const fechaInicioEdit = elements.detalleFechaInicio.value;
    const fechaFinEdit = elements.detalleFechaFin.value;
    const productoraEdit = elements.detalleProductora.value.trim();
    if (!nombreEdit || !ubicacionEdit || !fechaInicioEdit || !fechaFinEdit || !productoraEdit) {
      utils.showError("Completa todos los campos obligatorios: nombre, ubicación, fechas y productora");
      return;
    }
    // Validación de fechas
    if (new Date(fechaFinEdit) < new Date(fechaInicioEdit)) {
      utils.showError("La fecha de fin no puede ser anterior a la fecha de inicio");
      return;
    }
    try {
      // Get selected technicians
      const selectedTechnicians = Array.from(
        elements.detallePersonalContainer.querySelectorAll(
          'input[type="checkbox"]:checked'
        )
      ).map((cb) => cb.value);

      const updatedEvent = {
        nombre: elements.detalleNombre.value,
        ubicacion: elements.detalleUbicacion.value,
        fechaInicio: elements.detalleFechaInicio.value,
        fechaFin: elements.detalleFechaFin.value,
        productora: elements.detalleProductora.value,
        contacto: elements.detalleContacto.value,
        descripcion: elements.detalledescripcion.value,
        personal: selectedTechnicians,
      };

      await db.collection("eventos").doc(event.id).update(updatedEvent);

      // Update local state
      Object.assign(event, updatedEvent);

      // Reset form
      this.resetEventForm();
      elements.btnEditarEvento.innerHTML =
        '<i data-lucide="edit" class="w-4 h-4 mr-2"></i>Editar';

      utils.showSuccess("Evento actualizado correctamente");
      utils.hideModal(elements.eventDetailModal);
      this.renderEvents();
      this.updateStats();

      // Update calendar if visible
      if (AppState.currentView === "calendar") {
        calendarManager.updateCalendar();
      }
    } catch (error) {
      console.error("Error updating event:", error);
      utils.showError("Error al actualizar el evento");
    }
  },

  // Delete event
  deleteEvent(event) {
    utils.showConfirmation(
      "¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.",
      async () => {
        try {
          await db.collection("eventos").doc(event.id).delete();

          // Remove from local state
          AppState.events = AppState.events.filter((e) => e.id !== event.id);

          utils.hideModal(elements.eventDetailModal);
          utils.showSuccess("Evento eliminado correctamente");
          this.renderEvents();
          this.updateStats();

          // Update calendar if visible
          if (AppState.currentView === "calendar") {
            calendarManager.updateCalendar();
          }
        } catch (error) {
          console.error("Error deleting event:", error);
          utils.showError("Error al eliminar el evento");
        }
      }
    );
  },

  // Create new event
  async createEvent() {
    // Validaciones de campos obligatorios
    const nombre = elements.crearNombre.value.trim();
    const ubicacion = elements.crearUbicacion.value.trim();
    const fechaInicio = elements.crearFechaInicio.value;
    const fechaFin = elements.crearFechaFin.value;
    const productora = elements.crearProductora.value.trim();
    if (!nombre || !ubicacion || !fechaInicio || !fechaFin || !productora) {
      utils.showError("Completa todos los campos obligatorios: Nombre, Ubicación, Fechas y Productora");
      return;
    }
    // Validación de fechas
    if (new Date(fechaFin) < new Date(fechaInicio)) {
      utils.showError("La fecha de Fin no puede ser anterior a la fecha de Inicio");
      return;
    }
    try {
      // Get selected technicians
      const selectedTechnicians = Array.from(
        elements.crearPersonalContainer.querySelectorAll(
          'input[type="checkbox"]:checked'
        )
      ).map((cb) => cb.value);

      const newEvent = {
        nombre: elements.crearNombre.value,
        ubicacion: elements.crearUbicacion.value,
        fechaInicio: elements.crearFechaInicio.value,
        fechaFin: elements.crearFechaFin.value,
        productora: elements.crearProductora.value,
        contacto: elements.crearContacto.value,
        descripcion: elements.crearDescripcion.value,
        personal: selectedTechnicians,
        createdAt: new Date(),
      };

      const docRef = await db.collection("eventos").add(newEvent);
      newEvent.id = docRef.id;

      // Add to local state
      AppState.events.push(newEvent);

      utils.hideModal(elements.createEventModal);
      utils.showSuccess("Evento creado correctamente");

      // Reset form
      elements.createEventForm.reset();

      this.renderEvents();
      this.updateStats();

      // Update calendar if visible
      if (AppState.currentView === "calendar") {
        calendarManager.updateCalendar();
      }
    } catch (error) {
      console.error("Error creating event:", error);
      utils.showError("Error al crear el evento");
    }
  },

  // Load event technicians
  async loadEventTechnicians(event, container, readOnly = false) {
    container.innerHTML = "";

    for (const technician of AppState.technicians) {
      const isSelected =
        event.personal && event.personal.includes(technician.nombre);

      const checkbox = document.createElement("div");
      checkbox.className = isSelected ? "checkbox-item selected" : "checkbox-item";
      checkbox.innerHTML = `
        <input type="checkbox" value="${technician.nombre}"
               ${isSelected ? "checked" : ""}
               ${readOnly ? "disabled" : ""}>
        <span>${technician.nombre}</span>
      `;

      container.appendChild(checkbox);
    }

    // Add new technician button (only in edit mode)
    if (!readOnly) {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "btn btn-sm btn-secondary mt-2";
      addButton.innerHTML =
        '<i data-lucide="plus" class="w-4 h-4 mr-2"></i>Agregar técnico';
      addButton.onclick = () => technicianManager.addTechnician();
      container.appendChild(addButton);
    }
  },

  // Reset event form
  resetEventForm() {
    const fields = [
      elements.detalleNombre,
      elements.detalleUbicacion,
      elements.detalleFechaInicio,
      elements.detalleFechaFin,
      elements.detalleProductora,
      elements.detalleContacto,
      elements.detalledescripcion,
    ];

    fields.forEach((field) => {
      field.readOnly = true;
      field.classList.add("bg-gray-50");
    });
  },

  // Update stats
  updateStats() {
    if (elements.totalEvents) {
      elements.totalEvents.textContent = AppState.events.length;
    }
    if (elements.totalTechnicians) {
      elements.totalTechnicians.textContent = AppState.technicians.length;
    }

    const upcomingCount = AppState.events.filter(
      (event) => utils.getEventStatus(event) === "upcoming"
    ).length;

    if (elements.upcomingEvents) {
      elements.upcomingEvents.textContent = upcomingCount;
    }
  },
};

// ===== TECHNICIAN MANAGER =====
const technicianManager = {
  // Load technicians
  async loadTechnicians() {
    try {
      const querySnapshot = await db.collection("tecnicos").get();
      AppState.technicians = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      this.renderTechnicians();
    } catch (error) {
      console.error("Error loading technicians:", error);
    }
  },

  // Render technicians
  renderTechnicians() {
    const containers = [
      elements.crearPersonalContainer,
      elements.detallePersonalContainer,
    ];

    containers.forEach((container) => {
      if (container && !container.hasAttribute("data-rendered")) {
        this.renderTechniciansInContainer(container);
        container.setAttribute("data-rendered", "true");
      }
    });
  },

  // Render technicians in container
  renderTechniciansInContainer(container) {
    container.innerHTML = "";

    AppState.technicians.forEach((technician) => {
      const checkbox = document.createElement("div");
      checkbox.className = "checkbox-item";
      checkbox.innerHTML = `
        <input type="checkbox" value="${technician.nombre}">
        <span>${technician.nombre}</span>
      `;
      container.appendChild(checkbox);
    });

    // Add new technician button
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "btn btn-sm btn-secondary mt-2";
    addButton.innerHTML =
      '<i data-lucide="plus" class="w-4 h-4 mr-2"></i>Agregar técnico';
    addButton.onclick = () => this.addTechnician();
    container.appendChild(addButton);
  },

  // Add new technician
  async addTechnician() {
    const { value: nombre } = await Swal.fire({
      title: "Agregar Técnico",
      input: "text",
      inputLabel: "Nombre del técnico",
      inputPlaceholder: "Ingresa el nombre del técnico",
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "El nombre es requerido";
        }
      },
    });

    if (nombre) {
      try {
        const docRef = await db.collection("tecnicos").add({
          nombre: nombre.trim(),
          createdAt: new Date(),
        });

        const newTechnician = {
          id: docRef.id,
          nombre: nombre.trim(),
        };

        AppState.technicians.push(newTechnician);
        this.renderTechnicians();
        utils.showSuccess("Técnico agregado correctamente");
      } catch (error) {
        console.error("Error adding technician:", error);
        utils.showError("Error al agregar el técnico");
      }
    }
  },
};

// ===== CALENDAR MANAGER =====
const calendarManager = {
  calendar: null,

  // Initialize calendar
  init() {
    if (!elements.calendar) return;

    this.calendar = new FullCalendar.Calendar(elements.calendar, {
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      },
      locale: "es",
      events: this.getCalendarEvents(),
      eventClick: (info) => {
        const eventId = info.event.id;
        eventManager.openEventDetail(eventId);
      },
      eventDidMount: (info) => {
        // Add custom styling based on event status
        const event = AppState.events.find((e) => e.id === info.event.id);
        if (event) {
          const status = utils.getEventStatus(event);
          info.el.classList.add(`event-${status}`);
        }
      },
    });

    this.calendar.render();
  },

  // Get calendar events
  getCalendarEvents() {
    return AppState.events.map((event) => {
      const fechaFin = new Date(event.fechaFin);
      fechaFin.setDate(fechaFin.getDate() + 1);

      return {
        id: event.id,
        title: event.nombre,
        start: event.fechaInicio,
        end: fechaFin.toISOString().split("T")[0],
        backgroundColor: this.getEventColor(event),
        borderColor: this.getEventColor(event),
      };
    });
  },

  // Get event color based on status
  getEventColor(event) {
    const status = utils.getEventStatus(event);
    switch (status) {
      case "upcoming":
        return "#f59e0b";
      case "ongoing":
        return "#22c55e";
      case "completed":
        return "#6b7280";
      default:
        return "#3b82f6";
    }
  },

  // Update calendar
  updateCalendar() {
    if (this.calendar) {
      this.calendar.removeAllEvents();
      this.calendar.addEventSource(this.getCalendarEvents());
    }
  },

  // Show calendar view
  showCalendar() {
    elements.mainContent.style.display = "none";
    elements.calendarContainer.style.display = "block";
    AppState.currentView = "calendar";

    if (!this.calendar) {
      this.init();
    } else {
      this.updateCalendar();
    }
  },

  // Hide calendar view
  hideCalendar() {
    elements.calendarContainer.style.display = "none";
    elements.mainContent.style.display = "block";
    AppState.currentView = "home";
  },
};

// ===== PROFILE MANAGER =====
const profileManager = {
  // Load profile
  async loadProfile() {
    if (!AppState.currentUser) return;

    try {
      const userDoc = await db
        .collection("users")
        .doc(AppState.currentUser.uid)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();

        elements.profileName.value = userData.name || "";
        elements.profileLastName.value = userData.lastName || "";
        elements.profileCargo.value = userData.cargo || "";
        elements.profilePhone.value = userData.phone || "";

        if (userData.avatarBase64) {
          elements.profilePhotoPreview.src = userData.avatarBase64;
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  },

  // Save profile
  async saveProfile() {
    if (!AppState.currentUser) return;

    try {
      const updatedData = {
        name: elements.profileName.value.trim(),
        lastName: elements.profileLastName.value.trim(),
        cargo: elements.profileCargo.value.trim(),
        phone: elements.profilePhone.value.trim(),
      };

      // Handle profile photo
      const file = elements.profilePhoto.files[0];
      if (file) {
        const base64String = await this.readFileAsDataURL(file);
        updatedData.avatarBase64 = base64String;
        elements.profilePhotoPreview.src = base64String;
      }

      await db
        .collection("users")
        .doc(AppState.currentUser.uid)
        .set(updatedData, { merge: true });

      utils.hideModal(elements.profileModal);
      utils.showSuccess("Perfil actualizado correctamente");

      // Update navbar
      authManager.updateUserInterface(AppState.currentUser, updatedData);
    } catch (error) {
      console.error("Error saving profile:", error);
      utils.showError("Error al actualizar el perfil");
    }
  },

  // Read file as data URL
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },
};



// ===== NAVIGATION MANAGER =====
const navigationManager = {
  // Initialize navigation
  init() {
    // Sidebar toggle
    if (elements.sidebarToggle) {
      elements.sidebarToggle.addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("hidden");
      });
    }

    // Mobile menu toggle
    if (elements.mobileMenuButton) {
      elements.mobileMenuButton.addEventListener("click", () => this.toggleMobileMenu());
    }

    // Mobile menu close button
    const mobileMenuClose = document.getElementById("mobileMenuClose");
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener("click", () => this.closeMobileMenu());
    }



    // Navigation buttons
    this.setupNavigationButtons();
  },

      // Toggle mobile menu
  toggleMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
      const isOpen = mobileMenu.classList.contains("open");
      if (isOpen) {
        mobileMenu.classList.remove("open");
        document.body.classList.remove("mobile-menu-open");
      } else {
        mobileMenu.classList.add("open");
        document.body.classList.add("mobile-menu-open");
      }
    }
  },

  // Close mobile menu
  closeMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) {
      mobileMenu.classList.remove("open");
      document.body.classList.remove("mobile-menu-open");
    }
  },

  // Setup navigation buttons
  setupNavigationButtons() {
    const buttons = [
      { element: elements.btnInicioSidebar, action: () => this.goHome() },
      { element: elements.btnCalendarSidebar, action: () => this.goCalendar() },
      {
        element: elements.btnCrearEventoSidebar,
        action: () => this.openCreateEvent(),
      },
      { element: elements.btnPerfilSidebar, action: () => this.openProfile() },
      {
        element: elements.btnCerrarSesionSidebar,
        action: () => authManager.logout(),
      },

      { element: elements.mobileBtnInicio, action: () => this.goHome() },
      { element: elements.mobileBtnCalendar, action: () => this.goCalendar() },
      {
        element: elements.mobileBtnCrearEvento,
        action: () => this.openCreateEvent(),
      },
      { element: elements.mobileBtnPerfil, action: () => this.openProfile() },
      {
        element: elements.mobileBtnCerrarSesion,
        action: () => {
          authManager.logout();
          this.closeMobileMenu();
        },
      },

      {
        element: elements.btnCreateFirstEvent,
        action: () => this.openCreateEvent(),
      },
    ];

    buttons.forEach(({ element, action }) => {
      if (element) {
        element.addEventListener("click", action);
      }
    });
  },

  // Go to home
  goHome() {
    calendarManager.hideCalendar();
    this.closeMobileMenu();
  },

  // Go to calendar
  goCalendar() {
    calendarManager.showCalendar();
    this.closeMobileMenu();
  },

  // Open create event modal
  openCreateEvent() {
    elements.createEventForm.reset();
    technicianManager.renderTechniciansInContainer(
      elements.crearPersonalContainer
    );
    utils.showModal(elements.createEventModal);
    this.closeMobileMenu();
  },

  // Open profile modal
  openProfile() {
    profileManager.loadProfile();
    utils.showModal(elements.profileModal);
    this.closeMobileMenu();
  },
};

// ===== EVENT LISTENERS =====
const setupEventListeners = () => {


  // Auth form
  if (elements.btnAuthSubmit) {
    elements.btnAuthSubmit.addEventListener("click", () =>
      authManager.submitAuth()
    );
  }
  if (elements.btnToggleAuth) {
    elements.btnToggleAuth.addEventListener("click", () =>
      authManager.toggleAuthMode()
    );
  }
  if (elements.btnGoogleAuth) {
    elements.btnGoogleAuth.addEventListener("click", () =>
      authManager.googleAuth()
    );
  }

  // Event forms
  if (elements.btnGuardarCrearEvento) {
    elements.btnGuardarCrearEvento.addEventListener("click", () =>
      eventManager.createEvent()
    );
  }
  if (elements.btnCancelarCrearEvento) {
    elements.btnCancelarCrearEvento.addEventListener("click", () =>
      utils.hideModal(elements.createEventModal)
    );
  }

  // Profile
  if (elements.btnSaveProfile) {
    elements.btnSaveProfile.addEventListener("click", () =>
      profileManager.saveProfile()
    );
  }
  if (elements.profilePhoto) {
    elements.profilePhoto.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (elements.profilePhotoPreview) {
            elements.profilePhotoPreview.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Modal close buttons
  if (elements.authModal) {
    utils.setupModalClose(elements.authModal);
  }
  if (elements.eventDetailModal) {
    utils.setupModalClose(
      elements.eventDetailModal,
      elements.closeEventDetailModal
    );
  }
  if (elements.createEventModal) {
    utils.setupModalClose(
      elements.createEventModal,
      elements.closeCreateEventModal
    );
  }
  if (elements.profileModal) {
    utils.setupModalClose(elements.profileModal, elements.closeProfileModal);
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && AppState.activeModal) {
      utils.hideModal(AppState.activeModal);
    }
  });

  // Form submissions
  if (elements.authForm) {
    elements.authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      authManager.submitAuth();
    });
  }

  if (elements.createEventForm) {
    elements.createEventForm.addEventListener("submit", (e) => {
      e.preventDefault();
      eventManager.createEvent();
    });
  }

  if (elements.profileForm) {
    elements.profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      profileManager.saveProfile();
    });
  }
};

// ===== INITIALIZATION =====
const init = async () => {
  try {
    utils.showLoading();

    // Initialize icons
    utils.initIcons();

    // Setup event listeners
    setupEventListeners();

    // Initialize navigation
    navigationManager.init();

    // Initialize authentication
    authManager.init();

    // Set default date for new events
    const today = new Date().toISOString().split("T")[0];
    if (elements.crearFechaInicio) {
      elements.crearFechaInicio.value = today;
    }
    if (elements.crearFechaFin) {
      elements.crearFechaFin.value = today;
    }
  } catch (error) {
    console.error("Error initializing app:", error);
    utils.showError("Error al inicializar la aplicación");
  }
};

// ===== START APPLICATION =====
document.addEventListener("DOMContentLoaded", init);
