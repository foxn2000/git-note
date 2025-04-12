import { useCallback } from 'react';
import modelsConfig from '../config/models.yaml';

export interface ModelConfig {
  name: string;
  baseUrl: string;
  apiKeyEnvName: string;
  defaultParams: {
    temperature: number;
    max_tokens: number;
    [key: string]: any;
  };
}

interface UseModelConfigReturn {
  getModelConfig: (modelId?: string) => ModelConfig;
  getApiKey: (modelId?: string) => string | undefined;
  getAllModelIds: () => string[];
  getDefaultModelId: () => string;
}

export function useModelConfig(): UseModelConfigReturn {
  // デフォルトモデルID取得
  const getDefaultModelId = useCallback(() => {
    return modelsConfig.models.default;
  }, []);

  // 指定されたモデルIDの設定を取得（デフォルト値を使用）
  const getModelConfig = useCallback((modelId?: string): ModelConfig => {
    const idToUse = modelId || getDefaultModelId();
    return modelsConfig.models.available[idToUse];
  }, [getDefaultModelId]);

  // モデルのAPIキーを環境変数から取得
  const getApiKey = useCallback((modelId?: string): string | undefined => {
    const config = getModelConfig(modelId);
    return import.meta.env[config.apiKeyEnvName];
  }, [getModelConfig]);

  // 利用可能なすべてのモデルIDを取得
  const getAllModelIds = useCallback((): string[] => {
    return Object.keys(modelsConfig.models.available);
  }, []);

  return {
    getModelConfig,
    getApiKey,
    getAllModelIds,
    getDefaultModelId,
  };
}
