import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// generateImageはテストごとに挙動を差し替えるため、モジュール全体をモックする
vi.mock('./services/gemini', () => ({ generateImage: vi.fn() }));

import App from './App';
import { generateImage } from './services/gemini';

const mockedGenerateImage = vi.mocked(generateImage);

const pngFile = () =>
  new File([new Uint8Array([1, 2, 3])], 'base.png', { type: 'image/png' });

/** APIキー選択済みの状態でAppを描画する */
const renderApp = () => {
  window.aistudio = {
    hasSelectedApiKey: vi.fn().mockResolvedValue(true),
    openSelectKey: vi.fn().mockResolvedValue(undefined),
  };
  return render(<App />);
};

/** 画像をアップロードし、渡されたプロンプトを追加する */
const setUpRun = async (user: ReturnType<typeof userEvent.setup>, prompts: string[]) => {
  const input = document.querySelector('input[type=file]') as HTMLInputElement;
  await user.upload(input, pngFile());
  await screen.findByAltText('ベース広告');

  for (const prompt of prompts) {
    const field = screen.getByLabelText('編集プロンプトを入力');
    await user.type(field, prompt);
    await user.click(screen.getByRole('button', { name: 'プロンプトを追加' }));
  }
};

const generateButton = () => screen.getByRole('button', { name: 'バリエーションを生成' });

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn(),
  });
  mockedGenerateImage.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('generation flow', () => {
  it('makes one request per prompt and renders each result', async () => {
    const user = userEvent.setup();
    mockedGenerateImage.mockResolvedValue('data:image/png;base64,AAAA');

    renderApp();
    await setUpRun(user, ['背景を青にする', '全体を水彩画風に']);
    await user.click(generateButton());

    await waitFor(() => expect(mockedGenerateImage).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /プレビューを開く/ })).toHaveLength(2),
    );
  });

  it('sends the user prompt plus the fixed preservation instruction', async () => {
    const user = userEvent.setup();
    mockedGenerateImage.mockResolvedValue('data:image/png;base64,AAAA');

    renderApp();
    await setUpRun(user, ['背景を青にする']);
    await user.click(generateButton());

    await waitFor(() => expect(mockedGenerateImage).toHaveBeenCalled());
    const fullPrompt = mockedGenerateImage.mock.calls[0][2];
    expect(fullPrompt).toContain('背景を青にする');
    expect(fullPrompt).toContain('既存のテキスト、ロゴ、クーポンコードはすべてそのまま維持');
    expect(fullPrompt).toContain('ブランドカラー');
  });

  it('shows the API key screen when a prompt fails on the key', async () => {
    // Promise.allSettledはrejectしないため、以前はこの経路が汎用エラーに落ちていた
    const user = userEvent.setup();
    mockedGenerateImage.mockRejectedValue(new Error('API key not valid. Please pass a valid API key.'));

    renderApp();
    await setUpRun(user, ['背景を青にする']);
    await user.click(generateButton());

    expect(await screen.findByText('APIキーエラーが発生しました')).toBeInTheDocument();
  });

  it('never renders the raw error text', async () => {
    const user = userEvent.setup();
    const leaky = 'API key not valid: https://generativelanguage.googleapis.com/v1?key=SECRET123';
    mockedGenerateImage.mockRejectedValue(new Error(leaky));

    renderApp();
    await setUpRun(user, ['背景を青にする']);
    await user.click(generateButton());

    await screen.findByText('APIキーエラーが発生しました');
    expect(document.body.textContent).not.toContain('SECRET123');
    expect(document.body.textContent).not.toContain('generativelanguage.googleapis.com');
  });

  it('renders successes and reports the failure count on partial failure', async () => {
    const user = userEvent.setup();
    mockedGenerateImage
      .mockResolvedValueOnce('data:image/png;base64,AAAA')
      .mockRejectedValueOnce(new Error('the model returned no image data'));

    renderApp();
    await setUpRun(user, ['成功する方', '失敗する方']);
    await user.click(generateButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '1個のプロンプトで画像を生成できませんでした',
    );
    expect(screen.getAllByRole('button', { name: /プレビューを開く/ })).toHaveLength(1);
  });

  it('does not misreport an ordinary failure as an API key problem', async () => {
    const user = userEvent.setup();
    // 以前は'not found'をAPIキーエラーと誤判定していた
    mockedGenerateImage.mockRejectedValue(new Error('Model not found'));

    renderApp();
    await setUpRun(user, ['背景を青にする']);
    await user.click(generateButton());

    await screen.findByRole('alert');
    expect(screen.queryByText('APIキーエラーが発生しました')).not.toBeInTheDocument();
  });

  it('reports progress while running', async () => {
    const user = userEvent.setup();
    let release: (v: string) => void = () => {};
    mockedGenerateImage
      .mockResolvedValueOnce('data:image/png;base64,AAAA')
      .mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));

    renderApp();
    await setUpRun(user, ['ひとつめ', 'ふたつめ']);
    await user.click(generateButton());

    expect(await screen.findByText('生成中... (1/2)')).toBeInTheDocument();
    release('data:image/png;base64,BBBB');
    await waitFor(() => expect(screen.queryByText(/生成中/)).not.toBeInTheDocument());
  });

  it('disables the generate button while a run is in flight', async () => {
    const user = userEvent.setup();
    mockedGenerateImage.mockImplementation(() => new Promise(() => {}));

    renderApp();
    await setUpRun(user, ['背景を青にする']);
    // 生成中はボタンの文言が変わるため、同じ要素を掴んだまま検証する
    const button = generateButton();
    await user.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    // 連打しても追加のリクエストは飛ばない
    await user.click(button);
    expect(mockedGenerateImage).toHaveBeenCalledTimes(1);
  });

  it('aborts in-flight requests and keeps what finished when cancelled', async () => {
    const user = userEvent.setup();
    mockedGenerateImage
      .mockResolvedValueOnce('data:image/png;base64,AAAA')
      .mockImplementationOnce((_i, _m, _p, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted.');
            err.name = 'AbortError';
            reject(err);
          });
        }),
      );

    renderApp();
    await setUpRun(user, ['完了する方', '中断される方']);
    await user.click(generateButton());

    const cancel = await screen.findByRole('button', { name: 'キャンセル' });
    await user.click(cancel);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /プレビューを開く/ })).toHaveLength(1),
    );
    // キャンセルはエラーとして扱わない
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(generateButton()).toBeEnabled();
  });

  it('passes an abort signal to the service', async () => {
    const user = userEvent.setup();
    mockedGenerateImage.mockResolvedValue('data:image/png;base64,AAAA');

    renderApp();
    await setUpRun(user, ['背景を青にする']);
    await user.click(generateButton());

    await waitFor(() => expect(mockedGenerateImage).toHaveBeenCalled());
    expect(mockedGenerateImage.mock.calls[0][3]).toBeInstanceOf(AbortSignal);
  });
});

describe('upload validation in the real flow', () => {
  it('blocks an unsupported file before any request is made', async () => {
    // applyAccept: false でaccept属性による絞り込みを外し、accept属性が効かない
    // ドラッグ&ドロップ経路と同じ条件にする。ここがコード側の検証を必要とする理由。
    const user = userEvent.setup({ applyAccept: false });
    renderApp();

    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    await user.upload(input, new File(['x'], 'doc.pdf', { type: 'application/pdf' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('対応していないファイル形式');
    expect(screen.queryByAltText('ベース広告')).not.toBeInTheDocument();
    expect(mockedGenerateImage).not.toHaveBeenCalled();
  });
});
