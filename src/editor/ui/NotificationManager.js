/**
 * Shows toast notifications.
 */
export class NotificationManager {
  /**
   * Show a notification toast.
   * @param {string} message
   * @param {'success' | 'error' | 'info'} type
   */
  static show(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    const duration = type === 'info' ? 2000 : 3000;
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
}
