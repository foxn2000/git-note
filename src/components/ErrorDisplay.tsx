import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) {
    return null;
  }

  // 簡単なエラー表示（必要に応じてスタイルを調整）
  return (
    <div className="error-display" style={{ color: 'red', marginTop: '1rem' }}>
      <h3>エラーが発生しました</h3>
      <p>{error}</p>
    </div>
  );
};

export default ErrorDisplay;
