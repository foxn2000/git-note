import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ResultDisplayProps {
  article: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ article }) => {
  if (!article) {
    return null; // 記事がない場合は何も表示しない
  }

  return (
    <div className="result-display">
      <h2>生成された記事</h2>
      <ReactMarkdown>{article}</ReactMarkdown>
      {/* 必要に応じてコピーボタンなどを追加 */}
      <button onClick={() => navigator.clipboard.writeText(article)}>
        記事をコピー
      </button>
    </div>
  );
};

export default ResultDisplay;
