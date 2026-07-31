/**
 * 画面に出すエラーの種別。
 * UI側は文言の前方一致ではなくこの`kind`で分岐すること。
 */
export type AppErrorKind = 'apiKey' | 'validation' | 'generation';

export interface AppError {
  kind: AppErrorKind;
  /** 利用者向けの文言。内部エラーの生の文字列を含めてはならない */
  message: string;
}

/**
 * APIキーの不備を示す語句。Gemini APIのエラーは英語で返るため英語で照合する。
 * 'not found'のような汎用語は誤検知するので含めない。
 */
const API_KEY_ERROR_PATTERNS = [
  'api key',
  'api_key',
  'permission denied',
  'permission_denied',
  'unauthenticated',
  'unauthorized',
  'billing',
  'quota',
  'resource_exhausted',
];

/** APIキーの問題として扱うHTTPステータス */
const API_KEY_ERROR_STATUSES = [401, 403, 429];

/** 例外オブジェクトからHTTPステータスを取り出す。取れなければundefined */
const readStatus = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
};

/** ログ用に生のメッセージを取り出す。画面には出さないこと */
export const readErrorDetail = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    // JSON.stringifyはundefinedや関数に対して文字列を返さないため、必ずString()で受ける
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
};

export const isApiKeyError = (error: unknown): boolean => {
  const status = readStatus(error);
  if (status !== undefined && API_KEY_ERROR_STATUSES.includes(status)) {
    return true;
  }

  const detail = readErrorDetail(error).toLowerCase();
  return API_KEY_ERROR_PATTERNS.some(pattern => detail.includes(pattern));
};

/**
 * 生成時の例外を、画面に出して安全なエラーへ変換する。
 *
 * 生のエラー文字列はリクエストURLなどを含むことがあるため、`message`には載せない。
 * 呼び出し側で`readErrorDetail`をconsoleに出して調査に使う。
 */
export const classifyGenerationError = (error: unknown): AppError => {
  if (isApiKeyError(error)) {
    return {
      kind: 'apiKey',
      message: 'APIキーが無効か、必要な権限がありません。',
    };
  }

  return {
    kind: 'generation',
    message: '画像の生成に失敗しました。しばらく待ってから再試行してください。',
  };
};

/** 中断由来の例外かどうか。キャンセル操作はエラー表示しない */
export const isAbortError = (error: unknown): boolean => {
  if (error instanceof Error && error.name === 'AbortError') return true;
  return readErrorDetail(error).toLowerCase().includes('abort');
};
