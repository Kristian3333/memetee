/**
 * upload.js
 *
 * Browser ES module for file upload validation and drag-drop setup.
 * Intended to be loaded with <script type="module">.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validates that a file is a non-null image under the 10 MB size limit.
 *
 * @param {File|null} file - The file to validate.
 * @returns {{ valid: boolean, error?: string }} Validation result.
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Only image files are supported.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds the 10 MB size limit.' };
  }

  return { valid: true };
}

/**
 * Wires drag-drop and click-to-upload behaviour onto an upload area element.
 *
 * Behaviour:
 * - dragover  — adds the `drag-over` CSS class and prevents the default browser action.
 * - dragleave — removes the `drag-over` CSS class.
 * - drop      — removes the `drag-over` CSS class, validates the first dropped file,
 *               and calls `callbacks.onFile` or `callbacks.onError` accordingly.
 * - click     — programmatically clicks the hidden file input.
 * - change    — (on fileInputEl) validates the selected file and fires the appropriate callback.
 *
 * @param {HTMLElement} uploadAreaEl - The visible drag-drop target.
 * @param {HTMLInputElement} fileInputEl - The hidden file input element.
 * @param {{ onFile: (file: File) => void, onError: (message: string) => void }} callbacks
 */
export function setupUploadArea(uploadAreaEl, fileInputEl, callbacks) {
  uploadAreaEl.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadAreaEl.classList.add('drag-over');
  });

  uploadAreaEl.addEventListener('dragleave', () => {
    uploadAreaEl.classList.remove('drag-over');
  });

  uploadAreaEl.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadAreaEl.classList.remove('drag-over');

    const file = event.dataTransfer.files[0];
    const result = validateFile(file);

    if (result.valid) {
      callbacks.onFile(file);
    } else {
      callbacks.onError(result.error);
    }
  });

  uploadAreaEl.addEventListener('click', () => {
    fileInputEl.click();
  });

  fileInputEl.addEventListener('change', () => {
    const file = fileInputEl.files[0];
    const result = validateFile(file);

    if (result.valid) {
      callbacks.onFile(file);
    } else {
      callbacks.onError(result.error);
    }
  });
}
