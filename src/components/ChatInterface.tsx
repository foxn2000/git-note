import React, { useState, useRef, useEffect } from 'react';
import { useChatLLM } from '../hooks/useChatLLM';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

interface ChatInterfaceProps {
  articleContent: string;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ articleContent, onClose }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
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


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-overlay">
      <div className="chat-container">
        <div className="chat-header">
          <h2>記事についてAIに質問</h2>
          <button onClick={onClose} className="chat-close-button">×</button>
        </div>
        <div className="chat-messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={msg.sender === 'user' ? 'chat-user-message' : 'chat-ai-message'}>
              {msg.sender === 'user' ? (
                <p className="chat-message-text">{msg.text}</p>
              ) : (
                <div className="chat-ai-content">
                  <ReactMarkdown
                    components={{
                      code: CodeBlock,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="chat-loading-indicator">
              <div className="chat-loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
              <p>AIが応答を生成中</p>
            </div>
          )}
          {error && <div className="chat-error-message">{error}</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-area">
          <textarea
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="記事に関する質問を入力してください..."
            className="chat-textarea"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className={`chat-send-button ${(isLoading || !userInput.trim()) ? 'disabled' : ''}`}
            disabled={isLoading || !userInput.trim()}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
};



export default ChatInterface;
