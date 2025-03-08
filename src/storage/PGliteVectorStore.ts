import { PGliteProvider } from './PGliteProvider';

/**
 * Implementation of VectorStore using PGlite
 */
export class PGliteVectorStore {
    /**
     * Create a new PGliteVectorStore
     * @param provider PGlite provider
     * @param dimensions Number of dimensions for vectors
     * @param tableName Name of the vector table
     * @param relaxedDurability Whether to use relaxed durability for better performance
     */
    constructor(
        private provider: PGliteProvider,
        private dimensions: number,
        private tableName: string = 'vector_test',
        private relaxedDurability: boolean = true
    ) {}
    
    /**
     * Check if the provider is ready
     */
    isReady(): boolean {
        return this.provider.isReady();
    }

    /**
     * Get the current vector dimensions in the store
     */
    getDimensions(): number {
        return this.dimensions;
    }
    
    /**
     * Set the vector dimensions for future operations
     * @param dimensions Number of dimensions
     */
    setDimensions(dimensions: number): void {
        this.dimensions = dimensions;
    }
    
    /**
     * Check if the vector table exists and get its dimensions
     * @returns Object with existence and dimensions information
     */
    async checkTableExists(): Promise<{exists: boolean, dimensions?: number}> {
        if (!this.isReady()) {
            throw new Error('PGlite provider is not ready');
        }
        
        try {
            const pgClient = this.provider.getClient();
            
            // Check if table exists
            const tableExists = await pgClient.query(
                `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '${this.tableName}')`
            );
            
            if (!(tableExists.rows[0] as {exists: boolean}).exists) {
                return { exists: false };
            }
            
            // Get the dimensions of the vector column
            // For pgvector, vector dimensions = (atttypmod - 8) / 4
            const dimensionsResult = await pgClient.query(
                `SELECT atttypmod as dimensions FROM pg_attribute WHERE attrelid = '${this.tableName}'::regclass AND attname = 'embedding'`
            );
            
            if (dimensionsResult.rows.length > 0) {
                const dimensions = parseInt((dimensionsResult.rows[0] as {dimensions: string}).dimensions);
                return { exists: true, dimensions };
            }
            
            return { exists: true };
        } catch (error) {
            console.error(`Error checking vector table ${this.tableName}:`, error);
            return { exists: false };
        }
    }
    
    /**
     * Create or recreate the vector table
     * @param force If true, drop the existing table first
     */
    async createTable(force: boolean = false): Promise<void> {
        if (!this.isReady()) {
            throw new Error('PGlite provider is not ready');
        }
        
        try {
            const pgClient = this.provider.getClient();
            
            // Drop table if force is true and table exists
            if (force) {
                await pgClient.query(`DROP TABLE IF EXISTS ${this.tableName}`);
                console.log(`Dropped existing vector table: ${this.tableName}`);
            }
            
            // Create table with the specified dimensions
            await pgClient.query(`
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id SERIAL PRIMARY KEY,
                    content TEXT,
                    embedding VECTOR(${this.dimensions})
                )
            `);
            
            console.log(`Vector table ${this.tableName} created with ${this.dimensions} dimensions`);
        } catch (error) {
            console.error(`Error creating vector table ${this.tableName}:`, error);
            throw new Error(`Failed to create vector table ${this.tableName}: ${error}`);
        }
    }
    
    /**
     * Insert a vector into the store
     * @param content Text content associated with the vector
     * @param vector The embedding vector
     * @returns ID of the inserted vector
     */
    async insertVector(content: string, vector: number[]): Promise<number> {
        if (!this.isReady()) {
            throw new Error('PGlite provider is not ready');
        }
        
        const pgClient = this.provider.getClient();

        // Insert the vector data
        const result = await pgClient.query(
            `INSERT INTO ${this.tableName} (content, embedding) VALUES ($1, $2) RETURNING id`,
            [content, JSON.stringify(vector)]
        );
        
        const id = (result.rows[0] as { id: number }).id;
        console.log(`Vector inserted into ${this.tableName} with ID: ${id}`);
        return id;
    }
    
    /**
     * Search for vectors similar to the given vector
     * @param vector The query vector
     * @param limit Maximum number of results to return
     * @returns Array of matching results with similarity scores
     */
    async searchSimilar(vector: number[], limit: number = 5): Promise<any[]> {
        if (!this.isReady()) {
            throw new Error('PGlite provider is not ready');
        }
        
        const pgClient = this.provider.getClient();
            
        // Search for similar vectors
        const result = await pgClient.query(
            `SELECT id, content, embedding <=> $1 as distance FROM ${this.tableName} ORDER BY distance LIMIT $2`,
            [JSON.stringify(vector), limit]
        );
            
        return result.rows;
    }
    
    /**
     * Save the current state of the vector store
     */
    async save(): Promise<void> {
        if (!this.isReady()) return;
        
        await this.provider.save();
    }
    
    /**
     * Get the table name used by this vector store
     */
    getTableName(): string {
        return this.tableName;
    }
}
