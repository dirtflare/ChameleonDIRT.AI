import React from 'react';

export const ApiKeyInstructions: React.FC<{ error: string | null }> = ({ error }) => {
  return (
    <div className="text-center text-gray-400 p-8 bg-red-900/20 rounded-lg border-2 border-dashed border-red-500/30 flex flex-col items-center justify-center h-full">
      <svg className="w-16 h-16 mb-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-2xl font-bold text-red-300">APIキーエラーが発生しました</h3>
      <p className="mt-2 mb-6 max-w-2xl text-red-300/80">
        選択されたAPIキーが無効か、必要な権限がありません。これは通常、Google Cloudプロジェクトの設定が原因です。
      </p>
      
      <div className="text-left bg-gray-800 p-4 rounded-md w-full max-w-xl mb-6">
        <p className="font-mono text-xs text-red-400 break-words">{error}</p>
      </div>

      <div className="text-left space-y-4 max-w-2xl">
        <p className="font-semibold text-gray-200">問題を解決するには、以下の点をご確認ください：</p>
        <div className="flex items-start space-x-3">
          <span className="font-bold text-violet-400 text-lg">1.</span>
          <div>
            <h4 className="font-semibold text-gray-200">プロジェクトの課金が有効になっているか</h4>
            <p className="text-sm text-gray-400">
              Gemini APIの利用には、APIキーが関連付けられているGoogle Cloudプロジェクトで課金が有効になっている必要があります。
              <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline ml-1">
                課金設定を確認
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <span className="font-bold text-violet-400 text-lg">2.</span>
          <div>
            <h4 className="font-semibold text-gray-200">"Vertex AI API" が有効になっているか</h4>
            <p className="text-sm text-gray-400">
              プロジェクトで "Vertex AI API" を有効にする必要があります。
              <a href="https://console.cloud.google.com/apis/library/aiplatform.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline ml-1">
                APIを有効化
              </a>
            </p>
          </div>
        </div>
      </div>
       <p className="mt-6 text-sm text-gray-500">
        上記を確認後、左のパネルから再度APIキーを選択し直してください。
      </p>
    </div>
  );
};
