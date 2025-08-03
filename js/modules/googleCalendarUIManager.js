import { googleCalendarManager } from './googleCalendarManager.js';
import { NotificationManager } from '../utils/notifications.js';

/**
 * Google Calendar UI Manager
 * Maneja la interfaz de usuario para la integración con Google Calendar
 */
export class GoogleCalendarUIManager {
  constructor() {
    this.isInitialized = false;
    this.connectButton = null;
    this.disconnectButton = null;
    this.syncCheckbox = null;
    this.statusElement = null;
  }

  /**
   * Inicializar la UI de Google Calendar
   */
  init() {
    try {
      // Obtener elementos del DOM
      this.connectButton = document.getElementById('btnConnectGoogleCalendar');
      this.disconnectButton = document.getElementById(
        'btnDisconnectGoogleCalendar'
      );
      this.syncCheckbox = document.getElementById('syncWithGoogleCalendar');
      this.statusElement = document.getElementById('calendarSyncStatus');

      // Configurar event listeners
      this.setupEventListeners();

      // Actualizar estado inicial
      this.updateUI();

      this.isInitialized = true;
      console.log('Google Calendar UI Manager inicializado');
    } catch (error) {
      console.error('Error inicializando Google Calendar UI:', error);
    }
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    if (this.connectButton) {
      this.connectButton.addEventListener(
        'click',
        this.handleConnect.bind(this)
      );
    }

    if (this.disconnectButton) {
      this.disconnectButton.addEventListener(
        'click',
        this.handleDisconnect.bind(this)
      );
    }

    // Escuchar cambios en el estado de autenticación de Google Calendar
    // (esto se puede mejorar con un sistema de eventos más robusto)
    setInterval(() => {
      this.updateUI();
    }, 2000);
  }

  /**
   * Manejar conexión con Google Calendar
   */
  async handleConnect() {
    try {
      this.setButtonLoading(this.connectButton, true, 'Conectando...');

      await googleCalendarManager.authenticate();

      NotificationManager.showSuccess(
        'Redirigiendo a Google para autorización...'
      );
    } catch (error) {
      console.error('Error conectando con Google Calendar:', error);
      NotificationManager.showError('Error al conectar con Google Calendar');
    } finally {
      this.setButtonLoading(this.connectButton, false, 'Conectar');
    }
  }

  /**
   * Manejar desconexión de Google Calendar
   */
  async handleDisconnect() {
    try {
      this.setButtonLoading(this.disconnectButton, true, 'Desconectando...');

      await googleCalendarManager.disconnect();

      NotificationManager.showSuccess('Desconectado de Google Calendar');
      this.updateUI();
    } catch (error) {
      console.error('Error desconectando de Google Calendar:', error);
      NotificationManager.showError('Error al desconectar de Google Calendar');
    } finally {
      this.setButtonLoading(this.disconnectButton, false, 'Desconectar');
    }
  }

  /**
   * Actualizar la interfaz según el estado de conexión
   */
  updateUI() {
    const isConnected = googleCalendarManager.isConnected();

    // Actualizar botones
    if (this.connectButton && this.disconnectButton) {
      if (isConnected) {
        this.connectButton.classList.add('hidden');
        this.disconnectButton.classList.remove('hidden');
      } else {
        this.connectButton.classList.remove('hidden');
        this.disconnectButton.classList.add('hidden');
      }
    }

    // Actualizar checkbox
    if (this.syncCheckbox) {
      this.syncCheckbox.disabled = !isConnected;
      if (!isConnected) {
        this.syncCheckbox.checked = false;
      }
    }

    // Actualizar estado
    if (this.statusElement) {
      this.statusElement.textContent = isConnected
        ? '🟢 Conectado a Google Calendar'
        : '🔴 Google Calendar desconectado';
    }
  }

  /**
   * Establecer estado de carga en un botón
   */
  setButtonLoading(button, isLoading, text) {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.innerHTML = `
        <div class="flex items-center justify-center space-x-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>${text}</span>
        </div>
      `;
    } else {
      button.disabled = false;
      button.textContent = text;
    }
  }

  /**
   * Verificar si la sincronización está habilitada
   */
  isSyncEnabled() {
    return (
      this.syncCheckbox &&
      this.syncCheckbox.checked &&
      googleCalendarManager.isConnected()
    );
  }

  /**
   * Mostrar modal de configuración de Google Calendar
   */
  showConfigurationHelp() {
    const helpText = `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900">Configuración de Google Calendar</h3>
        <div class="text-sm text-gray-600 space-y-2">
          <p><strong>1.</strong> Asegúrate de que tu proyecto tenga habilitada la Google Calendar API</p>
          <p><strong>2.</strong> Configura las credenciales OAuth 2.0 en Google Cloud Console</p>
          <p><strong>3.</strong> Agrega tu dominio a los orígenes autorizados</p>
          <p><strong>4.</strong> Haz clic en "Conectar" para autorizar la aplicación</p>
        </div>
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            <strong>Nota:</strong> Una vez conectado, todos los eventos se pueden
            sincronizar automáticamente con tu Google Calendar.
          </p>
        </div>
      </div>
    `;

    // Aquí puedes usar SweetAlert2 o tu sistema de modales preferido
    if (window.Swal) {
      window.Swal.fire({
        title: 'Ayuda de Google Calendar',
        html: helpText,
        icon: 'info',
        confirmButtonText: 'Entendido',
      });
    }
  }
}

// Crear instancia global
const googleCalendarUIManager = new GoogleCalendarUIManager();

export default googleCalendarUIManager;
