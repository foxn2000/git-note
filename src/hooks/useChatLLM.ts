import { useState } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface UseChatLLMProps {
  articleContent: string;
}

const CEREBRAS_API_ENDPOINT = 'https://api.cerebras.ai/v1/chat/completions';

export const useChatLLM = ({ articleContent }: UseChatLLMProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSystemPrompt = (messages: Message[]) => {
    return `あなたは、提供された記事の内容についてユーザーからの質問に答えるAIアシスタントです。
以下の記事をよく読んで、ユーザーの質問に分かりやすく答えてください。

# 記事内容:
${articleContent}

# これまでの会話:
${messages.map(msg => `${msg.sender === 'user' ? 'ユーザー' : 'AI'}: ${msg.text}`).join('\n')}`;
  };

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const newUserMessage: Message = { sender: 'user', text: userMessage };
    setMessages(prevMessages => {
      // 10件を超える場合は古いメッセージを削除
      const updatedMessages = [...prevMessages, newUserMessage];
      return updatedMessages.length > 10 ? updatedMessages.slice(-10) : updatedMessages;
    });

    setIsLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_CEREBRAS_API_KEY;
      if (!apiKey) {
        throw new Error('APIキーが設定されていません。');
      }

      const response = await fetch(CEREBRAS_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'system',
              content: generateSystemPrompt(messages),
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          max_tokens: 1000, // 必要に応じて調整
          temperature: 0.7, // 必要に応じて調整
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'APIリクエストに失敗しました。');
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('AIからの応答を取得できませんでした。');
      }

      const newAiMessage: Message = { sender: 'ai', text: aiResponse };
      setMessages(prevMessages => [...prevMessages, newAiMessage]);

    } catch (err) {
      console.error('Error in sendMessage:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
      // エラー時は最後のユーザーメッセージを削除
      setMessages(prevMessages => prevMessages.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
};
