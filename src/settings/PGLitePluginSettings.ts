/**
 * Settings for the PGLite plugin
 */
export interface PGLitePluginSettings {
    databaseName: string;
    relaxedDurability: boolean;
    ollamaBaseUrl: string;
    ollamaModel: string;
}

/**
 * Default settings for the PGLite plugin
 */
export const DEFAULT_SETTINGS: PGLitePluginSettings = {
    databaseName: 'pglite',
    relaxedDurability: true,
    ollamaBaseUrl: 'http://localhost:11434/api',
    ollamaModel: 'nomic-embed-text'
}
