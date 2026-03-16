/**
 * app.js — Entry point for the MemeTee landing page.
 *
 * Wires together the upload, generator, display, contact, and notify modules.
 * Loaded as a browser ES module via <script type="module">.
 */

import { setupUploadArea } from './upload.js';
import { generateMeme } from './generator.js';
import { showMeme, showTshirt, showResults, hideResults, resetResults } from './display.js';
import { validateContactForm, submitContact } from './contact.js';
import { showNotification } from './notify.js';

/**
 * Looks up a required DOM element by ID. Throws if not found.
 *
 * @param {string} id - Element ID.
 * @returns {HTMLElement}
 */
function requireElement(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Required element #${id} not found.`);
  return el;
}

/**
 * Updates a loading step indicator.
 *
 * @param {HTMLElement} stepEl - The step element.
 * @param {'active'|'completed'|'pending'} status
 */
function setStepStatus(stepEl, status) {
  stepEl.classList.remove('active', 'completed');
  if (status !== 'pending') stepEl.classList.add(status);
}

/**
 * Returns the currently selected meme style from the style chips.
 *
 * @returns {string} The data-style value of the active chip, or 'funny' as default.
 */
function getSelectedStyle() {
  const active = document.querySelector('.style-chip.active');
  return active ? active.dataset.style : 'funny';
}

/**
 * Wires click handlers on style chips so only one is active at a time.
 *
 * @param {HTMLElement} container - The element containing the style chips.
 */
function setupStyleSelector(container) {
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.style-chip');
    if (!chip) return;
    container.querySelectorAll('.style-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
  });
}

/**
 * Handles the full meme generation flow after a file is selected.
 *
 * @param {File} file - The uploaded image file.
 * @param {object} els - DOM element references.
 */
async function handleGeneration(file, els) {
  // Show original preview
  const previewUrl = URL.createObjectURL(file);
  els.originalPreview.src = previewUrl;

  // Reset and show loading
  resetResults(els.memeContainer, els.tshirtContainer);
  hideResults(els.previewSection);
  els.loading.style.display = 'block';
  els.loadingText.textContent = 'AI is creating your meme...';
  setStepStatus(els.step1, 'active');
  setStepStatus(els.step2, 'pending');
  setStepStatus(els.step3, 'pending');

  try {
    setStepStatus(els.step1, 'completed');
    setStepStatus(els.step2, 'active');

    const style = getSelectedStyle();
    const result = await generateMeme(file, style);

    setStepStatus(els.step2, 'completed');
    setStepStatus(els.step3, 'active');

    showMeme(result.memeUrl, els.memeContainer);
    showTshirt(result.memeUrl, els.tshirtContainer);

    setStepStatus(els.step3, 'completed');
    showResults(els.previewSection);
    showNotification('Meme generated successfully!', 'success');
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    els.loading.style.display = 'none';
    URL.revokeObjectURL(previewUrl);
  }
}

/**
 * Handles contact form submission.
 *
 * @param {Event} event - The submit event.
 * @param {HTMLFormElement} form - The contact form.
 */
async function handleContactSubmit(event, form) {
  event.preventDefault();

  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const message = form.elements.message.value.trim();

  const validation = validateContactForm({ name, email, message });
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    return;
  }

  try {
    const result = await submitContact({ name, email, message });
    showNotification(result.message, 'success');
    form.reset();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

/**
 * Initialises the application: finds DOM elements, wires up event
 * listeners, and fires a non-blocking health check.
 *
 * @throws {Error} If required DOM elements are missing.
 */
export function init() {
  const els = {
    uploadArea: requireElement('upload-area'),
    fileInput: requireElement('file-input'),
    loading: requireElement('loading'),
    loadingText: requireElement('loading-text'),
    step1: requireElement('step-1'),
    step2: requireElement('step-2'),
    step3: requireElement('step-3'),
    previewSection: requireElement('preview-section'),
    originalPreview: requireElement('original-preview'),
    memeContainer: document.querySelector('.meme-container'),
    tshirtContainer: document.querySelector('.tshirt-container'),
  };

  setupUploadArea(els.uploadArea, els.fileInput, {
    onFile: (file) => handleGeneration(file, els),
    onError: (msg) => showNotification(msg, 'error'),
  });

  const styleOptions = document.getElementById('style-options');
  if (styleOptions) setupStyleSelector(styleOptions);

  const contactForm = requireElement('contact-form');
  contactForm.addEventListener('submit', (e) => handleContactSubmit(e, contactForm));

  // Non-blocking health check
  fetch('/api/health').catch(() => {});
}

