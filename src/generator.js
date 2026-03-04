/**
 * generator.js — AI meme generation pipeline.
 *
 * Converts a File to base64 and calls the /api/generate-meme endpoint.
 * AbortController enforces a 45-second timeout on the network request.
 * All error messages are user-friendly; internal details are not exposed.
 *
 * Exported for use as a browser ES module (<script type="module">).
 */

const TIMEOUT_MS = 45_000;

/**
 * Maps a known API error code to a human-readable message.
 *
 * @param {string} code - Error code returned by the API.
 * @returns {string} A user-friendly error message.
 */
function messageForCode(code) {
  switch (code) {
    case 'QUOTA_EXCEEDED':
      return 'Usage limit reached — please try again later.';
    case 'CONTENT_POLICY':
      return 'The image could not be used due to content policy. Please upload an appropriate photo.';
    case 'TIMEOUT_ERROR':
      return 'The request timed out — the server is slow right now. Please try again.';
    case 'SERVICE_UNAVAILABLE':
      return 'The service is temporarily unavailable. Please try again later.';
    default:
      return 'Meme generation failed. Please try again.';
  }
}

/**
 * Converts a File object to a base64-encoded data URL using FileReader.
 *
 * @param {File} file - The image file to convert.
 * @returns {Promise<string>} Resolves with the base64 data URL (starts with "data:").
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a meme from the supplied image file by calling the server-side
 * AI pipeline.
 *
 * The request is automatically aborted after 45 seconds.
 *
 * @param {File} file - The photo to turn into a meme.
 * @returns {Promise<{ memeUrl: string, provider: string, visionPrompt: string }>}
 * @throws {Error} On network failure, API error, or timeout.
 */
export async function generateMeme(file) {
  // Create the AbortController synchronously so the timeout is registered
  // immediately. This ensures jest.advanceTimersByTime() in tests can fire
  // the abort even before the async fileToBase64 step completes.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const base64Data = await fileToBase64(file);

    // The timeout may have fired while fileToBase64 was running. If the signal
    // is already aborted, throw immediately rather than passing a dead signal
    // to fetch (jsdom does not fire 'abort' on already-aborted signals).
    if (controller.signal.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    const response = await fetch('/api/generate-meme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(messageForCode(data.error));
    }

    return {
      memeUrl: data.meme_url,
      provider: data.provider,
      visionPrompt: data.vision_prompt,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The request timed out — please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
