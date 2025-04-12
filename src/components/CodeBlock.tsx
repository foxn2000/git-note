import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useLanguage } from '../context/LanguageContext';

// コードブロック用のカスタムコンポーネント
const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const { translations } = useLanguage();
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, ''); // 末尾の改行を削除

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500); // 1.5秒後に表示を元に戻す
      })
      .catch(err => {
        console.error(translations.codeBlock.error + ':', err);
      });
  };

  return !inline && match ? (
    <div className="code-block-container">
      <SyntaxHighlighter
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
      <button onClick={handleCopy} className="copy-button">
        {copied ? translations.codeBlock.copied : translations.codeBlock.copy}
      </button>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default CodeBlock;
