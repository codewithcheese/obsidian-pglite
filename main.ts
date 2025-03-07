import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PGliteManager } from './src/PGliteManager';

interface PGLitePluginSettings {
	databaseName: string;
	relaxedDurability: boolean;
}

const DEFAULT_SETTINGS: PGLitePluginSettings = {
	databaseName: 'pglite',
	relaxedDurability: true
}

export default class PGLitePlugin extends Plugin {
	settings: PGLitePluginSettings;
	dbManager: PGliteManager | null = null;

	async onload() {
		await this.loadSettings();

		// Initialize PGlite with our DatabaseManager
		await this.initializePGlite();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('database', 'PGlite Plugin', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			if (this.dbManager?.isReady()) {
				await this.dbManager.save();
				new Notice('PGlite database saved!');
			} else {
				new Notice('PGlite Plugin is active!');
			}
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('pglite-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('PGlite: ' + (this.dbManager?.isReady() ? 'Connected' : 'Disconnected'));

		// Command to create a test table
		this.addCommand({
			id: 'pglite-create-test-table',
			name: 'Create test table',
			callback: async () => {
				await this.createTestTable();
			}
		});

		// Command to insert test data
		this.addCommand({
			id: 'pglite-insert-test-data',
			name: 'Insert test data',
			callback: async () => {
				await this.insertTestData();
			}
		});

		// Command to query test data
		this.addCommand({
			id: 'pglite-query-test-data',
			name: 'Query test data',
			callback: async () => {
				await this.queryTestData();
			}
		});

		// Command to insert note data
		this.addCommand({
			id: 'pglite-insert-current-note',
			name: 'Insert current note data',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const noteContent = editor.getValue();
				const noteTitle = view.file?.basename || 'Untitled';
				await this.insertNoteData(noteTitle, noteContent);
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PGLiteSettingTab(this.app, this));
	}

	async initializePGlite() {
		try {
			// Initialize PGlite with our PGliteManager
			this.dbManager = new PGliteManager(
				this, // Pass the plugin instance instead of just the app
				this.settings.databaseName,
				this.settings.relaxedDurability
			);
			
			await this.dbManager.initialize();
			console.log('PGlite initialized successfully');
			new Notice('PGlite database connected!');
		} catch (error) {
			console.error('Failed to initialize PGlite:', error);
			new Notice('Failed to initialize PGlite: ' + (error as Error).message);
		}
	}

	async createTestTable() {
		if (!this.dbManager || !this.dbManager.isReady()) {
			new Notice('PGlite is not initialized yet');
			return;
		}

		try {
			await this.dbManager.createTable();
			// Save the database after creating the table
			await this.dbManager.save();
			new Notice('Test table created successfully');
		} catch (error) {
			console.error('Error creating test table:', error);
			new Notice('Error creating test table: ' + (error as Error).message);
		}
	}

	async insertTestData() {
		if (!this.dbManager || !this.dbManager.isReady()) {
			new Notice('PGlite is not initialized yet');
			return;
		}

		try {
			const id = await this.dbManager.insertTestData();
			// Save the database after inserting data
			await this.dbManager.save();
			new Notice(`Test data inserted with ID: ${id}`);
		} catch (error) {
			console.error('Error inserting test data:', error);
			new Notice('Error inserting test data: ' + (error as Error).message);
		}
	}

	async queryTestData() {
		if (!this.dbManager || !this.dbManager.isReady()) {
			new Notice('PGlite is not initialized yet');
			return;
		}

		try {
			const rows = await this.dbManager.queryAllData();
			console.log('Query results:', rows);
			
			// Display results in a modal
			new ResultsModal(this.app, rows).open();
		} catch (error) {
			console.error('Error querying test data:', error);
			new Notice('Error querying test data: ' + (error as Error).message);
		}
	}

	async insertNoteData(title: string, content: string) {
		if (!this.dbManager || !this.dbManager.isReady()) {
			new Notice('PGlite is not initialized yet');
			return;
		}

		try {
			const id = await this.dbManager.insertNoteData(title, content);
			// Save the database after inserting note data
			await this.dbManager.save();
			new Notice(`Note inserted with ID: ${id}`);
		} catch (error) {
			console.error('Error inserting note data:', error);
			new Notice('Error inserting note data: ' + (error as Error).message);
		}
	}

	async onunload() {
		// Close the PGlite connection when the plugin is unloaded
		if (this.dbManager) {
			await this.dbManager.close();
			console.log('PGlite connection closed');
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		
		// Reinitialize PGlite if settings have changed
		if (this.dbManager && this.dbManager.isReady()) {
			await this.dbManager.close();
			await this.initializePGlite();
		}
	}
}

class ResultsModal extends Modal {
	results: any[];

	constructor(app: App, results: any[]) {
		super(app);
		this.results = results;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl('h2', {text: 'Query Results'});

		if (this.results.length === 0) {
			contentEl.createEl('p', {text: 'No results found'});
			return;
		}

		// Create a table to display the results
		const table = contentEl.createEl('table');
		
		// Create table header
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		
		// Get column names from the first result
		const columns = Object.keys(this.results[0]);
		columns.forEach(column => {
			headerRow.createEl('th', {text: column});
		});

		// Create table body
		const tbody = table.createEl('tbody');
		this.results.forEach(row => {
			const tableRow = tbody.createEl('tr');
			columns.forEach(column => {
				tableRow.createEl('td', {text: String(row[column] || '')});
			});
		});

		// Add some basic styling
		contentEl.createEl('style', {
			text: `
				table { border-collapse: collapse; width: 100%; }
				th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
				th { background-color: #f2f2f2; }
				tr:nth-child(even) { background-color: #f9f9f9; }
			`
		});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class PGLiteSettingTab extends PluginSettingTab {
	plugin: PGLitePlugin;

	constructor(app: App, plugin: PGLitePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'PGlite Settings'});

		new Setting(containerEl)
			.setName('Database Name')
			.setDesc('The name of the IndexedDB database to use')
			.addText(text => text
				.setPlaceholder('Enter database name')
				.setValue(this.plugin.settings.databaseName)
				.onChange(async (value) => {
					this.plugin.settings.databaseName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Relaxed Durability')
			.setDesc('When enabled, query results are returned immediately and database writes happen asynchronously. This improves performance but may lead to data loss if the application crashes.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.relaxedDurability)
				.onChange(async (value) => {
					this.plugin.settings.relaxedDurability = value;
					await this.plugin.saveSettings();
				}));
	}
}
