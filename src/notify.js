/**
 * notify.js — Simple DOM-based notification helper.
 *
 * Provides two public functions:
 *   - showNotification(message, type) — creates and displays a notification
 *   - clearNotifications()            — removes all active notifications
 *
 * No animation library dependency. Styling is handled entirely via CSS classes.
 */

const MAX_NOTIFICATIONS = 3;
const AUTO_REMOVE_DELAY_MS = 5000;

/**
 * Returns all current notification elements in the DOM.
 *
 * @returns {HTMLElement[]} Array of active notification elements.
 */
function getActiveNotifications() {
  return Array.from(document.querySelectorAll('.notification'));
}

/**
 * Removes a single notification element from the DOM.
 *
 * @param {HTMLElement} el - The notification element to remove.
 * @returns {void}
 */
function removeNotification(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

/**
 * Enforces the maximum number of simultaneous notifications by removing
 * the oldest ones when the limit is exceeded.
 *
 * @returns {void}
 */
function enforceMaxNotifications() {
  const active = getActiveNotifications();
  const excess = active.length - MAX_NOTIFICATIONS;
  if (excess > 0) {
    active.slice(0, excess).forEach(removeNotification);
  }
}

/**
 * Creates and appends a notification element to the document body.
 *
 * The notification auto-removes after AUTO_REMOVE_DELAY_MS milliseconds.
 * If the number of visible notifications exceeds MAX_NOTIFICATIONS, the
 * oldest notification(s) are removed to make room.
 *
 * @param {string} message        - The text content to display.
 * @param {'info'|'success'|'error'} [type='info'] - Visual style of the notification.
 * @returns {HTMLElement} The created notification element.
 */
export function showNotification(message, type = 'info') {
  const el = document.createElement('div');
  el.classList.add('notification', `notification--${type}`);
  el.textContent = message;

  document.body.appendChild(el);

  enforceMaxNotifications();

  const timer = setTimeout(() => removeNotification(el), AUTO_REMOVE_DELAY_MS);

  // Store timer reference on element so clearNotifications can cancel it
  el._notifyTimer = timer;

  return el;
}

/**
 * Removes all active notification elements from the DOM immediately,
 * cancelling their auto-remove timers.
 *
 * @returns {void}
 */
export function clearNotifications() {
  getActiveNotifications().forEach((el) => {
    clearTimeout(el._notifyTimer);
    removeNotification(el);
  });
}
