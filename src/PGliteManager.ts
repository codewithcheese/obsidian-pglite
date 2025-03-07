import { PGlite } from '@electric-sql/pglite';
import { App, requestUrl, normalizePath, Plugin } from 'obsidian';

export class PGliteManager {
    private app: App;
    private plugin: Plugin;
    private pgClient: PGlite | null = null;
    private isInitialized: boolean = false;
    private dbName: string;
    private relaxedDurability: boolean;
    private dbPath: string;

    constructor(plugin: Plugin, dbName: string = 'database', relaxedDurability: boolean = true) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.dbName = dbName;
        this.relaxedDurability = relaxedDurability;
        
        // Use the plugin's data directory for storing the database file
        // This ensures we're using the correct plugin ID from the manifest
        this.dbPath = normalizePath(`${this.plugin.manifest.dir}/${this.dbName}.db`);
        console.log('Database path set to:', this.dbPath);
    }

    async initialize(): Promise<void> {
        try {
            const { fsBundle, wasmModule } = await this.loadPGliteResources();
            
            // Check if we have a saved database file
            const databaseFileExists = await this.app.vault.adapter.exists(this.dbPath);
            
            if (databaseFileExists) {
                // Load existing database
                console.log('Loading existing database from:', this.dbPath);
                const fileBuffer = await this.app.vault.adapter.readBinary(this.dbPath);
                const fileBlob = new Blob([fileBuffer], { type: 'application/x-gzip' });
                
                this.pgClient = await PGlite.create({
                    loadDataDir: fileBlob,
                    fsBundle: fsBundle,
                    wasmModule: wasmModule,
                    relaxedDurability: this.relaxedDurability
                });
            } else {
                // Create new database
                console.log('Creating new database');
                this.pgClient = await PGlite.create({
                    fsBundle: fsBundle,
                    wasmModule: wasmModule,
                    relaxedDurability: this.relaxedDurability
                });
            }
            
            this.isInitialized = true;
            console.log('PGlite initialized successfully');
            
            // Make sure the directory exists
            const dirPath = this.dbPath.substring(0, this.dbPath.lastIndexOf('/'));
            if (!await this.app.vault.adapter.exists(dirPath)) {
                await this.app.vault.adapter.mkdir(dirPath);
            }
        } catch (error) {
            console.error('Failed to initialize PGlite:', error);
            throw error;
        }
    }

    isReady(): boolean {
        return this.isInitialized && this.pgClient !== null;
    }

    async createTable(): Promise<void> {
        if (!this.isReady()) {
            throw new Error('Database is not initialized');
        }

        try {
            await this.pgClient!.exec(`
                CREATE TABLE IF NOT EXISTS test_table (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (error) {
            console.error('Error creating table:', error);
            throw error;
        }
    }

    async insertTestData(): Promise<number> {
        if (!this.isReady()) {
            throw new Error('Database is not initialized');
        }

        try {
            const results = await this.pgClient!.exec(`
                INSERT INTO test_table (title, content)
                VALUES ('Test Note', 'This is a test note created with PGlite')
                RETURNING id
            `);
            return results[0].rows[0].id;
        } catch (error) {
            console.error('Error inserting test data:', error);
            throw error;
        }
    }

    async insertNoteData(title: string, content: string): Promise<number> {
        if (!this.isReady()) {
            throw new Error('Database is not initialized');
        }

        try {
            // Make sure the table exists
            await this.createTable();
            
            // Use query method for parameterized queries
            interface InsertResult {
                id: number;
            }
            
            const result = await this.pgClient!.query<InsertResult>(
                'INSERT INTO test_table (title, content) VALUES ($1, $2) RETURNING id',
                [title, content]
            );
            
            return result.rows[0].id;
        } catch (error) {
            console.error('Error inserting note data:', error);
            throw error;
        }
    }

    async queryAllData(): Promise<any[]> {
        if (!this.isReady()) {
            throw new Error('Database is not initialized');
        }

        try {
            const results = await this.pgClient!.exec('SELECT * FROM test_table');
            return results[0].rows;
        } catch (error) {
            console.error('Error querying data:', error);
            throw error;
        }
    }

    async save(): Promise<void> {
        if (!this.pgClient || !this.isInitialized) {
            console.log('Cannot save: PGlite not initialized');
            return;
        }
        
        try {
            console.log('Saving database to:', this.dbPath);
            const blob: Blob = await this.pgClient.dumpDataDir('gzip');
            await this.app.vault.adapter.writeBinary(
                this.dbPath,
                Buffer.from(await blob.arrayBuffer())
            );
            console.log('Database saved successfully');
        } catch (error) {
            console.error('Error saving database:', error);
            throw error;
        }
    }
    
    async close(): Promise<void> {
        if (this.pgClient) {
            // Save the database before closing
            try {
                await this.save();
            } catch (error) {
                console.error('Error saving database during close:', error);
            }
            
            await this.pgClient.close();
            this.pgClient = null;
            this.isInitialized = false;
        }
    }

    private async loadPGliteResources(): Promise<{
        fsBundle: Blob;
        wasmModule: WebAssembly.Module;
    }> {
        try {
            // Use a specific version for stability
            const PGLITE_VERSION = '0.2.17';
            
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

            return { fsBundle, wasmModule };
        } catch (error) {
            console.error('Error loading PGlite resources:', error);
            throw error;
        }
    }
}
