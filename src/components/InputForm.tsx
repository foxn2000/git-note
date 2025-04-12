import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface InputFormProps {
  onSubmit: (repoName: string, language: string) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [repoName, setRepoName] = useState('');
  const { translations } = useLanguage();
  const [language, setLanguage] = useState('ja');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!repoName.trim()) {
      alert(translations.input.repository.error.required);
      return;
    }
    // 簡単な形式チェック (owner/repo)
    if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(repoName)) {
      alert(translations.input.repository.error.format);
      return;
    }
    onSubmit(repoName, language);
  };

  return (
    // Apply the input-form class to the form or a wrapping div
    <form onSubmit={handleSubmit} className="input-form">
      <div className="form-group"> {/* Apply form-group class */}
        <label htmlFor="repoName">{translations.input.repository.label}</label>
        <input
          type="text"
          id="repoName"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          placeholder={translations.input.repository.placeholder}
          disabled={isLoading}
          required
        />
      </div>
      <div className="form-group"> {/* Apply form-group class */}
        <label htmlFor="language">{translations.input.language.label}</label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isLoading}
        >
          <option value="ja">{translations.input.language.options.ja}</option>
          <option value="en">{translations.input.language.options.en}</option>
          <option value="fr">{translations.input.language.options.fr}</option>
          <option value="es">{translations.input.language.options.es}</option>
          <option value="de">{translations.input.language.options.de}</option>
        </select>
      </div>
      {/* Apply analyze-button class */}
      <button type="submit" disabled={isLoading} className="analyze-button">
        {isLoading ? translations.input.button.analyzing : translations.input.button.analyze}
      </button>
    </form>
  );
};

export default InputForm;
