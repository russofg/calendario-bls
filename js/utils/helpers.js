// General utility functions
import { EVENT_STATUS, EVENT_STATUS_TEXT } from '../config/constants.js';

export class Helpers {
  // Date formatting
  static formatDate(dateString) {
    if (!dateString) return '';
    // Si el formato es YYYY-MM-DD, parsea como local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    // Si no, usa el parseo normal
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  static formatDateTime(dateString) {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  static formatTime(dateString) {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  static getTodayISO() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fix timezone issues with dates
  static fixDateTimezone(dateString) {
    if (!dateString) return dateString;

    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // If it's a full date string, convert to local date
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Event status
  static getEventStatus(event) {
    const now = new Date();
    const startDate = new Date(event.fechaInicio + 'T00:00:00');
    const endDate = new Date(event.fechaFin + 'T23:59:59');

    if (now < startDate) return EVENT_STATUS.UPCOMING;
    if (now >= startDate && now <= endDate) return EVENT_STATUS.ONGOING;
    return EVENT_STATUS.COMPLETED;
  }

  static getEventStatusText(event) {
    const status = this.getEventStatus(event);
    return EVENT_STATUS_TEXT[status];
  }

  // Validation
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  static isValidDateRange(startDate, endDate) {
    return new Date(endDate) >= new Date(startDate);
  }

  static isRequired(value) {
    return value && value.trim().length > 0;
  }

  static validateEventData(eventData) {
    const errors = [];

    if (!this.isRequired(eventData.nombre)) {
      errors.push('El nombre del evento es requerido');
    }

    if (!this.isRequired(eventData.ubicacion)) {
      errors.push('La ubicación es requerida');
    }

    if (!this.isValidDate(eventData.fechaInicio)) {
      errors.push('La fecha de inicio no es válida');
    }

    if (!this.isValidDate(eventData.fechaFin)) {
      errors.push('La fecha de fin no es válida');
    }

    if (
      this.isValidDate(eventData.fechaInicio) &&
      this.isValidDate(eventData.fechaFin)
    ) {
      if (!this.isValidDateRange(eventData.fechaInicio, eventData.fechaFin)) {
        errors.push(
          'La fecha de fin no puede ser anterior a la fecha de inicio'
        );
      }
    }

    if (!this.isRequired(eventData.productora)) {
      errors.push('La productora es requerida');
    }

    return errors;
  }

  // File handling
  static readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  static validateImageFile(file, maxSize = 5 * 1024 * 1024) {
    // 5MB default
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!validTypes.includes(file.type)) {
      return 'El archivo debe ser una imagen (JPEG, PNG, GIF, WebP)';
    }

    if (file.size > maxSize) {
      return `El archivo no puede ser mayor a ${maxSize / (1024 * 1024)}MB`;
    }

    return null;
  }

  // String manipulation
  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  }

  static slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Array utilities
  static sortByDate(array, dateField, ascending = true) {
    return [...array].sort((a, b) => {
      const dateA = new Date(a[dateField]);
      const dateB = new Date(b[dateField]);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  static unique(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const value = key ? item[key] : item;
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  // Debounce and throttle
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Local storage
  static setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static getLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  static removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  // Error handling
  static handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    return {
      message: error.message || 'Ha ocurrido un error inesperado',
      code: error.code || 'UNKNOWN_ERROR',
      context,
    };
  }

  // Random utilities
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}
