import { App, Modal, Setting } from 'obsidian';

/**
 * Confirmation modal for changing embedding model when dimensions differ
 */
export class ModelChangeConfirmationModal extends Modal {
    private newModel: string;
    private newDimensions: number;
    private currentDimensions: number;
    private onConfirm: (confirmed: boolean) => void;

    /**
     * Create a new ModelChangeConfirmationModal
     * @param app Obsidian app instance
     * @param newModel Name of the new model
     * @param newDimensions Dimensions of the new model
     * @param currentDimensions Current dimensions in the vector table
     * @param onConfirm Callback function called with the confirmation result
     */
    constructor(
        app: App, 
        newModel: string, 
        newDimensions: number, 
        currentDimensions: number,
        onConfirm: (confirmed: boolean) => void
    ) {
        super(app);
        this.newModel = newModel;
        this.newDimensions = newDimensions;
        this.currentDimensions = currentDimensions;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl, titleEl } = this;
        
        titleEl.setText('Change Embedding Model');
        
        contentEl.createEl('p', {
            text: `You are changing the embedding model to "${this.newModel}" which uses ${this.newDimensions} dimensions, ` +
                  `but your current vector table uses ${this.currentDimensions} dimensions.`
        });
        
        contentEl.createEl('p', {
            text: 'This will require recreating the vector table, which will delete all existing vectors. ' +
                  'You will need to re-index your notes after this change.'
        });
        
        contentEl.createEl('p', {
            text: 'Do you want to proceed?',
            cls: 'warning'
        }).style.color = 'var(--text-warning)';
        
        // Add buttons
        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.marginTop = '20px';
        
        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.style.marginRight = '10px';
        cancelButton.addEventListener('click', () => {
            this.onConfirm(false);
            this.close();
        });
        
        const confirmButton = buttonContainer.createEl('button', { text: 'Proceed', cls: 'mod-warning' });
        confirmButton.addEventListener('click', () => {
            this.onConfirm(true);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
