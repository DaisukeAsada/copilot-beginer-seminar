---
description: "OWASP Top 10 に基づくセキュリティコードレビューを実施する"
agent: "agent"
tools: [search, search/codebase]
---

# セキュリティコードレビュー — OWASP Top 10

以下のソースディレクトリを対象に、OWASP Top 10 (2021) の観点でセキュリティレビューを行ってください。

## 対象

- `src/` — Express バックエンド
- `client/src/` — React フロントエンド

## レビュー観点

各カテゴリについてコードを精査し、該当する問題があれば報告してください。

| # | OWASP カテゴリ | 着眼点 |
|---|---------------|--------|
| A01 | Broken Access Control | 認可チェック漏れ、RBAC バイパス、IDOR、CORS 設定不備 |
| A02 | Cryptographic Failures | 平文パスワード保存、弱いハッシュ、秘密情報のハードコード |
| A03 | Injection | SQL/NoSQL インジェクション、OS コマンドインジェクション、XSS |
| A04 | Insecure Design | ビジネスロジックの欠陥、レート制限の欠如、入力バリデーション不足 |
| A05 | Security Misconfiguration | デフォルト設定の放置、不要な機能の有効化、エラー情報の過剰露出 |
| A06 | Vulnerable and Outdated Components | 既知脆弱性のある依存パッケージ |
| A07 | Identification and Authentication Failures | セッション管理の不備、ブルートフォース対策の欠如 |
| A08 | Software and Data Integrity Failures | 安全でないデシリアライゼーション、CI/CD の整合性 |
| A09 | Security Logging and Monitoring Failures | 重要操作のログ不足、ログインジェクション |
| A10 | Server-Side Request Forgery (SSRF) | ユーザー入力による外部リクエスト |

## 出力形式

検出した問題を以下のテーブル形式で報告してください。問題がないカテゴリはスキップして構いません。

| OWASP カテゴリ | ファイル | 行 | 深刻度 | 問題の説明 | 推奨される修正 |
|---------------|---------|-----|--------|-----------|--------------|
| A0X: カテゴリ名 | path/to/file.ts | L42 | 高/中/低 | 具体的な問題 | 修正案 |

### 深刻度の基準

- **高**: 直接的なデータ漏洩・権限昇格・RCE につながるもの
- **中**: 特定条件下で悪用可能、または防御層が部分的に欠如しているもの
- **低**: ベストプラクティスからの逸脱、将来的なリスク

## 注意事項

- 推測ではなく、コード上の根拠を示してください。
- 誤検知を避け、実際に悪用可能な問題を優先してください。
- 最後に、全体的なセキュリティ評価サマリーを 3〜5 文で記載してください。
