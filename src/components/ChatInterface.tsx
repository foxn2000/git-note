import React, { useState, useRef, useEffect } from 'react';
import { useChatLLM } from '../hooks/useChatLLM';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import { useLanguage } from '../context/LanguageContext';

interface ChatInterfaceProps {
  articleContent: string;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ articleContent, onClose }) => {
  const { translations } = useLanguage();
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
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const sendKeyCombination = isMac 
      ? event.key === 'Enter' && event.metaKey  // Mac では Command + Enter
      : event.key === 'Enter' && event.ctrlKey; // その他では Ctrl + Enter
    
    if (sendKeyCombination) {
      event.preventDefault();
      handleSendMessage();
    }
    // Enter のみの場合は通常の改行を許可（preventDefault を呼ばない）
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
          <h2>{translations.chat.header}</h2>
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
              <p>{translations.chat.loading}</p>
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
            placeholder={translations.chat.placeholder}
            className="chat-textarea"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className={`chat-send-button ${(isLoading || !userInput.trim()) ? 'disabled' : ''}`}
            disabled={isLoading || !userInput.trim()}
          >
            {translations.chat.send}
          </button>
        </div>
      </div>
    </div>
  );
};



export default ChatInterface;
