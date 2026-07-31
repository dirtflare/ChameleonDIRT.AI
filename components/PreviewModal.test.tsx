import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewModal } from './PreviewModal';
import { GeneratedImage } from '../types';

afterEach(cleanup);

const image: GeneratedImage = {
  id: '0-背景を青にする-1',
  prompt: '背景を青にする',
  imageUrl: 'data:image/png;base64,iVBORw0KGgo=',
};

const renderModal = (overrides: Partial<React.ComponentProps<typeof PreviewModal>> = {}) => {
  const onClose = vi.fn();
  const onDownload = vi.fn();
  const result = render(
    <PreviewModal image={image} onClose={onClose} onDownload={onDownload} {...overrides} />,
  );
  return { onClose, onDownload, ...result };
};

describe('PreviewModal', () => {
  it('exposes dialog semantics', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('プレビュー');
  });

  it('moves focus into the dialog on open', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'プレビューを閉じる' })).toHaveFocus();
  });

  it('restores focus to the trigger when it unmounts', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const { unmount } = renderModal();
    expect(trigger).not.toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    renderModal();
    const dialog = screen.getByRole('dialog');

    // 十分な回数まわしても、フォーカスがダイアログの外に出ないこと
    for (let i = 0; i < 12; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('wraps backwards from the first element with Shift+Tab', async () => {
    const user = userEvent.setup();
    renderModal();
    const dialog = screen.getByRole('dialog');

    // 先頭（閉じるボタン）にフォーカスがある状態から後方へ
    expect(screen.getByRole('button', { name: 'プレビューを閉じる' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('button', { name: 'プレビューを閉じる' })).not.toHaveFocus();
  });

  it('seeds the filename from the prompt and downloads it', async () => {
    const user = userEvent.setup();
    const { onDownload } = renderModal();

    const input = screen.getByLabelText('ファイル名');
    await user.clear(input);
    await user.type(input, 'spring-banner');
    await user.click(screen.getByRole('button', { name: '適用' }));
    await user.click(screen.getByRole('button', { name: 'ダウンロード' }));

    expect(onDownload).toHaveBeenCalledWith(image, 'spring-banner');
  });

  it('requires 適用 before a rename takes effect', async () => {
    const user = userEvent.setup();
    const { onDownload } = renderModal();

    const input = screen.getByLabelText('ファイル名');
    await user.clear(input);
    await user.type(input, 'not-applied');
    await user.click(screen.getByRole('button', { name: 'ダウンロード' }));

    expect(onDownload).not.toHaveBeenCalledWith(image, 'not-applied');
  });

  it('announces the rename through a live region', async () => {
    const user = userEvent.setup();
    renderModal();

    const input = screen.getByLabelText('ファイル名');
    await user.clear(input);
    await user.type(input, 'renamed');
    await user.click(screen.getByRole('button', { name: '適用' }));

    expect(screen.getByText('ファイル名を更新しました。')).toBeInTheDocument();
  });
});
