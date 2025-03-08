import { EmbeddingModel, EmbeddingProvider, ModelConfig } from '../models/EmbeddingModel';
import { OllamaModel } from '../models/OllamaModel';
import { OpenAIModel } from '../models/OpenAIModel';
import { EmbeddingModelInfo, PGLitePluginSettings, getModelInfo } from '../settings/PGLitePluginSettings';

/**
 * Get the appropriate configuration for a model based on its provider
 * @param settings Plugin settings
 * @param modelInfo Model information
 * @returns Configuration object for the model
 */
export function getConfigForModel(settings: PGLitePluginSettings, modelInfo: EmbeddingModelInfo): ModelConfig {
    switch (modelInfo.provider) {
        case EmbeddingProvider.Ollama:
            return settings.ollama;
        case EmbeddingProvider.OpenAI:
            // Validate OpenAI API key
            if (!settings.openai.apiKey) {
                throw new Error('OpenAI API key is required for OpenAI models');
            }
            return settings.openai;
        default:
            throw new Error(`Unsupported provider: ${modelInfo.provider}`);
    }
}

/**
 * Create an embedding model instance based on model information
 * @param modelInfo Model information
 * @param config Configuration for the model
 * @returns Embedding model instance
 */
export function createModelInstance(modelInfo: EmbeddingModelInfo, config: ModelConfig): EmbeddingModel {
    switch (modelInfo.provider) {
        case EmbeddingProvider.Ollama:
            return new OllamaModel(
                modelInfo.name,
                modelInfo.dimensions,
                modelInfo.description,
                config
            );
        case EmbeddingProvider.OpenAI:
            return new OpenAIModel(
                modelInfo.name,
                modelInfo.dimensions,
                modelInfo.description,
                config
            );
        default:
            throw new Error(`Unsupported provider: ${modelInfo.provider}`);
    }
}

/**
 * Get an embedding model based on the provided settings
 * Creates a new instance on demand
 * @param name The name of the model
 * @param config Configuration for the embedding model
 * @returns The embedding model
 */
export function getEmbeddingModel(
    name: string,
    config: ModelConfig
): EmbeddingModel {
    // Get the model information
    const modelInfo = getModelInfo(name);
    if (!modelInfo) {
        throw new Error(`Model ${name} not found in available models`);
    }
    
    // Create the model instance
    return createModelInstance(modelInfo, config);
}
