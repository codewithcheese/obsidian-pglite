import { EmbeddingModelInfo } from './EmbeddingModel';

/**
 * Registry for embedding models
 * Manages available embedding models and their properties
 */
export class ModelRegistry {
    private static models: Map<string, EmbeddingModelInfo> = new Map();
    
    /**
     * Register a model in the registry
     * @param info Model information
     */
    static registerModel(info: EmbeddingModelInfo): void {
        this.models.set(info.name, info);
    }
    
    /**
     * Get model information by name
     * @param name Model name
     * @returns Model information or undefined if not found
     */
    static getModel(name: string): EmbeddingModelInfo | undefined {
        return this.models.get(name);
    }
    
    /**
     * Get all registered models
     * @returns Array of all model information
     */
    static getAllModels(): EmbeddingModelInfo[] {
        return Array.from(this.models.values());
    }
}

// Register default models
ModelRegistry.registerModel({ 
    name: 'nomic-embed-text', 
    dimensions: 768, 
    description: 'Nomic Embed Text - High quality text embeddings (768 dimensions)' 
});

ModelRegistry.registerModel({ 
    name: 'all-minilm', 
    dimensions: 384, 
    description: 'All-MiniLM - Lightweight text embeddings (384 dimensions)' 
});

ModelRegistry.registerModel({ 
    name: 'mxbai-embed-large', 
    dimensions: 1024, 
    description: 'MxbAI Embed Large - High quality text embeddings (1024 dimensions)' 
});
