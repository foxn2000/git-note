import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// ダークテーマのスタイルインポートは削除されました

interface ResultDisplayProps {
    article: string | null;
}

// コードブロック用のカスタムコンポーネント
const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
  console.log("CodeBlock received children:", children); // ★デバッグ用ログ追加
  console.log("CodeBlock received className:", className); // 言語クラス名確認用
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, ''); // 末尾の改行を削除

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500); // 1.5秒後に表示を元に戻す
      })
      .catch(err => {
        console.error('コードブロックのコピーに失敗しました:', err);
        // 必要に応じてユーザーへのエラー通知を追加
      });
  };

  return !inline && match ? (
    <div className="code-block-container">
      <SyntaxHighlighter
        // スタイルの明示的な適用は削除されました
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
    const [articleCopied, setArticleCopied] = useState(false); // 記事全体のコピー状態

    if (!article) {
        return null; // 記事がない場合は何も表示しない
    }

    const handleArticleCopy = () => {
        if (!article) return; // articleがnullの場合は何もしない
        navigator.clipboard.writeText(article)
            .then(() => {
                setArticleCopied(true);
                setTimeout(() => setArticleCopied(false), 1500); // 1.5秒後に表示を元に戻す
            })
            .catch(err => {
                console.error('記事全体のコピーに失敗しました:', err);
                // 必要に応じてユーザーへのエラー通知を追加
            });
    };

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
            {/* 記事全体のコピーボタンにクラスを適用し、インラインスタイルを削除 */}
            <button
                onClick={handleArticleCopy}
                className="copy-button article-copy-button" // 新しいクラスを追加
            >
                {articleCopied ? 'コピー完了' : '記事全体をコピー'}
            </button>
        </div>
    );
};

export default ResultDisplay;
