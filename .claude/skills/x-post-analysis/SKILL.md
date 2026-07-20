---
name: x-post-analysis
description: >-
  Analyze, verify, and structure copy-pasted X (Twitter) post content — tweet
  text, threads, quoted posts, replies, and video transcripts or descriptions —
  then decide what (if anything) should be incorporated into this repository.
  Use this skill whenever the user pastes X/Twitter content, shares an x.com or
  twitter.com URL, or mentions ツイート, ポスト, Xのコピペ, スレッド, 動画の内容,
  バズった投稿, or asks to 解析 / 分析 / 確認 / 取り込み (incorporate) social
  media content. Also trigger when an X URL fails to fetch — this environment's
  network policy blocks x.com and its mirrors, so the workflow is built around
  copy-pasted text instead.
---

# X 投稿コピペ解析スキル

## なぜこのスキルがあるか

このリモート実行環境のネットワークポリシーは `x.com` / `twitter.com` と
そのミラー(fxtwitter, syndication API など)への接続を 403 で拒否する。
そのため X の投稿は URL からは読めない。**ユーザーが貼り付けたテキストが唯一の入力**であり、
コピペには UI ノイズ(ボタンラベル、カウント数、広告)が混ざるため、
解析前に構造化が必要になる。

## Step 0 — URL しか無い場合

直接フェッチは 1 回だけ試してよい(WebFetch)。失敗したら再試行を繰り返さず、
ユーザーに以下を依頼する:

> 投稿を開いて全文をコピペしてください。含めてほしいもの:
> ① 投稿者名と @ハンドル ② 本文(スレッドなら全ツイート、順番どおり)
> ③ 投稿日時 ④ 動画・画像がある場合はその内容の説明か文字起こし
> ⑤ 引用元の投稿があればそれも

動画そのものは環境からは視聴できない。動画付き投稿では「本文」だけでなく
**動画内で語られている・表示されている内容**の説明を必ず求めること。
本文が短い動画ツイートは、価値の大半が動画側にある。

## Step 1 — パース(ノイズ除去と構造の復元)

コピペから以下を識別・抽出する:

- **投稿者**: 表示名、@ハンドル、認証マークの有無
- **本体**: 投稿本文。スレッドは番号や「···」区切りから順序を復元する
- **引用・返信**: 引用ポストや返信は本体と区別する(入れ子のコピペでは
  インデントや2つ目の名前ブロックが手がかり)
- **日時・エンゲージメント**: 投稿日時、表示回数・いいね・リポスト数(あれば)
- **メディア**: 動画の文字起こし・説明、画像 alt テキスト

除去してよい UI ノイズ: 「返信 / リポスト / いいね / ブックマーク / 共有」の
ラベル、単独行の数値カウント、「さらに表示」「Show more」「翻訳を表示」、
おすすめ投稿・広告(「プロモーション」ラベル)。
迷ったら削除せず「不明・要確認」として残す — 勝手に本文を削るほうが害が大きい。

## Step 2 — 分析

構造化した内容に対して:

1. **要旨**: 投稿が主張・紹介していることを 2〜3 文で
2. **主張の抽出**: 事実として述べられていることを箇条書きにする
3. **検証**: 検証可能な主張(ツール名、リリース、統計、手法)は WebSearch で
   裏を取る。X 自体は検索結果でもブロックされがちなので、公式ドキュメント・
   GitHub・ニュース記事を当たる。検証できなかったものは「未検証」と明記する
4. **信頼性メモ**: 投稿者の専門性が判断できる場合は添える。宣伝・誇張の兆候
   (アフィリエイトリンク、「9割の人が知らない」型の釣り文句)も指摘する

## Step 3 — このリポジトリへの取り込み判断

ChameleonDIRT.AI は React + TypeScript + Vite + Gemini の
ブラウザ画像編集ツールである。内容ごとの行き先の目安:

| 内容の種類 | 取り込み先 |
|---|---|
| プロンプト技法・画像編集テクニック | スタイルプリセット (`components/ControlsPanel.tsx`) や `services/gemini.ts` のプロンプト構築 |
| Gemini API の新機能・パラメータ | `services/gemini.ts`、必要なら `docs/` に調査メモ |
| UI/UX のアイデア | 提案としてまとめ、実装はユーザー確認後 |
| 一般的な知見・参考情報 | `docs/research/x-posts/YYYY-MM-DD-<slug>.md` にアーカイブ |
| 宣伝・未検証・無関係な内容 | 取り込まない(理由を報告) |

原則:

- 解析した投稿は取り込みの有無にかかわらず `docs/research/x-posts/` に
  構造化サマリーを保存する(出典 URL、取得日、検証結果を含める)。
  後から「あの投稿どうなった?」に答えられるようにするため
- ドキュメント追加・調査メモは指定ブランチに直接コミットしてよい。
  アプリコード(components / services)に触る変更は、先に提案を提示して
  ユーザーの了承を得てから実装する
- 未検証の主張をコードやドキュメントに事実として書かない

## 報告フォーマット

ユーザーへの最終報告は必ずこの構成で:

```
## 投稿サマリー
(投稿者 / 日時 / 要旨)

## 主な主張と検証結果
(主張ごとに ✅検証済み / ⚠️未検証 / ❌誤り と根拠)

## 取り込み内容
(何をどこに追加・変更したか、しなかった場合はその理由)

## 不明点
(コピペから読み取れず確認が必要なこと。無ければ省略)
```
