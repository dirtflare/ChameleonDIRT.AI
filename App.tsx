import React, { useState, useCallback, useEffect } from 'react';
import { ControlsPanel } from './components/ControlsPanel';
import { ResultsGrid } from './components/ResultsGrid';
import { GeneratedImage, ColorTemplate } from './types';
import { fileToBase64, downloadImage } from './utils/file';
import { generateImage } from './services/gemini';
import { Header } from './components/Header';
import { PreviewModal } from './components/PreviewModal';

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<{ file: File; preview: string } | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [brandColor, setBrandColor] = useState<string>('#FFFFFF');
  const [useTexture, setUseTexture] = useState<boolean>(false);
  const [useTransparentBackground, setUseTransparentBackground] = useState<boolean>(false);
  
  const [useColorTemplates, setUseColorTemplates] = useState<boolean>(false);
  const initialColorTemplates: ColorTemplate[] = [
    { category: '髪型（装飾品含む）', color: '#8B4513', enabled: true },
    { category: '顔', color: '#FFDDC1', enabled: true },
    { category: '体', color: '#4682B4', enabled: true },
    { category: '靴', color: '#000000', enabled: true },
    { category: '小物', color: '#FFD700', enabled: true },
    { category: 'アクセサリー', color: '#C0C0C0', enabled: true },
    { category: '背景', color: '#F0F8FF', enabled: true },
  ];
  const [colorTemplates, setColorTemplates] = useState<ColorTemplate[]>(initialColorTemplates);

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsApiKeySelected(hasKey);
        } catch (e) {
          console.error("APIキーの確認に失敗しました:", e);
          setError("APIキーのステータスを確認できませんでした。");
          setIsApiKeySelected(false);
        }
      } else {
        console.warn('window.aistudioが見つかりません。APIキー選択UIは利用できません。');
        // フォールバックとしてprocess.envをチェック
        setIsApiKeySelected(!!process.env.API_KEY && process.env.API_KEY !== 'YOUR_API_KEY_HERE');
      }
    };
    checkApiKey();
  }, []);
  
  const handleSelectApiKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // レースコンディションを避けるため、成功を想定して即座にUIを更新
      setIsApiKeySelected(true);
      setError(null);
    } catch (e) {
      console.error("APIキーの選択に失敗しました:", e);
      setError("APIキーの選択ダイアログを開けませんでした。");
    }
  };

  const handleImageUpload = (file: File) => {
    const preview = URL.createObjectURL(file);
    setBaseImage({ file, preview });
  };
  
  const handleRemoveBaseImage = () => {
    if (baseImage) {
      URL.revokeObjectURL(baseImage.preview);
    }
    setBaseImage(null);
  };
  
  const handleSelectImage = (image: GeneratedImage) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleDownloadWithNewName = (image: GeneratedImage, newName: string) => {
    downloadImage(image.imageUrl, newName);
  };

  const handleGenerate = useCallback(async () => {
    if (!isApiKeySelected) {
      setError('最初にAPIキーを選択してください。');
      return;
    }
    if (!baseImage) {
      setError('最初にベース画像をアップロードしてください。');
      return;
    }
    if (prompts.length === 0) {
      setError('編集プロンプトを少なくとも1つ追加してください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const base64Image = await fileToBase64(baseImage.file);
      const mimeType = baseImage.file.type;
      
      let colorPromptPart = '';
      if (useColorTemplates) {
          const colorSpecs = colorTemplates
              .filter(t => t.enabled)
              .map(t => `${t.category}を${t.color}の色合いにする`)
              .join('、');
          if (colorSpecs) {
            colorPromptPart = `以下の個別カラー指定を厳密に適用してください: ${colorSpecs}。`;
          }
      }

      const imagePromises = prompts.map(prompt => {
        const fullPrompt = [
          prompt,
          `ブランドカラー #${brandColor.replace('#', '')} を取り入れてください。`,
          useTexture ? '繊細でエレガントなテクスチャを重ねてください。' : '',
          useTransparentBackground ? '背景を透過（透明）にしてください。生成する画像はPNG形式で、背景が完全に透明になるようにしてください。' : '',
          colorPromptPart,
          '重要指示：元の画像にある既存のテキスト、ロゴ、クーポンコードはすべてそのまま維持してください。全体のレイアウト比率は変更しないでください。'
        ].filter(Boolean).join(' ');
        
        return generateImage(base64Image, mimeType, fullPrompt).then(imageUrl => ({
          id: `${prompt}-${Date.now()}`,
          prompt,
          imageUrl,
        }));
      });

      const results = await Promise.allSettled(imagePromises);

      const successfulImages = results
        .filter((result): result is PromiseFulfilledResult<GeneratedImage> => result.status === 'fulfilled')
        .map(result => result.value);

      const failedPrompts = results
        .filter(result => result.status === 'rejected')
        .length;

      if (failedPrompts > 0) {
        setError(`${failedPrompts}個のプロンプトで画像を生成できませんでした。再試行するか、プロンプトを修正してください。`);
      }

      setGeneratedImages(successfulImages);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      
      if (errorMessage.includes('API key') || 
          errorMessage.includes('not found') ||
          errorMessage.includes('permission') ||
          errorMessage.includes('billing')) {
        setError(`APIキーエラーが発生しました。別のキーを選択するか、キーの権限とプロジェクトの課金設定を確認してください。エラー詳細: "${errorMessage}"`);
        setIsApiKeySelected(false); 
      } else {
        setError(`画像の生成中に予期せぬエラーが発生しました。エラー詳細: "${errorMessage}"`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [baseImage, prompts, brandColor, useTexture, useTransparentBackground, isApiKeySelected, useColorTemplates, colorTemplates]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 xl:col-span-3">
          <ControlsPanel
            baseImage={baseImage}
            onImageUpload={handleImageUpload}
            onRemoveBaseImage={handleRemoveBaseImage}
            prompts={prompts}
            setPrompts={setPrompts}
            brandColor={brandColor}
            setBrandColor={setBrandColor}
            useTexture={useTexture}
            setUseTexture={setUseTexture}
            useTransparentBackground={useTransparentBackground}
            setUseTransparentBackground={setUseTransparentBackground}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            isApiKeySelected={isApiKeySelected}
            onSelectApiKey={handleSelectApiKey}
            useColorTemplates={useColorTemplates}
            setUseColorTemplates={setUseColorTemplates}
            colorTemplates={colorTemplates}
            setColorTemplates={setColorTemplates}
          />
        </div>
        <div className="lg:col-span-8 xl:col-span-9">
          <ResultsGrid
            generatedImages={generatedImages}
            isLoading={isLoading}
            error={error}
            onImageSelect={handleSelectImage}
          />
        </div>
      </main>
      {selectedImage && (
        <PreviewModal 
          image={selectedImage}
          onClose={handleCloseModal}
          onDownload={handleDownloadWithNewName}
        />
      )}
    </div>
  );
};

export default App;