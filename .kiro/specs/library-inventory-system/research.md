# Research & Design Decisions

## Summary
- **Feature**: `library-inventory-system`
- **Discovery Scope**: New Feature（グリーンフィールド開発）
- **Key Findings**:
  - レイヤードアーキテクチャとクリーンアーキテクチャの組み合わせが図書館システムに最適
  - TypeScript + Node.js + PostgreSQL の構成が蔵書管理の要件に適合
  - ISBNバリデーション、予約キュー管理、通知システムが主要な技術的課題

## Research Log

### 図書館システムのドメイン分析
- **Context**: 蔵書管理システムのコアドメインと境界の特定
- **Sources Consulted**: 図書館情報学の標準、MARC21、ISBN規格
- **Findings**:
  - 主要ドメイン: 蔵書管理、利用者管理、貸出管理、予約管理、統計レポート
  - ISBN-10とISBN-13の両方をサポートする必要あり
  - 書籍の状態管理が重要（貸出可能、貸出中、予約中、修理中など）
- **Implications**: 明確なドメイン境界を設定し、各ドメインを独立したモジュールとして設計

### 技術スタック選定
- **Context**: 中規模図書館向けWebベースの蔵書管理システム
- **Sources Consulted**: Node.js/TypeScript エコシステム、PostgreSQL ドキュメント
- **Findings**:
  - TypeScript: 型安全性によりドメインモデルの整合性を保証
  - Node.js/Express: 軽量で十分なパフォーマンス、エコシステムが充実
  - PostgreSQL: リレーショナルデータに最適、全文検索機能内蔵
  - React: 管理画面UIに適した成熟したフレームワーク
- **Implications**: MERN代替としてPERN（PostgreSQL, Express, React, Node）スタックを採用

### 検索機能の実装方針
- **Context**: 蔵書検索の効率的な実装
- **Sources Consulted**: PostgreSQL全文検索、Elasticsearch比較
- **Findings**:
  - PostgreSQL `tsvector` と `GIN` インデックスで日本語対応可能
  - 初期規模ではElasticsearch不要、PostgreSQL FTSで十分
  - 将来的な拡張性のためリポジトリパターンで検索を抽象化
- **Implications**: PostgreSQL FTSを採用し、検索インターフェースを抽象化

### 通知システム設計
- **Context**: 予約書籍の返却通知、延滞通知の実装
- **Sources Consulted**: Node.js メール送信ライブラリ、ジョブキュー
- **Findings**:
  - Nodemailer: SMTPベースのメール送信に十分
  - Bull/BullMQ: Redis ベースのジョブキューで非同期処理
  - 通知は非同期処理で実行し、メインフローをブロックしない
- **Implications**: 通知サービスを独立させ、ジョブキューで非同期実行

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| レイヤードアーキテクチャ | Controller-Service-Repository の3層構造 | シンプル、理解しやすい、小中規模に最適 | 大規模化で依存関係が複雑化 | 基本構造として採用 |
| クリーンアーキテクチャ | ドメイン中心の依存性逆転 | ドメインロジックの独立性、テスタビリティ向上 | 初期実装コストが高い | ドメイン層に適用 |
| マイクロサービス | 機能別に独立したサービス | 独立デプロイ、スケーラビリティ | 運用複雑性、オーバーエンジニアリング | 現時点では不採用 |

## Design Decisions

### Decision: モジュラーモノリスアーキテクチャの採用
- **Context**: 中規模図書館向けシステムで、適切な複雑性と拡張性のバランスが必要
- **Alternatives Considered**:
  1. 純粋なレイヤードアーキテクチャ — シンプルだが境界が曖昧になりやすい
  2. マイクロサービス — 過度に複雑、運用コスト高
  3. モジュラーモノリス — 明確な境界を持ちつつ単一デプロイ
- **Selected Approach**: モジュラーモノリスを採用。ドメインごとにモジュールを分離しつつ、単一アプリケーションとしてデプロイ
- **Rationale**: 開発初期の複雑性を抑えつつ、将来のマイクロサービス化への移行パスを確保
- **Trade-offs**: 初期実装は若干複雑になるが、長期的な保守性が向上
- **Follow-up**: モジュール間の依存関係を監視し、循環依存を防ぐ

### Decision: PostgreSQL全文検索の採用
- **Context**: 蔵書検索機能の実装
- **Alternatives Considered**:
  1. LIKE検索 — シンプルだがパフォーマンス問題
  2. PostgreSQL FTS — 追加インフラ不要、十分な機能
  3. Elasticsearch — 高機能だがインフラ追加必要
- **Selected Approach**: PostgreSQL FTSを採用
- **Rationale**: 初期規模では十分な性能、追加コンポーネント不要で運用シンプル
- **Trade-offs**: 超大規模時にはElasticsearch移行が必要になる可能性
- **Follow-up**: 検索リポジトリを抽象化し、将来の切り替えを容易に

### Decision: 非同期通知システム
- **Context**: 予約通知、延滞通知の実装
- **Alternatives Considered**:
  1. 同期処理 — シンプルだがレスポンス遅延
  2. Redis + BullMQ — 信頼性の高いジョブキュー
  3. インメモリキュー — 永続化なし、障害時にジョブ消失
- **Selected Approach**: Redis + BullMQ によるジョブキュー
- **Rationale**: 通知の確実な配信と再試行機能が必要
- **Trade-offs**: Redis追加が必要だが、セッション管理にも活用可能
- **Follow-up**: 通知失敗時のリトライポリシーを定義

## Risks & Mitigations
- **日本語検索の精度** — PostgreSQL の `pg_trgm` 拡張と適切なトークナイザ設定で対応
- **ISBN重複登録** — 同一ISBNの複数コピー（蔵書）を区別するため、書籍マスタと蔵書コピーを分離
- **予約キューの整合性** — トランザクション制御と楽観的ロックで競合を防止
- **延滞計算の精度** — 日付計算はUTCベースで統一、タイムゾーン変換はUI層で実施

## References
- [PostgreSQL Full Text Search](https://www.postgresql.org/docs/current/textsearch.html) — 全文検索実装ガイド
- [BullMQ Documentation](https://docs.bullmq.io/) — ジョブキュー実装
- [ISBN Standard](https://www.isbn-international.org/) — ISBN規格
