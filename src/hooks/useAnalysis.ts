import { useState } from 'react';
import axios from 'axios';

// Cerebras APIキーを環境変数から取得 (Viteの場合、import.meta.env.VITE_...)
// .env ファイルに VITE_CEREBRAS_API_KEY="YOUR_API_KEY" のように設定する必要があります。
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;
const CEREBRAS_API_ENDPOINT = 'https://api.cerebras.ai/v1/chat/completions'; // OpenAI互換エンドポイント
const MODEL_NAME = 'llama-4-scout-17b-16e-instruct'; // 設計書指定のモデル

// 分析する視点
const ANALYSIS_PERSPECTIVES = [
  { key: 'usage', ja: '使い方', en: 'Usage' },
  { key: 'installation', ja: 'インストール方法', en: 'Installation' },
  { key: 'structure', ja: 'リポジトリ構造', en: 'Repository Structure' },
  { key: 'logic', ja: 'コードロジック', en: 'Code Logic' },
];

interface AnalysisResult {
  [key: string]: string; // e.g., { usage: "...", installation: "..." }
}

const useAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);

  const analyzeRepository = async (repoName: string, language: string) => {
    setIsLoading(true);
    setError(null);
    setGeneratedArticle(null);

    if (!CEREBRAS_API_KEY) {
        setError('Cerebras APIキーが設定されていません。.env ファイルに VITE_CEREBRAS_API_KEY を設定してください。');
        setIsLoading(false);
        return;
    }

    try {
      // 1. uithubからMarkdownを取得
      // 注意: uithub.com が存在しない、または仕様変更されている可能性があります。
      // また、ブラウザからの直接アクセスはCORSポリシーにより失敗する可能性があります。
      // その場合はサーバーサイドプロキシが必要になります。
      const uithubUrl = `https://uithub.com/${repoName}?ext=md`;
      let markdownContent = '';
      try {
        // uithub.com がプレーンなテキスト/マークダウンを返すことを期待
        const response = await axios.get(uithubUrl, {
            // タイムアウト設定
            timeout: 15000, // 15秒
             // レスポンスタイプをtextとして扱う (もしJSON等が返る場合は調整)
            responseType: 'text'
        });
        // ステータスコードが200番台でない場合もエラーとする
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`HTTP status ${response.status}`);
        }
        markdownContent = response.data;
        // 簡単な内容チェック（空でないか、HTMLタグが含まれていないかなど）
        if (!markdownContent || markdownContent.trim().startsWith('<html') || markdownContent.trim().startsWith('<!DOCTYPE')) {
             console.warn("uithubから取得した内容がMarkdown形式でない可能性があります。", markdownContent.substring(0, 200));
             // ここでエラーにするか、処理を続けるか判断が必要
             // 今回は警告にとどめ、処理を続行してみる
             if (!markdownContent) markdownContent = `[警告] uithubから空の内容が返されました: ${uithubUrl}`;
        }

      } catch (fetchError: any) {
        console.error('uithub fetch error:', fetchError);
        let errorMessage = `uithubからMarkdownを取得できませんでした: ${uithubUrl}`;
        if (axios.isAxiosError(fetchError)) {
            errorMessage += ` - ${fetchError.message}`;
            if (fetchError.code === 'ECONNABORTED') {
                errorMessage += ' (タイムアウト)';
            } else if (fetchError.response) {
                errorMessage += ` (ステータス: ${fetchError.response.status})`;
            }
        } else {
            errorMessage += ` - ${fetchError.message}`;
        }
         // CORSエラーの可能性も示唆
        if (fetchError.message.toLowerCase().includes('network error') || fetchError.message.toLowerCase().includes('cors')) {
            errorMessage += ' CORSポリシーによりブロックされた可能性があります。サーバーサイドプロキシの導入を検討してください。';
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // 2. 各視点でCerebras APIにリクエスト
      const analysisResults: AnalysisResult = {};
      const apiRequests = ANALYSIS_PERSPECTIVES.map(async (perspective) => {
        const prompt = generatePrompt(perspective, markdownContent, language);
        try {
          const response = await axios.post(
            CEREBRAS_API_ENDPOINT,
            {
              model: MODEL_NAME,
              messages: [{ role: 'user', content: prompt }],
              // temperature: 0.7, // 必要に応じて調整
              // max_tokens: 1024, // 必要に応じて調整
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
              },
               timeout: 30000, // 30秒
            }
          );
          // OpenAI互換APIのレスポンス形式を想定
          const resultText = response.data.choices?.[0]?.message?.content;
          if (!resultText) {
              console.warn(`[${perspective.key}] の分析結果が空です。Response:`, response.data);
          }
          analysisResults[perspective.key] = resultText || `[${perspective.ja}] の分析結果を取得できませんでした (空の応答)。`;

        } catch (apiError: any) {
          console.error(`Error analyzing ${perspective.key}:`, apiError);
          let apiErrorMessage = `[${perspective.ja}] の分析中にエラーが発生しました`;
           if (axios.isAxiosError(apiError)) {
                apiErrorMessage += `: ${apiError.message}`;
                if (apiError.response) {
                    apiErrorMessage += ` (ステータス: ${apiError.response.status}, 詳細: ${JSON.stringify(apiError.response.data)})`;
                } else if (apiError.code === 'ECONNABORTED') {
                    apiErrorMessage += ' (タイムアウト)';
                }
           } else {
               apiErrorMessage += `: ${apiError.message}`;
           }
          analysisResults[perspective.key] = apiErrorMessage;
        }
      });

      await Promise.all(apiRequests);

      // 3. 結果を統合して記事を生成
      const finalArticle = generateFinalArticle(repoName, analysisResults, language);
      setGeneratedArticle(finalArticle);

    } catch (err: any) {
      console.error('Analysis process error:', err);
      setError(`分析プロセス中に予期せぬエラーが発生しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // プロンプト生成ロジック
  const generatePrompt = (perspective: { key: string; ja: string; en: string }, markdown: string, lang: string): string => {
    const baseLang = (lang === 'ja' || lang === 'en') ? lang : 'en';
    const perspectiveName = perspective[baseLang as keyof typeof perspective];
    const langInstruction = (lang !== 'ja' && lang !== 'en') ? ` Finally, please provide the answer in ${getLanguageName(lang)}.` : '';
    const langResponseInstruction = baseLang === 'ja' ? '日本語で回答してください。' : 'Respond in English.';

    let promptTemplate = '';
    switch (perspective.key) {
        case 'usage':
            promptTemplate = baseLang === 'ja'
                ? `以下のMarkdown化されたリポジトリの内容を確認し、このリポジトリの「${perspectiveName}」を説明してください。想定できるユースケースや利用の流れを、具体例を交えて書いてください。${langResponseInstruction}${langInstruction}\n\n(リポジトリのMarkdown内容)\n{{markdown_content}}`
                : `Please review the following repository content (provided in Markdown), and describe the "${perspectiveName}" of this repository. Include possible use cases and a typical workflow, with examples. ${langResponseInstruction}${langInstruction}\n\n(Repository Markdown content)\n{{markdown_content}}`;
            break;
        case 'installation':
             promptTemplate = baseLang === 'ja'
                ? `以下のMarkdown化されたリポジトリの内容を読み、このリポジトリの「${perspectiveName}」や必要な前提ソフトウェア、環境設定などを説明してください。${langResponseInstruction}${langInstruction}\n\n{{markdown_content}}`
                : `Please read the following Markdown repository content and explain the "${perspectiveName}" process, including prerequisites and environment setup. ${langResponseInstruction}${langInstruction}\n\n{{markdown_content}}`;
            break;
        case 'structure':
             promptTemplate = baseLang === 'ja'
                ? `以下のMarkdown化されたリポジトリの内容を読み、このリポジトリの「${perspectiveName}」や重要ファイルの役割を説明してください。${langResponseInstruction}${langInstruction}\n\n{{markdown_content}}`
                : `Please review the following Markdown repository content and describe the "${perspectiveName}". Include a breakdown of directories and important files. ${langResponseInstruction}${langInstruction}\n\n{{markdown_content}}`;
            break;
        case 'logic':
             promptTemplate = baseLang === 'ja'
                ? `以下のMarkdown化されたリポジトリの内容から、主要な「${perspectiveName}」やアルゴリズムについて要点をまとめて説明してください。実際のコード断片や重要関数の動作についても触れてください。${langResponseInstruction}${langInstruction}\n\n{{markdown_content}}`
                : `Based on the following Markdown repository content, please summarize the main "${perspectiveName}" or algorithms in the repository. Include any key functions or code snippets. ${langResponseInstruction}${langInstruction}\n\n{{markdown_content}}`;
            break;
        default:
            promptTemplate = '{{markdown_content}}'; // Fallback
    }
    // テンプレートにMarkdownコンテンツを埋め込む
    return promptTemplate.replace('{{markdown_content}}', markdown);
  };

  // 言語コードから言語名を取得するヘルパー関数 (簡易版)
  const getLanguageName = (code: string): string => {
      // より多くの言語に対応する場合はライブラリ等を利用
      const names: { [key: string]: string } = { fr: 'French', es: 'Spanish', de: 'German' };
      return names[code] || code; // 不明な場合はコードをそのまま返す
  }

  // 最終的な記事を生成するロジック
  const generateFinalArticle = (repoName: string, results: AnalysisResult, lang: string): string => {
    // 各セクションのタイトルを言語に応じて設定
    const titles = {
        ja: {
            main: `# ${repoName} の分析レポート`,
            intro: `このドキュメントは、GitHubリポジトリ \`${repoName}\` を自動分析した結果をまとめたものです。`,
            usage: '## 使い方 (Usage)',
            installation: '## インストール方法 (Installation)',
            structure: '## リポジトリ構造 (Repository Structure)',
            logic: '## コードロジック (Code Logic)',
            conclusion: '## まとめ',
            conclusionText: `以上が \`${repoName}\` の自動分析結果です。`
        },
        en: {
            main: `# Analysis Report for ${repoName}`,
            intro: `This document summarizes the results of an automated analysis of the GitHub repository \`${repoName}\`.`,
            usage: '## Usage',
            installation: '## Installation',
            structure: '## Repository Structure',
            logic: '## Code Logic',
            conclusion: '## Conclusion',
            conclusionText: `This concludes the automated analysis of \`${repoName}\`.`
        }
    };
    // その他の言語は英語をベースにする
    const currentTitles = titles[lang as keyof typeof titles] || titles.en;

    // 結果がない場合のデフォルトメッセージ
    const noResultMsg = lang === 'ja' ? '分析結果を取得できませんでした。' : 'Analysis result not available.';

    return `
${currentTitles.main}

${currentTitles.intro}

${currentTitles.usage}
${results.usage || noResultMsg}

${currentTitles.installation}
${results.installation || noResultMsg}

${currentTitles.structure}
${results.structure || noResultMsg}

${currentTitles.logic}
${results.logic || noResultMsg}

${currentTitles.conclusion}
${currentTitles.conclusionText}
    `.trim();
  };

  return { isLoading, error, generatedArticle, analyzeRepository };
};

export default useAnalysis;
