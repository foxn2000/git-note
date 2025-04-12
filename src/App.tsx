import React, { useState } from 'react'; // useState をインポート
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import ChatInterface from './components/ChatInterface'; // ChatInterface をインポート
import useAnalysis from './hooks/useAnalysis';
import './App.css'; // 必要に応じてスタイルを調整

function App() {
  const { isLoading, error, generatedArticle, analyzeRepository } = useAnalysis();
  const [isChatOpen, setIsChatOpen] = useState(false); // チャット表示状態

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  const handleFormSubmit = (repoName: string, language: string) => {
    // analyzeRepositoryを呼び出して分析を開始
    analyzeRepository(repoName, language);
  };

  return (
    <div className="App"> {/* Keep or remove this wrapper if not needed */}
      <header className="app-header"> {/* Apply the new header class */}
        <h1>GitNote: GitHubリポジトリ分析レポート生成</h1>
      </header>
      <main>
        <InputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        <LoadingIndicator isLoading={isLoading} />
        <ErrorDisplay error={error} />
        <ResultDisplay article={generatedArticle} />
        {generatedArticle && !isLoading && !error && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={openChat} className="chat-button"> {/* スタイルは App.css で定義推奨 */}
              この記事についてAIに質問する
            </button>
          </div>
        )}
      </main>
      {isChatOpen && generatedArticle && (
        <ChatInterface articleContent={generatedArticle} onClose={closeChat} />
      )}
      <footer>
        {/* フッター情報など */}
      </footer>
    </div>
  );
}

export default App;
