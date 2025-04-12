import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Remove dark theme style import

interface ResultDisplayProps {
    article: string | null;
}

// コードブロック用のカスタムコンポーネント
const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, ''); // 末尾の改行を削除

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // 1.5秒後に表示を元に戻す
    });
  };

  return !inline && match ? (
    <div className="code-block-container">
      <SyntaxHighlighter
        // style={vscDarkPlus} // Remove explicit style application
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
      <button onClick={handleCopy} className="copy-button">
        {copied ? 'コピー完了' : 'コピー'}
      </button>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ article }) => {
    if (!article) {
        return null; // 記事がない場合は何も表示しない
    }

    return (
        <div className="result-display">
            <h2>生成された記事</h2>
            <ReactMarkdown
                components={{
                    code: CodeBlock, // code要素をカスタムコンポーネントで置き換え
                }}
            >
                {article}
            </ReactMarkdown>
            {/* Apply copy-button class to the article copy button */}
            <button onClick={() => navigator.clipboard.writeText(article)} className="copy-button" style={{ position: 'relative', display: 'block', margin: '2rem auto 0' }}> {/* Add class and some inline styles for positioning */}
                記事全体をコピー
            </button>
        </div>
    );
};

export default ResultDisplay;
