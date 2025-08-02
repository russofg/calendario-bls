// WhatsApp Notification Manager
import { WHATSAPP_CONFIG, COLLECTIONS } from '../config/constants.js';
import { PhoneValidator } from '../utils/phoneValidator.js';
import { NotificationManager } from '../utils/notifications.js';

export class WhatsAppNotificationManager {
  constructor(db) {
    this.db = db;
    this.apiKey = WHATSAPP_CONFIG.API_KEY;
    this.baseUrl = WHATSAPP_CONFIG.API_BASE_URL;
  }

  /**
   * Sends WhatsApp message using CallMeBot API
   * @param {string} phone - Phone number (with country code)
   * @param {string} message - Message to send
   * @returns {Promise<boolean>} - Success status
   */
  async sendWhatsAppMessage(phone, message) {
    try {
      // Check if running in development (localhost) or disabled by config
      const isLocalDevelopment =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('localhost');

      if (isLocalDevelopment && WHATSAPP_CONFIG.DISABLE_IN_DEVELOPMENT) {
        console.log('🔧 WhatsApp notifications disabled in development mode');
        console.log(`📱 Would send to ${phone}: ${message}`);
        return true; // Return true to simulate success
      }

      // Validate phone number
      const validation = PhoneValidator.validatePhone(phone);
      if (!validation.isValid) {
        console.error(
          'Invalid phone number for WhatsApp:',
          phone,
          validation.error
        );
        return false;
      }

      // Llamar a la función serverless de Netlify
      const response = await fetch(
        `${window.location.origin}/.netlify/functions/send-whatsapp`,
        {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: validation.formatted,
            message,
          }),
        }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        console.log(
          '✅ WhatsApp message sent successfully to:',
          validation.formatted
        );
        return true;
      }
      console.error(
        '❌ Failed to send WhatsApp message:',
        result.error || result
      );
      return false;
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Sends notification to all users with valid phone numbers
   * @param {string} message - Message to send
   * @returns {Promise<object>} - Results summary
   */
  async sendNotificationToAllUsers(message) {
    try {
      // Get all users from Firestore
      const usersSnapshot = await this.db.collection(COLLECTIONS.USERS).get();
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }));

      // Get valid phone numbers
      const validPhones = PhoneValidator.getValidPhoneNumbers(users);

      if (validPhones.length === 0) {
        console.log('ℹ️ No users with valid phone numbers found');
        return { success: 0, failed: 0, total: 0 };
      }

      console.log(`📱 Sending notification to ${validPhones.length} users`);

      // Send messages to all valid phones
      const results = await Promise.allSettled(
        validPhones.map(user => this.sendWhatsAppMessage(user.phone, message))
      );

      // Count results
      const success = results.filter(
        result => result.status === 'fulfilled' && result.value
      ).length;
      const failed = results.length - success;

      console.log(
        `📊 WhatsApp notification results: ${success} sent, ${failed} failed`
      );

      return { success, failed, total: validPhones.length };
    } catch (error) {
      console.error('❌ Error sending notifications to all users:', error);
      return { success: 0, failed: 0, total: 0 };
    }
  }

  /**
   * Formats event data for notification messages
   * @param {object} event - Event object
   * @returns {object} - Formatted event data
   */
  formatEventData(event) {
    // Parse fechaInicio as local date to avoid UTC bug
    // event.fechaInicio expected as 'YYYY-MM-DDTHH:mm' or similar
    let dateString = event.fechaInicio;
    let timeString;
    if (dateString && dateString.includes('T')) {
      [dateString, timeString] = dateString.split('T');
      timeString = timeString ? timeString.slice(0, 5) : undefined;
    } else {
      timeString = undefined;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    let eventDate;
    if (timeString) {
      const [hour, minute] = timeString.split(':').map(Number);
      eventDate = new Date(year, month - 1, day, hour, minute);
    } else {
      eventDate = new Date(year, month - 1, day);
    }
    const formattedDate = eventDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: WHATSAPP_CONFIG.TIMEZONE,
    });
    const formattedTime = eventDate.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: WHATSAPP_CONFIG.TIMEZONE,
    });
    return {
      eventName: event.nombre || 'Evento',
      location: event.ubicacion || 'No especificado',
      productora: event.productora || 'No especificada',
      contacto: event.contacto || 'No especificado',
      date: formattedDate,
      time: formattedTime,
    };
  }

  /**
   * Replaces placeholders in message template
   * @param {string} template - Message template
   * @param {object} data - Data to replace placeholders
   * @returns {string} - Formatted message
   */
  formatMessage(template, data) {
    let message = template;

    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    return message;
  }

  /**
   * Sends event creation notification
   * @param {object} event - Event object
   * @returns {Promise<object>} - Results summary
   */
  async sendEventCreatedNotification(event) {
    const eventData = this.formatEventData(event);
    const message = this.formatMessage(
      WHATSAPP_CONFIG.MESSAGE_TEMPLATES.EVENT_CREATED,
      eventData
    );

    console.log('🎉 Sending event created notification');
    return await this.sendNotificationToAllUsers(message);
  }

  /**
   * Sends event update notification
   * @param {object} event - Event object
   * @returns {Promise<object>} - Results summary
   */
  async sendEventUpdatedNotification(event) {
    const eventData = this.formatEventData(event);
    const message = this.formatMessage(
      WHATSAPP_CONFIG.MESSAGE_TEMPLATES.EVENT_UPDATED,
      eventData
    );

    console.log('✏️ Sending event updated notification');
    return await this.sendNotificationToAllUsers(message);
  }

  /**
   * Sends event deletion notification
   * @param {object} event - Event object
   * @returns {Promise<object>} - Results summary
   */
  async sendEventDeletedNotification(event) {
    const eventData = this.formatEventData(event);
    const message = this.formatMessage(
      WHATSAPP_CONFIG.MESSAGE_TEMPLATES.EVENT_DELETED,
      eventData
    );

    console.log('🗑️ Sending event deleted notification');
    return await this.sendNotificationToAllUsers(message);
  }

  /**
   * Sends event reminder notification
   * @param {object} event - Event object
   * @param {number} hoursBefore - Hours before event (48 or 24)
   * @returns {Promise<object>} - Results summary
   */
  async sendEventReminderNotification(event, hoursBefore) {
    const eventData = this.formatEventData(event);
    const template =
      hoursBefore === 48
        ? WHATSAPP_CONFIG.MESSAGE_TEMPLATES.EVENT_REMINDER_48H
        : WHATSAPP_CONFIG.MESSAGE_TEMPLATES.EVENT_REMINDER_24H;

    const message = this.formatMessage(template, eventData);

    console.log(
      `⏰ Sending ${hoursBefore}h reminder notification for event:`,
      event.nombre
    );
    return await this.sendNotificationToAllUsers(message);
  }

  /**
   * Schedules reminder notifications for an event
   * @param {object} event - Event object
   * @returns {Promise<void>}
   */
  async scheduleEventReminders(event) {
    try {
      const eventDate = new Date(event.fechaInicio);
      const now = new Date();

      // Calculate reminder times
      const reminder48h = new Date(eventDate.getTime() - 48 * 60 * 60 * 1000);
      const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);

      // Save reminder schedule to Firestore
      const reminderData = {
        eventId: event.id,
        eventName: event.nombre,
        eventDate: eventDate,
        reminder48h: reminder48h,
        reminder24h: reminder24h,
        sent48h: false,
        sent24h: false,
        createdAt: now,
      };

      await this.db
        .collection(COLLECTIONS.NOTIFICATIONS)
        .doc(event.id)
        .set(reminderData);
      console.log('📅 Event reminders scheduled for:', event.nombre);
    } catch (error) {
      console.error('❌ Error scheduling event reminders:', error);
    }
  }

  /**
   * Checks and sends due reminders
   * @returns {Promise<void>}
   */
  async checkAndSendReminders() {
    try {
      const now = new Date();
      const notificationsRef = this.db.collection(COLLECTIONS.NOTIFICATIONS);

      // Get all pending notifications
      const snapshot = await notificationsRef
        .where('sent48h', '==', false)
        .where('sent24h', '==', false)
        .get();

      for (const doc of snapshot.docs) {
        const notification = doc.data();

        // Check 48h reminder
        if (!notification.sent48h && notification.reminder48h.toDate() <= now) {
          await this.sendEventReminderNotification(
            {
              id: notification.eventId,
              nombre: notification.eventName,
              fechaInicio: notification.eventDate,
            },
            48
          );
          await doc.ref.update({ sent48h: true });
        }

        // Check 24h reminder
        if (!notification.sent24h && notification.reminder24h.toDate() <= now) {
          await this.sendEventReminderNotification(
            {
              id: notification.eventId,
              nombre: notification.eventName,
              fechaInicio: notification.eventDate + 1,
            },
            24
          );
          await doc.ref.update({ sent24h: true });
        }
      }
    } catch (error) {
      console.error('❌ Error checking reminders:', error);
    }
  }
}

// Create singleton instance
export const whatsappNotificationManager = new WhatsAppNotificationManager(
  null
);
