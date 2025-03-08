import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { EmbeddingModel, ModelConfig } from './EmbeddingModel';

/**
 * Implementation of EmbeddingModel using OpenAI
 */
export class OpenAIModel implements EmbeddingModel {
    private openaiProvider;
    private embeddingModel;
    
    /**
     * Create a new OpenAIModel
     * @param name Model name
     * @param dimensions Number of dimensions in the embedding
     * @param description Human-readable description of the model
     * @param config Configuration for the OpenAI API
     */
    constructor(
        public readonly name: string,
        public readonly dimensions: number,
        public readonly description: string,
        private config: ModelConfig
    ) {
        // Create a custom OpenAI provider with the API key
        this.openaiProvider = createOpenAI({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseURL
        });
        
        // Create an embedding model using the provider
        this.embeddingModel = this.openaiProvider.embedding(name);
    }
    
    /**
     * Generate an embedding for the given text
     * @param text The text to generate an embedding for
     * @returns A vector representation of the text
     */
    async generateEmbedding(text: string): Promise<number[]> {
        console.log(`Generating embedding using OpenAI ${this.name} for text: ${text.substring(0, 50)}...`);
        
        // Use the AI SDK's embed function with our OpenAI model
        const { embedding } = await embed({
            model: this.embeddingModel,
            value: text
        });
            
        // Verify the dimensions match what we expect
        if (embedding.length !== this.dimensions) {
            console.warn(`Warning: Expected ${this.dimensions} dimensions but got ${embedding.length}`);
        }
            
        return embedding;
    }
}
