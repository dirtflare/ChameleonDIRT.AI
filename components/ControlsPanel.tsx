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
  isLoading: boolean;
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
  isLoading,
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
          accept="image/*"
          className="hidden"
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
          <div
            className="bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-violet-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="text-gray-400 flex flex-col items-center py-4">
              <UploadIcon className="w-8 h-8 mb-2" />
              <p>クリックまたはドラッグしてアップロード</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Edit Prompts */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-violet-300">2. 編集プロンプト</h3>
        <div className="space-y-2">
          {prompts.map((prompt, index) => (
            <div key={index} className="flex items-center bg-gray-700 rounded-md p-2">
              <p className="flex-grow text-sm text-gray-200">{prompt}</p>
              <button
                onClick={() => handleRemovePrompt(index)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                aria-label="プロンプトを削除"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center mt-3">
          <input
            type="text"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPrompt()}
            placeholder="例：背景を赤に変更..."
            className="flex-grow bg-gray-900 border border-gray-600 rounded-l-md p-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
          <button
            onClick={handleAddPrompt}
            className="bg-violet-600 hover:bg-violet-700 text-white p-2"
            aria-label="プロンプトを追加"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleAddHint}
            className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-r-md"
            aria-label="プロンプトのヒントを追加"
          >
            <LightbulbIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Style Presets */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-violet-300">3. スタイルプリセット</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="brandColor" className="text-gray-300">ブランドカラー</label>
            <div className="flex items-center bg-gray-700 rounded-md px-2">
              <span className="text-gray-400">#</span>
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
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="textureToggle" className="text-gray-300">テクスチャ</label>
            <button
              onClick={() => setUseTexture(!useTexture)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${useTexture ? 'bg-violet-500' : 'bg-gray-600'}`}
              id="textureToggle"
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${useTexture ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="transparentToggle" className="text-gray-300">背景の透過</label>
            <button
              onClick={() => setUseTransparentBackground(!useTransparentBackground)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${useTransparentBackground ? 'bg-violet-500' : 'bg-gray-600'}`}
              id="transparentToggle"
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${useTransparentBackground ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* 4. Individual Color Specification */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-violet-300">4. 個別カラー指定</h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label htmlFor="colorTemplateToggle" className="text-gray-300">機能を有効化</label>
                <button
                    onClick={() => setUseColorTemplates(!useColorTemplates)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${useColorTemplates ? 'bg-violet-500' : 'bg-gray-600'}`}
                    id="colorTemplateToggle"
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${useColorTemplates ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            {useColorTemplates && (
                <div className="space-y-3 pt-4 mt-4 border-t border-gray-700/50">
                    {colorTemplates.map((template, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleColorTemplateToggle(index)}
                                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${template.enabled ? 'bg-violet-500' : 'bg-gray-600'}`}
                                    aria-label={`${template.category}を${template.enabled ? '無効化' : '有効化'}`}
                                >
                                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${template.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <label htmlFor={`color-template-${index}`} className={`text-sm ${template.enabled ? 'text-gray-300' : 'text-gray-500'}`}>{template.category}</label>
                            </div>
                            <div className={`flex items-center bg-gray-700 rounded-md px-2 ${!template.enabled && 'opacity-50'}`}>
                                <span className="text-gray-400">#</span>
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

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={!isApiKeySelected || isLoading || !baseImage || prompts.length === 0}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            {/* FIX: The viewBox attribute contained invalid text, which broke JSX parsing. Replaced it with a standard value. */}
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>生成中...</span>
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5" />
            <span>バリエーションを生成</span>
          </>
        )}
      </button>
    </div>
  );
};