import { EmbeddingModel } from '../models/EmbeddingModel';
import { PGliteVectorStore } from '../storage/PGliteVectorStore';

/**
 * Service for vector operations
 * Coordinates between embedding models and vector storage
 */
export class VectorService {
    private model: EmbeddingModel;
    private store: PGliteVectorStore;
    
    /**
     * Create a new VectorService
     * @param model Embedding model for generating vectors
     * @param store Vector store for storing and retrieving vectors
     */
    constructor(model: EmbeddingModel, store: PGliteVectorStore) {
        this.model = model;
        this.store = store;
    }
    
    /**
     * Get the name of the current model
     */
    getModelName(): string {
        return this.model.name;
    }
    
    /**
     * Get the dimensions of the current model
     */
    getModelDimensions(): number {
        return this.model.dimensions;
    }
    
    /**
     * Change the embedding model
     * @param newModel The new model to use
     * @returns Information about the model change
     */
    async changeModel(newModel: EmbeddingModel): Promise<{
        dimensionsChanged: boolean,
        oldDimensions?: number,
        newDimensions: number
    }> {
        const oldDimensions = this.model.dimensions;
        this.model = newModel;
        
        // Update store dimensions
        this.store.setDimensions(newModel.dimensions);
        
        return {
            dimensionsChanged: oldDimensions !== newModel.dimensions,
            oldDimensions: oldDimensions !== newModel.dimensions ? oldDimensions : undefined,
            newDimensions: newModel.dimensions
        };
    }
    
    /**
     * Insert content with its vector embedding
     * @param content Text content to embed and store
     * @returns ID of the inserted vector
     */
    async insertContent(content: string): Promise<number> {
        // Generate embedding
        const vector = await this.model.generateEmbedding(content);
        
        // Check dimensions
        if (vector.length !== this.model.dimensions) {
            console.warn(`Warning: Expected ${this.model.dimensions} dimensions but got ${vector.length}`);
        }
        
        // Insert vector
        const id = await this.store.insertVector(content, vector);
        
        // Save changes
        await this.store.save();
        
        return id;
    }
    
    /**
     * Search for content similar to the given text
     * @param content Text to search for similar content
     * @param limit Maximum number of results to return
     * @returns Array of similar content with similarity scores
     */
    async searchSimilar(content: string, limit?: number): Promise<any[]> {
        // Generate embedding
        const vector = await this.model.generateEmbedding(content);
        
        // Check dimensions
        if (vector.length !== this.model.dimensions) {
            console.warn(`Warning: Expected ${this.model.dimensions} dimensions but got ${vector.length}`);
        }
        
        // Search for similar vectors
        return this.store.searchSimilar(vector, limit);
    }
    
    /**
     * Check if the vector table is compatible with the current model
     * @returns Compatibility information
     */
    async checkTableCompatibility(): Promise<{
        compatible: boolean,
        tableDimensions?: number,
        modelDimensions: number
    }> {
        const tableInfo = await this.store.checkTableExists();
        
        if (!tableInfo.exists || !tableInfo.dimensions) {
            return { compatible: true, modelDimensions: this.model.dimensions };
        }
        
        return {
            compatible: tableInfo.dimensions === this.model.dimensions,
            tableDimensions: tableInfo.dimensions,
            modelDimensions: this.model.dimensions
        };
    }
    
    /**
     * Recreate the vector table with current model dimensions
     * This will delete all existing vectors
     */
    async recreateTable(): Promise<void> {
        await this.store.createTable(true);
        await this.store.save();
    }
}
