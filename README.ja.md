[English](./README.md) | [Türkçe](./README.tr.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

> このドキュメントは英語のREADMEから翻訳されたものです。一部の表現が不自然な場合があります。

<p align="center">
  <img src="./docs/logo.jpg" alt="omm logo" width="80"/>
</p>

<h1 align="center">Oh-my-mermaid</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-mermaid"><img src="https://img.shields.io/npm/v/oh-my-mermaid" alt="npm version"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"/></a>
</p>

<p align="center">
  AIは数秒でコードを書きます。人間が理解するには数時間かかります。<br/>
  理解をスキップすると、コードベースはブラックボックスになります — あなた自身にとっても。<br/><br/>
  <strong>ommがそのギャップを埋めます — AIが生成した、人間のためのアーキテクチャドキュメント。</strong>
</p>

---

## クイックスタート

ターミナルに貼り付けてください：

```bash
npm install -g oh-my-mermaid && omm setup
```

AIコーディングツールを開き、`/omm-scan`スキルを実行：

```
/omm-scan
```

以上です。結果を表示：

```bash
omm view
```

## 例

> ommが自分自身をスキャンしました。これがその結果です。

<table><tr>
<td width="50%"><img src="./docs/screenshot.png" alt="omm viewer"/></td>
<td width="50%"><img src="./docs/demo.gif" alt="omm scan demo"/></td>
</tr></table>

## 仕組み

AIがコードベースを分析し、**パースペクティブ**を生成します — アーキテクチャを見るための様々なレンズ（構造、データフロー、外部連携など）。各パースペクティブにはMermaidダイアグラムとドキュメントフィールドが含まれます。

すべてのノードが**再帰的に分析**されます。複雑なノードは独自のダイアグラムを持つネストされた子エレメントになります。シンプルなノードはリーフとして残ります。ファイルシステムがツリーを直接反映します：

```
.omm/
├── overall-architecture/           ← パースペクティブ
│   ├── description.md
│   ├── diagram.mmd
│   ├── context.md
│   ├── main-process/               ← ネストされたエレメント
│   │   ├── description.md
│   │   ├── diagram.mmd
│   │   └── auth-service/           ← より深いネスト
│   │       └── ...
│   └── renderer/
│       └── ...
├── data-flow/
└── external-integrations/
```

ビューアはファイルシステムからネストを自動検出します — 子を持つエレメントは展開可能なグループとして、それ以外はノードとしてレンダリングされます。

各エレメントは最大7つのフィールドを持ちます：`description`、`diagram`、`context`、`constraint`、`concern`、`todo`、`note`。

## CLI

```bash
omm setup                          # AIツールにスキルを登録
omm view                           # インタラクティブビューアを開く
omm config language ja             # コンテンツ言語を設定
omm update                         # 最新バージョンに更新
```

完全なコマンドリストは`omm help`を参照してください。

## スキル

スキルは**AIコーディングツール内で**実行するコマンドです（ターミナルではありません）。`/`で始まります。

| スキル | 機能 |
| --- | --- |
| `/omm-scan` | コードベース分析 → アーキテクチャドキュメント生成 |
| `/omm-push` | ログイン + リンク + クラウドプッシュを一度に |

## クラウド

[ohmymermaid.com](https://ohmymermaid.com)を通じてアーキテクチャをクラウドに保存できます。

```bash
omm login && omm link && omm push
```

デフォルトではプライベートです。チームと共有したり、[この例](https://ohmymermaid.com/share/c47e20a7063c231760361ed9cb9ec4b6)のように公開できます。

## 対応AIツール

| プラットフォーム | セットアップ |
| --- | --- |
| Claude Code | `omm setup claude` |
| Codex | `omm setup codex` |
| Cursor | `omm setup cursor` |
| OpenClaw | `omm setup openclaw` |
| Antigravity | `omm setup antigravity` |

`omm setup`を実行すると、インストール済みのすべてのツールを自動検出して設定します。

## ロードマップ

[docs/ROADMAP.md](./docs/ROADMAP.md)を参照してください。

## 開発 & 貢献

```bash
git clone https://github.com/oh-my-mermaid/oh-my-mermaid.git
cd oh-my-mermaid
npm install && npm run build
npm test
```

IssueとPRを歓迎します。[Conventional Commits](https://www.conventionalcommits.org/)を使用してください。

## ライセンス

[MIT](./LICENSE)
