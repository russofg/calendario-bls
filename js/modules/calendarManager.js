// Calendar manager with lazy loading
import { appState } from './appState.js';
import { NotificationManager } from '../utils/notifications.js';
import { Helpers } from '../utils/helpers.js';
import { EVENT_STATUS_COLORS } from '../config/constants.js';

export class CalendarManager {
  constructor() {
    this.calendar = null;
    this.isInitialized = false;
    this.fullCalendarLoaded = false;
    this.loadingShown = false; // New property to track if loading is shown
  }

  // Lazy load FullCalendar
  async loadFullCalendar() {
    if (this.fullCalendarLoaded) return;

    try {
      // Check if FullCalendar is already loaded
      if (typeof FullCalendar === 'undefined') {
        // Load FullCalendar CSS
        if (!document.querySelector('link[href*="fullcalendar"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href =
            'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css';
          document.head.appendChild(link);
        }

        // Load FullCalendar JS
        await this.loadScript(
          'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js'
        );
      }

      this.fullCalendarLoaded = true;
    } catch (error) {
      console.error('Error loading FullCalendar:', error);
      NotificationManager.showError('Error al cargar el calendario');
      throw error;
    }
  }

  // Load script dynamically
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize calendar
  async initialize(containerElement) {
    if (this.isInitialized) {
      // If already initialized, just refresh the events
      this.updateEvents();
      return;
    }

    try {
      // Show loading state
      NotificationManager.showLoading('Inicializando calendario...');

      await this.loadFullCalendar();

      if (!containerElement) {
        throw new Error('Container element is required');
      }

      // Detect mobile device
      const isMobile = window.innerWidth <= 768;
      const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

      this.calendar = new FullCalendar.Calendar(containerElement, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: isMobile
            ? 'dayGridMonth'
            : 'dayGridMonth,timeGridWeek,timeGridDay',
        },
        locale: 'es',
        events: this.getCalendarEvents(),
        eventClick: info => {
          this.handleEventClick(info);
        },
        eventDidMount: info => {
          this.handleEventMount(info);
        },
        eventDidUnmount: info => {
          this.handleEventUnmount(info);
        },
        dateClick: info => {
          this.handleDateClick(info);
        },
        selectable: true,
        select: info => {
          this.handleDateSelection(info);
        },
        eventDrop: info => {
          this.handleEventDrop(info);
        },
        eventResize: info => {
          this.handleEventResize(info);
        },
        loading: isLoading => {
          this.handleLoading(isLoading);
        },
        height: 'auto',
        aspectRatio: isMobile ? 1.0 : 1.35,
        dayMaxEvents: isMobile ? 2 : true,
        moreLinkClick: 'popover',
        eventTimeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false,
        },
        slotMinTime: '06:00:00',
        slotMaxTime: '24:00:00',
        allDaySlot: true,
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00',
        expandRows: true,
        stickyHeaderDates: true,
        nowIndicator: true,
        businessHours: {
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Monday - Sunday
          startTime: '08:00',
          endTime: '18:00',
        },
        eventDisplay: 'block',
        eventColor: '#3b82f6',
        eventTextColor: '#ffffff',
        eventBorderColor: '#1d4ed8',
        dayCellDidMount: arg => {
          this.handleDayCellMount(arg);
        },
        viewDidMount: arg => {
          this.handleViewMount(arg);
        },
      });

      this.calendar.render();
      this.isInitialized = true;

      // Listen to event changes
      this.setupEventListeners();

      // Hide loading after successful initialization
      setTimeout(() => {
        NotificationManager.hideLoading();
      }, 500);
    } catch (error) {
      console.error('Error initializing calendar:', error);
      NotificationManager.hideLoading();
      NotificationManager.showError('Error al inicializar el calendario');
      throw error;
    }
  }

  // Helper method to fix end date for FullCalendar (add one day because FullCalendar uses exclusive end dates)
  fixEndDateForCalendar(fechaFin) {
    if (!fechaFin) return fechaFin;

    const fechaFinDate = new Date(fechaFin);
    fechaFinDate.setDate(fechaFinDate.getDate() + 1);
    return fechaFinDate.toISOString().split('T')[0];
  }

  // Get calendar events from app state
  getCalendarEvents() {
    const events = appState.get('events');

    return events.map(event => {
      return {
        id: event.id,
        title: event.nombre,
        start: event.fechaInicio,
        end: this.fixEndDateForCalendar(event.fechaFin),
        backgroundColor: this.getEventColor(event),
        borderColor: this.getEventColor(event),
        textColor: '#ffffff',
        extendedProps: {
          ubicacion: event.ubicacion,
          productora: event.productora,
          contacto: event.contacto,
          descripcion: event.descripcion,
          personal: event.personal || [],
          status: Helpers.getEventStatus(event),
        },
        classNames: [`event-${Helpers.getEventStatus(event)}`],
      };
    });
  }

  // Get event color based on status
  getEventColor(event) {
    const status = Helpers.getEventStatus(event);
    return EVENT_STATUS_COLORS[status] || '#3b82f6';
  }

  // Update calendar events
  updateEvents() {
    if (!this.calendar || !this.isInitialized) return;

    try {
      this.calendar.removeAllEvents();
      this.calendar.addEventSource(this.getCalendarEvents());
    } catch (error) {
      console.error('Error updating calendar events:', error);
    }
  }

  // Handle event click
  handleEventClick(info) {
    const eventId = info.event.id;

    // Emit custom event for other modules to handle
    const customEvent = new CustomEvent('calendarEventClick', {
      detail: { eventId, event: info.event },
    });
    document.dispatchEvent(customEvent);
  }

  // Handle event mount
  handleEventMount(info) {
    const { event } = info;
    const { status } = event.extendedProps;

    // Add custom styling
    info.el.classList.add(`event-${status}`);

    // Add tooltip
    this.addEventTooltip(info.el, event);
  }

  // Handle event unmount
  handleEventUnmount(info) {
    // Clean up tooltips if needed
    const tooltip = info.el.querySelector('.event-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  // Handle date click
  handleDateClick(info) {
    const date = info.dateStr;

    // Emit custom event for other modules to handle
    const customEvent = new CustomEvent('calendarDateClick', {
      detail: { date, dateObj: info.date },
    });
    document.dispatchEvent(customEvent);
  }

  // Handle date selection
  handleDateSelection(info) {
    const startDate = info.startStr;
    const endDate = info.endStr;

    // Emit custom event for other modules to handle
    const customEvent = new CustomEvent('calendarDateSelection', {
      detail: {
        startDate,
        endDate,
        startObj: info.start,
        endObj: info.end,
      },
    });
    document.dispatchEvent(customEvent);
  }

  // Handle event drop (drag and drop)
  async handleEventDrop(info) {
    try {
      const eventId = info.event.id;
      const newStartDate = info.event.startStr;
      const newEndDate = info.event.endStr;

      // Update event in database
      const eventManager = await import('./eventManager.js');
      await eventManager.eventManager.updateEvent(eventId, {
        fechaInicio: newStartDate,
        fechaFin: newEndDate,
      });

      NotificationManager.showSuccess('Evento actualizado correctamente');
    } catch (error) {
      console.error('Error updating event date:', error);
      NotificationManager.showError('Error al actualizar la fecha del evento');

      // Revert the change
      info.revert();
    }
  }

  // Handle event resize
  async handleEventResize(info) {
    try {
      const eventId = info.event.id;
      const newEndDate = info.event.endStr;

      // Update event in database
      const eventManager = await import('./eventManager.js');
      await eventManager.eventManager.updateEvent(eventId, {
        fechaFin: newEndDate,
      });

      NotificationManager.showSuccess('Evento actualizado correctamente');
    } catch (error) {
      console.error('Error updating event duration:', error);
      NotificationManager.showError(
        'Error al actualizar la duración del evento'
      );

      // Revert the change
      info.revert();
    }
  }

  // Handle loading state
  handleLoading(isLoading) {
    if (isLoading) {
      // Only show loading if not already showing
      if (!this.loadingShown) {
        NotificationManager.showLoading('Cargando calendario...');
        this.loadingShown = true;
      }
    } else {
      // Hide loading and reset flag
      NotificationManager.hideLoading();
      this.loadingShown = false;
    }
  }

  // Handle day cell mount
  handleDayCellMount(arg) {
    const { date } = arg;
    const today = new Date();

    // Highlight today
    if (date.toDateString() === today.toDateString()) {
      arg.el.classList.add('fc-day-today');
    }

    // Highlight weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      arg.el.classList.add('fc-day-weekend');
    }
  }

  // Handle view mount
  handleViewMount(arg) {
    // Add custom view-specific styling or behavior
    const viewType = arg.view.type;
    console.log(`Calendar view changed to: ${viewType}`);

    // Ensure loading is hidden when view is mounted
    NotificationManager.hideLoading();
    this.loadingShown = false;
  }

  // Add event tooltip
  addEventTooltip(element, event) {
    const tooltip = document.createElement('div');
    tooltip.className = 'event-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <h4>${event.title}</h4>
        <p><strong>Ubicación:</strong> ${event.extendedProps.ubicacion}</p>
        <p><strong>Productora:</strong> ${event.extendedProps.productora}</p>
        <p><strong>Fecha:</strong> ${Helpers.formatDate(event.start)}</p>
        ${event.extendedProps.descripcion ? `<p><strong>Descripción:</strong> ${event.extendedProps.descripcion}</p>` : ''}
      </div>
    `;

    element.appendChild(tooltip);

    // Show/hide tooltip on hover
    element.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
    });

    element.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }

  // Setup event listeners
  setupEventListeners() {
    // Listen to event changes from other modules
    document.addEventListener('eventChanged', () => {
      this.updateEvents();
    });

    // Listen to technician changes
    document.addEventListener('technicianChanged', () => {
      this.updateEvents();
    });
  }

  // Navigate to specific date
  goToDate(date) {
    if (!this.calendar || !this.isInitialized) return;

    this.calendar.gotoDate(date);
  }

  // Navigate to today
  goToToday() {
    if (!this.calendar || !this.isInitialized) return;

    this.calendar.today();
  }

  // Change view
  changeView(viewType) {
    if (!this.calendar || !this.isInitialized) return;

    this.calendar.changeView(viewType);
  }

  // Get current view
  getCurrentView() {
    if (!this.calendar || !this.isInitialized) return null;

    return this.calendar.view.type;
  }

  // Get current date
  getCurrentDate() {
    if (!this.calendar || !this.isInitialized) return null;

    return this.calendar.getDate();
  }

  // Get selected dates
  getSelectedDates() {
    if (!this.calendar || !this.isInitialized) return null;

    return this.calendar.getDate();
  }

  // Add event programmatically
  addEvent(eventData) {
    if (!this.calendar || !this.isInitialized) return;

    const calendarEvent = {
      id: eventData.id,
      title: eventData.nombre,
      start: eventData.fechaInicio,
      end: this.fixEndDateForCalendar(eventData.fechaFin),
      backgroundColor: this.getEventColor(eventData),
      borderColor: this.getEventColor(eventData),
      extendedProps: {
        ubicacion: eventData.ubicacion,
        productora: eventData.productora,
        contacto: eventData.contacto,
        descripcion: eventData.descripcion,
        personal: eventData.personal || [],
        status: Helpers.getEventStatus(eventData),
      },
    };

    this.calendar.addEvent(calendarEvent);
  }

  // Remove event programmatically
  removeEvent(eventId) {
    if (!this.calendar || !this.isInitialized) return;

    const event = this.calendar.getEventById(eventId);
    if (event) {
      event.remove();
    }
  }

  // Update event programmatically
  updateEvent(eventId, updates) {
    if (!this.calendar || !this.isInitialized) return;

    const event = this.calendar.getEventById(eventId);
    if (event) {
      event.setProp('title', updates.nombre || event.title);
      event.setStart(updates.fechaInicio || event.start);
      event.setEnd(this.fixEndDateForCalendar(updates.fechaFin) || event.end);
      event.setProp('backgroundColor', this.getEventColor(updates));
      event.setProp('borderColor', this.getEventColor(updates));

      // Update extended properties
      const extendedProps = {
        ubicacion: updates.ubicacion || event.extendedProps.ubicacion,
        productora: updates.productora || event.extendedProps.productora,
        contacto: updates.contacto || event.extendedProps.contacto,
        descripcion: updates.descripcion || event.extendedProps.descripcion,
        personal: updates.personal || event.extendedProps.personal,
        status: Helpers.getEventStatus(updates),
      };

      event.setExtendedProp('ubicacion', extendedProps.ubicacion);
      event.setExtendedProp('productora', extendedProps.productora);
      event.setExtendedProp('contacto', extendedProps.contacto);
      event.setExtendedProp('descripcion', extendedProps.descripcion);
      event.setExtendedProp('personal', extendedProps.personal);
      event.setExtendedProp('status', extendedProps.status);
    }
  }

  // Destroy calendar
  destroy() {
    if (this.calendar && this.isInitialized) {
      this.calendar.destroy();
      this.calendar = null;
      this.isInitialized = false;
    }
  }

  // Refresh calendar
  refresh() {
    if (this.calendar && this.isInitialized) {
      this.calendar.refetchEvents();
    }
  }

  // Get calendar instance
  getCalendar() {
    return this.calendar;
  }

  // Check if calendar is initialized
  isCalendarInitialized() {
    return this.isInitialized;
  }
}

// Create singleton instance
export const calendarManager = new CalendarManager();
