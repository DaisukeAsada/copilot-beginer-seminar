import React from 'react';

/**
 * ホームページ
 */
export function HomePage(): React.ReactElement {
  return (
    <div data-testid="home-page">
      <h1>図書館蔵書管理システム</h1>
      <p>蔵書の管理・検索・貸出・返却を効率的に行うシステムです。</p>
    </div>
  );
}
