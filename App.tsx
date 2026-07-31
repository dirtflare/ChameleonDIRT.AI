import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ControlsPanel } from './components/ControlsPanel';
import { ResultsGrid } from './components/ResultsGrid';
import { GeneratedImage, ColorTemplate } from './types';
import { fileToBase64, downloadImage, validateImageFile } from './utils/file';
import { AppError, classifyGenerationError, isAbortError, readErrorDetail } from './utils/errors';
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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  // 実行中のリクエストを中断するためのコントローラ
  const abortControllerRef = useRef<AbortController | null>(null);
  // 古い実行の結果で新しい実行を上書きしないための識別子
  const runIdRef = useRef<number>(0);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsApiKeySelected(hasKey);
        } catch (e) {
          console.error("APIキーの確認に失敗しました:", e);
          setError({ kind: 'apiKey', message: 'APIキーのステータスを確認できませんでした。' });
          setIsApiKeySelected(false);
        }
      } else {
        console.warn('window.aistudioが見つかりません。APIキー選択UIは利用できません。');
        // フォールバックとしてprocess.envをチェック。
        // 'undefined'は、ビルド時の置換でキー未設定が文字列化された場合に入りうる値。
        const key = process.env.API_KEY;
        const placeholders = ['', 'undefined', 'YOUR_API_KEY_HERE'];
        setIsApiKeySelected(!!key && !placeholders.includes(key));
      }
    };
    checkApiKey();
  }, []);
  
  const handleSelectApiKey = async () => {
    // AI Studio外ではダイアログが存在しない。自分で動かしている利用者には
    // 「開けませんでした」ではなく、実際にやるべきことを案内する。
    if (!window.aistudio) {
      setError({
        kind: 'apiKey',
        message: 'この環境ではAPIキーの選択ダイアログを利用できません。.env.local に GEMINI_API_KEY を設定し、開発サーバーを再起動してください。',
      });
      return;
    }

    try {
      await window.aistudio.openSelectKey();
      // レースコンディションを避けるため、成功を想定して即座にUIを更新
      setIsApiKeySelected(true);
      setError(null);
    } catch (e) {
      console.error("APIキーの選択に失敗しました:", e);
      setError({ kind: 'apiKey', message: 'APIキーの選択ダイアログを開けませんでした。' });
    }
  };

  const handleImageUpload = (file: File) => {
    const result = validateImageFile(file);
    if (!result.valid) {
      setError({ kind: 'validation', message: result.message });
      return;
    }

    // 以前のプレビューURLを解放してから差し替える
    if (baseImage) {
      URL.revokeObjectURL(baseImage.preview);
    }
    const preview = URL.createObjectURL(file);
    setBaseImage({ file, preview });
    setError(null);
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

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleGenerate = useCallback(async () => {
    // ボタンのdisabledに加えた二重送信の防止線
    if (isLoading) {
      return;
    }
    if (!isApiKeySelected) {
      setError({ kind: 'validation', message: '最初にAPIキーを選択してください。' });
      return;
    }
    if (!baseImage) {
      setError({ kind: 'validation', message: '最初にベース画像をアップロードしてください。' });
      return;
    }
    if (prompts.length === 0) {
      setError({ kind: 'validation', message: '編集プロンプトを少なくとも1つ追加してください。' });
      return;
    }

    const runId = ++runIdRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const isCurrentRun = () => runIdRef.current === runId;

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setProgress({ done: 0, total: prompts.length });

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

      const imagePromises = prompts.map((prompt, index) => {
        const fullPrompt = [
          prompt,
          `ブランドカラー #${brandColor.replace('#', '')} を取り入れてください。`,
          useTexture ? '繊細でエレガントなテクスチャを重ねてください。' : '',
          useTransparentBackground ? '背景を透過（透明）にしてください。生成する画像はPNG形式で、背景が完全に透明になるようにしてください。' : '',
          colorPromptPart,
          '重要指示：元の画像にある既存のテキスト、ロゴ、クーポンコードはすべてそのまま維持してください。全体のレイアウト比率は変更しないでください。'
        ].filter(Boolean).join(' ');
        
        return generateImage(base64Image, mimeType, fullPrompt, controller.signal)
          .then(imageUrl => ({
            // 同じプロンプトを複数追加できるため、キーにはindexを含める
            id: `${index}-${prompt}-${runId}`,
            prompt,
            imageUrl,
          }))
          .finally(() => {
            if (isCurrentRun()) {
              setProgress(prev => (prev ? { ...prev, done: prev.done + 1 } : prev));
            }
          });
      });

      const results = await Promise.allSettled(imagePromises);

      // 実行中に再生成が始まっていた場合、この実行の結果は破棄する
      if (!isCurrentRun()) {
        return;
      }

      const successfulImages = results
        .filter((result): result is PromiseFulfilledResult<GeneratedImage> => result.status === 'fulfilled')
        .map(result => result.value);

      setGeneratedImages(successfulImages);

      // キャンセル時は、間に合った分だけ表示してエラーは出さない
      if (controller.signal.aborted) {
        return;
      }

      const failures = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      if (failures.length > 0) {
        failures.forEach(reason => console.error('画像生成エラー:', readErrorDetail(reason)));

        // Promise.allSettledはrejectしないため、個別の失敗はここで判定する必要がある。
        // APIキーの問題は再試行しても直らないので、汎用文言より優先して案内する。
        const apiKeyFailure = failures.map(classifyGenerationError).find(e => e.kind === 'apiKey');

        if (apiKeyFailure) {
          setError(apiKeyFailure);
          setIsApiKeySelected(false);
        } else {
          setError({
            kind: 'generation',
            message: `${failures.length}個のプロンプトで画像を生成できませんでした。再試行するか、プロンプトを修正してください。`,
          });
        }
      }
    } catch (e) {
      if (!isCurrentRun() || isAbortError(e)) {
        return;
      }
      // 生の内容はコンソールにのみ出す。リクエストURL等を含みうるため画面には出さない
      console.error('画像生成エラー:', readErrorDetail(e));

      const appError = classifyGenerationError(e);
      setError(appError);
      if (appError.kind === 'apiKey') {
        setIsApiKeySelected(false);
      }
    } finally {
      if (isCurrentRun()) {
        setIsLoading(false);
        setProgress(null);
        abortControllerRef.current = null;
      }
    }
  }, [baseImage, prompts, brandColor, useTexture, useTransparentBackground, isApiKeySelected, useColorTemplates, colorTemplates, isLoading]);

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
            onCancel={handleCancel}
            isLoading={isLoading}
            progress={progress}
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
            progress={progress}
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