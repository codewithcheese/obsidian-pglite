import { embed } from 'ai';
import { ollama, createOllama } from 'ollama-ai-provider';
import { EmbeddingModel } from './EmbeddingModel';

/**
 * Implementation of EmbeddingModel using Ollama
 */
export class OllamaModel implements EmbeddingModel {
    private ollamaProvider;
    private embeddingModel;
    
    /**
     * Create a new OllamaModel
     * @param name Model name
     * @param dimensions Number of dimensions in the embedding
     * @param description Human-readable description of the model
     * @param baseUrl Base URL for the Ollama API
     */
    constructor(
        public readonly name: string,
        public readonly dimensions: number,
        public readonly description: string,
        private baseUrl: string
    ) {
        // Create a custom Ollama provider with the specified base URL
        this.ollamaProvider = createOllama({
            baseURL: baseUrl
        });
        
        // Create an embedding model using the provider
        this.embeddingModel = this.ollamaProvider.embedding(name);
    }
    
    /**
     * Generate an embedding for the given text
     * @param text The text to generate an embedding for
     * @returns A vector representation of the text
     */
    async generateEmbedding(text: string): Promise<number[]> {
        console.log(`Generating embedding using ${this.name} for text: ${text.substring(0, 50)}...`);
        
        try {
            // Use the AI SDK's embed function with our Ollama model
            const { embedding } = await embed({
                model: this.embeddingModel,
                value: text
            });
            
            // Verify the dimensions match what we expect
            if (embedding.length !== this.dimensions) {
                console.warn(`Warning: Expected ${this.dimensions} dimensions but got ${embedding.length}`);
            }
            
            return embedding;
        } catch (error) {
            console.error(`Error generating embedding: ${error}`);
            throw new Error(`Failed to generate embedding: ${error}`);
        }
    }
}
