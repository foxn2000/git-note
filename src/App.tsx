import React from 'react';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import useAnalysis from './hooks/useAnalysis';
import './App.css'; // 必要に応じてスタイルを調整

function App() {
  const { isLoading, error, generatedArticle, analyzeRepository } = useAnalysis();

  const handleFormSubmit = (repoName: string, language: string) => {
    // analyzeRepositoryを呼び出して分析を開始
    analyzeRepository(repoName, language);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>GitNote: GitHubリポジトリ分析レポート生成</h1>
      </header>
      <main>
        <InputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        <LoadingIndicator isLoading={isLoading} />
        <ErrorDisplay error={error} />
        <ResultDisplay article={generatedArticle} />
      </main>
      <footer>
        {/* フッター情報など */}
      </footer>
    </div>
  );
}

export default App;
