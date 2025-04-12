import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

interface ResultDisplayProps {
    article: string | null;
}

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
