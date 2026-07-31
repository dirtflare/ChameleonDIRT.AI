import { describe, expect, it } from 'vitest';
import {
  classifyGenerationError,
  isAbortError,
  isApiKeyError,
  readErrorDetail,
} from './errors';

/** statusを持つ、SDKが投げるエラーに近い形のオブジェクト */
const apiError = (message: string, status?: number) =>
  Object.assign(new Error(message), status === undefined ? {} : { status });

describe('isApiKeyError', () => {
  it.each([
    'API key not valid. Please pass a valid API key.',
    'Permission denied on resource project.',
    'Request had invalid authentication credentials. UNAUTHENTICATED',
    'Billing account not configured for this project.',
    'RESOURCE_EXHAUSTED: quota exceeded',
  ])('detects %s', (message) => {
    expect(isApiKeyError(new Error(message))).toBe(true);
  });

  it.each([401, 403, 429])('treats HTTP %i as an API key problem', (status) => {
    expect(isApiKeyError(apiError('Something went wrong', status))).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isApiKeyError(new Error('INVALID API KEY'))).toBe(true);
  });

  it('does not fire on an unrelated failure', () => {
    expect(isApiKeyError(new Error('The model returned no image data.'))).toBe(false);
  });

  it('does not fire on a plain 500', () => {
    expect(isApiKeyError(apiError('Internal error', 500))).toBe(false);
  });

  it('does not fire on "not found", which is too generic to attribute to the key', () => {
    // 以前の実装は'not found'でAPIキーエラーと誤判定していた
    expect(isApiKeyError(new Error('Model not found'))).toBe(false);
  });
});

describe('classifyGenerationError', () => {
  it('returns the apiKey kind for a key failure', () => {
    expect(classifyGenerationError(new Error('API key not valid')).kind).toBe('apiKey');
  });

  it('returns the generation kind for anything else', () => {
    expect(classifyGenerationError(new Error('boom')).kind).toBe('generation');
  });

  it.each([
    new Error('API key not valid, request to https://generativelanguage.googleapis.com/?key=SECRET'),
    new Error('boom'),
  ])('never leaks the raw error text into the user-facing message', (error) => {
    const { message } = classifyGenerationError(error);
    expect(message).not.toContain('SECRET');
    expect(message).not.toContain('http');
    expect(message).not.toContain(error.message);
  });

  it.each([null, undefined, 'a string', { odd: true }])(
    'produces a usable message for %o',
    (input) => {
      expect(classifyGenerationError(input).message.length).toBeGreaterThan(0);
    },
  );
});

describe('readErrorDetail', () => {
  it('reads the message off an Error', () => {
    expect(readErrorDetail(new Error('boom'))).toBe('boom');
  });

  it('passes a string through', () => {
    expect(readErrorDetail('boom')).toBe('boom');
  });

  it('serializes a plain object', () => {
    expect(readErrorDetail({ code: 7 })).toBe('{"code":7}');
  });

  it('does not throw on a circular structure', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => readErrorDetail(circular)).not.toThrow();
  });
});

describe('isAbortError', () => {
  it('detects a DOMException-style abort', () => {
    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';
    expect(isAbortError(error)).toBe(true);
  });

  it('detects an abort reported only in the message', () => {
    expect(isAbortError(new Error('Request aborted by the caller'))).toBe(true);
  });

  it('does not fire on an ordinary failure', () => {
    expect(isAbortError(new Error('API key not valid'))).toBe(false);
  });
});
