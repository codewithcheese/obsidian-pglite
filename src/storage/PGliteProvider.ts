import { Plugin, requestUrl, normalizePath } from 'obsidian';
import { PGlite } from '@electric-sql/pglite';

// Use a specific version for stability
const PGLITE_VERSION = '0.2.17';

/**
 * Provider for PGlite database in Obsidian
 * Handles loading PGlite from CDN and database persistence
 */
export class PGliteProvider {
    private plugin: Plugin;
    private dbName: string;
    private pgClient: PGlite | null = null;
    private isInitialized: boolean = false;
    private dbPath: string;
    private relaxedDurability: boolean;
    
    /**
     * Create a new PGliteProvider
     * @param plugin Obsidian plugin instance
     * @param dbName Database name
     * @param relaxedDurability Whether to use relaxed durability for better performance
     */
    constructor(plugin: Plugin, dbName: string, relaxedDurability: boolean = true) {
        this.plugin = plugin;
        this.dbName = dbName;
        this.relaxedDurability = relaxedDurability;
        
        // Use the plugin's data directory for storing the database file
        // This ensures we're using the correct plugin ID from the manifest
        this.dbPath = normalizePath(`${this.plugin.manifest.dir}/${this.dbName}.db`);
        console.log('Database path set to:', this.dbPath);
    }
    
    /**
     * Initialize the PGlite database
     * Loads PGlite from CDN and restores data if available
     */
    async initialize(): Promise<void> {
        try {
            const { fsBundle, wasmModule, vectorExtensionBundlePath } = await this.loadPGliteResources();
            
            // Check if we have a saved database file
            const databaseFileExists = await this.plugin.app.vault.adapter.exists(this.dbPath);
            
            if (databaseFileExists) {
                // Load existing database
                console.log('Loading existing database from:', this.dbPath);
                const fileBuffer = await this.plugin.app.vault.adapter.readBinary(this.dbPath);
                const fileBlob = new Blob([fileBuffer], { type: 'application/x-gzip' });
                
                // Create PGlite instance with existing data
                this.pgClient = await this.createPGliteInstance({
                    loadDataDir: fileBlob,
                    fsBundle,
                    wasmModule,
                    vectorExtensionBundlePath
                });
            } else {
                // Create new database
                console.log('Creating new database');
                this.pgClient = await this.createPGliteInstance({
                    fsBundle,
                    wasmModule,
                    vectorExtensionBundlePath
                });
            }
            
            this.isInitialized = true;
            console.log('PGlite initialized successfully');
            
            // Make sure the directory exists
            const dirPath = this.dbPath.substring(0, this.dbPath.lastIndexOf('/'));
            if (!await this.plugin.app.vault.adapter.exists(dirPath)) {
                await this.plugin.app.vault.adapter.mkdir(dirPath);
            }
        } catch (error) {
            console.error('Error initializing PGlite:', error);
            throw new Error(`Failed to initialize PGlite: ${error}`);
        }
    }
    
    /**
     * Get the PGlite client
     * @returns The initialized PGlite client
     */
    getClient(): PGlite {
        if (!this.pgClient) {
            throw new Error('PGlite client is not initialized');
        }
        return this.pgClient;
    }
    
    /**
     * Check if the PGlite provider is ready for operations
     */
    isReady(): boolean {
        return this.isInitialized && this.pgClient !== null;
    }
    
    /**
     * Save the current state of the database
     */
    async save(): Promise<void> {
        if (!this.pgClient || !this.isInitialized) {
            console.log('Cannot save: PGlite not initialized');
            return;
        }
        
        try {
            console.log('Saving database to:', this.dbPath);
            const blob: Blob = await this.pgClient.dumpDataDir('gzip');
            await this.plugin.app.vault.adapter.writeBinary(
                this.dbPath,
                Buffer.from(await blob.arrayBuffer())
            );
            console.log('Database saved successfully');
        } catch (error) {
            console.error('Error saving database:', error);
            throw error;
        }
    }
    

    
    /**
     * Close the PGlite connection
     */
    async close(): Promise<void> {
        if (this.pgClient) {
            try {
                // Save before closing
                await this.save();
                
                // Close the connection
                await this.pgClient.close();
                this.pgClient = null;
                this.isInitialized = false;
                console.log('PGlite connection closed');
            } catch (error) {
                console.error('Error closing PGlite connection:', error);
            }
        }
    }
    
    /**
     * Create a PGlite instance with the specified options
     */
    private async createPGliteInstance(options: {
        loadDataDir?: Blob,
        fsBundle: Blob,
        wasmModule: WebAssembly.Module,
        vectorExtensionBundlePath: URL
    }): Promise<PGlite> {
        // Create PGlite instance with options
        return await PGlite.create({
            ...options,
            relaxedDurability: this.relaxedDurability,
            extensions: {
                vector: options.vectorExtensionBundlePath
            }
        });
    }
    
    /**
     * Load PGlite resources from CDN
     */
    private async loadPGliteResources(): Promise<{
        fsBundle: Blob,
        wasmModule: WebAssembly.Module,
        vectorExtensionBundlePath: URL
    }> {
        try {
            const [fsBundleResponse, wasmResponse] = await Promise.all([
                requestUrl(
                    `https://unpkg.com/@electric-sql/pglite@${PGLITE_VERSION}/dist/postgres.data`
                ),
                requestUrl(
                    `https://unpkg.com/@electric-sql/pglite@${PGLITE_VERSION}/dist/postgres.wasm`
                )
            ]);

            const fsBundle = new Blob([fsBundleResponse.arrayBuffer], {
                type: 'application/octet-stream'
            });
            
            const wasmModule = await WebAssembly.compile(wasmResponse.arrayBuffer);
            
            // Add vector extension bundle path
            const vectorExtensionBundlePath = new URL(
                `https://unpkg.com/@electric-sql/pglite@${PGLITE_VERSION}/dist/vector.tar.gz`
            );

            return { fsBundle, wasmModule, vectorExtensionBundlePath };
        } catch (error) {
            console.error('Error loading PGlite resources:', error);
            throw error;
        }
    }
}
