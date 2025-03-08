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
 * Information about an embedding model
 */
export interface EmbeddingModelInfo {
    name: string;
    dimensions: number;
    description: string;
}
