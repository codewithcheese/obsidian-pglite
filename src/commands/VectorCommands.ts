import { Editor, MarkdownView, Modal, Notice } from 'obsidian';
import { BaseCommand } from './BaseCommand';
import { ResultsModal } from '../ui/ResultsModal';
import { ModelChangeConfirmationModal } from '../ui/ModelChangeConfirmationModal';

export class CreateVectorTableCommand extends BaseCommand {
    async execute(): Promise<void> {
        if (!this.checkVectorStoreReady()) return;

        try {
            // Create the vector table
            await this.plugin.vectorStore.createTable(true); // Force recreate
            
            // Save the database
            await this.plugin.vectorStore.save();
            new Notice('Vector table created successfully');
        } catch (error) {
            console.error('Error creating vector table:', error);
            new Notice('Error creating vector table: ' + (error as Error).message);
        }
    }
}

export class InsertNoteAsVectorCommand extends BaseCommand {
    async execute(editor: Editor): Promise<void> {
        if (!this.checkVectorServiceReady()) return;

        const content = editor.getValue();
        try {
            // Show a notice that we're generating the embedding
            const notice = new Notice('Generating embedding...', 0);
            
            // Check if the table is compatible with the current model
            const compatibility = await this.plugin.vectorService.checkTableCompatibility();
            
            if (!compatibility.compatible) {
                // Ask user for confirmation to recreate the table
                const confirmModal = new ModelChangeConfirmationModal(
                    this.plugin.app,
                    this.plugin.vectorService.getModelName(),
                    compatibility.modelDimensions,
                    compatibility.tableDimensions || 0,
                    async (confirmed) => {
                        if (confirmed) {
                            // Store a reference to the vector service to help TypeScript infer non-nullability
                            const vectorService = this.plugin.vectorService;
                            if (vectorService) {
                                // Recreate the vector table
                                await vectorService.recreateTable();
                                
                                // Try inserting again
                                await this.execute(editor);
                            }
                        }
                    }
                );
                notice.hide();
                confirmModal.open();
                return;
            }
            
            // Insert content using the vector service
            const id = await this.plugin.vectorService.insertContent(content);
            
            // Close the notice
            notice.hide();
            
            new Notice(`Note vector inserted with ID: ${id}`);
        } catch (error) {
            console.error('Error inserting note vector:', error);
            new Notice('Error inserting note vector: ' + (error as Error).message);
        }
    }
}

export class SearchSimilarToNoteCommand extends BaseCommand {
    async execute(editor: Editor, limit?: number): Promise<void> {
        if (!this.checkVectorServiceReady()) return;

        const content = editor.getValue();
        try {
            // Show a notice that we're searching
            const notice = new Notice('Searching for similar content...', 0);
            
            // Check if the table exists and is compatible
            const tableInfo = await this.plugin.vectorStore?.checkTableExists();
            if (!tableInfo?.exists) {
                notice.hide();
                new Notice('Vector table does not exist. Please create it first.');
                return;
            }
            
            // Search for similar content using the vector service
            const results = await this.plugin.vectorService.searchSimilar(content, limit);
            
            // Close the notice
            notice.hide();
            
            // Display results in a modal
            const resultsModal = new ResultsModal(this.plugin.app, results, true);
            resultsModal.open();
        } catch (error) {
            console.error('Error searching similar vectors:', error);
            new Notice('Error searching similar vectors: ' + (error as Error).message);
        }
    }
}

export class SearchSimilarWithCustomLimitCommand extends BaseCommand {
    async execute(editor: Editor): Promise<void> {
        const content = editor.getValue();
        
        // Create a small modal to get the limit from the user
        const modal = new Modal(this.plugin.app);
        modal.titleEl.setText('Enter search limit');
        
        const inputEl = modal.contentEl.createEl('input', {
            type: 'number',
            value: '10',
            attr: {
                min: '1',
                max: '100',
                step: '1'
            }
        });
        inputEl.style.width = '100%';
        inputEl.style.marginBottom = '10px';
        
        const buttonContainer = modal.contentEl.createDiv();
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        
        const searchButton = buttonContainer.createEl('button', { text: 'Search' });
        searchButton.addEventListener('click', async () => {
            const limit = parseInt(inputEl.value);
            if (isNaN(limit) || limit < 1) {
                new Notice('Please enter a valid number');
                return;
            }
            modal.close();
            
            // Use the SearchSimilarToNoteCommand to perform the search
            const searchCommand = new SearchSimilarToNoteCommand(this.plugin);
            await searchCommand.execute(editor, limit);
        });
        
        modal.open();
    }
}
