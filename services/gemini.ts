import { GoogleGenAI, Modality } from '@google/genai';

export const generateImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string,
  abortSignal?: AbortSignal
): Promise<string> => {
  // 最新のAPIキーを確実に使用するため、呼び出しごとにインスタンスを生成
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
        abortSignal,
      },
    });

    // 安全フィルタなどで候補が返らないことがある。無防備に辿るとTypeErrorになり、
    // 下の分かりやすいエラーに到達しないため、ここで存在を確認する。
    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error('APIレスポンスに画像データが見つかりませんでした。');
  } catch (error) {
    console.error('Geminiでの画像生成エラー:', error);
    // エラーを呼び出し元にスローして、UI層でハンドリングできるようにする
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('画像の生成に失敗しました。詳細はコンソールを確認してください。');
  }
};