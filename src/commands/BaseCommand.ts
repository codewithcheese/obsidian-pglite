import { Notice, Plugin } from 'obsidian';
import PGLitePlugin from '../../main';

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
     * Check if the vector store is ready
     * @returns True if the vector store is ready
     */
    protected checkVectorStoreReady(): this is { plugin: PGLitePlugin & { vectorStore: NonNullable<PGLitePlugin['vectorStore']> } } {
        if (!this.plugin.vectorStore || !this.plugin.vectorStore.isReady()) {
            new Notice('Vector store is not initialized yet');
            return false;
        }
        return true;
    }

    /**
     * Check if the vector service is ready
     * @returns True if the vector service is ready
     */
    protected checkVectorServiceReady(): this is { plugin: PGLitePlugin & { vectorService: NonNullable<PGLitePlugin['vectorService']> } } {
        if (!this.plugin.vectorService) {
            new Notice('Vector service is not initialized yet');
            return false;
        }
        return true;
    }
}
