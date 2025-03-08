import { Notice, Plugin } from 'obsidian';
import PGLitePlugin from '../../main';
import { PGliteVectorStore } from '../storage/PGliteVectorStore';
import { getModelInfo } from '../settings/PGLitePluginSettings';
import { getConfigForModel, getEmbeddingModel } from '../utils/EmbeddingHelpers';

export abstract class BaseCommand {
    constructor(protected plugin: PGLitePlugin) {}

    /**
     * Check if the provider is ready
     * @returns True if the provider is ready
     */
    protected checkProviderReady(): this is { plugin: PGLitePlugin & { provider: NonNullable<PGLitePlugin['provider']> } } {
        if (!this.plugin.provider || !this.plugin.provider.isReady()) {
            new Notice('PGlite is not initialized yet');
            return false;
        }
        return true;
    }

    /**
     * Create a vector store instance
     * @returns A new vector store instance
     */
    protected createVectorStore(): PGliteVectorStore {
        if (!this.checkProviderReady()) {
            throw new Error('Provider is not ready');
        }
        
        // Get model info to determine dimensions
        const modelInfo = getModelInfo(this.plugin.settings.selectedModel);
        if (!modelInfo) {
            throw new Error(`Model ${this.plugin.settings.selectedModel} not found in available models`);
        }
        
        // Create and return a new vector store
        return new PGliteVectorStore(
            this.plugin.provider,
            modelInfo.dimensions,
            'vector_test'            
        );
    }

    /**
     * Create an embedding model instance
     * @returns A new embedding model instance
     */
    protected createEmbeddingModel() {
        const modelInfo = getModelInfo(this.plugin.settings.selectedModel);
        if (!modelInfo) {
            throw new Error(`Model ${this.plugin.settings.selectedModel} not found in available models`);
        }
        
        // Get the appropriate configuration for the model's provider
        const config = getConfigForModel(this.plugin.settings, modelInfo);
            
        return getEmbeddingModel(
            this.plugin.settings.selectedModel,
            config
        );
    }
    

}
