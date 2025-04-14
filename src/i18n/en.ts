export const en = {
  header: {
    title: "GitNote: GitHub Repository Analysis Report Generator"
  },
  input: {
    repository: {
      label: "GitHub Repository:",
      placeholder: "e.g., owner/repo or https://github.com/owner/repo/tree/main",
      error: {
        required: "Please enter a repository name (e.g., owner/repo)",
        format: "Repository name should be in the format \"owner/repo\" or any valid GitHub URL."
      }
    },
    language: {
      label: "Output Language:",
      options: {
        ja: "Japanese (ja)",
        en: "English (en)",
        fr: "French (fr)",
        es: "Spanish (es)",
        de: "German (de)"
      }
    },
    button: {
      analyze: "Start Analysis",
      analyzing: "Analyzing..."
    }
  },
  chat: {
    button: "Ask AI about this article",
    header: "Ask AI about the article",
    placeholder: "Enter your question about the article...",
    loading: "AI is generating a response",
    send: "Send"
  },
  result: {
    title: "Generated Article",
    copyButton: {
      default: "Copy entire article",
      copied: "Copied"
    }
  },
  codeBlock: {
    copy: "Copy",
    copied: "Copied",
    error: "Failed to copy code block"
  }
};
