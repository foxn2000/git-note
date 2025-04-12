import React from 'react';

interface LoadingIndicatorProps {
  isLoading: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }

  // 簡単なローディング表示（必要に応じてスタイルを調整）
  return (
    <div className="loading-indicator">
      <p>分析中です...</p>
      {/* ここにスピナーなどのUI要素を追加できます */}
    </div>
  );
};

export default LoadingIndicator;
