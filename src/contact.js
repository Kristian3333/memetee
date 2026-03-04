/**
 * Contact module — email validation, form validation, and API submission.
 * Designed as a browser ES module (no Node-only APIs).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address using a basic RFC-friendly regex.
 *
 * @param {string} email - The email address to test.
 * @returns {boolean} True when the email looks valid, false otherwise.
 */
export function isValidEmail(email) {
  if (typeof email !== 'string' || email.length === 0) return false;
  return EMAIL_RE.test(email);
}

/**
 * Validate all fields of the contact form.
 *
 * Rules:
 *   - name: required, 2–100 characters
 *   - email: required, must pass isValidEmail
 *   - message: required, 10–1000 characters
 *
 * @param {{ name: string, email: string, message: string }} fields
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
export function validateContactForm({ name, email, message }) {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters.' };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Name must be 100 characters or fewer.' };
  }
  if (!isValidEmail(email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!message || message.trim().length < 10) {
    return { valid: false, error: 'Message must be at least 10 characters.' };
  }
  if (message.trim().length > 1000) {
    return { valid: false, error: 'Message must be 1000 characters or fewer.' };
  }
  return { valid: true };
}

/**
 * Submit the contact form data to the API endpoint.
 *
 * @param {{ name: string, email: string, message: string }} data
 * @returns {Promise<{ message: string }>} Resolves with the server response on success.
 * @throws {Error} On network failure, 429 rate limiting, or any non-OK response.
 */
export async function submitContact({ name, email, message }) {
  let response;

  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });
  } catch (networkError) {
    throw new Error('Network error — please check your connection and try again.');
  }

  if (response.status === 429) {
    throw new Error('Too many requests — please wait a moment before trying again.');
  }

  if (!response.ok) {
    throw new Error('Failed to send message — please try again later.');
  }

  return response.json();
}
