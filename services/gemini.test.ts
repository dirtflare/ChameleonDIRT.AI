import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mockのファクトリは巻き上げられるため、参照する値はvi.hoistedで用意する
const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
  Modality: { IMAGE: 'IMAGE' },
}));

import { generateImage } from './gemini';

beforeEach(() => {
  generateContent.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const call = () => generateImage('AAAA', 'image/png', 'テストプロンプト');

describe('generateImage', () => {
  it('returns the first inline image as a data URL', async () => {
    generateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ inlineData: { data: 'BBBB', mimeType: 'image/webp' } }] } }],
    });

    await expect(call()).resolves.toBe('data:image/webp;base64,BBBB');
  });

  it('skips text parts and returns the image part', async () => {
    generateContent.mockResolvedValue({
      candidates: [{
        content: { parts: [{ text: 'なにか説明' }, { inlineData: { data: 'CCCC', mimeType: 'image/png' } }] },
      }],
    });

    await expect(call()).resolves.toBe('data:image/png;base64,CCCC');
  });

  it('falls back to image/png when the mime type is missing', async () => {
    generateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ inlineData: { data: 'DDDD' } }] } }],
    });

    await expect(call()).resolves.toBe('data:image/png;base64,DDDD');
  });

  it.each([
    ['no candidates at all', {}],
    ['an empty candidate list', { candidates: [] }],
    ['a candidate with no content', { candidates: [{}] }],
    ['content with no parts', { candidates: [{ content: {} }] }],
    ['parts with no image', { candidates: [{ content: { parts: [{ text: 'ごめんなさい' }] } }] }],
  ])('reports a clean error for %s', async (_label, response) => {
    // 安全フィルタ等でこの形が返る。以前はTypeErrorになり原因が分からなかった
    generateContent.mockResolvedValue(response);

    await expect(call()).rejects.toThrow('APIレスポンスに画像データが見つかりませんでした。');
  });

  it('passes the abort signal through to the SDK', async () => {
    generateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ inlineData: { data: 'EEEE', mimeType: 'image/png' } }] } }],
    });
    const controller = new AbortController();

    await generateImage('AAAA', 'image/png', 'テスト', controller.signal);

    expect(generateContent.mock.calls[0][0].config.abortSignal).toBe(controller.signal);
  });

  it('rethrows an SDK error so the caller can classify it', async () => {
    generateContent.mockRejectedValue(new Error('API key not valid'));

    await expect(call()).rejects.toThrow('API key not valid');
  });
});
