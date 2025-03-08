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
 * Information about an embedding model
 */
export interface EmbeddingModelInfo {
    name: string;
    dimensions: number;
    description: string;
    provider: EmbeddingProvider;
}

export type ModelConfig = {
    baseURL?: string;
    apiKey?: string;
}