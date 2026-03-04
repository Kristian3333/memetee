import { isValidEmail, validateContactForm, submitContact } from '../../src/contact.js';

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------

describe('isValidEmail', () => {
  test('returns true for a standard email address', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  test('returns true for a subdomain email address', () => {
    expect(isValidEmail('user@domain.co.uk')).toBe(true);
  });

  test('returns false for a string with no @ symbol', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });

  test('returns false when domain is missing after @', () => {
    expect(isValidEmail('missing@')).toBe(false);
  });

  test('returns false for an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateContactForm
// ---------------------------------------------------------------------------

describe('validateContactForm', () => {
  test('returns { valid: true } for a fully valid payload', () => {
    const result = validateContactForm({
      name: 'John',
      email: 'john@example.com',
      message: 'Hello world!',
    });
    expect(result).toEqual({ valid: true });
  });

  test('returns { valid: false, error: string } when name is empty', () => {
    const result = validateContactForm({
      name: '',
      email: 'john@example.com',
      message: 'Hello world!',
    });
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });

  test('returns { valid: false, error: string } when email is invalid', () => {
    const result = validateContactForm({
      name: 'John',
      email: 'invalid',
      message: 'Hello world!',
    });
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });

  test('returns { valid: false, error: string } when message is too short (min 10 chars)', () => {
    const result = validateContactForm({
      name: 'John',
      email: 'john@example.com',
      message: 'short',
    });
    expect(result.valid).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// submitContact
// ---------------------------------------------------------------------------

describe('submitContact', () => {
  const validData = {
    name: 'John',
    email: 'john@example.com',
    message: 'Hello world!',
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('calls fetch with POST to /api/contact', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Success' }),
    });

    await submitContact(validData);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('sends JSON body containing name, email, and message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Success' }),
    });

    await submitContact(validData);

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      name: validData.name,
      email: validData.email,
      message: validData.message,
    });
  });

  test('returns success message on 200 response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Thank you for reaching out!' }),
    });

    const result = await submitContact(validData);

    expect(result).toHaveProperty('message');
    expect(typeof result.message).toBe('string');
  });

  test('throws an Error on 429 rate limit response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Too Many Requests' }),
    });

    await expect(submitContact(validData)).rejects.toThrow(Error);
  });

  test('throws an Error on network error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(submitContact(validData)).rejects.toThrow(Error);
  });
});
