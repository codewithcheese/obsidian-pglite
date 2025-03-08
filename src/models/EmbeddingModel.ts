import { OllamaModel } from './OllamaModel';
import { OpenAIModel } from './OpenAIModel';
import { PGLitePluginSettings, getModelInfo } from '../settings/PGLitePluginSettings';

/**
 * Interface for embedding models that can generate vector embeddings
 */
export interface EmbeddingModel {
    readonly name: string;
    readonly dimensions: number;
    readonly description: string;
    generateEmbedding(text: string): Promise<number[]>;
}

/**
 * Enum for embedding model providers
 */
export enum EmbeddingProvider {
    Ollama = 'ollama',
    OpenAI = 'openai'
}

/**
 * Configuration for embedding models
 */
export type ModelConfig = {
    baseURL?: string;
    apiKey?: string;
};

/**
 * Type definition for a model factory function
 */
type ModelFactory = (name: string, dimensions: number, description: string, config: ModelConfig) => EmbeddingModel;

/**
 * Type definition for a config validator function
 */
type ConfigValidator = (config: ModelConfig) => void;

/**
 * Standard field keys for model configuration
 */
export enum ModelConfigField {
    BaseURL = 'baseURL',
    ApiKey = 'apiKey'
}

/**
 * Field metadata for standard configuration fields
 */
export const MODEL_FIELD_METADATA: Record<ModelConfigField, {
    name: string;
    description: string;
    placeholder: string;
    isPassword: boolean;
}> = {
    [ModelConfigField.BaseURL]: {
        name: 'Base URL',
        description: 'The base URL for the API',
        placeholder: 'https://api.example.com',
        isPassword: false
    },
    [ModelConfigField.ApiKey]: {
        name: 'API Key',
        description: 'Your API key for authentication',
        placeholder: 'Enter API key...',
        isPassword: true
    }
};

/**
 * Provider registry entry
 */
export interface ProviderRegistryEntry {
    factory: ModelFactory;
    configGetter: (settings: PGLitePluginSettings) => ModelConfig;
    displayName: string;
    requiredFields: ModelConfigField[];
    optionalFields: ModelConfigField[];
}

/**
 * Registry of embedding model providers
 */
const providerRegistry: Record<EmbeddingProvider, ProviderRegistryEntry> = {
    [EmbeddingProvider.Ollama]: {
        factory: (name, dimensions, description, config) => 
            new OllamaModel(name, dimensions, description, config),
        configGetter: (settings) => settings.providers[EmbeddingProvider.Ollama],
        displayName: 'Ollama',
        requiredFields: [ModelConfigField.BaseURL],
        optionalFields: []
    },
    [EmbeddingProvider.OpenAI]: {
        factory: (name, dimensions, description, config) => 
            new OpenAIModel(name, dimensions, description, config),
        configGetter: (settings) => settings.providers[EmbeddingProvider.OpenAI],
        displayName: 'OpenAI',
        requiredFields: [ModelConfigField.ApiKey],
        optionalFields: [ModelConfigField.BaseURL]
    }
};

/**
 * Register a new embedding model provider
 * @param provider The provider enum value
 * @param entry The provider registry entry
 */
export function registerProvider(provider: EmbeddingProvider, entry: ProviderRegistryEntry): void {
    providerRegistry[provider] = entry;
}

/**
 * Get all registered providers
 * @returns Array of provider entries with their enum values
 */
export function getRegisteredProviders(): Array<{provider: EmbeddingProvider, entry: ProviderRegistryEntry}> {
    return Object.entries(providerRegistry).map(([key, entry]) => ({
        provider: key as EmbeddingProvider,
        entry
    }));
}

/**
 * Validate a configuration using the provider's required fields
 * @param provider The provider to validate for
 * @param config The configuration to validate
 * @returns Array of validation errors, empty if valid
 */
export function validateProviderConfig(provider: EmbeddingProvider, config: ModelConfig): string[] {
    const entry = providerRegistry[provider];
    if (!entry) {
        return [`Unsupported provider: ${provider}`];
    }
    
    const errors: string[] = [];
    
    // Check that all required fields are present
    for (const fieldKey of entry.requiredFields) {
        const fieldValue = config[fieldKey];
        if (!fieldValue) {
            const metadata = MODEL_FIELD_METADATA[fieldKey];
            errors.push(`${metadata.name} is required`);
        }
    }
    
    // Validate URL fields
    for (const fieldKey of [...entry.requiredFields, ...entry.optionalFields]) {
        const fieldValue = config[fieldKey] as string | undefined;
        if (fieldValue && fieldKey === ModelConfigField.BaseURL) {
            try {
                new URL(fieldValue);
            } catch (e) {
                errors.push(`${MODEL_FIELD_METADATA[fieldKey].name}: Please enter a valid URL`);
            }
        }
    }
    
    return errors;
}

/**
 * Get the appropriate configuration for a model based on its provider
 * @param settings Plugin settings
 * @param modelInfo Model information
 * @returns Configuration object for the model
 */
export function getConfigForModel(settings: PGLitePluginSettings, modelInfo: EmbeddingModelInfo): ModelConfig {
    const entry = providerRegistry[modelInfo.provider];
    if (!entry) {
        throw new Error(`Unsupported provider: ${modelInfo.provider}`);
    }
    
    const config = entry.configGetter(settings);
    
    // Validate the configuration
    const errors = validateProviderConfig(modelInfo.provider, config);
    if (errors.length > 0) {
        throw new Error(`Invalid configuration for ${modelInfo.provider}: ${errors.join(', ')}`);
    }
    
    return config;
}

/**
 * Create an embedding model instance based on model information
 * @param modelInfo Model information
 * @param config Configuration for the model
 * @returns Embedding model instance
 */
export function createModelInstance(modelInfo: EmbeddingModelInfo, config: ModelConfig): EmbeddingModel {
    const entry = providerRegistry[modelInfo.provider];
    if (!entry) {
        throw new Error(`Unsupported provider: ${modelInfo.provider}`);
    }
    
    return entry.factory(
        modelInfo.name,
        modelInfo.dimensions,
        modelInfo.description,
        config
    );
}

/**
 * Information about an embedding model
 */
export interface EmbeddingModelInfo {
    name: string;
    dimensions: number;
    description: string;
    provider: EmbeddingProvider;
}