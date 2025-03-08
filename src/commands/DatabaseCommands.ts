import { Editor, MarkdownView, Notice } from 'obsidian';
import { BaseCommand } from './BaseCommand';
import { createTable, insertTestData, queryAllData, insertNoteData } from '../utils/DatabaseHelpers';
import { ResultsModal } from '../ui/ResultsModal';

export class CreateTableCommand extends BaseCommand {
    async execute(): Promise<void> {
        if (!this.checkProviderReady()) return;

        try {
            await createTable(this.plugin.provider);
            // Save the database after creating the table
            await this.plugin.provider.save();
            new Notice('Test table created successfully');
        } catch (error) {
            console.error('Error creating test table:', error);
            new Notice('Error creating test table: ' + (error as Error).message);
        }
    }
}

export class InsertTestDataCommand extends BaseCommand {
    async execute(): Promise<void> {
        if (!this.checkProviderReady()) return;

        try {
            const id = await insertTestData(this.plugin.provider);
            // Save the database after inserting data
            await this.plugin.provider.save();
            new Notice(`Test data inserted with ID: ${id}`);
        } catch (error) {
            console.error('Error inserting test data:', error);
            new Notice('Error inserting test data: ' + (error as Error).message);
        }
    }
}

export class QueryTestDataCommand extends BaseCommand {
    async execute(): Promise<void> {
        if (!this.checkProviderReady()) return;

        try {
            const rows = await queryAllData(this.plugin.provider);
            console.log('Query results:', rows);
            
            // Display results in a modal
            new ResultsModal(this.plugin.app, rows).open();
        } catch (error) {
            console.error('Error querying test data:', error);
            new Notice('Error querying test data: ' + (error as Error).message);
        }
    }
}

export class InsertNoteDataCommand extends BaseCommand {
    async execute(editor: Editor, view: MarkdownView): Promise<void> {
        if (!this.checkProviderReady()) return;

        const noteContent = editor.getValue();
        const noteTitle = view.file?.basename || 'Untitled';

        try {
            const id = await insertNoteData(this.plugin.provider, noteTitle, noteContent);
            // Save the database after inserting note data
            await this.plugin.provider.save();
            new Notice(`Note inserted with ID: ${id}`);
        } catch (error) {
            console.error('Error inserting note data:', error);
            new Notice('Error inserting note data: ' + (error as Error).message);
        }
    }
}
