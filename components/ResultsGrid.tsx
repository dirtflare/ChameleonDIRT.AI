import React from 'react';
import { GeneratedImage, ExportPreset } from '../types';
import { downloadAllAsZip, resizeAndExportAll } from '../utils/file';
import { PackageIcon, InstagramIcon, StoryIcon, SparklesIcon } from './icons';
import { ApiKeyInstructions } from './ApiKeyInstructions';

interface ResultsGridProps {
  generatedImages: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
  onImageSelect: (image: GeneratedImage) => void;
}

const ImageCard: React.FC<{ image: GeneratedImage, onSelect: () => void }> = ({ image, onSelect }) => {
  return (
    <div 
      className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 cursor-pointer"
      onClick={onSelect}
    >
      <img src={image.imageUrl} alt={image.prompt} className="w-full h-auto aspect-square object-cover" />
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
        <p className="text-sm text-gray-200 line-clamp-3">{image.prompt}</p>
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => {
    return (
        <div className="text-center text-gray-500 p-10 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center h-full min-h-[400px]">
            <SparklesIcon className="w-16 h-16 mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-400">画像バリエーションはここに表示されます</h3>
            <p className="mt-2 max-w-sm">画像をアップロードし、編集プロンプトを追加して「バリエーションを生成」をクリックしてください。</p>
        </div>
    );
};


const LoadingState: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: count > 0 ? count : 3 }).map((_, i) => (
      <div key={i} className="bg-gray-800 rounded-lg aspect-square animate-pulse"></div>
    ))}
  </div>
);


export const ResultsGrid: React.FC<ResultsGridProps> = ({ generatedImages, isLoading, error, onImageSelect }) => {
  
  const EXPORT_PRESETS: ExportPreset[] = [
    { name: 'インスタ投稿', key: 'instagram-post', width: 1080, height: 1350, icon: <InstagramIcon className="w-5 h-5"/> },
    { name: 'インスタストーリー', key: 'instagram-story', width: 1080, height: 1920, icon: <StoryIcon className="w-5 h-5"/> },
  ];
  
  const handleExport = (preset: ExportPreset) => {
    resizeAndExportAll(generatedImages, preset.width, preset.height, `export-${preset.key}`);
  };


  const hasResults = generatedImages.length > 0;
  const isApiKeyError = error && error.startsWith('APIキーエラー');

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 min-h-[500px] lg:min-h-0 flex flex-col">
      {error && !isApiKeyError && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4">{error}</div>}
      
      {hasResults && !isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">生成されたバリエーション</h2>
            <div className='flex items-center gap-2 flex-wrap'>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">すべてエクスポート:</span>
                     {EXPORT_PRESETS.map(preset => (
                       <button
                         key={preset.name}
                         onClick={() => handleExport(preset)}
                         className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold py-2 px-3 rounded-md transition-colors"
                       >
                         {preset.icon}
                         {preset.name}
                       </button>
                     ))}
                </div>
                 <button 
                    onClick={() => downloadAllAsZip(generatedImages)}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                    <PackageIcon className="w-5 h-5" />
                    すべてダウンロード (.zip)
                </button>
            </div>
        </div>
      )}

      <div className="flex-grow">
        {isApiKeyError ? (
          <ApiKeyInstructions error={error} />
        ) : isLoading ? (
          <LoadingState count={3} />
        ) : hasResults ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {generatedImages.map((image) => (
              <ImageCard key={image.id} image={image} onSelect={() => onImageSelect(image)} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};