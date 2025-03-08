import { EmbeddingProvider, ModelConfig } from '../models/EmbeddingModel';

/**
 * Information about an embedding model
 */
export interface EmbeddingModelInfo {
    name: string;
    dimensions: number;
    description: string;
    provider: EmbeddingProvider;
}

/**
 * Base provider settings interface
 * All provider settings should extend this
 */
export interface ProviderSettings extends ModelConfig {
    // Base properties that all providers might have
    baseURL?: string;
}

/**
 * Ollama provider settings
 */
export interface OllamaSettings extends ProviderSettings {
    baseURL: string; // Required for Ollama
}

/**
 * OpenAI provider settings
 */
export interface OpenAISettings extends ProviderSettings {
    apiKey: string;
    baseURL?: string; // Optional for OpenAI
}

/**
 * Type for provider settings map
 * This allows for dynamically adding new providers
 */
export type ProviderSettingsMap = {
    [key in EmbeddingProvider]?: ProviderSettings;
} & {
    // Ensure required providers are always present
    [EmbeddingProvider.Ollama]: OllamaSettings;
    [EmbeddingProvider.OpenAI]: OpenAISettings;
};

/**
 * Settings for the PGLite plugin
 */
export interface PGLitePluginSettings {
    databaseName: string;
    relaxedDurability: boolean;
    selectedModel: string;
    // Provider settings map for all embedding providers
    providers: ProviderSettingsMap;
}

/**
 * Default settings for the PGLite plugin
 */
export const DEFAULT_SETTINGS: PGLitePluginSettings = {
    databaseName: 'pglite',
    relaxedDurability: true,
    selectedModel: 'nomic-embed-text',
    // Initialize the providers map
    providers: {
        [EmbeddingProvider.Ollama]: {
            baseURL: 'http://localhost:11434/api'
        },
        [EmbeddingProvider.OpenAI]: {
            apiKey: '',
            baseURL: undefined
        }
    }
}

/**
 * Available embedding models for the plugin
 */
export const AVAILABLE_MODELS: EmbeddingModelInfo[] = [
    { 
        name: 'nomic-embed-text', 
        dimensions: 768, 
        description: 'Nomic Embed Text - High quality text embeddings (768 dimensions)',
        provider: EmbeddingProvider.Ollama
    },
    { 
        name: 'all-minilm', 
        dimensions: 384, 
        description: 'All-MiniLM - Lightweight text embeddings (384 dimensions)',
        provider: EmbeddingProvider.Ollama
    },
    { 
        name: 'mxbai-embed-large', 
        dimensions: 1024, 
        description: 'MxbAI Embed Large - High quality text embeddings (1024 dimensions)',
        provider: EmbeddingProvider.Ollama
    },
    { 
        name: 'text-embedding-3-small', 
        dimensions: 1536, 
        description: 'OpenAI text-embedding-3-small (1536 dimensions)',
        provider: EmbeddingProvider.OpenAI
    },
    { 
        name: 'text-embedding-3-large', 
        dimensions: 3072, 
        description: 'OpenAI text-embedding-3-large (3072 dimensions)',
        provider: EmbeddingProvider.OpenAI
    },
    { 
        name: 'text-embedding-ada-002', 
        dimensions: 1536, 
        description: 'OpenAI text-embedding-ada-002 (1536 dimensions)',
        provider: EmbeddingProvider.OpenAI
    }
];

/**
 * Get all available models for a specific provider
 * @param provider The embedding provider
 * @returns Array of model information for the specified provider
 */
export function getModelsForProvider(provider: EmbeddingProvider): EmbeddingModelInfo[] {
    return AVAILABLE_MODELS.filter(model => model.provider === provider);
}

/**
 * Get model information by name
 * @param name Model name
 * @returns Model information or undefined if not found
 */
export function getModelInfo(name: string): EmbeddingModelInfo | undefined {
    return AVAILABLE_MODELS.find(model => model.name === name);
}
