import { showNotification, clearNotifications } from '../../src/notify.js';

describe('notify module', () => {
  beforeEach(() => {
    // Clean up any notifications left from previous tests
    clearNotifications();
    jest.useFakeTimers();
  });

  afterEach(() => {
    clearNotifications();
    jest.useRealTimers();
  });

  describe('showNotification()', () => {
    it('creates an error notification element in the DOM', () => {
      showNotification('Something went wrong', 'error');

      const el = document.querySelector('.notification');
      expect(el).not.toBeNull();
    });

    it('creates a success notification element in the DOM', () => {
      showNotification('Operation succeeded', 'success');

      const el = document.querySelector('.notification');
      expect(el).not.toBeNull();
    });

    it('applies the correct CSS class for error type', () => {
      showNotification('Error happened', 'error');

      const el = document.querySelector('.notification');
      expect(el.classList.contains('notification--error')).toBe(true);
    });

    it('applies the correct CSS class for success type', () => {
      showNotification('All good', 'success');

      const el = document.querySelector('.notification');
      expect(el.classList.contains('notification--success')).toBe(true);
    });

    it('applies the correct CSS class for info type', () => {
      showNotification('Heads up', 'info');

      const el = document.querySelector('.notification');
      expect(el.classList.contains('notification--info')).toBe(true);
    });

    it('defaults to info type when type is omitted', () => {
      showNotification('Default type');

      const el = document.querySelector('.notification');
      expect(el.classList.contains('notification--info')).toBe(true);
    });

    it('contains the message text', () => {
      showNotification('Hello world', 'info');

      const el = document.querySelector('.notification');
      expect(el.textContent).toContain('Hello world');
    });

    it('returns the notification element', () => {
      const el = showNotification('Return check', 'success');

      expect(el).toBeInstanceOf(HTMLElement);
      expect(el.classList.contains('notification')).toBe(true);
    });

    it('appends the notification to the document body', () => {
      const el = showNotification('Body append test', 'info');

      expect(document.body.contains(el)).toBe(true);
    });

    it('auto-removes the notification after 5000ms', () => {
      showNotification('Timed message', 'info');

      expect(document.querySelector('.notification')).not.toBeNull();

      jest.advanceTimersByTime(5000);

      expect(document.querySelector('.notification')).toBeNull();
    });

    it('does not auto-remove before the timeout elapses', () => {
      showNotification('Timed message', 'info');

      jest.advanceTimersByTime(4999);

      expect(document.querySelector('.notification')).not.toBeNull();
    });

    it('allows multiple notifications to exist simultaneously', () => {
      showNotification('First', 'info');
      showNotification('Second', 'success');
      showNotification('Third', 'error');

      const all = document.querySelectorAll('.notification');
      expect(all.length).toBe(3);
    });

    it('removes the oldest notification when max 3 is exceeded', () => {
      const first = showNotification('First', 'info');
      showNotification('Second', 'success');
      showNotification('Third', 'error');

      // Adding a fourth should remove the first
      showNotification('Fourth', 'info');

      const all = document.querySelectorAll('.notification');
      expect(all.length).toBe(3);
      expect(document.body.contains(first)).toBe(false);
    });

    it('keeps exactly 3 notifications after adding a fifth', () => {
      showNotification('One', 'info');
      showNotification('Two', 'info');
      showNotification('Three', 'info');
      showNotification('Four', 'info');
      showNotification('Five', 'info');

      const all = document.querySelectorAll('.notification');
      expect(all.length).toBe(3);
    });
  });

  describe('clearNotifications()', () => {
    it('removes all active notifications from the DOM', () => {
      showNotification('First', 'info');
      showNotification('Second', 'error');
      showNotification('Third', 'success');

      clearNotifications();

      const remaining = document.querySelectorAll('.notification');
      expect(remaining.length).toBe(0);
    });

    it('does not throw when there are no notifications to clear', () => {
      expect(() => clearNotifications()).not.toThrow();
    });

    it('leaves the rest of the DOM untouched', () => {
      const div = document.createElement('div');
      div.id = 'unrelated';
      document.body.appendChild(div);

      showNotification('To be cleared', 'info');
      clearNotifications();

      expect(document.getElementById('unrelated')).not.toBeNull();

      // Cleanup
      document.body.removeChild(div);
    });
  });
});
