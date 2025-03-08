import { App, Modal } from 'obsidian';

/**
 * Modal for displaying query results
 */
export class ResultsModal extends Modal {
    private results: any[];
    private isVectorSearch: boolean;

    /**
     * Create a new ResultsModal
     * @param app Obsidian app instance
     * @param results Query results to display
     * @param isVectorSearch Whether the results are from a vector search
     */
    constructor(app: App, results: any[], isVectorSearch: boolean = false) {
        super(app);
        this.results = results;
        this.isVectorSearch = isVectorSearch;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Query Results' });

        if (this.results.length === 0) {
            contentEl.createEl('p', { text: 'No results found.' });
            return;
        }

        // Create a table for the results
        const table = contentEl.createEl('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        // Create table header
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');

        // Get column names from the first result
        const firstResult = this.results[0];
        const columns = Object.keys(firstResult);

        // Add header cells
        columns.forEach(column => {
            const th = headerRow.createEl('th', { text: column });
            th.style.textAlign = 'left';
            th.style.padding = '8px';
            th.style.borderBottom = '1px solid #ddd';
        });

        // Create table body
        const tbody = table.createEl('tbody');

        // Add rows for each result
        this.results.forEach(result => {
            const row = tbody.createEl('tr');

            // Add cells for each column
            columns.forEach(column => {
                const td = row.createEl('td');
                td.style.padding = '8px';
                td.style.borderBottom = '1px solid #ddd';

                // Format the cell content based on the column and value
                let value = result[column];

                // Special handling for vector search results
                if (this.isVectorSearch && column === 'distance') {
                    // Format distance as a percentage similarity
                    const similarity = (1 - value) * 100;
                    td.textContent = `${similarity.toFixed(2)}%`;
                } else if (column === 'embedding' && Array.isArray(value)) {
                    // For embedding vectors, show a summary
                    td.textContent = `[${value.length} dimensions]`;
                } else if (column === 'content' && typeof value === 'string' && value.length > 100) {
                    // For long content, show a truncated version
                    td.textContent = value.substring(0, 100) + '...';
                    
                    // Add a button to view the full content
                    const viewButton = td.createEl('button', { text: 'View' });
                    viewButton.style.marginLeft = '8px';
                    viewButton.addEventListener('click', () => {
                        // Create a modal to display the full content
                        const contentModal = new Modal(this.app);
                        contentModal.titleEl.setText('Full Content');
                        contentModal.contentEl.createEl('pre', { text: value });
                        contentModal.open();
                    });
                } else {
                    // Default display
                    td.textContent = String(value);
                }
            });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
