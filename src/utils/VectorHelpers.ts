import { Notice } from 'obsidian';
import { EmbeddingModel } from '../models/EmbeddingModel';
import { PGliteVectorStore } from '../storage/PGliteVectorStore';

/**
 * Get the name of the embedding model
 * @param model The embedding model
 * @returns The name of the model
 */
export function getModelName(model: EmbeddingModel): string {
    return model.name;
}

/**
 * Get the dimensions of the embedding model
 * @param model The embedding model
 * @returns The number of dimensions
 */
export function getModelDimensions(model: EmbeddingModel): number {
    return model.dimensions;
}

/**
 * Change the embedding model for a vector store
 * @param model Current model reference to update
 * @param newModel The new model to use
 * @param store The vector store to update
 * @returns Information about the model change
 */
export function changeEmbeddingModel(
    currentModel: EmbeddingModel,
    newModel: EmbeddingModel,
    store: PGliteVectorStore
): {
    dimensionsChanged: boolean,
    oldDimensions?: number,
    newDimensions: number
} {
    const oldDimensions = currentModel.dimensions;
    
    // Update store dimensions
    store.setDimensions(newModel.dimensions);
    
    return {
        dimensionsChanged: oldDimensions !== newModel.dimensions,
        oldDimensions: oldDimensions !== newModel.dimensions ? oldDimensions : undefined,
        newDimensions: newModel.dimensions
    };
}

/**
 * Insert content with its vector embedding
 * @param model The embedding model
 * @param store The vector store
 * @param content Text content to embed and store
 * @returns ID of the inserted vector
 */
export async function insertContentAsVector(
    model: EmbeddingModel,
    store: PGliteVectorStore,
    content: string
): Promise<number> {
    // Generate embedding
    const vector = await model.generateEmbedding(content);
    
    // Check dimensions
    if (vector.length !== model.dimensions) {
        console.warn(`Warning: Expected ${model.dimensions} dimensions but got ${vector.length}`);
    }
    
    // Insert vector
    const id = await store.insertVector(content, vector);
    
    // Save changes
    await store.save();
    
    return id;
}

/**
 * Search for content similar to the given text
 * @param model The embedding model
 * @param store The vector store
 * @param content Text to search for similar content
 * @param limit Maximum number of results to return
 * @returns Array of similar content with similarity scores
 */
export async function searchSimilarContent(
    model: EmbeddingModel,
    store: PGliteVectorStore,
    content: string,
    limit?: number
): Promise<any[]> {
    // Generate embedding
    const vector = await model.generateEmbedding(content);
    
    // Check dimensions
    if (vector.length !== model.dimensions) {
        console.warn(`Warning: Expected ${model.dimensions} dimensions but got ${vector.length}`);
    }
    
    // Search for similar vectors
    return store.searchSimilar(vector, limit);
}

/**
 * Check if the vector table is compatible with the current model
 * @param model The embedding model
 * @param store The vector store
 * @returns Compatibility information
 */
export async function checkTableCompatibility(
    model: EmbeddingModel,
    store: PGliteVectorStore
): Promise<{
    compatible: boolean,
    tableDimensions?: number,
    modelDimensions: number
}> {
    const tableInfo = await store.checkTableExists();
    
    if (!tableInfo.exists || !tableInfo.dimensions) {
        return { compatible: true, modelDimensions: model.dimensions };
    }
    
    return {
        compatible: tableInfo.dimensions === model.dimensions,
        tableDimensions: tableInfo.dimensions,
        modelDimensions: model.dimensions
    };
}

/**
 * Recreate the vector table with current model dimensions
 * This will delete all existing vectors
 * @param store The vector store
 */
export async function recreateVectorTable(store: PGliteVectorStore): Promise<void> {
    await store.createTable(true);
    await store.save();
}
