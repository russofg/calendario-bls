// Reminder Service for WhatsApp Notifications
import { WhatsAppNotificationManager } from './whatsappNotificationManager.js';

export class ReminderService {
  constructor(db) {
    this.db = db;
    this.whatsappManager = new WhatsAppNotificationManager(db);
    this.checkInterval = null;
    this.isRunning = false;
  }

  /**
   * Start the reminder service
   * @param {number} intervalMinutes - Check interval in minutes (default: 30)
   */
  start(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log('⚠️ Reminder service is already running');
      return;
    }

    console.log(
      `🚀 Starting reminder service (checking every ${intervalMinutes} minutes)`
    );

    this.isRunning = true;

    // Check immediately
    this.checkReminders();

    // Set up periodic checking
    this.checkInterval = setInterval(
      () => {
        this.checkReminders();
      },
      intervalMinutes * 60 * 1000
    );
  }

  /**
   * Stop the reminder service
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Reminder service is not running');
      return;
    }

    console.log('🛑 Stopping reminder service');

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check and send due reminders
   */
  async checkReminders() {
    try {
      console.log('⏰ Checking for due reminders...');
      await this.whatsappManager.checkAndSendReminders();
    } catch (error) {
      console.error('❌ Error checking reminders:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval ? 'Active' : 'Inactive',
      lastCheck: new Date().toISOString(),
    };
  }

  /**
   * Manually trigger reminder check
   */
  async triggerCheck() {
    console.log('🔔 Manually triggering reminder check');
    await this.checkReminders();
  }
}

// Create singleton instance
export const reminderService = new ReminderService(null);
