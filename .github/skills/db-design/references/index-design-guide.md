# インデックス設計ガイド (PostgreSQL)

## 基本原則

1. **主キー**: 自動でユニークインデックスが作成される（追加不要）
2. **外部キー**: PostgreSQL は自動でインデックスを作成しないため、**必ず明示的に作成**
3. **UNIQUE 制約**: 自動でユニークインデックスが作成される（追加不要）

## インデックス種別の選定

| 種別 | 用途 | PostgreSQL 構文 |
|------|------|----------------|
| B-tree（デフォルト） | 等値検索・範囲検索・ORDER BY | `CREATE INDEX idx ON t(col)` |
| Hash | 等値検索のみ（範囲不可） | `CREATE INDEX idx ON t USING hash(col)` |
| GIN | 全文検索・配列・JSONB | `CREATE INDEX idx ON t USING gin(col)` |
| GiST | 地理空間・範囲型 | `CREATE INDEX idx ON t USING gist(col)` |

## 設計チェックリスト

### 必須インデックス

- [ ] 外部キーカラムすべてにインデックスがある
- [ ] `WHERE` 句で頻繁に使用されるカラムにインデックスがある
- [ ] `ORDER BY` + `LIMIT` パターンに対応するインデックスがある

### 複合インデックス

- [ ] カーディナリティの高いカラムを先頭に配置
- [ ] `WHERE a = ? AND b = ?` パターンに `(a, b)` インデックスを検討
- [ ] 既存の単一カラムインデックスが複合インデックスでカバーされる場合、単一側を削除検討

### 部分インデックス

アクティブなレコードのみ検索する場合に有効:

```sql
-- status が AVAILABLE の book_copies のみインデックス
CREATE INDEX IF NOT EXISTS idx_book_copies_available
  ON book_copies(book_id)
  WHERE status = 'AVAILABLE';
```

### 全文検索 (GIN)

```sql
-- title と author を結合した全文検索インデックス
CREATE INDEX IF NOT EXISTS idx_books_search
  ON books USING gin(to_tsvector('english', title || ' ' || author));
```

## アンチパターン

| パターン | 問題 |
|----------|------|
| 全カラムにインデックス | 書き込み性能の低下・ストレージ浪費 |
| 低選択性カラムの単独インデックス | boolean や status（値が2-3種）は単独では効果薄 |
| 重複インデックス | `(a)` と `(a, b)` が両方ある場合、`(a)` は冗長 |
| 未使用インデックス | `pg_stat_user_indexes` で `idx_scan = 0` を定期確認 |

## 命名規則（プロジェクト標準）

```
idx_{テーブル名}_{カラム名}            -- 単一カラム
idx_{テーブル名}_{カラム1}_{カラム2}   -- 複合
idx_{テーブル名}_search               -- 全文検索
```
