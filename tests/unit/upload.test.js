import { validateFile, setupUploadArea } from '../../src/upload.js';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// ---------------------------------------------------------------------------
// validateFile
// ---------------------------------------------------------------------------

describe('validateFile', () => {
  test('returns { valid: true } for a valid JPEG under 10MB', () => {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateFile(file)).toEqual({ valid: true });
  });

  test('returns { valid: true } for a valid PNG under 10MB', () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    expect(validateFile(file)).toEqual({ valid: true });
  });

  test('returns { valid: false, error } for a file over 10MB', () => {
    const file = new File(['data'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });

  test('returns { valid: false, error } for a non-image file', () => {
    const file = new File(['hello'], 'readme.txt', { type: 'text/plain' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });

  test('returns { valid: false, error } for null', () => {
    const result = validateFile(null);
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// setupUploadArea
// ---------------------------------------------------------------------------

describe('setupUploadArea', () => {
  let uploadArea;
  let fileInput;
  let callbacks;

  beforeEach(() => {
    uploadArea = document.createElement('div');
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    callbacks = {
      onFile: jest.fn(),
      onError: jest.fn(),
    };
  });

  test('attaches dragover listener that adds drag-over class and prevents default', () => {
    setupUploadArea(uploadArea, fileInput, callbacks);

    const event = new Event('dragover', { bubbles: true });
    event.preventDefault = jest.fn();
    uploadArea.dispatchEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(uploadArea.classList.contains('drag-over')).toBe(true);
  });

  test('attaches dragleave listener that removes drag-over class', () => {
    setupUploadArea(uploadArea, fileInput, callbacks);

    uploadArea.classList.add('drag-over');
    uploadArea.dispatchEvent(new Event('dragleave'));

    expect(uploadArea.classList.contains('drag-over')).toBe(false);
  });

  test('drop event removes drag-over class', () => {
    setupUploadArea(uploadArea, fileInput, callbacks);

    uploadArea.classList.add('drag-over');

    const validFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const dropEvent = createDropEvent([validFile]);
    uploadArea.dispatchEvent(dropEvent);

    expect(uploadArea.classList.contains('drag-over')).toBe(false);
  });

  test('drop event calls callbacks.onFile with valid dropped file', () => {
    setupUploadArea(uploadArea, fileInput, callbacks);

    const validFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const dropEvent = createDropEvent([validFile]);
    uploadArea.dispatchEvent(dropEvent);

    expect(callbacks.onFile).toHaveBeenCalledWith(validFile);
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  test('drop event calls callbacks.onError when dropped file is invalid', () => {
    setupUploadArea(uploadArea, fileInput, callbacks);

    const badFile = new File(['data'], 'doc.txt', { type: 'text/plain' });
    const dropEvent = createDropEvent([badFile]);
    uploadArea.dispatchEvent(dropEvent);

    expect(callbacks.onError).toHaveBeenCalled();
    expect(typeof callbacks.onError.mock.calls[0][0]).toBe('string');
    expect(callbacks.onFile).not.toHaveBeenCalled();
  });

  test('click on upload area triggers file input click', () => {
    setupUploadArea(uploadArea, fileInput, callbacks);

    const inputClick = jest.fn();
    fileInput.click = inputClick;

    uploadArea.dispatchEvent(new Event('click'));

    expect(inputClick).toHaveBeenCalled();
  });

  test('file input change event calls callbacks.onFile with selected file', () => {
    setupUploadArea(uploadArea, fileInput, callbacks);

    const selectedFile = new File(['data'], 'selfie.jpg', { type: 'image/jpeg' });

    // Simulate the files property on the input
    Object.defineProperty(fileInput, 'files', {
      value: [selectedFile],
      configurable: true,
    });

    fileInput.dispatchEvent(new Event('change'));

    expect(callbacks.onFile).toHaveBeenCalledWith(selectedFile);
    expect(callbacks.onError).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a synthetic drop event carrying the given files.
 * @param {File[]} files
 * @returns {Event}
 */
function createDropEvent(files) {
  const event = new Event('drop', { bubbles: true });
  event.preventDefault = jest.fn();
  Object.defineProperty(event, 'dataTransfer', {
    value: { files },
  });
  return event;
}
