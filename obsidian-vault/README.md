# Obsidian × Claude Code 環境

> 「AIを**使う**」から「AIで**システムを作る**」へ。
> 自分の文脈を書いた `CLAUDE.md` を Claude が毎セッション最初に読み、
> さらに毎朝 Claude が全ノートを自動で巡回してつながりを育て、古いものを整理します。

元ネタ：Anthropic メンバーの Obsidian セットアップ（`CLAUDE.md` + スケジュール実行）。
この `obsidian-vault/` フォルダがそのまま **Obsidian の Vault** かつ **Claude Code の作業ディレクトリ** です。

---

## 📁 中身

```
obsidian-vault/
├── CLAUDE.md                  ← ★ あなたの取扱説明書（まず最初に埋める）
├── 00-Inbox/                  とりあえず放り込む（未整理）
├── 01-Daily/                  デイリーノート (YYYY-MM-DD.md)
├── 02-Notes/                  永続ノート（1ノート1アイデア）
├── 03-Projects/               進行中プロジェクト
├── 04-Areas/                  継続的に世話する領域
├── 99-Archive/                古い・使わなくなったもの
├── templates/                 ノートのひな形（Obsidian Templates用）
├── scripts/
│   ├── daily-maintenance.sh              毎朝の自動巡回スクリプト
│   └── com.obsidian.claude.maintenance.plist  macOS launchd 設定例
├── .claude/commands/
│   └── daily-maintenance.md   「/daily-maintenance」の中身（Claudeへの指示）
└── logs/                      実行ログ
```

---

## 🚀 セットアップ（3ステップ）

### 1. Obsidian でこのフォルダを開く
1. [Obsidian](https://obsidian.md/)（無料）をインストール
2. 「Open folder as vault」で **この `obsidian-vault/` フォルダ** を選ぶ
3. （任意）設定 → Core plugins → **Templates** を有効化し、テンプレートフォルダを `templates` に指定

### 2. `CLAUDE.md` を自分仕様に書き換える
`CLAUDE.md` を開いて、各項目を **自分の言葉** で埋めます。
- 私について / 考え方 / 今やっていること / 話し方の希望
- これが Claude の「あなたの読み方」になります。空欄でも動きますが、埋めるほど精度が上がります。

### 3. Claude Code をこのフォルダで起動して確認
```bash
cd obsidian-vault
claude
```
起動すると Claude は `CLAUDE.md` を自動で読み込みます。試しに巡回を手動実行：
```
/daily-maintenance
```
`02-Notes/` のサンプル2ノートが相互リンクされ、当日のデイリーノートにレポートが残れば成功です。

---

## ⏰ 毎朝の自動実行（7:00）

Vault はローカルのファイルなので、**あなたのPC上で** スケジュール実行します。

### macOS（launchd 推奨）
```bash
# 1) plist内の /ABSOLUTE/PATH/TO/obsidian-vault を実際の絶対パスに置換
# 2) 配置してロード
cp scripts/com.obsidian.claude.maintenance.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.obsidian.claude.maintenance.plist
```
`pwd` で絶対パスを確認できます（例：`/Users/you/notes/obsidian-vault`）。

### macOS / Linux（cron でも可）
```bash
crontab -e
# 毎朝7:00 に実行（パスは自分の環境に合わせる）
0 7 * * * /bin/bash /ABSOLUTE/PATH/TO/obsidian-vault/scripts/daily-maintenance.sh
```

### 手動でテスト
```bash
./scripts/daily-maintenance.sh
tail -f logs/maintenance_*.log
```

> スクリプトは `claude -p "/daily-maintenance" --permission-mode acceptEdits` を無人実行します。
> Vault が git 管理下なら、変更を自動コミットもします（任意）。

---

## 🔒 安全設計

- 自動巡回は **非破壊的**：やることはリンク付け・整理・要約の追記が基本。
- ファイルの **削除はしない**（移動のみ。削除が要る場合はレポートで提案）。
- `99-Archive/` は勝手に消さない。
- 詳細なガードレールは `CLAUDE.md` と `.claude/commands/daily-maintenance.md` に記載。

## 💡 慣れてきたら
- `.claude/commands/` に自分用コマンドを追加（例：`/weekly-review`、`/inbox-zero`）。
- テンプレートを増やす（会議メモ、読書メモ など）。
- 実行時刻や頻度は plist / cron を編集して調整。
