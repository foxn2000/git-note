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
  isCustomModeEnabled: () => boolean;
}

export function useModelConfig(): UseModelConfigReturn {
  // カスタムモードが有効かどうかをチェック
  const isCustomModeEnabled = useCallback((): boolean => {
    return import.meta.env.VITE_COSTOM_MODE === "true";
  }, []);

  // カスタムモデル設定を取得
  const getCustomModelConfig = useCallback((): ModelConfig => {
    return {
      name: import.meta.env.VITE_COSTOM_MODEL_NAME as string,
      baseUrl: import.meta.env.VITE_COSTOM_BASE_URL as string,
      apiKeyEnvName: "VITE_COSTOM_API_KEY",
      defaultParams: {
        temperature: 0.7,
        max_tokens: 4096,
      }
    };
  }, []);

  // デフォルトモデルID取得
  const getDefaultModelId = useCallback(() => {
    return modelsConfig.models.default;
  }, []);

  // 指定されたモデルIDの設定を取得（カスタムモードが有効な場合はカスタム設定を使用）
  const getModelConfig = useCallback((modelId?: string): ModelConfig => {
    if (isCustomModeEnabled()) {
      return getCustomModelConfig();
    }
    
    const idToUse = modelId || getDefaultModelId();
    return modelsConfig.models.available[idToUse];
  }, [getDefaultModelId, isCustomModeEnabled, getCustomModelConfig]);

  // モデルのAPIキーを環境変数から取得（カスタムモードが有効な場合はカスタムAPIキーを使用）
  const getApiKey = useCallback((modelId?: string): string | undefined => {
    if (isCustomModeEnabled()) {
      return import.meta.env.VITE_COSTOM_API_KEY as string;
    }
    
    const config = getModelConfig(modelId);
    return import.meta.env[config.apiKeyEnvName];
  }, [getModelConfig, isCustomModeEnabled]);

  // 利用可能なすべてのモデルIDを取得（カスタムモードが有効な場合はカスタムモデルを含める）
  const getAllModelIds = useCallback((): string[] => {
    const modelIds = Object.keys(modelsConfig.models.available);
    
    if (isCustomModeEnabled()) {
      return [...modelIds, "custom"];
    }
    
    return modelIds;
  }, [isCustomModeEnabled]);

  return {
    getModelConfig,
    getApiKey,
    getAllModelIds,
    getDefaultModelId,
    isCustomModeEnabled,
  };
}
