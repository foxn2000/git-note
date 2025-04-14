import { useState } from 'react';
import axios from 'axios';
import { useModelConfig } from './useModelConfig';

// 分析する視点
const ANALYSIS_PERSPECTIVES = [
  { key: 'usage', ja: '使い方', en: 'Usage' },
  { key: 'installation', ja: 'インストール方法', en: 'Installation' },
  { key: 'structure', ja: 'リポジトリ構造', en: 'Repository Structure' },
  { key: 'logic', ja: 'コードロジック', en: 'Code Logic' },
];

interface AnalysisResult {
  [key: string]: string;
}

const useAnalysis = (modelId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string | null>(null);

  // モデル設定フックを使用
  const { getModelConfig, getApiKey } = useModelConfig();

  const analyzeRepository = async (repoName: string, language: string) => {
    setIsLoading(true);
    setError(null);
    setGeneratedArticle(null);

    // モデル設定を取得
    const modelConfig = getModelConfig(modelId);
    const apiKey = getApiKey(modelId);

    if (!apiKey) {
      setError(
        `${modelConfig.apiKeyEnvName}が設定されていません。.env ファイルに ${modelConfig.apiKeyEnvName} を設定してください。`
      );
      setIsLoading(false);
      return;
    }

    try {
      // 1. uithubからMarkdownを取得
      const uithubUrl = `https://uithub.com/${repoName}?ext=md`;
      let markdownContent = '';
      try {
        const response = await axios.get(uithubUrl, {
          timeout: 15000,
          responseType: 'text',
        });
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`HTTP status ${response.status}`);
        }
        markdownContent = response.data;
        if (
          !markdownContent ||
          markdownContent.trim().startsWith('<html') ||
          markdownContent.trim().startsWith('<!DOCTYPE')
        ) {
          console.warn(
            'uithubから取得した内容がMarkdown形式でない可能性があります。',
            markdownContent.substring(0, 200)
          );
          if (!markdownContent)
            markdownContent = `[警告] uithubから空の内容が返されました: ${uithubUrl}`;
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
        if (
          fetchError.message.toLowerCase().includes('network error') ||
          fetchError.message.toLowerCase().includes('cors')
        ) {
          errorMessage +=
            ' CORSポリシーによりブロックされた可能性があります。サーバーサイドプロキシの導入を検討してください。';
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
            modelConfig.baseUrl,
            {
              model: modelConfig.name,
              messages: [{ role: 'user', content: prompt }],
              temperature: modelConfig.defaultParams.temperature,
              max_tokens: 1500,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              timeout: 30000,
            }
          );
          const resultText = response.data.choices?.[0]?.message?.content;
          if (!resultText) {
            console.warn(
              `[${perspective.key}] の分析結果が空です。Response:`,
              response.data
            );
          }
          analysisResults[perspective.key] =
            resultText ||
            `[${perspective.ja}] の分析結果を取得できませんでした (空の応答)。`;
        } catch (apiError: any) {
          console.error(`Error analyzing ${perspective.key}:`, apiError);
          let apiErrorMessage = `[${perspective.ja}] の分析中にエラーが発生しました`;
          if (axios.isAxiosError(apiError)) {
            apiErrorMessage += `: ${apiError.message}`;
            if (apiError.response) {
              apiErrorMessage += ` (ステータス: ${apiError.response.status}, 詳細: ${JSON.stringify(
                apiError.response.data
              )})`;
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

      // 3. 最終的な記事として統合
      const finalArticle = await generateUnifiedArticle(
        repoName,
        analysisResults,
        language,
        modelId
      );
      setGeneratedArticle(finalArticle);
    } catch (err: any) {
      console.error('Analysis process error:', err);
      setError(`分析プロセス中に予期せぬエラーが発生しました: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // ここからプロンプトの定義部
  // -----------------------------

  /**
   * 言語コードをユーザーフレンドリーな言語名にする簡易関数
   */
  const getLanguageName = (code: string): string => {
    const names: { [key: string]: string } = {
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      it: 'Italian',
      // 必要に応じて追加
    };
    return names[code] || code;
  };

  // -- Usage セクション --

  // JA
  const usagePromptJA = (markdown: string) => `
あなたはプロのテクニカルライターです。以下のMarkdownを参照し、このリポジトリの「使い方」について、わかりやすく体系的に説明してください。

【文書構成・スタイルの要望】
- 見出しや箇条書きを使い、読み手が手順を追いやすい構成にする
- 具体的なユースケースや想定シナリオを示し、「いつどのように使うと便利か」を明記する
- 実行例やサンプルコードがあれば引用し、読者がイメージしやすいようにする

【書くべき内容】
1. 基本的な利用手順（セットアップ済みの場合の前提や準備）  
2. コマンドやコードの実行手順、パラメータやオプションの説明  
3. 応用的な使い方や拡張的なユースケース（使いどころや制限など）  
4. 使う上でのメリット（高速化、管理の容易性など）や注意点（バージョン、依存関係など）

【ユーザーに伝えるべきポイント】
- このリポジトリを使うことで得られる具体的な効果・利点
- 最初にハマりがちな落とし穴やトラブルシューティングのヒント

すべて日本語で回答してください。

--- リポジトリのMarkdown ---
${markdown}
---
`.trim();

  // EN
  const usagePromptEN = (markdown: string) => `
You are a professional technical writer. Refer to the following Markdown and explain the "Usage" of this repository in a clear and structured way.

[Documentation Style & Structure]
- Utilize headings and bullet points to make the flow of instructions easy to follow
- Provide concrete use cases or scenarios that clarify when and how the repository is beneficial
- Include example commands or code snippets if available, to help readers visualize the process

[Required Content]
1. Basic usage steps (any prerequisites or setups already in place)
2. Instructions on running commands or code, with descriptions of parameters or options
3. Advanced usage scenarios or extended use cases (potential limitations or best practices)
4. Key advantages (e.g., performance, ease of use) and any important caveats (e.g., version constraints)

[Key Points to Convey]
- The specific benefits or outcomes of using this repository
- Common pitfalls or troubleshooting tips for first-time users

Respond in English.

--- Repository Markdown ---
${markdown}
---
`.trim();

  // Other
  const usagePromptOther = (markdown: string, langName: string) => `
You are a professional technical writer. Refer to the following Markdown and explain the "Usage" of this repository in a clear and structured way.

[Documentation Style & Structure]
- Utilize headings and bullet points to make the flow of instructions easy to follow
- Provide concrete use cases or scenarios that clarify when and how the repository is beneficial
- Include example commands or code snippets if available, to help readers visualize the process

[Required Content]
1. Basic usage steps (any prerequisites or setups already in place)
2. Instructions on running commands or code, with descriptions of parameters or options
3. Advanced usage scenarios or extended use cases (potential limitations or best practices)
4. Key advantages (e.g., performance, ease of use) and any important caveats (e.g., version constraints)

[Key Points to Convey]
- The specific benefits or outcomes of using this repository
- Common pitfalls or troubleshooting tips for first-time users

Finally, please respond in ${langName}.

--- Repository Markdown ---
${markdown}
---
`.trim();

  // -- Installation セクション --

  // JA
  const installationPromptJA = (markdown: string) => `
あなたはプロのテクニカルライターです。以下のMarkdownをもとに、このリポジトリの「インストール方法」と「環境構築手順」について詳しく解説してください。

【文書構成・スタイルの要望】
- ステップバイステップで解説し、初心者でも実行しやすい構成にする
- 見やすい箇条書きや番号付きリストを使って、依存関係や必要ソフトのインストール順序を明確化する
- エラーが起きやすいポイントや、追加の環境設定が必要な場合はその回避策や例を提示する

【書くべき内容】
1. 必要な前提条件（OSやバージョン、ソフトウェアなど）
2. 具体的なインストール手順（例：コマンド一覧、設定ファイルの編集手順）
3. 動作確認の方法（インストール成功を確認するためのテストコマンドなど）
4. トラブルシューティング（よくあるエラー例や対策）

【ユーザーに伝えるべきポイント】
- 事前に用意しておくべき環境要素やバージョン依存の注意点
- インストール後すぐに活用できるような確認方法・サンプル実行手順

すべて日本語で回答してください。

--- リポジトリのMarkdown ---
${markdown}
---
`.trim();

  // EN
  const installationPromptEN = (markdown: string) => `
You are a professional technical writer. Based on the following Markdown, provide a thorough explanation of the "Installation" procedure and any required environment setup for this repository.

[Documentation Style & Structure]
- Present the instructions in a step-by-step manner, ensuring even beginners can follow them
- Use clear bullet points or numbered lists to outline dependencies and required software
- Provide solutions or examples for potential errors or additional configurations

[Required Content]
1. Prerequisites (e.g., OS version, necessary tools, or library versions)
2. Detailed installation steps (e.g., command lines, configuration file edits)
3. Methods for verifying successful installation (e.g., test commands or example runs)
4. Troubleshooting tips (common error messages and their resolutions)

[Key Points to Convey]
- Any environment or version constraints that users must be aware of
- How to quickly validate that everything is installed correctly

Respond in English.

--- Repository Markdown ---
${markdown}
---
`.trim();

  // Other
  const installationPromptOther = (markdown: string, langName: string) => `
You are a professional technical writer. Based on the following Markdown, provide a thorough explanation of the "Installation" procedure and any required environment setup for this repository.

[Documentation Style & Structure]
- Present the instructions in a step-by-step manner, ensuring even beginners can follow them
- Use clear bullet points or numbered lists to outline dependencies and required software
- Provide solutions or examples for potential errors or additional configurations

[Required Content]
1. Prerequisites (e.g., OS version, necessary tools, or library versions)
2. Detailed installation steps (e.g., command lines, configuration file edits)
3. Methods for verifying successful installation (e.g., test commands or example runs)
4. Troubleshooting tips (common error messages and their resolutions)

[Key Points to Convey]
- Any environment or version constraints that users must be aware of
- How to quickly validate that everything is installed correctly

Finally, please respond in ${langName}.

--- Repository Markdown ---
${markdown}
---
`.trim();

  // -- Structure セクション --

  // JA
  const structurePromptJA = (markdown: string) => `
あなたはプロのテクニカルライターです。以下のMarkdownを確認し、このリポジトリの「リポジトリ構造」について説明してください。

【文書構成・スタイルの要望】
- ディレクトリやファイルの一覧をわかりやすく示し、それぞれの役割や関連性を整理する
- ユーザーがソースコードを読み始める際に「どこから着手すればよいか」がわかるようにする
- 必要に応じて図示やアーキテクチャ概念（テキストベースでも可）を補足する

【書くべき内容】
1. 主なディレクトリ構成とそれぞれの目的（例：src/, docs/, tests/ など）
2. 主要ファイル・クラスの役割（例：index.js, app.py, package.json などの説明）
3. モジュール間の依存関係や流れがある場合はその概要
4. 初心者が開発を始める際に注目すべきポイント（設定ファイルや入口となるファイルなど）

【ユーザーに伝えるべきポイント】
- ソースコードを追うときの視点（どのファイルやディレクトリから見ると理解しやすいか）
- 特筆すべきフォルダ構造や命名規則などの理由や利点

すべて日本語で回答してください。

--- リポジトリのMarkdown ---
${markdown}
---
`.trim();

  // EN
  const structurePromptEN = (markdown: string) => `
You are a professional technical writer. Review the following Markdown and describe the "Repository Structure" of this project.

[Documentation Style & Structure]
- Clearly list the directories and files, indicating each one's role and how they interrelate
- Help users understand where to begin when reading or modifying the source code
- Provide diagrams or architectural context if useful (even simple text-based representations)

[Required Content]
1. Major directories and their purposes (e.g., src/, docs/, tests/)
2. The function of key files or classes (e.g., index.js, app.py, package.json)
3. An overview of any inter-module dependencies or data flow
4. Tips for new contributors on where to start (important config files or entry points)

[Key Points to Convey]
- Guidance on how to approach understanding the codebase
- Noteworthy folder structures or naming conventions, and why they're beneficial

Respond in English.

--- Repository Markdown ---
${markdown}
---
`.trim();

  // Other
  const structurePromptOther = (markdown: string, langName: string) => `
You are a professional technical writer. Review the following Markdown and describe the "Repository Structure" of this project.

[Documentation Style & Structure]
- Clearly list the directories and files, indicating each one's role and how they interrelate
- Help users understand where to begin when reading or modifying the source code
- Provide diagrams or architectural context if useful (even simple text-based representations)

[Required Content]
1. Major directories and their purposes (e.g., src/, docs/, tests/)
2. The function of key files or classes (e.g., index.js, app.py, package.json)
3. An overview of any inter-module dependencies or data flow
4. Tips for new contributors on where to start (important config files or entry points)

[Key Points to Convey]
- Guidance on how to approach understanding the codebase
- Noteworthy folder structures or naming conventions, and why they're beneficial

Finally, please respond in ${langName}.

--- Repository Markdown ---
${markdown}
---
`.trim();

  // -- Logic セクション --

  // JA
  const logicPromptJA = (markdown: string) => `
あなたはプロのテクニカルライターです。以下のMarkdownを読み、このリポジトリが実装する「コードロジック」や主要なアルゴリズム・関数について説明してください。

【文書構成・スタイルの要望】
- 重要なクラスや関数単位で説明し、処理の流れや入力・出力を整理する
- コード断片（抜粋）を用いて、論点を具体的に示す
- 可能であれば設計思想やアーキテクチャの概要（なぜこの実装になっているのか）も含める

【書くべき内容】
1. 中核となる処理フロー（データの流れ、アルゴリズムのステップなど）
2. メインの関数・クラス・モジュールの役割や動作
3. 依存しているライブラリやAPIの簡単な説明（特に重要なものがあれば）
4. 継続的な拡張やカスタマイズが想定される部分へのガイド

【ユーザーに伝えるべきポイント】
- このリポジトリが解決しようとしている課題や目的、およびそれをどう実現しているか
- コードを深く理解・改変する際に注目すべき箇所や注意点

すべて日本語で回答してください。

--- リポジトリのMarkdown ---
${markdown}
---
`.trim();

  // EN
  const logicPromptEN = (markdown: string) => `
You are a professional technical writer. Read the following Markdown and explain the "Code Logic" or main algorithms/functions implemented in this repository.

[Documentation Style & Structure]
- Break down the logic by key classes or functions, detailing the flow of processing and input/output
- Include code snippets (where relevant) to illustrate specific points
- Add high-level design insights or architectural reasoning behind certain implementations, if possible

[Required Content]
1. The core processing flow (data pipeline, algorithmic steps, etc.)
2. Roles and behaviors of major functions, classes, or modules
3. Brief mention of any crucial libraries or APIs that the code depends on
4. Guidance on extendability or customization (where future development might occur)

[Key Points to Convey]
- The problem or goal this repository aims to address, and how the code structure solves it
- Which parts of the code are most critical for deeper understanding or modification

Respond in English.

--- Repository Markdown ---
${markdown}
---
`.trim();

  // Other
  const logicPromptOther = (markdown: string, langName: string) => `
You are a professional technical writer. Read the following Markdown and explain the "Code Logic" or main algorithms/functions implemented in this repository.

[Documentation Style & Structure]
- Break down the logic by key classes or functions, detailing the flow of processing and input/output
- Include code snippets (where relevant) to illustrate specific points
- Add high-level design insights or architectural reasoning behind certain implementations, if possible

[Required Content]
1. The core processing flow (data pipeline, algorithmic steps, etc.)
2. Roles and behaviors of major functions, classes, or modules
3. Brief mention of any crucial libraries or APIs that the code depends on
4. Guidance on extendability or customization (where future development might occur)

[Key Points to Convey]
- The problem or goal this repository aims to address, and how the code structure solves it
- Which parts of the code are most critical for deeper understanding or modification

Finally, please respond in ${langName}.

--- Repository Markdown ---
${markdown}
---
`.trim();

  /**
   * 指定されたperspectiveに応じて、上記で分割したプロンプトを返す
   */
  const generatePrompt = (
    perspective: { key: string; ja: string; en: string },
    markdown: string,
    lang: string
  ): string => {
    const isJA = lang === 'ja';
    const isEN = lang === 'en';
    const langName = getLanguageName(lang);

    switch (perspective.key) {
      case 'usage':
        if (isJA) return usagePromptJA(markdown);
        if (isEN) return usagePromptEN(markdown);
        return usagePromptOther(markdown, langName);

      case 'installation':
        if (isJA) return installationPromptJA(markdown);
        if (isEN) return installationPromptEN(markdown);
        return installationPromptOther(markdown, langName);

      case 'structure':
        if (isJA) return structurePromptJA(markdown);
        if (isEN) return structurePromptEN(markdown);
        return structurePromptOther(markdown, langName);

      case 'logic':
        if (isJA) return logicPromptJA(markdown);
        if (isEN) return logicPromptEN(markdown);
        return logicPromptOther(markdown, langName);

      default:
        // Fallback
        return `Repository Markdown:\n${markdown}\n`;
    }
  };

  // --------------------------------------------------
  // 最終的な記事を統合するステップ
  // --------------------------------------------------
  const generateUnifiedArticle = async (
    repoName: string,
    results: AnalysisResult,
    lang: string,
    modelId?: string
  ): Promise<string> => {
    const isJA = lang === 'ja';
    const isEN = lang === 'en';
    const langName = getLanguageName(lang);

    let unifyPrompt = '';

    // 日本語
    if (isJA) {
      unifyPrompt = `
あなたはプロのテクニカルライターです。以下の4つの分析結果を統合して、一貫性のある最終的な技術記事をMarkdownで作成してください。
リポジトリ名: ${repoName}

【要件】
1. 記事の冒頭でリポジトリの概要を簡潔に述べる
2. 「使い方(Usage)」「インストール方法(Installation)」「リポジトリ構造(Structure)」「コードロジック(Code Logic)」の順でまとめる
3. 見出しや箇条書きを活用し、重複があれば整理する
4. 記事の末尾に簡単なまとめを書く
5. コードブロックの前にはインデントを置かないで下さい。

すべて日本語で回答してください。

【Usageに関する分析結果】:
${results.usage || ''}

【Installationに関する分析結果】:
${results.installation || ''}

【Structureに関する分析結果】:
${results.structure || ''}

【Code Logicに関する分析結果】:
${results.logic || ''}
`.trim();
    }
    // 英語
    else if (isEN) {
      unifyPrompt = `
You are a professional technical writer. Integrate the four analyses below into a coherent, comprehensive technical article.
Repository name: ${repoName}

REQUIREMENTS:
1. Begin with a concise overview of the repository
2. Organize in this order: Usage, Installation, Repository Structure, Code Logic
3. Use headings and bullet points, consolidating any duplicate info
4. Conclude with a brief summary
5. Do not indent before code blocks.

Finally, please respond in English.

Respond in English.

[Usage Analysis]:
${results.usage || ''}

[Installation Analysis]:
${results.installation || ''}

[Structure Analysis]:
${results.structure || ''}

[Code Logic Analysis]:
${results.logic || ''}
`.trim();
    }
    // その他言語
    else {
      unifyPrompt = `
You are a professional technical writer. Integrate the four analyses below into a coherent, comprehensive technical article.
Repository name: ${repoName}

REQUIREMENTS:
1. Begin with a concise overview of the repository
2. Organize in this order: Usage, Installation, Repository Structure, Code Logic
3. Use headings and bullet points, consolidating any duplicate info
4. Conclude with a brief summary

Finally, please respond in ${langName}.

[Usage Analysis]:
${results.usage || ''}

[Installation Analysis]:
${results.installation || ''}

[Structure Analysis]:
${results.structure || ''}

[Code Logic Analysis]:
${results.logic || ''}
`.trim();
    }

    try {
      const modelConfig = getModelConfig(modelId);
      const apiKey = getApiKey(modelId);

      const response = await axios.post(
        modelConfig.baseUrl,
        {
          model: modelConfig.name,
          messages: [{ role: 'user', content: unifyPrompt }],
          temperature: modelConfig.defaultParams.temperature,
          max_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        }
      );
      const unifiedText = response.data.choices?.[0]?.message?.content;
      if (!unifiedText) {
        console.warn('統合された記事の生成結果が空です。');
        // 空なら従来の文字列結合にフォールバック
        return generateFinalArticle(repoName, results, lang);
      }
      return unifiedText;
    } catch (error) {
      console.error('Error generating unified article:', error);
      // 失敗したら文字列結合にフォールバック
      return generateFinalArticle(repoName, results, lang);
    }
  };

  // --------------------------------------------------
  // フォールバック用の記事生成
  // --------------------------------------------------
  const generateFinalArticle = (
    repoName: string,
    results: AnalysisResult,
    lang: string
  ) => {
    const titles = {
      ja: {
        main: `# ${repoName} の分析レポート`,
        intro: `このドキュメントは、リポジトリ \`${repoName}\` を自動分析した結果をまとめたものです。`,
        usage: '## 使い方 (Usage)',
        installation: '## インストール方法 (Installation)',
        structure: '## リポジトリ構造 (Structure)',
        logic: '## コードロジック (Code Logic)',
        conclusion: '## まとめ',
        conclusionText: `以上が \`${repoName}\` の自動分析結果です。`,
      },
      en: {
        main: `# Analysis Report for ${repoName}`,
        intro: `This document summarizes the results of an automated analysis of the repository \`${repoName}\`.`,
        usage: '## Usage',
        installation: '## Installation',
        structure: '## Repository Structure',
        logic: '## Code Logic',
        conclusion: '## Conclusion',
        conclusionText: `This concludes the automated analysis of \`${repoName}\`.`,
      },
    };

    const isJA = lang === 'ja';
    const currentTitles = isJA ? titles.ja : titles.en;
    const noResultMsg = isJA
      ? '分析結果を取得できませんでした。'
      : 'Analysis result not available.';

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
