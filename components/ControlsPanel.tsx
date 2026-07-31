import React, { useState, useRef } from 'react';
import { UploadIcon, TrashIcon, SparklesIcon, PlusIcon, CloseIcon, LightbulbIcon } from './icons';
import { ColorTemplate } from '../types';

interface ControlsPanelProps {
  baseImage: { file: File; preview: string } | null;
  onImageUpload: (file: File) => void;
  onRemoveBaseImage: () => void;
  prompts: string[];
  setPrompts: React.Dispatch<React.SetStateAction<string[]>>;
  brandColor: string;
  setBrandColor: React.Dispatch<React.SetStateAction<string>>;
  useTexture: boolean;
  setUseTexture: React.Dispatch<React.SetStateAction<boolean>>;
  useTransparentBackground: boolean;
  setUseTransparentBackground: React.Dispatch<React.SetStateAction<boolean>>;
  onGenerate: () => void;
  onCancel: () => void;
  isLoading: boolean;
  progress: { done: number; total: number } | null;
  isApiKeySelected: boolean;
  onSelectApiKey: () => void;
  useColorTemplates: boolean;
  setUseColorTemplates: React.Dispatch<React.SetStateAction<boolean>>;
  colorTemplates: ColorTemplate[];
  setColorTemplates: React.Dispatch<React.SetStateAction<ColorTemplate[]>>;
}

const promptHints = [
    'メインの商品を高級腕時計に交換。',
    '背景を未来的な夜の街並みに変更。',
    '全体を水彩画風のタッチに。',
    '商品に桜の花びらが舞い散るエフェクトを追加。',
    '広告の季節を夏から冬に変えて、雪景色にする。',
    'サイバーパンクなネオンカラーを全体に加える。',
    '商品を宙に浮かせ、光の軌跡を追加する。',
    '背景をミニマルな単色（#f0f0f0）にする。',
    '全体をレトロな80年代風の広告デザインに変更。',
];

/** キーボード操作とスクリーンリーダーに対応したトグル。 */
const Toggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  labelledBy: string;
}> = ({ checked, onChange, labelledBy }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-labelledby={labelledBy}
    onClick={onChange}
    className={`relative inline-flex flex-shrink-0 items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${checked ? 'bg-violet-500' : 'bg-gray-600'}`}
  >
    <span
      aria-hidden="true"
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  baseImage,
  onImageUpload,
  onRemoveBaseImage,
  prompts,
  setPrompts,
  brandColor,
  setBrandColor,
  useTexture,
  setUseTexture,
  useTransparentBackground,
  setUseTransparentBackground,
  onGenerate,
  onCancel,
  isLoading,
  progress,
  isApiKeySelected,
  onSelectApiKey,
  useColorTemplates,
  setUseColorTemplates,
  colorTemplates,
  setColorTemplates,
}) => {
  const [newPrompt, setNewPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPrompt = () => {
    if (newPrompt.trim()) {
      setPrompts(prev => [...prev, newPrompt.trim()]);
      setNewPrompt('');
    }
  };

  const handleAddHint = () => {
    const availableHints = promptHints.filter(h => !prompts.includes(h));
    const hintsToUse = availableHints.length > 0 ? availableHints : promptHints;
    const hint = hintsToUse[Math.floor(Math.random() * hintsToUse.length)];
    setPrompts(prev => [...prev, hint]);
  };

  const handleRemovePrompt = (indexToRemove: number) => {
    setPrompts(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleColorTemplateChange = (index: number, newColor: string) => {
    setColorTemplates(prev => {
      const newTemplates = [...prev];
      newTemplates[index] = { ...newTemplates[index], color: newColor };
      return newTemplates;
    });
  };

  const handleColorTemplateToggle = (index: number) => {
    setColorTemplates(prev => {
      const newTemplates = [...prev];
      newTemplates[index] = { ...newTemplates[index], enabled: !newTemplates[index].enabled };
      return newTemplates;
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6 sticky top-8">
      {/* 1. Base Image */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-violet-300">1. ベース画像</h3>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          aria-label="ベース画像を選択"
        />
        {baseImage ? (
           <div className="relative">
            <img src={baseImage.preview} alt="ベース広告" className="rounded-md w-full max-h-60 object-contain mx-auto bg-gray-900/50" />
            <button 
              onClick={onRemoveBaseImage}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
              aria-label="ベース画像を削除"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // buttonにすることでキーボードのTab移動とEnter/Space操作が標準で効く
          <button
            type="button"
            className="w-full bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-violet-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <span className="text-gray-400 flex flex-col items-center py-4">
              <UploadIcon className="w-8 h-8 mb-2" aria-hidden="true" />
              <span>クリックまたはドラッグしてアップロード</span>
              <span className="text-xs mt-1 text-gray-500">PNG / JPEG / WebP、10MBまで</span>
            </span>
          </button>
        )}
      </div>

      {/* 2. Edit Prompts */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-violet-300">2. 編集プロンプト</h3>
        <ul className="space-y-2">
          {prompts.map((prompt, index) => (
            <li key={index} className="flex items-center bg-gray-700 rounded-md p-2">
              <p className="flex-grow text-sm text-gray-200">{prompt}</p>
              <button
                type="button"
                onClick={() => handleRemovePrompt(index)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
                // 削除ボタンが並ぶため、どのプロンプトを消すのか読み上げでわかるようにする
                aria-label={`プロンプトを削除: ${prompt}`}
              >
                <TrashIcon className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center mt-3">
          <label htmlFor="newPrompt" className="sr-only">編集プロンプトを入力</label>
          <input
            id="newPrompt"
            type="text"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddPrompt();
              }
            }}
            placeholder="例：背景を赤に変更..."
            className="flex-grow min-w-0 bg-gray-900 border border-gray-600 rounded-l-md p-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
          <button
            type="button"
            onClick={handleAddPrompt}
            className="bg-violet-600 hover:bg-violet-700 text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            aria-label="プロンプトを追加"
          >
            <PlusIcon className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleAddHint}
            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-r-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            aria-label="プロンプトのヒントを追加"
          >
            <LightbulbIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 3. Style Presets */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-violet-300">3. スタイルプリセット</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="brandColor" className="text-gray-300">ブランドカラー</label>
            <div className="flex items-center bg-gray-700 rounded-md px-2 focus-within:ring-2 focus-within:ring-violet-500">
              <span aria-hidden="true" className="text-gray-400">#</span>
              <input
                id="brandColor"
                type="text"
                value={brandColor.replace('#', '')}
                onChange={(e) => setBrandColor(`#${e.target.value}`)}
                className="w-20 bg-transparent p-1 text-white text-right outline-none"
              />
               <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-6 h-6 bg-transparent border-none cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                aria-label="ブランドカラーをカラーピッカーで選択"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span id="textureToggleLabel" className="text-gray-300">テクスチャ</span>
            <Toggle
              checked={useTexture}
              onChange={() => setUseTexture(!useTexture)}
              labelledBy="textureToggleLabel"
            />
          </div>
          <div className="flex items-center justify-between">
            <span id="transparentToggleLabel" className="text-gray-300">背景の透過</span>
            <Toggle
              checked={useTransparentBackground}
              onChange={() => setUseTransparentBackground(!useTransparentBackground)}
              labelledBy="transparentToggleLabel"
            />
          </div>
        </div>
      </div>
      
      {/* 4. Individual Color Specification */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-violet-300">4. 個別カラー指定</h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span id="colorTemplateToggleLabel" className="text-gray-300">機能を有効化</span>
                <Toggle
                    checked={useColorTemplates}
                    onChange={() => setUseColorTemplates(!useColorTemplates)}
                    labelledBy="colorTemplateToggleLabel"
                />
            </div>
            {useColorTemplates && (
                <div className="space-y-3 pt-4 mt-4 border-t border-gray-700/50">
                    {colorTemplates.map((template, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Toggle
                                    checked={template.enabled}
                                    onChange={() => handleColorTemplateToggle(index)}
                                    labelledBy={`color-template-label-${index}`}
                                />
                                <label
                                    id={`color-template-label-${index}`}
                                    htmlFor={`color-template-${index}`}
                                    className={`text-sm ${template.enabled ? 'text-gray-300' : 'text-gray-500'}`}
                                >
                                    {template.category}
                                </label>
                            </div>
                            <div className={`flex items-center bg-gray-700 rounded-md px-2 focus-within:ring-2 focus-within:ring-violet-500 ${!template.enabled && 'opacity-50'}`}>
                                <span aria-hidden="true" className="text-gray-400">#</span>
                                <input
                                    id={`color-template-${index}`}
                                    type="text"
                                    value={template.color.replace('#', '')}
                                    onChange={(e) => handleColorTemplateChange(index, `#${e.target.value}`)}
                                    className="w-16 bg-transparent p-1 text-white text-right outline-none"
                                    disabled={!template.enabled}
                                />
                                <input
                                    type="color"
                                    value={template.color}
                                    onChange={(e) => handleColorTemplateChange(index, e.target.value)}
                                    className="w-6 h-6 bg-transparent border-none cursor-pointer"
                                    style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                                    disabled={!template.enabled}
                                    aria-label={`${template.category}の色をカラーピッカーで選択`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* API Key Selection */}
      {!isApiKeySelected && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 p-4 rounded-lg text-center">
          <p className="text-sm mb-3">操作を続けるには、Gemini APIキーを選択してください。</p>
          <button
            onClick={onSelectApiKey}
            className="bg-yellow-500 text-yellow-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-400 transition-colors w-full"
          >
            APIキーを選択
          </button>
          <p className="text-xs text-yellow-400 mt-2">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
              請求に関する情報はこちら
            </a>
          </p>
        </div>
      )}

      {/* Generate / Cancel */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!isApiKeySelected || isLoading || !baseImage || prompts.length === 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
        >
          {isLoading ? (
            <>
              {/* FIX: The viewBox attribute contained invalid text, which broke JSX parsing. Replaced it with a standard value. */}
              <svg aria-hidden="true" className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>
                {progress ? `生成中... (${progress.done}/${progress.total})` : '生成中...'}
              </span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" aria-hidden="true" />
              <span>バリエーションを生成</span>
            </>
          )}
        </button>

        {isLoading && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            キャンセル
          </button>
        )}

        {/* 進捗をスクリーンリーダーにも伝える */}
        <p aria-live="polite" className="sr-only">
          {isLoading && progress
            ? `画像を生成しています。${progress.total}件中${progress.done}件完了。`
            : ''}
        </p>
      </div>
    </div>
  );
};