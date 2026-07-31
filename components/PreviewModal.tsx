import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeneratedImage } from '../types';
import { CloseIcon, DownloadIcon } from './icons';

interface PreviewModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onDownload: (image: GeneratedImage, newName: string) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ image, onClose, onDownload }) => {
  const [fileName, setFileName] = useState('');
  const [confirmedFileName, setConfirmedFileName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Sanitize prompt to create a valid initial filename
    const initialName = image.prompt.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'generated-image';
    setFileName(initialName);
    setConfirmedFileName(initialName);
  }, [image]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
      return;
    }

    // フォーカスがダイアログの外へ出ないように巡回させる
    if (event.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    // 閉じたときに、開く前のフォーカス位置へ戻す
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      previouslyFocused?.focus();
    };
  }, []);


  const handleApplyName = () => {
    if (fileName.trim()) {
        const trimmedName = fileName.trim();
        setConfirmedFileName(trimmedName);
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 2000);
    }
  };

  const handleDownload = () => {
    onDownload(image, confirmedFileName);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="previewModalTitle"
        className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 id="previewModalTitle" className="text-lg font-semibold text-violet-300">プレビュー</h3>
            <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="プレビューを閉じる"
                className="p-1 text-gray-400 hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
                <CloseIcon className="w-6 h-6" aria-hidden="true" />
            </button>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto">
            <img src={image.imageUrl} alt={image.prompt} className="w-full h-auto max-h-[60vh] object-contain rounded-md" />
        </div>

        <div className="p-4 bg-gray-900/50 rounded-b-xl border-t border-gray-700 space-y-3">
             <p className="text-sm text-gray-400">
                <span className='font-semibold text-gray-300'>プロンプト:</span> {image.prompt}
            </p>
            <div className="flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="fileName" className="block text-sm font-medium text-gray-300 mb-1">ファイル名</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            id="fileName"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyName();
                              }
                            }}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                        />
                         <button
                            type="button"
                            onClick={handleApplyName}
                            disabled={fileName.trim() === confirmedFileName || !fileName.trim()}
                            className="flex-shrink-0 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                        >
                            適用
                        </button>
                    </div>
                     <p aria-live="polite" className="text-xs text-green-400 mt-1">
                       {showConfirmation ? 'ファイル名を更新しました。' : ''}
                     </p>
                </div>
                <div>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                    >
                        <DownloadIcon className="w-5 h-5" aria-hidden="true" />
                        ダウンロード
                    </button>
                </div>
            </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
