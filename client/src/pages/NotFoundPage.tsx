import React from 'react';

/**
 * 404ページ
 */
export function NotFoundPage(): React.ReactElement {
  return (
    <div data-testid="not-found-page">
      <h1>404 - ページが見つかりません</h1>
      <p>お探しのページは存在しません。</p>
    </div>
  );
}
