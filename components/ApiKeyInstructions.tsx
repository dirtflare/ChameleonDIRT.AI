import React from 'react';

export const ApiKeyInstructions: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div
      role="alert"
      className="text-center text-gray-400 p-8 bg-red-900/20 rounded-lg border-2 border-dashed border-red-500/30 flex flex-col items-center justify-center h-full"
    >
      <svg aria-hidden="true" className="w-16 h-16 mb-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-2xl font-bold text-red-300">APIキーエラーが発生しました</h3>
      <p className="mt-2 mb-6 max-w-2xl text-red-300/80">{message}</p>

      {/*
        生のAPIエラーはここには出さない。リクエストURLなど内部情報を含みうるため、
        詳細はブラウザのコンソールにのみ記録している。
      */}

      <div className="text-left space-y-4 max-w-2xl">
        <p className="font-semibold text-gray-200">問題を解決するには、以下の点をご確認ください：</p>
        <div className="flex items-start space-x-3">
          <span aria-hidden="true" className="font-bold text-violet-400 text-lg">1.</span>
          <div>
            <h4 className="font-semibold text-gray-200">APIキーが有効か</h4>
            <p className="text-sm text-gray-400">
              Google AI Studioでキーの状態を確認し、必要であれば新しいキーを発行してください。
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline ml-1">
                APIキーを管理
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <span aria-hidden="true" className="font-bold text-violet-400 text-lg">2.</span>
          <div>
            <h4 className="font-semibold text-gray-200">利用量の上限や課金設定に問題がないか</h4>
            <p className="text-sm text-gray-400">
              無料枠を超えている場合や課金が未設定の場合、リクエストは拒否されます。
              <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline ml-1">
                利用制限を確認
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <span aria-hidden="true" className="font-bold text-violet-400 text-lg">3.</span>
          <div>
            <h4 className="font-semibold text-gray-200">自分で動かしている場合、キーが正しく読み込まれているか</h4>
            <p className="text-sm text-gray-400">
              <code className="text-gray-300">.env.local</code> に <code className="text-gray-300">GEMINI_API_KEY</code> を設定し、開発サーバーを再起動してください。設定は起動時にのみ読み込まれます。
            </p>
          </div>
        </div>
      </div>
       <p className="mt-6 text-sm text-gray-500">
        上記を確認後、左のパネルから再度APIキーを選択し直してください。詳しいエラー内容はブラウザの開発者コンソールに出力しています。
      </p>
    </div>
  );
};
