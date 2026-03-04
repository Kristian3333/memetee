/**
 * Unit tests for src/generator.js
 *
 * Tests are frozen — do not modify assertions to make tests pass.
 * Fix the implementation instead.
 */

import { fileToBase64, generateMeme } from '../../src/generator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a minimal fake File object. */
function makeFakeFile(name = 'photo.jpg', type = 'image/jpeg', size = 1024) {
  return new File(['x'.repeat(size)], name, { type });
}

/** Installs a mock FileReader into the global scope. */
function mockFileReader(result) {
  global.FileReader = jest.fn().mockImplementation(() => ({
    readAsDataURL: jest.fn(function () {
      // Simulate async completion
      Promise.resolve().then(() => {
        this.result = result;
        this.onload({ target: { result } });
      });
    }),
    result: null,
    onload: null,
    onerror: null,
  }));
}

// ---------------------------------------------------------------------------
// fileToBase64
// ---------------------------------------------------------------------------

describe('fileToBase64', () => {
  const FAKE_DATA_URL = 'data:image/jpeg;base64,/9j/abc123==';

  beforeEach(() => {
    mockFileReader(FAKE_DATA_URL);
  });

  afterEach(() => {
    delete global.FileReader;
  });

  it('returns a Promise that resolves to a string', async () => {
    const file = makeFakeFile();
    const result = await fileToBase64(file);
    expect(typeof result).toBe('string');
  });

  it('returns a string starting with "data:"', async () => {
    const file = makeFakeFile();
    const result = await fileToBase64(file);
    expect(result.startsWith('data:')).toBe(true);
  });

  it('returns the full base64 data URL produced by FileReader', async () => {
    const file = makeFakeFile();
    const result = await fileToBase64(file);
    expect(result).toBe(FAKE_DATA_URL);
  });
});

// ---------------------------------------------------------------------------
// generateMeme — fetch mocking helpers
// ---------------------------------------------------------------------------

const FAKE_BASE64 = 'data:image/jpeg;base64,/9j/abc123==';

/** Mocks FileReader to return FAKE_BASE64 for every call. */
function installBase64Mock() {
  global.FileReader = jest.fn().mockImplementation(() => ({
    readAsDataURL: jest.fn(function () {
      Promise.resolve().then(() => {
        this.result = FAKE_BASE64;
        this.onload({ target: { result: FAKE_BASE64 } });
      });
    }),
    result: null,
    onload: null,
    onerror: null,
  }));
}

/** Builds a mock fetch that resolves with a JSON response. */
function mockFetchSuccess(body) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  });
}

/** Builds a mock fetch that resolves with a non-ok JSON response. */
function mockFetchFailure(body, status = 500) {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue(body),
  });
}

/** Builds a mock fetch that rejects (network error). */
function mockFetchNetworkError(message = 'Network error') {
  return jest.fn().mockRejectedValue(new Error(message));
}

// ---------------------------------------------------------------------------
// generateMeme
// ---------------------------------------------------------------------------

describe('generateMeme', () => {
  beforeEach(() => {
    installBase64Mock();
  });

  afterEach(() => {
    delete global.FileReader;
    delete global.fetch;
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // fetch call contract
  // -------------------------------------------------------------------------

  it('calls fetch with POST to "/api/generate-meme"', async () => {
    global.fetch = mockFetchSuccess({
      success: true,
      meme_url: 'https://example.com/meme.png',
      provider: 'dalle3',
      vision_prompt: 'A funny meme',
    });

    const file = makeFakeFile();
    await generateMeme(file);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/generate-meme');
  });

  it('sends a POST request', async () => {
    global.fetch = mockFetchSuccess({
      success: true,
      meme_url: 'https://example.com/meme.png',
      provider: 'dalle3',
      vision_prompt: 'A funny meme',
    });

    const file = makeFakeFile();
    await generateMeme(file);

    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe('POST');
  });

  it('sends JSON body with an "image" field containing base64 data', async () => {
    global.fetch = mockFetchSuccess({
      success: true,
      meme_url: 'https://example.com/meme.png',
      provider: 'dalle3',
      vision_prompt: 'A funny meme',
    });

    const file = makeFakeFile();
    await generateMeme(file);

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toHaveProperty('image', FAKE_BASE64);
  });

  // -------------------------------------------------------------------------
  // success response shape
  // -------------------------------------------------------------------------

  it('returns { memeUrl, provider, visionPrompt } on success', async () => {
    global.fetch = mockFetchSuccess({
      success: true,
      meme_url: 'https://example.com/meme.png',
      provider: 'dalle3',
      vision_prompt: 'A funny meme',
    });

    const file = makeFakeFile();
    const result = await generateMeme(file);

    expect(result).toEqual({
      memeUrl: 'https://example.com/meme.png',
      provider: 'dalle3',
      visionPrompt: 'A funny meme',
    });
  });

  it('maps meme_url → memeUrl', async () => {
    global.fetch = mockFetchSuccess({
      success: true,
      meme_url: 'https://cdn.example.com/meme-42.jpg',
      provider: 'gpt-image-1',
      vision_prompt: 'Cat with sunglasses',
    });

    const file = makeFakeFile();
    const result = await generateMeme(file);

    expect(result.memeUrl).toBe('https://cdn.example.com/meme-42.jpg');
  });

  // -------------------------------------------------------------------------
  // error handling
  // -------------------------------------------------------------------------

  it('throws an Error on network failure', async () => {
    global.fetch = mockFetchNetworkError('Failed to fetch');

    const file = makeFakeFile();
    await expect(generateMeme(file)).rejects.toThrow(Error);
  });

  it('throws an Error when API returns { success: false, error: "..." }', async () => {
    global.fetch = mockFetchFailure({
      success: false,
      error: 'Something went wrong',
    });

    const file = makeFakeFile();
    await expect(generateMeme(file)).rejects.toThrow(Error);
  });

  it('includes a user-friendly message when API returns success: false', async () => {
    global.fetch = mockFetchFailure({
      success: false,
      error: 'QUOTA_EXCEEDED',
    });

    const file = makeFakeFile();
    await expect(generateMeme(file)).rejects.toThrow(/quota|limit|try again/i);
  });

  it('includes a user-friendly message for CONTENT_POLICY errors', async () => {
    global.fetch = mockFetchFailure({
      success: false,
      error: 'CONTENT_POLICY',
    });

    const file = makeFakeFile();
    await expect(generateMeme(file)).rejects.toThrow(/content|policy|appropriate/i);
  });

  it('includes a user-friendly message for TIMEOUT_ERROR errors', async () => {
    global.fetch = mockFetchFailure({
      success: false,
      error: 'TIMEOUT_ERROR',
    });

    const file = makeFakeFile();
    await expect(generateMeme(file)).rejects.toThrow(/timeout|slow|again/i);
  });

  it('includes a user-friendly message for SERVICE_UNAVAILABLE errors', async () => {
    global.fetch = mockFetchFailure({
      success: false,
      error: 'SERVICE_UNAVAILABLE',
    });

    const file = makeFakeFile();
    await expect(generateMeme(file)).rejects.toThrow(/unavailable|service|later/i);
  });

  // -------------------------------------------------------------------------
  // AbortController / timeout
  // -------------------------------------------------------------------------

  it('aborts fetch after 45 seconds via AbortController', async () => {
    jest.useFakeTimers();

    // fetch never resolves — simulates a hanging request
    global.fetch = jest.fn().mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        // Listen for abort signal
        options.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    });

    const file = makeFakeFile();
    const promise = generateMeme(file);

    // Advance time by 45 seconds to trigger the abort
    jest.advanceTimersByTime(45000);

    await expect(promise).rejects.toThrow(Error);
  });

  it('passes an AbortSignal to fetch', async () => {
    global.fetch = mockFetchSuccess({
      success: true,
      meme_url: 'https://example.com/meme.png',
      provider: 'dalle3',
      vision_prompt: 'A funny meme',
    });

    const file = makeFakeFile();
    await generateMeme(file);

    const [, options] = global.fetch.mock.calls[0];
    expect(options.signal).toBeDefined();
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
});
