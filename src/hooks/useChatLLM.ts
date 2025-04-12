import { useState } from 'react';
import { useModelConfig } from './useModelConfig';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  isStreaming?: boolean;
}

interface UseChatLLMProps {
  articleContent: string;
  modelId?: string; // オプションでモデルIDを指定可能に
}

export const useChatLLM = ({ articleContent, modelId }: UseChatLLMProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // モデル設定フックを使用
  const { getModelConfig, getApiKey } = useModelConfig();

  /**
   * ユーザーに対して「記事の内容に関する質問にのみ回答し、それ以外は答えない」という方針を明確に示す。
   */
  const generateSystemPrompt = (messages: Message[]) => {
    return `あなたは、提供された記事の内容についてのみ答えるAIアシスタントです。
以下の記事内容から答えられる質問にのみ答えてください。
もしユーザーの質問が、記事の内容に含まれない情報や記事の範囲を超えるものである場合は、
「申し訳ありませんが、そのご質問は記事の内容からはお答えできません。」と返答してください。

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
      // モデル設定を取得
      const modelConfig = getModelConfig(modelId);
      const apiKey = getApiKey(modelId);
      
      if (!apiKey) {
        throw new Error(`APIキー(${modelConfig.apiKeyEnvName})が設定されていません。`);
      }

      // ストリーミング用の空のメッセージを追加
      const streamingMessage: Message = { sender: 'ai', text: '', isStreaming: true };
      setMessages(prevMessages => [...prevMessages, streamingMessage]);

      const response = await fetch(modelConfig.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.name,
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
          max_tokens: modelConfig.defaultParams.max_tokens,
          temperature: modelConfig.defaultParams.temperature,
          stream: true, // ストリーミングを有効化
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'APIリクエストに失敗しました。');
      }

      if (!response.body) {
        throw new Error('レスポンスボディが空です。');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  accumulatedText += content;
                  setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.isStreaming) {
                      lastMessage.text = accumulatedText;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      } finally {
        // ストリーミング完了後、isStreamingフラグを削除
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
          }
          return newMessages;
        });
      }

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
