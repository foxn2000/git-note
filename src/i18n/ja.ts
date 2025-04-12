export const ja = {
  header: {
    title: "GitNote: GitHubリポジトリ分析レポート生成"
  },
  input: {
    repository: {
      label: "GitHubリポジトリ:",
      placeholder: "例: owner/repo",
      error: {
        required: "リポジトリ名を入力してください (例: owner/repo)",
        format: "リポジトリ名は \"owner/repo\" の形式で入力してください。"
      }
    },
    language: {
      label: "出力言語:",
      options: {
        ja: "日本語 (ja)",
        en: "英語 (en)",
        fr: "フランス語 (fr)",
        es: "スペイン語 (es)",
        de: "ドイツ語 (de)"
      }
    },
    button: {
      analyze: "分析開始",
      analyzing: "分析中..."
    }
  },
  chat: {
    button: "この記事についてAIに質問する",
    header: "記事についてAIに質問",
    placeholder: "記事に関する質問を入力してください...",
    loading: "AIが応答を生成中",
    send: "送信"
  },
  result: {
    title: "生成された記事",
    copyButton: {
      default: "記事全体をコピー",
      copied: "コピー完了"
    }
  }
};
