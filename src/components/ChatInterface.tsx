import React, { useState } from 'react';
import { useChatLLM } from '../hooks/useChatLLM';

interface ChatInterfaceProps {
  articleContent: string; // 現在の記事内容を受け取る
  onClose: () => void; // チャットを閉じるための関数
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ articleContent, onClose }) => {
  const [userInput, setUserInput] = useState('');
  const { messages, isLoading, error, sendMessage } = useChatLLM({ articleContent });

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    
    const message = userInput;
    setUserInput(''); // 入力欄をクリア
    await sendMessage(message);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // デフォルトの改行動作を抑制
      handleSendMessage();
    }
  };


  return (
    <div style={styles.overlay}>
      <div style={styles.chatContainer}>
        <div style={styles.header}>
          <h2>記事についてAIに質問</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div key={index} style={msg.sender === 'user' ? styles.userMessage : styles.aiMessage}>
              <p style={styles.messageText}>{msg.text}</p>
            </div>
          ))}
          {isLoading && <div style={styles.loadingIndicator}>AIが応答を生成中...</div>}
          {error && <div style={styles.errorMessage}>{error}</div>}
        </div>
        <div style={styles.inputArea}>
          <textarea
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="記事に関する質問を入力してください..."
            style={styles.textarea}
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            style={{
              ...styles.sendButton,
              ...( (isLoading || !userInput.trim()) && styles.sendButtonDisabled ) // disabled状態のスタイルを適用
            }}
            disabled={isLoading || !userInput.trim()}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
};

// 簡単なインラインスタイル (必要に応じてCSSファイルに移動)
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  chatContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    width: '90%',
    maxWidth: '600px',
    height: '70vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f7f7f7',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  messagesContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    borderRadius: '10px 10px 0 10px',
    padding: '8px 12px',
    maxWidth: '80%',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f0f0',
    borderRadius: '10px 10px 10px 0',
    padding: '8px 12px',
    maxWidth: '80%',
  },
  messageText: {
    margin: 0,
    whiteSpace: 'pre-wrap', // 改行を保持
    wordBreak: 'break-word', // 長い単語を折り返す
  },
  loadingIndicator: {
    textAlign: 'center',
    color: '#888',
    padding: '10px',
  },
  errorMessage: {
    textAlign: 'center',
    color: 'red',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    margin: '10px 0',
  },
  inputArea: {
    display: 'flex',
    padding: '10px 20px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f7f7f7',
  },
  textarea: {
    flexGrow: 1,
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '10px',
    fontSize: '14px',
    resize: 'none', // リサイズ不可
    marginRight: '10px',
  },
  sendButton: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    // ':disabled' はインラインスタイルでは直接使えないため削除
  },
  sendButtonDisabled: { // disabled時のスタイルを別プロパティとして定義
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  }
};


export default ChatInterface;
