// Phone validation utilities for WhatsApp notifications
import { WHATSAPP_CONFIG } from '../config/constants.js';

export class PhoneValidator {
  /**
   * Validates and formats phone number for WhatsApp API
   * @param {string} phone - Phone number to validate
   * @returns {object} - { isValid: boolean, formatted: string, error: string }
   */
  static validatePhone(phone) {
    if (!phone) {
      return {
        isValid: false,
        formatted: '',
        error: 'El número de teléfono es requerido',
      };
    }

    // Remove all non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');

    // Check if it's a valid Argentine phone number
    if (cleanPhone.length === 10) {
      // Add country code for Argentina (54)
      cleanPhone = '54' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      // Remove leading 0 and add country code
      cleanPhone = '54' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('54')) {
      // Already has country code
      cleanPhone = cleanPhone;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('549')) {
      // Already has country code with 9
      cleanPhone = cleanPhone;
    } else {
      return {
        isValid: false,
        formatted: '',
        error:
          'Formato de teléfono inválido. Debe ser un número argentino válido',
      };
    }

    // Validate final format
    if (cleanPhone.length === 12 && cleanPhone.startsWith('54')) {
      return {
        isValid: true,
        formatted: cleanPhone,
        error: '',
      };
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('549')) {
      return {
        isValid: true,
        formatted: cleanPhone,
        error: '',
      };
    } else {
      return {
        isValid: false,
        formatted: '',
        error:
          'Formato de teléfono inválido. Debe ser un número argentino válido',
      };
    }
  }

  /**
   * Formats phone number for display
   * @param {string} phone - Phone number to format
   * @returns {string} - Formatted phone number
   */
  static formatForDisplay(phone) {
    if (!phone) return '';

    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length === 10) {
      // Format: (011) 1234-5678
      return `(${cleanPhone.substring(0, 2)}) ${cleanPhone.substring(2, 6)}-${cleanPhone.substring(6)}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      // Format: (011) 1234-5678
      const withoutZero = cleanPhone.substring(1);
      return `(${withoutZero.substring(0, 2)}) ${withoutZero.substring(2, 6)}-${withoutZero.substring(6)}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('54')) {
      // Format: +54 11 1234-5678
      const withoutCountry = cleanPhone.substring(2);
      return `+54 ${withoutCountry.substring(0, 2)} ${withoutCountry.substring(2, 6)}-${withoutCountry.substring(6)}`;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('549')) {
      // Format: +54 9 11 1234-5678
      const withoutCountry = cleanPhone.substring(3);
      return `+54 9 ${withoutCountry.substring(0, 2)} ${withoutCountry.substring(2, 6)}-${withoutCountry.substring(6)}`;
    }

    return phone;
  }

  /**
   * Gets all valid phone numbers from users
   * @param {Array} users - Array of user objects
   * @returns {Array} - Array of valid phone numbers
   */
  static getValidPhoneNumbers(users) {
    const validPhones = [];

    users.forEach(user => {
      if (user.phone) {
        const validation = this.validatePhone(user.phone);
        if (validation.isValid) {
          validPhones.push({
            uid: user.uid,
            phone: validation.formatted,
            name: user.name || user.displayName || 'Usuario',
          });
        }
      }
    });

    return validPhones;
  }

  /**
   * Validates phone number for WhatsApp API specifically
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if valid for WhatsApp API
   */
  static isValidForWhatsApp(phone) {
    const validation = this.validatePhone(phone);
    return validation.isValid;
  }
}
