import { Notice } from 'obsidian';
import { PGliteProvider } from '../storage/PGliteProvider';

/**
 * Create a basic test table in the database
 * @param provider The PGlite provider instance
 */
export async function createTable(provider: PGliteProvider): Promise<void> {
    if (!provider.isReady()) {
        throw new Error('Database is not initialized');
    }

    try {
        const pgClient = provider.getClient();
        await pgClient.exec(`
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

/**
 * Insert test data into the database
 * @param provider The PGlite provider instance
 * @returns The ID of the inserted row
 */
export async function insertTestData(provider: PGliteProvider): Promise<number> {
    if (!provider.isReady()) {
        throw new Error('Database is not initialized');
    }

    try {
        const pgClient = provider.getClient();
        const results = await pgClient.exec(`
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

/**
 * Insert note data into the database
 * @param provider The PGlite provider instance
 * @param title The title of the note
 * @param content The content of the note
 * @returns The ID of the inserted row
 */
export async function insertNoteData(provider: PGliteProvider, title: string, content: string): Promise<number> {
    if (!provider.isReady()) {
        throw new Error('Database is not initialized');
    }

    try {
        // Make sure the table exists
        await createTable(provider);
        
        // Use query method for parameterized queries
        interface InsertResult {
            id: number;
        }
        
        const pgClient = provider.getClient();
        const result = await pgClient.query(
            'INSERT INTO test_table (title, content) VALUES ($1, $2) RETURNING id',
            [title, content]
        );
        
        // Cast the result to the expected type
        const insertedRow = result.rows[0] as InsertResult;
        
        return insertedRow.id;
    } catch (error) {
        console.error('Error inserting note data:', error);
        throw error;
    }
}

/**
 * Query all data from the test table
 * @param provider The PGlite provider instance
 * @returns Array of rows from the test table
 */
export async function queryAllData(provider: PGliteProvider): Promise<any[]> {
    if (!provider.isReady()) {
        throw new Error('Database is not initialized');
    }

    try {
        const pgClient = provider.getClient();
        const results = await pgClient.exec('SELECT * FROM test_table');
        return results[0].rows;
    } catch (error) {
        console.error('Error querying data:', error);
        throw error;
    }
}
