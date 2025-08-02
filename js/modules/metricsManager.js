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
  eventsInitialized: false,

  /**
   * Inicializa el gestor de métricas
   */
  init() {
    if (!this.eventsInitialized) {
      this.bindEvents();
      this.eventsInitialized = true;
    }
    this.setupDateRangeButtons();
  },

  /**
   * Vincula eventos de la interfaz
   */
  bindEvents() {
    // Botones de rango de fechas (desktop)
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

    // Botones de rango de fechas (móvil)
    document.querySelectorAll('.mobile-range-btn').forEach(button => {
      button.addEventListener('click', () => {
        const range = button.dataset.range;
        this.setDateRange(range);
      });
    });

    // Botones de exportación (desktop)
    document
      .getElementById('exportPdfReport')
      ?.addEventListener('click', () => this.exportPdfReport());
    document
      .getElementById('exportExcelReport')
      ?.addEventListener('click', () => this.exportExcelReport());
    document
      .getElementById('exportTechnicianCalendar')
      ?.addEventListener('click', () => this.exportTechnicianCalendar());

    // Botones de exportación (móvil)
    document.querySelectorAll('.mobile-export-btn').forEach(button => {
      button.addEventListener('click', () => {
        const exportType = button.dataset.export;
        switch (exportType) {
          case 'pdf':
            this.exportPdfReport();
            break;
          case 'excel':
            this.exportExcelReport();
            break;
          case 'calendar':
            this.exportTechnicianCalendar();
            break;
        }
      });
    });
  },

  /**
   * Configura los botones de rango de fechas
   */
  setupDateRangeButtons() {
    // Resetear todos los botones a estado inactivo
    const allButtons = [
      'metricsRange7d',
      'metricsRange30d',
      'metricsRange90d',
      'metricsRange1y',
    ];

    allButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        // Resetear clases para desktop
        button.className = button.className
          .replace(
            /bg-blue-50|border-blue-200|text-blue-600|text-blue-700/g,
            ''
          )
          .replace(
            /bg-gray-50|border-gray-200|text-gray-600|text-gray-700/g,
            ''
          );

        // Aplicar clases inactivas
        button.classList.add('bg-gray-50', 'border-gray-200');
        const icon = button.querySelector('i');
        const span = button.querySelector('span');
        if (icon)
          icon.className = icon.className.replace(
            /text-blue-600/g,
            'text-gray-600'
          );
        if (span)
          span.className = span.className.replace(
            /text-blue-700/g,
            'text-gray-700'
          );
      }
    });

    // Activar el botón seleccionado
    const activeButton = document.getElementById(
      `metricsRange${this.currentRange}`
    );
    if (activeButton) {
      // Aplicar clases activas
      activeButton.className = activeButton.className.replace(
        /bg-gray-50|border-gray-200/g,
        ''
      );
      activeButton.classList.add('bg-blue-50', 'border-blue-200');

      const icon = activeButton.querySelector('i');
      const span = activeButton.querySelector('span');
      if (icon)
        icon.className = icon.className.replace(
          /text-gray-600/g,
          'text-blue-600'
        );
      if (span)
        span.className = span.className.replace(
          /text-gray-700/g,
          'text-blue-700'
        );
    }

    // También actualizar los botones móviles si existen
    this.updateMobileButtons();
  },

  /**
   * Actualiza los botones móviles para reflejar el estado activo
   */
  updateMobileButtons() {
    const mobileButtons = document.querySelectorAll('.mobile-range-btn');
    if (!mobileButtons.length) return;

    mobileButtons.forEach(button => {
      const range = button.dataset.range;
      const isActive = range === this.currentRange;

      if (isActive) {
        button.className = button.className.replace(
          /bg-gray-50|border-gray-200|text-gray-600|text-gray-700/g,
          ''
        );
        button.classList.add('bg-blue-50', 'border-blue-200');

        const icon = button.querySelector('i');
        const span = button.querySelector('span');
        if (icon)
          icon.className = icon.className.replace(
            /text-gray-600/g,
            'text-blue-600'
          );
        if (span)
          span.className = span.className.replace(
            /text-gray-700/g,
            'text-blue-700'
          );
      } else {
        button.className = button.className.replace(
          /bg-blue-50|border-blue-200|text-blue-600|text-blue-700/g,
          ''
        );
        button.classList.add('bg-gray-50', 'border-gray-200');

        const icon = button.querySelector('i');
        const span = button.querySelector('span');
        if (icon)
          icon.className = icon.className.replace(
            /text-blue-600/g,
            'text-gray-600'
          );
        if (span)
          span.className = span.className.replace(
            /text-gray-700/g,
            'text-gray-700'
          );
      }
    });
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
        return `${topTech.nombre} (${maxCount} eventos)`;
      }

      // Si no encontramos el técnico por ID, intentar buscar por nombre
      const techByName = technicians.find(t => t.nombre === topTechId);
      if (techByName) {
        return `${techByName.nombre} (${maxCount} eventos)`;
      }

      // Fallback: mostrar el ID/nombre con el conteo
      return `${topTechId} (${maxCount} eventos)`;
    }

    // Si hay múltiples técnicos empatados, mostrar todos
    const topTechNames = topTechIds.map(techId => {
      const tech = technicians.find(t => t.id === techId);
      if (tech) {
        return tech.nombre;
      }

      const techByName = technicians.find(t => t.nombre === techId);
      if (techByName) {
        return techByName.nombre;
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
    const currentCount = events.length;

    // Obtener eventos del período anterior para comparación real
    const previousEvents = this.getEventsInPreviousRange();
    const previousCount = previousEvents.length;

    console.log(
      `📊 Growth calculation: Current: ${currentCount}, Previous: ${previousCount}`
    );

    // Si no hay período anterior, mostrar como crecimiento desde 0
    if (previousCount === 0) {
      return currentCount > 0 ? '+100%' : '0%';
    }

    // Calcular porcentaje de crecimiento
    const growth = ((currentCount - previousCount) / previousCount) * 100;

    if (growth === 0) {
      return '0%';
    }

    return growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  },

  /**
   * Obtiene eventos del período anterior para comparar crecimiento
   * @returns {Array} Array de eventos del período anterior
   */
  getEventsInPreviousRange() {
    const events = appState.get(APP_STATE_KEYS.EVENTS);
    if (!events || events.length === 0) {
      return [];
    }

    const now = new Date();
    let currentStartDate, previousStartDate, previousEndDate;

    // Calcular fechas del período anterior basado en el rango actual
    switch (this.currentRange) {
      case '7d':
        currentStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousEndDate = currentStartDate;
        break;
      case '30d':
        currentStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        previousEndDate = currentStartDate;
        break;
      case '90d':
        currentStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        previousEndDate = currentStartDate;
        break;
      case '1y':
        currentStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        previousEndDate = currentStartDate;
        break;
      default:
        currentStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousEndDate = currentStartDate;
    }

    console.log(
      `📅 Previous period: ${previousStartDate.toISOString()} to ${previousEndDate.toISOString()}`
    );

    // Filtrar eventos del período anterior
    const filteredEvents = events.filter(event => {
      const eventDateString = event.fechaInicio || event.date;
      if (!eventDateString) {
        return false;
      }

      const eventDate = new Date(eventDateString);
      return eventDate >= previousStartDate && eventDate < previousEndDate;
    });

    console.log(`📊 Previous period events: ${filteredEvents.length}`);
    return filteredEvents;
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
        const name = tech ? tech.nombre : techId;
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

  // ============ FUNCIONES DE EXPORTACIÓN ============

  /**
   * Verifica que las bibliotecas de exportación estén disponibles
   */
  checkExportLibraries() {
    const libraries = {
      jsPDF: false,
      XLSX: false,
    };

    // Verificar jsPDF
    if (typeof window.jsPDF !== 'undefined') {
      libraries.jsPDF = true;
    } else if (typeof jsPDF !== 'undefined') {
      libraries.jsPDF = true;
    } else if (typeof window.jspdf !== 'undefined') {
      libraries.jsPDF = true;
    }

    // Verificar XLSX
    if (typeof window.XLSX !== 'undefined') {
      libraries.XLSX = true;
    } else if (typeof XLSX !== 'undefined') {
      libraries.XLSX = true;
    }

    console.log('📚 Estado de bibliotecas de exportación:', libraries);
    return libraries;
  },

  /**
   * Exporta un reporte completo en PDF
   */
  async exportPdfReport() {
    try {
      console.log('📄 Iniciando exportación PDF...');

      // Verificar bibliotecas disponibles
      const libraries = this.checkExportLibraries();
      if (!libraries.jsPDF) {
        alert(
          'Error: Biblioteca PDF no disponible. Por favor, recarga la página.'
        );
        return;
      }

      // Verificar múltiples formas de acceso a jsPDF
      let jsPDFClass = null;
      if (typeof window.jsPDF !== 'undefined') {
        jsPDFClass = window.jsPDF;
      } else if (typeof window.jspdf !== 'undefined') {
        jsPDFClass = window.jspdf.jsPDF;
      }

      if (!jsPDFClass) {
        console.error('❌ jsPDF no está disponible después de la verificación');
        alert('Error: No se pudo acceder a la biblioteca PDF.');
        return;
      }

      const events = await this.getEventsInRange();
      const technicians = appState.get(APP_STATE_KEYS.TECHNICIANS) || [];

      // Crear nueva instancia de jsPDF
      const doc = new jsPDFClass();

      // Configurar fuente
      doc.setFont('helvetica', 'normal');

      // Título principal
      doc.setFontSize(20);
      doc.text('Reporte de Métricas de Eventos', 20, 30);

      // Información del período
      doc.setFontSize(12);
      const rangeText = this.getRangeText(this.currentRange);
      doc.text(`Período: ${rangeText}`, 20, 45);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`,
        20,
        55
      );

      // Línea separadora
      doc.line(20, 65, 190, 65);

      // Métricas resumidas
      let yPos = 80;
      doc.setFontSize(16);
      doc.text('Resumen Ejecutivo', 20, yPos);
      yPos += 15;

      doc.setFontSize(12);
      doc.text(`• Total de eventos: ${events.length}`, 25, yPos);
      yPos += 10;

      const avgDuration = this.calculateAverageDuration(events);
      doc.text(`• Duración promedio: ${avgDuration}`, 25, yPos);
      yPos += 10;

      const topTechnician = this.getTopTechnician(events, technicians);
      doc.text(`• Técnico más activo: ${topTechnician}`, 25, yPos);
      yPos += 10;

      const growth = this.calculateGrowth(events);
      doc.text(`• Crecimiento vs período anterior: ${growth}`, 25, yPos);
      yPos += 20;

      // Detalles de eventos
      if (events.length > 0) {
        doc.setFontSize(16);
        doc.text('Detalle de Eventos', 20, yPos);
        yPos += 15;

        doc.setFontSize(10);

        events.forEach((event, index) => {
          if (yPos > 270) {
            // Nueva página si es necesario
            doc.addPage();
            yPos = 30;
          }

          const eventDate = event.fechaInicio
            ? new Date(event.fechaInicio).toLocaleDateString('es-ES')
            : 'Sin fecha';
          const techName = this.getEventTechniciansNames(event, technicians);

          doc.text(`${index + 1}. ${event.nombre || 'Sin nombre'}`, 25, yPos);
          yPos += 6;
          doc.text(`   Fecha: ${eventDate} | Técnico: ${techName}`, 30, yPos);
          yPos += 6;
          if (event.cliente) {
            doc.text(`   Cliente: ${event.cliente}`, 30, yPos);
            yPos += 6;
          }
          yPos += 3;
        });
      }

      // Guardar el PDF
      const fileName = `reporte-metricas-${this.currentRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('✅ PDF exportado exitosamente');
    } catch (error) {
      console.error('❌ Error exportando PDF:', error);
      alert('Error al exportar el reporte PDF');
    }
  },

  /**
   * Exporta datos en formato Excel
   */
  async exportExcelReport() {
    try {
      console.log('📊 Iniciando exportación Excel...');

      // Verificar bibliotecas disponibles
      const libraries = this.checkExportLibraries();
      if (!libraries.XLSX) {
        alert(
          'Error: Biblioteca Excel no disponible. Por favor, recarga la página.'
        );
        return;
      }

      // Verificar múltiples formas de acceso a XLSX
      let XLSXLib = null;
      if (typeof window.XLSX !== 'undefined') {
        XLSXLib = window.XLSX;
      }

      if (!XLSXLib) {
        console.error('❌ XLSX no está disponible después de la verificación');
        alert('Error: No se pudo acceder a la biblioteca Excel.');
        return;
      }

      const events = await this.getEventsInRange();
      const technicians = appState.get(APP_STATE_KEYS.TECHNICIANS) || [];

      // Preparar datos para Excel
      const excelData = events.map((event, index) => {
        const techName = this.getEventTechniciansNames(event, technicians);
        const startDate = event.fechaInicio
          ? new Date(event.fechaInicio).toLocaleDateString('es-ES')
          : '';
        const endDate = event.fechaFin
          ? new Date(event.fechaFin).toLocaleDateString('es-ES')
          : '';

        return {
          'N°': index + 1,
          'Nombre del Evento': event.nombre || '',
          Cliente: event.cliente || '',
          'Fecha Inicio': startDate,
          'Fecha Fin': endDate,
          'Técnico Asignado': techName,
          Estado: event.estado || 'Activo',
          Notas: event.notas || '',
        };
      });

      // Agregar hoja de resumen
      const summaryData = [
        ['RESUMEN DE MÉTRICAS', ''],
        ['Período', this.getRangeText(this.currentRange)],
        ['Total de Eventos', events.length],
        ['Duración Promedio', this.calculateAverageDuration(events)],
        ['Técnico Más Activo', this.getTopTechnician(events, technicians)],
        ['Crecimiento', this.calculateGrowth(events)],
        ['Fecha de Generación', new Date().toLocaleDateString('es-ES')],
        ['', ''],
      ];

      // Crear libro de trabajo
      const workbook = XLSXLib.utils.book_new();

      // Hoja de resumen
      const summaryWorksheet = XLSXLib.utils.aoa_to_sheet(summaryData);
      XLSXLib.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen');

      // Hoja de eventos
      const eventsWorksheet = XLSXLib.utils.json_to_sheet(excelData);
      XLSXLib.utils.book_append_sheet(workbook, eventsWorksheet, 'Eventos');

      // Hoja de técnicos (si hay datos)
      if (technicians.length > 0) {
        const techData = technicians.map(tech => ({
          ID: tech.id,
          Nombre: tech.nombre,
          Email: tech.email || '',
          Teléfono: tech.phone || '',
          Especialidad: tech.specialty || '',
        }));

        const techWorksheet = XLSXLib.utils.json_to_sheet(techData);
        XLSXLib.utils.book_append_sheet(workbook, techWorksheet, 'Técnicos');
      }

      // Guardar archivo
      const fileName = `datos-eventos-${this.currentRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSXLib.writeFile(workbook, fileName);

      console.log('✅ Excel exportado exitosamente');
    } catch (error) {
      console.error('❌ Error exportando Excel:', error);
      alert('Error al exportar los datos en Excel');
    }
  },

  /**
   * Exporta calendario de técnicos en PDF
   */
  async exportTechnicianCalendar() {
    try {
      console.log('👥 Iniciando exportación calendario de técnicos...');

      // Verificar bibliotecas disponibles
      const libraries = this.checkExportLibraries();
      if (!libraries.jsPDF) {
        alert(
          'Error: Biblioteca PDF no disponible. Por favor, recarga la página.'
        );
        return;
      }

      // Verificar múltiples formas de acceso a jsPDF
      let jsPDFClass = null;
      if (typeof window.jsPDF !== 'undefined') {
        jsPDFClass = window.jsPDF;
      } else if (typeof window.jspdf !== 'undefined') {
        jsPDFClass = window.jspdf.jsPDF;
      }

      if (!jsPDFClass) {
        console.error('❌ jsPDF no está disponible después de la verificación');
        alert('Error: No se pudo acceder a la biblioteca PDF.');
        return;
      }

      const events = await this.getEventsInRange();
      const technicians = appState.get(APP_STATE_KEYS.TECHNICIANS) || [];

      if (technicians.length === 0) {
        alert('No hay técnicos registrados para generar el calendario');
        return;
      }

      // Crear nueva instancia de jsPDF
      const doc = new jsPDFClass();

      // Título principal
      doc.setFontSize(18);
      doc.text('Calendario de Técnicos', 20, 30);

      // Información del período
      doc.setFontSize(12);
      const rangeText = this.getRangeText(this.currentRange);
      doc.text(`Período: ${rangeText}`, 20, 45);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 20, 55);

      // Línea separadora
      doc.line(20, 65, 190, 65);

      let yPos = 80;

      // Para cada técnico, mostrar sus eventos
      technicians.forEach(technician => {
        // Validar que el técnico tenga datos válidos
        if (
          !technician ||
          !technician.nombre ||
          technician.nombre === 'undefined'
        ) {
          return; // Saltar técnicos inválidos
        }

        // Filtrar eventos de este técnico usando lógica mejorada
        const techEvents = events.filter(event => {
          // Verificar campo 'technician' (un solo técnico)
          if (event.technician && event.technician !== 'Sin asignar') {
            if (
              event.technician === technician.id ||
              event.technician === technician.nombre
            ) {
              return true;
            }
          }

          // Verificar campo 'personal' (array de técnicos)
          if (event.personal && Array.isArray(event.personal)) {
            return event.personal.some(
              techId => techId === technician.id || techId === technician.nombre
            );
          }

          return false;
        });

        // Eliminar duplicados basándose en el ID del evento
        const uniqueTechEvents = techEvents.filter(
          (event, index, self) =>
            index ===
            self.findIndex(
              e =>
                e.id === event.id ||
                (e.nombre === event.nombre &&
                  e.fechaInicio === event.fechaInicio)
            )
        );

        if (yPos > 250) {
          // Nueva página si es necesario
          doc.addPage();
          yPos = 30;
        }

        // Nombre del técnico
        doc.setFontSize(14);
        doc.text(
          `${technician.nombre} (${uniqueTechEvents.length} eventos)`,
          20,
          yPos
        );
        yPos += 15;

        if (uniqueTechEvents.length === 0) {
          doc.setFontSize(10);
          doc.text('   Sin eventos asignados en este período', 25, yPos);
          yPos += 15;
        } else {
          doc.setFontSize(10);

          uniqueTechEvents.forEach((event, eventIndex) => {
            if (yPos > 270) {
              // Nueva página si es necesario
              doc.addPage();
              yPos = 30;
            }

            const eventDate = event.fechaInicio
              ? new Date(event.fechaInicio).toLocaleDateString('es-ES')
              : 'Sin fecha';
            const endDate = event.fechaFin
              ? new Date(event.fechaFin).toLocaleDateString('es-ES')
              : '';

            doc.text(
              `   ${eventIndex + 1}. ${event.nombre || 'Sin nombre'}`,
              25,
              yPos
            );
            yPos += 6;

            if (endDate && endDate !== eventDate) {
              doc.text(`      ${eventDate} → ${endDate}`, 30, yPos);
            } else {
              doc.text(`      ${eventDate}`, 30, yPos);
            }
            yPos += 6;

            if (event.cliente) {
              doc.text(`      Cliente: ${event.cliente}`, 30, yPos);
              yPos += 6;
            }
            yPos += 3;
          });
        }

        yPos += 10;
      });

      // Guardar el PDF
      const fileName = `calendario-tecnicos-${this.currentRange}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('✅ Calendario de técnicos exportado exitosamente');
    } catch (error) {
      console.error('❌ Error exportando calendario de técnicos:', error);
      alert('Error al exportar el calendario de técnicos');
    }
  },

  // ============ FUNCIONES AUXILIARES PARA EXPORTACIÓN ============

  /**
   * Obtiene el texto del rango de fechas
   * @param {string} range - Rango de fechas
   * @returns {string} Texto descriptivo del rango
   */
  getRangeText(range) {
    switch (range) {
      case '7d':
        return 'Últimos 7 días';
      case '30d':
        return 'Últimos 30 días';
      case '90d':
        return 'Últimos 3 meses';
      case '1y':
        return 'Último año';
      default:
        return 'Período personalizado';
    }
  },

  /**
   * Obtiene el nombre de un técnico por ID, considerando múltiples campos
   * @param {Object} event - Evento del cual obtener técnicos
   * @param {Array} technicians - Array de técnicos
   * @returns {string} Nombre(s) del técnico(s) asignado(s)
   */
  getEventTechniciansNames(event, technicians) {
    const assignedTechnicians = [];

    // Verificar campo 'technician' (un solo técnico)
    if (event.technician && event.technician !== 'Sin asignar') {
      const tech = technicians.find(
        t => t.id === event.technician || t.nombre === event.technician
      );
      if (tech) {
        assignedTechnicians.push(tech.nombre);
      } else {
        assignedTechnicians.push(event.technician);
      }
    }

    // Verificar campo 'personal' (array de técnicos)
    if (event.personal && Array.isArray(event.personal)) {
      event.personal.forEach(techId => {
        if (techId && techId !== 'Sin asignar') {
          const tech = technicians.find(
            t => t.id === techId || t.nombre === techId
          );
          if (tech) {
            if (!assignedTechnicians.includes(tech.nombre)) {
              assignedTechnicians.push(tech.nombre);
            }
          } else {
            if (!assignedTechnicians.includes(techId)) {
              assignedTechnicians.push(techId);
            }
          }
        }
      });
    }

    return assignedTechnicians.length > 0
      ? assignedTechnicians.join(', ')
      : 'Sin asignar';
  },

  /**
   * Obtiene el nombre de un técnico por ID (método simplificado para compatibilidad)
   * @param {string} technicianId - ID del técnico
   * @param {Array} technicians - Array de técnicos
   * @returns {string} Nombre del técnico
   */
  getTechnicianName(technicianId, technicians) {
    if (!technicianId || technicianId === 'Sin asignar') {
      return 'Sin asignar';
    }

    const tech = technicians.find(t => t.id === technicianId);
    if (tech) {
      return tech.nombre;
    }

    const techByName = technicians.find(t => t.nombre === technicianId);
    if (techByName) {
      return techByName.nombre;
    }

    return technicianId; // Fallback al ID/nombre original
  },

  /**
   * Método de debug para verificar datos
   */

  /**
   * Muestra la sección de métricas
   */
  show() {
    // Verificar bibliotecas de exportación
    console.log('📊 Mostrando sección de métricas...');
    this.checkExportLibraries();

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

    // Los eventos ya están inicializados en init()
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
