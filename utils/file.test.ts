import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  fileToBase64,
  sanitizeFileName,
  validateImageFile,
} from './file';

/** 指定したサイズとMIMEタイプを持つダミーファイルを作る */
const makeFile = (
  { type, size = 1024, name = 'test' }: { type: string; size?: number; name?: string },
): File => new File([new Uint8Array(size)], name, { type });

describe('validateImageFile', () => {
  it.each(ACCEPTED_IMAGE_TYPES)('accepts %s', (type) => {
    expect(validateImageFile(makeFile({ type }))).toEqual({ valid: true });
  });

  it('rejects an unsupported image format', () => {
    const result = validateImageFile(makeFile({ type: 'image/gif' }));
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.message).toMatch(/対応していないファイル形式/);
  });

  it('rejects a non-image file that was dropped past the accept attribute', () => {
    // accept="image/*" はドラッグ&ドロップを防がないため、この経路の検証が必要
    const result = validateImageFile(makeFile({ type: 'application/pdf', name: 'doc.pdf' }));
    expect(result.valid).toBe(false);
  });

  it('rejects a file with no MIME type', () => {
    expect(validateImageFile(makeFile({ type: '' })).valid).toBe(false);
  });

  it('rejects an empty file', () => {
    const result = validateImageFile(makeFile({ type: 'image/png', size: 0 }));
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.message).toMatch(/ファイルが空/);
  });

  it.each([null, undefined])('rejects %s instead of throwing', (input) => {
    const result = validateImageFile(input);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.message).toMatch(/選択されていません/);
  });

  it('accepts a file exactly at the size limit', () => {
    expect(validateImageFile(makeFile({ type: 'image/png', size: MAX_IMAGE_BYTES })))
      .toEqual({ valid: true });
  });

  it('rejects a file one byte over the size limit', () => {
    const result = validateImageFile(makeFile({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }));
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.message).toMatch(/大きすぎます/);
  });
});

describe('sanitizeFileName', () => {
  it('replaces characters that are invalid in file systems', () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
  });

  it('preserves Japanese characters', () => {
    expect(sanitizeFileName('春の新作バナー')).toBe('春の新作バナー');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeFileName('  banner  ')).toBe('banner');
  });

  it.each(['', '   '])('falls back to a default for %o', (input) => {
    expect(sanitizeFileName(input)).toBe('generated-image');
  });

  it('keeps a name made entirely of replaced characters', () => {
    // 置換後も空にはならないため、フォールバックは発動しない
    expect(sanitizeFileName('///')).toBe('___');
  });

  it('does not treat a leading dot as empty', () => {
    expect(sanitizeFileName('.hidden')).toBe('.hidden');
  });
});

describe('fileToBase64', () => {
  it('strips the data URL prefix and returns only the payload', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' });
    const result = await fileToBase64(file);
    expect(result).not.toContain(',');
    expect(result).toBe('AQID');
  });

  it('returns an empty string for an empty file rather than rejecting', async () => {
    // 空ファイルはvalidateImageFileで弾く前提。ここでは例外を投げないことだけ確認する
    const file = new File([], 'empty.png', { type: 'image/png' });
    await expect(fileToBase64(file)).resolves.toBe('');
  });
});
