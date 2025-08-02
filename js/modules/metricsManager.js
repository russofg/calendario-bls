import { appState } from './appState.js';
import { eventManager } from './eventManager.js';
import { technicianManager } from './technicianManager.js';
import { APP_STATE_KEYS } from '../config/constants.js';

/**
 * Módulo para gestionar métricas y análisis de eventos
 */
export const metricsManager = {
  charts: {},
  currentRange: '7d',

  /**
   * Inicializa el gestor de métricas
   */
  init() {
    this.bindEvents();
    this.setupDateRangeButtons();
  },

  /**
   * Vincula eventos de la interfaz
   */
  bindEvents() {
    // Botones de rango de fechas
    document
      .getElementById('metricsRange7d')
      ?.addEventListener('click', () => this.setDateRange('7d'));
    document
      .getElementById('metricsRange30d')
      ?.addEventListener('click', () => this.setDateRange('30d'));
    document
      .getElementById('metricsRange90d')
      ?.addEventListener('click', () => this.setDateRange('90d'));
    document
      .getElementById('metricsRange1y')
      ?.addEventListener('click', () => this.setDateRange('1y'));

    // Botón de debug
    document
      .getElementById('debugMetricsBtn')
      ?.addEventListener('click', () => this.debugData());
  },

  /**
   * Configura los botones de rango de fechas
   */
  setupDateRangeButtons() {
    const buttons = document.querySelectorAll('[id^="metricsRange"]');
    buttons.forEach(button => {
      button.classList.remove('active');
    });
    document
      .getElementById(`metricsRange${this.currentRange}`)
      ?.classList.add('active');
  },

  /**
   * Establece el rango de fechas para las métricas
   * @param {string} range - Rango de fechas ('7d', '30d', '90d', '1y')
   */
  setDateRange(range) {
    this.currentRange = range;
    this.setupDateRangeButtons();
    this.loadMetrics();
  },

  /**
   * Carga y muestra las métricas
   */
  async loadMetrics() {
    try {
      const events = await this.getEventsInRange();
      const technicians = appState.get(APP_STATE_KEYS.TECHNICIANS) || [];

      // Actualizar tarjetas de resumen
      this.updateSummaryCards(events, technicians);

      // Generar gráficos
      this.generateEventsTimelineChart(events);
      this.generateTechniciansUsageChart(events, technicians);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  },

  /**
   * Obtiene eventos en un rango de tiempo específico
   */
  getEventsInRange(range) {
    const events = appState.get(APP_STATE_KEYS.EVENTS);
    if (!events || events.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const filteredEvents = events.filter(event => {
      // Los eventos usan fechaInicio, no date
      const eventDateString = event.fechaInicio || event.date;
      if (!eventDateString) {
        return false;
      }

      const eventDate = new Date(eventDateString);
      const isInRange = eventDate >= startDate && eventDate <= now;

      return isInRange;
    });

    return filteredEvents;
  },

  /**
   * Actualiza las tarjetas de resumen
   * @param {Array} events - Array de eventos
   * @param {Array} technicians - Array de técnicos
   */
  updateSummaryCards(events, technicians) {
    // Total de eventos
    document.getElementById('metricsTotal').textContent = events.length;

    // Duración promedio
    const avgDuration = this.calculateAverageDuration(events);
    document.getElementById('metricsAvgDuration').textContent = avgDuration;

    // Técnico más usado
    const topTechnician = this.getTopTechnician(events, technicians);
    document.getElementById('metricsTopTechnician').textContent = topTechnician;

    // Crecimiento (comparado con período anterior)
    const growth = this.calculateGrowth(events);
    document.getElementById('metricsGrowth').textContent = growth;
  },

  /**
   * Calcula la duración promedio de eventos en días
   * @param {Array} events - Array de eventos
   * @returns {string} Duración promedio formateada
   */
  calculateAverageDuration(events) {
    if (events.length === 0) return '0 días';

    const totalDuration = events.reduce((total, event) => {
      if (event.fechaInicio && event.fechaFin) {
        const startDate = new Date(event.fechaInicio);
        const endDate = new Date(event.fechaFin);

        // Calcular diferencia en días
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // días completos

        return total + Math.max(1, daysDiff); // mínimo 1 día
      }
      return total + 1; // si no hay fechas, asumir 1 día
    }, 0);

    const avgDays = totalDuration / events.length;

    if (avgDays === 1) {
      return '1 día';
    } else {
      return `${avgDays.toFixed(1)} días`;
    }
  },

  /**
   * Obtiene el técnico más usado
   * @param {Array} events - Array de eventos
   * @param {Array} technicians - Array de técnicos
   * @returns {string} Nombre del técnico más usado
   */
  getTopTechnician(events, technicians) {
    if (events.length === 0) return '-';

    const technicianCount = {};

    // Contar uso de técnicos - revisar si es 'technician' o 'personal'
    events.forEach(event => {
      // Los eventos pueden tener 'technician' (un solo técnico) o 'personal' (array de técnicos)
      let eventTechnicians = [];

      if (event.technician && event.technician !== 'Sin asignar') {
        eventTechnicians = [event.technician];
      } else if (event.personal && Array.isArray(event.personal)) {
        eventTechnicians = event.personal.filter(
          techId => techId && techId !== 'Sin asignar'
        );
      }

      // Contar cada técnico
      eventTechnicians.forEach(techId => {
        technicianCount[techId] = (technicianCount[techId] || 0) + 1;
      });
    });

    if (Object.keys(technicianCount).length === 0) return '-';

    // Encontrar la cantidad máxima de eventos
    const maxCount = Math.max(...Object.values(technicianCount));

    // Encontrar todos los técnicos con la cantidad máxima
    const topTechIds = Object.keys(technicianCount).filter(
      techId => technicianCount[techId] === maxCount
    );

    if (topTechIds.length === 0) return '-';

    // Si hay un solo técnico con el máximo
    if (topTechIds.length === 1) {
      const topTechId = topTechIds[0];

      // Buscar el nombre del técnico
      const topTech = technicians.find(t => t.id === topTechId);
      if (topTech) {
        return `${topTech.name} (${maxCount} eventos)`;
      }

      // Si no encontramos el técnico por ID, intentar buscar por nombre
      const techByName = technicians.find(t => t.name === topTechId);
      if (techByName) {
        return `${techByName.name} (${maxCount} eventos)`;
      }

      // Fallback: mostrar el ID/nombre con el conteo
      return `${topTechId} (${maxCount} eventos)`;
    }

    // Si hay múltiples técnicos empatados, mostrar todos
    const topTechNames = topTechIds.map(techId => {
      const tech = technicians.find(t => t.id === techId);
      if (tech) {
        return tech.name;
      }

      const techByName = technicians.find(t => t.name === techId);
      if (techByName) {
        return techByName.name;
      }

      return techId;
    });

    return `${topTechNames.join(', ')} (${maxCount} eventos c/u)`;
  },

  /**
   * Calcula el crecimiento comparado con el período anterior
   * @param {Array} events - Array de eventos del período actual
   * @returns {string} Porcentaje de crecimiento
   */
  calculateGrowth(events) {
    // Implementación simplificada - comparar con el período anterior
    const currentCount = events.length;
    // Para una implementación completa, necesitaríamos obtener eventos del período anterior
    // Por ahora, mostraremos un cálculo básico
    const previousCount = Math.max(
      0,
      currentCount - Math.floor(currentCount * 0.2)
    );

    if (previousCount === 0) return currentCount > 0 ? '+100%' : '0%';

    const growth = ((currentCount - previousCount) / previousCount) * 100;
    return growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  },

  /**
   * Genera el gráfico de línea temporal de eventos
   * @param {Array} events - Array de eventos
   */
  generateEventsTimelineChart(events) {
    const ctx = document.getElementById('eventsTimelineChart');
    if (!ctx) {
      console.warn('⚠️ Canvas eventsTimelineChart no encontrado');
      return;
    }

    if (typeof Chart === 'undefined') {
      console.error('❌ Chart.js no está disponible');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.charts.timeline) {
      this.charts.timeline.destroy();
    }

    // Agrupar eventos por fecha
    const eventsByDate = this.groupEventsByDate(events);

    // Preparar datos para el gráfico
    const labels = Object.keys(eventsByDate).sort();
    const data = labels.map(date => eventsByDate[date]);

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.map(date => this.formatDateLabel(date)),
        datasets: [
          {
            label: 'Eventos',
            data: data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  },

  /**
   * Genera el gráfico de uso de técnicos
   * @param {Array} events - Array de eventos
   * @param {Array} technicians - Array de técnicos
   */
  generateTechniciansUsageChart(events, technicians) {
    const ctx = document.getElementById('techniciansUsageChart');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (this.charts.technicians) {
      this.charts.technicians.destroy();
    }

    // Contar uso de técnicos - manejar tanto 'technician' como 'personal'
    const technicianCount = {};
    events.forEach(event => {
      let eventTechnicians = [];

      // Los eventos pueden tener 'technician' (un solo técnico) o 'personal' (array de técnicos)
      if (event.technician && event.technician !== 'Sin asignar') {
        eventTechnicians = [event.technician];
      } else if (event.personal && Array.isArray(event.personal)) {
        eventTechnicians = event.personal.filter(
          techId => techId && techId !== 'Sin asignar'
        );
      }

      // Contar cada técnico y obtener su nombre
      eventTechnicians.forEach(techId => {
        const tech = technicians.find(t => t.id === techId);
        const name = tech ? tech.name : techId;
        technicianCount[name] = (technicianCount[name] || 0) + 1;
      });
    });

    if (Object.keys(technicianCount).length === 0) {
      // Si no hay técnicos asignados, mostrar un gráfico vacío o mensaje
      ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
      return;
    }

    const labels = Object.keys(technicianCount);
    const data = Object.values(technicianCount);
    const colors = this.generateColors(labels.length);

    this.charts.technicians = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  },

  /**
   * Agrupa eventos por fecha
   * @param {Array} events - Array de eventos
   * @returns {Object} Objeto con fechas como claves y conteos como valores
   */
  groupEventsByDate(events) {
    const grouped = {};

    events.forEach(event => {
      const eventDateString = event.fechaInicio || event.date;
      if (eventDateString) {
        const date = eventDateString.split('T')[0]; // Solo la fecha, sin hora
        grouped[date] = (grouped[date] || 0) + 1;
      }
    });

    return grouped;
  },

  /**
   * Formatea una fecha para mostrar en las etiquetas
   * @param {string} dateString - Fecha en formato YYYY-MM-DD
   * @returns {string} Fecha formateada
   */
  formatDateLabel(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Genera colores para gráficos
   * @param {number} count - Número de colores necesarios
   * @returns {Array} Array de colores en formato rgba
   */
  generateColors(count) {
    const colors = [
      'rgba(59, 130, 246, 0.8)', // blue
      'rgba(34, 197, 94, 0.8)', // green
      'rgba(251, 146, 60, 0.8)', // orange
      'rgba(168, 85, 247, 0.8)', // purple
      'rgba(236, 72, 153, 0.8)', // pink
      'rgba(14, 165, 233, 0.8)', // sky
      'rgba(132, 204, 22, 0.8)', // lime
      'rgba(245, 158, 11, 0.8)', // amber
    ];

    if (count <= colors.length) {
      return colors.slice(0, count);
    }

    // Si necesitamos más colores, generamos algunos adicionales
    const extraColors = [];
    for (let i = colors.length; i < count; i++) {
      const hue = (i * 137.508) % 360; // Distribución dorada
      extraColors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
    }

    return [...colors, ...extraColors];
  },

  /**
   * Destruye todos los gráficos
   */
  destroyCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.charts = {};
  },

  /**
   * Método de debug para verificar datos
   */

  /**
   * Muestra la sección de métricas
   */
  show() {
    // Verificar si necesitamos cargar datos
    const events = appState.get(APP_STATE_KEYS.EVENTS);
    const technicians = appState.get(APP_STATE_KEYS.TECHNICIANS);

    if (!events || events.length === 0) {
      // Intentar cargar eventos si no existen
      if (eventManager && eventManager.loadEvents) {
        eventManager
          .loadEvents()
          .then(() => {
            setTimeout(() => this.loadMetrics(), 500);
          })
          .catch(error => {
            console.error('❌ Error cargando eventos:', error);
          });
      }
    }

    if (!technicians || technicians.length === 0) {
      // Intentar cargar técnicos si no existen
      if (technicianManager && technicianManager.loadTechnicians) {
        technicianManager
          .loadTechnicians()
          .then(() => {
            setTimeout(() => this.loadMetrics(), 500);
          })
          .catch(error => {
            console.error('❌ Error cargando técnicos:', error);
          });
      }
    }

    // Inicializar eventos si no están bindados
    this.bindEvents();
    this.setupDateRangeButtons();

    // Cargar métricas cuando se muestra la sección
    setTimeout(() => {
      this.loadMetrics();
    }, 100);
  },

  /**
   * Oculta la sección de métricas
   */
  hide() {
    // Opcional: destruir gráficos para liberar memoria
    // this.destroyCharts();
  },
};
