import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import ChatInterface from './components/ChatInterface';
import useAnalysis from './hooks/useAnalysis';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import './App.css';

const AppContent = () => {
  const { translations } = useLanguage();
  const { isLoading, error, generatedArticle, analyzeRepository } = useAnalysis();
  const [isChatOpen, setIsChatOpen] = useState(false); // チャット表示状態

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  const handleFormSubmit = (repoName: string, language: string) => {
    // analyzeRepositoryを呼び出して分析を開始
    analyzeRepository(repoName, language);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>{translations.header.title}</h1>
      </header>
      <main>
        <InputForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        <LoadingIndicator isLoading={isLoading} />
        <ErrorDisplay error={error} />
        <ResultDisplay article={generatedArticle} />
        {generatedArticle && !isLoading && !error && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={openChat} className="chat-button">
              {translations.chat.button}
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
};

const App = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
