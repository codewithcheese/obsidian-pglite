import { App, Editor, MarkdownView, Modal, Notice, Plugin, ButtonComponent } from 'obsidian';
import { PGLitePluginSettings, DEFAULT_SETTINGS } from './src/settings/PGLitePluginSettings';
import { PGLiteSettingTab } from './src/settings/PGLiteSettingTab';
import { PGliteProvider } from './src/storage/PGliteProvider';
import { CreateVectorTableCommand, InsertNoteAsVectorCommand, SearchSimilarToNoteCommand, SearchSimilarWithCustomLimitCommand } from './src/commands/VectorCommands';
import { CreateTableCommand, InsertNoteDataCommand, InsertTestDataCommand, QueryTestDataCommand } from './src/commands/DatabaseCommands';

export default class PGLitePlugin extends Plugin {
	settings: PGLitePluginSettings;
	provider: PGliteProvider | null = null;

	async onload() {
		await this.loadSettings();

		// Initialize PGlite with our DatabaseManager
		await this.initializePGlite();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('database', 'PGlite Plugin', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			if (this.provider?.isReady()) {
				await this.provider.save();
				new Notice('PGlite database saved!');
			} else {
				new Notice('PGlite Plugin is active!');
			}
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('pglite-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('PGlite: ' + (this.provider?.isReady() ? 'Connected' : 'Disconnected'));

		// Database-related commands
		this.addCommand({
			id: 'pglite-create-test-table',
			name: 'Create test table',
			callback: async () => {
				const command = new CreateTableCommand(this);
				await command.execute();
			}
		});

		this.addCommand({
			id: 'pglite-insert-test-data',
			name: 'Insert test data',
			callback: async () => {
				const command = new InsertTestDataCommand(this);
				await command.execute();
			}
		});

		this.addCommand({
			id: 'pglite-query-test-data',
			name: 'Query test data',
			callback: async () => {
				const command = new QueryTestDataCommand(this);
				await command.execute();
			}
		});

		this.addCommand({
			id: 'pglite-insert-current-note',
			name: 'Insert current note data',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const command = new InsertNoteDataCommand(this);
				await command.execute(editor, view);
			}
		});

		// Vector-related commands
		this.addCommand({
			id: 'pglite-create-vector-table',
			name: 'Create vector table',
			callback: async () => {
				const command = new CreateVectorTableCommand(this);
				await command.execute();
			}
		});

		this.addCommand({
			id: 'pglite-insert-note-as-vector',
			name: 'Insert current note as vector',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const command = new InsertNoteAsVectorCommand(this);
				await command.execute(editor);
			}
		});

		this.addCommand({
			id: 'pglite-search-similar-vectors',
			name: 'Search similar to current note',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const command = new SearchSimilarToNoteCommand(this);
				await command.execute(editor);
			}
		});

		this.addCommand({
			id: 'pglite-search-similar-vectors-custom',
			name: 'Search similar to current note (custom limit)',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const command = new SearchSimilarWithCustomLimitCommand(this);
				await command.execute(editor);
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PGLiteSettingTab(this.app, this));
	}

	async initializePGlite() {
		try {
			this.provider = new PGliteProvider(
				this, // Pass the plugin instance
				this.settings.databaseName
			);
			
			await this.provider.initialize();
			
			// No need to initialize the vector store here - it will be created on demand
			
			console.log('PGlite and Embedding Model initialized successfully');
			new Notice('PGlite database connected!');
		} catch (error) {
			console.error('Failed to initialize PGlite:', error);
			new Notice('Failed to initialize PGlite: ' + (error as Error).message);
		}
	}



	async onunload() {
		// Close the PGlite connections when the plugin is unloaded
		if (this.provider) {
			await this.provider.close();
			console.log('PGlite provider connection closed');
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Save settings to disk
	 * @param reinitialize Whether to reinitialize PGlite after saving settings
	 */
	async saveSettings(reinitialize: boolean) {
		// Save settings to disk
		await this.saveData(this.settings);
		
		// Reinitialize PGlite if requested and if provider exists
		if (reinitialize && this.provider) {
			await this.provider.close();
			await this.initializePGlite();
		}
	}


}

