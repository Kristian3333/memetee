import { init } from '../../src/app.js';

// Mock the child modules so init() wiring is testable without real DOM/network
jest.mock('../../src/upload.js', () => ({
  setupUploadArea: jest.fn(),
}));

jest.mock('../../src/generator.js', () => ({
  generateMeme: jest.fn(),
}));

jest.mock('../../src/display.js', () => ({
  showMeme: jest.fn(),
  showTshirt: jest.fn(),
  showResults: jest.fn(),
  hideResults: jest.fn(),
  resetResults: jest.fn(),
}));

jest.mock('../../src/contact.js', () => ({
  validateContactForm: jest.fn(() => ({ valid: true })),
  submitContact: jest.fn(() => Promise.resolve({ message: 'OK' })),
}));

jest.mock('../../src/notify.js', () => ({
  showNotification: jest.fn(),
  clearNotifications: jest.fn(),
}));

// Build minimal DOM fixture using safe DOM methods (no innerHTML)
function buildDOM() {
  document.body.textContent = '';

  const ids = [
    { tag: 'div', id: 'upload-area' },
    { tag: 'input', id: 'file-input', type: 'file' },
    { tag: 'div', id: 'loading' },
    { tag: 'div', id: 'loading-text' },
    { tag: 'div', id: 'step-1' },
    { tag: 'div', id: 'step-2' },
    { tag: 'div', id: 'step-3' },
  ];

  ids.forEach(({ tag, id, type }) => {
    const el = document.createElement(tag);
    el.id = id;
    if (type) el.type = type;
    document.body.appendChild(el);
  });

  // preview section
  const preview = document.createElement('section');
  preview.id = 'preview-section';
  preview.style.display = 'none';

  const origImg = document.createElement('img');
  origImg.id = 'original-preview';
  preview.appendChild(origImg);

  const memeC = document.createElement('div');
  memeC.className = 'meme-container';
  preview.appendChild(memeC);

  const tshirtC = document.createElement('div');
  tshirtC.className = 'tshirt-container';
  preview.appendChild(tshirtC);

  document.body.appendChild(preview);

  // contact form
  const form = document.createElement('form');
  form.id = 'contact-form';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.name = 'name';
  nameInput.placeholder = 'Name';
  form.appendChild(nameInput);

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.placeholder = 'Email';
  form.appendChild(emailInput);

  const textarea = document.createElement('textarea');
  textarea.name = 'message';
  textarea.placeholder = 'Message';
  form.appendChild(textarea);

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Send';
  form.appendChild(btn);

  document.body.appendChild(form);
}

describe('app init', () => {
  beforeEach(() => {
    buildDOM();
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'OK' }) })
    );
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('init finds all required DOM elements without throwing', () => {
    expect(() => init()).not.toThrow();
  });

  test('init calls setupUploadArea with upload-area and file-input', () => {
    const { setupUploadArea } = require('../../src/upload.js');
    init();
    expect(setupUploadArea).toHaveBeenCalledTimes(1);
    const [areaEl, inputEl] = setupUploadArea.mock.calls[0];
    expect(areaEl.id).toBe('upload-area');
    expect(inputEl.id).toBe('file-input');
  });

  test('init sets up contact form submit handler', () => {
    init();
    const form = document.getElementById('contact-form');
    const submitEvent = new Event('submit', { cancelable: true });
    form.dispatchEvent(submitEvent);
    expect(submitEvent.defaultPrevented).toBe(true);
  });

  test('init calls health check endpoint', async () => {
    init();
    // health check is fire-and-forget, give it a tick
    await new Promise((r) => setTimeout(r, 0));
    expect(global.fetch).toHaveBeenCalledWith('/api/health');
  });

  test('init does not throw if health check fails', () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network')));
    expect(() => init()).not.toThrow();
  });

  test('init throws if upload-area element is missing', () => {
    document.body.textContent = '';
    expect(() => init()).toThrow();
  });
});

describe('handleGeneration (via onFile callback)', () => {
  beforeEach(() => {
    buildDOM();
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'OK' }) })
    );
    global.URL.createObjectURL = jest.fn(() => 'blob:fake-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('successful generation shows meme and tshirt', async () => {
    const { setupUploadArea } = require('../../src/upload.js');
    const { generateMeme } = require('../../src/generator.js');
    const { showMeme, showTshirt, showResults } = require('../../src/display.js');
    const { showNotification } = require('../../src/notify.js');

    generateMeme.mockResolvedValue({
      memeUrl: 'https://example.com/meme.png',
      provider: 'dall-e-3',
      visionPrompt: 'test prompt',
    });

    init();

    const onFile = setupUploadArea.mock.calls[0][2].onFile;
    const fakeFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await onFile(fakeFile);

    expect(generateMeme).toHaveBeenCalledWith(fakeFile);
    expect(showMeme).toHaveBeenCalled();
    expect(showTshirt).toHaveBeenCalled();
    expect(showResults).toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith('Meme generated successfully!', 'success');
  });

  test('failed generation shows error notification', async () => {
    const { setupUploadArea } = require('../../src/upload.js');
    const { generateMeme } = require('../../src/generator.js');
    const { showNotification } = require('../../src/notify.js');

    generateMeme.mockRejectedValue(new Error('AI is down'));

    init();

    const onFile = setupUploadArea.mock.calls[0][2].onFile;
    const fakeFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await onFile(fakeFile);

    expect(showNotification).toHaveBeenCalledWith('AI is down', 'error');
  });

  test('onError callback shows error notification', () => {
    const { setupUploadArea } = require('../../src/upload.js');
    const { showNotification } = require('../../src/notify.js');

    init();

    const onError = setupUploadArea.mock.calls[0][2].onError;
    onError('File too large');

    expect(showNotification).toHaveBeenCalledWith('File too large', 'error');
  });

  test('loading element is shown during generation and hidden after', async () => {
    const { setupUploadArea } = require('../../src/upload.js');
    const { generateMeme } = require('../../src/generator.js');
    generateMeme.mockResolvedValue({ memeUrl: 'url', provider: 'test', visionPrompt: '' });

    init();

    const onFile = setupUploadArea.mock.calls[0][2].onFile;
    const fakeFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    await onFile(fakeFile);

    const loading = document.getElementById('loading');
    expect(loading.style.display).toBe('none');
  });
});

describe('handleContactSubmit (via form submit)', () => {
  beforeEach(() => {
    buildDOM();
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'OK' }) })
    );
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('valid form submission calls submitContact and shows success', async () => {
    const { validateContactForm, submitContact } = require('../../src/contact.js');
    const { showNotification } = require('../../src/notify.js');

    validateContactForm.mockReturnValue({ valid: true });
    submitContact.mockResolvedValue({ message: 'Thanks!' });

    init();

    const form = document.getElementById('contact-form');
    form.elements.name.value = 'John';
    form.elements.email.value = 'john@test.com';
    form.elements.message.value = 'Hello world!';

    const event = new Event('submit', { cancelable: true });
    form.dispatchEvent(event);

    await new Promise((r) => setTimeout(r, 0));

    expect(submitContact).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@test.com',
      message: 'Hello world!',
    });
    expect(showNotification).toHaveBeenCalledWith('Thanks!', 'success');
  });

  test('invalid form shows validation error', async () => {
    const { validateContactForm } = require('../../src/contact.js');
    const { showNotification } = require('../../src/notify.js');

    validateContactForm.mockReturnValue({ valid: false, error: 'Name required' });

    init();

    const form = document.getElementById('contact-form');
    const event = new Event('submit', { cancelable: true });
    form.dispatchEvent(event);

    await new Promise((r) => setTimeout(r, 0));

    expect(showNotification).toHaveBeenCalledWith('Name required', 'error');
  });

  test('submitContact failure shows error notification', async () => {
    const { validateContactForm, submitContact } = require('../../src/contact.js');
    const { showNotification } = require('../../src/notify.js');

    validateContactForm.mockReturnValue({ valid: true });
    submitContact.mockRejectedValue(new Error('Rate limited'));

    init();

    const form = document.getElementById('contact-form');
    form.elements.name.value = 'John';
    form.elements.email.value = 'john@test.com';
    form.elements.message.value = 'Hello world!';

    const event = new Event('submit', { cancelable: true });
    form.dispatchEvent(event);

    await new Promise((r) => setTimeout(r, 0));

    expect(showNotification).toHaveBeenCalledWith('Rate limited', 'error');
  });
});
