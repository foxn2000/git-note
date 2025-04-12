import React, { useState } from 'react';

interface InputFormProps {
  onSubmit: (repoName: string, language: string) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [repoName, setRepoName] = useState('');
  const [language, setLanguage] = useState('ja'); // デフォルトは日本語

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!repoName.trim()) {
      alert('リポジトリ名を入力してください (例: owner/repo)');
      return;
    }
    // 簡単な形式チェック (owner/repo)
    if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(repoName)) {
        alert('リポジトリ名は "owner/repo" の形式で入力してください。');
        return;
    }
    onSubmit(repoName, language);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="repoName">GitHubリポジトリ:</label>
        <input
          type="text"
          id="repoName"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          placeholder="例: owner/repo"
          disabled={isLoading}
          required
        />
      </div>
      <div>
        <label htmlFor="language">出力言語:</label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isLoading}
        >
          <option value="ja">日本語 (ja)</option>
          <option value="en">英語 (en)</option>
          {/* 必要に応じて他の言語を追加 */}
          <option value="fr">フランス語 (fr)</option>
          <option value="es">スペイン語 (es)</option>
          <option value="de">ドイツ語 (de)</option>
        </select>
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? '分析中...' : '分析開始'}
      </button>
    </form>
  );
};

export default InputForm;
