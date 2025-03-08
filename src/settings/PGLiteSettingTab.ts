import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { PGLitePluginSettings, AVAILABLE_MODELS, getModelInfo } from './PGLitePluginSettings';
import { ModelChangeConfirmationModal } from '../ui/ModelChangeConfirmationModal';
import PGLitePlugin from '../../main';
import { EmbeddingProvider } from '../models/EmbeddingModel';
import { PGliteVectorStore } from '../storage/PGliteVectorStore';

/**
 * Settings tab for the PGLite plugin
 */
export class PGLiteSettingTab extends PluginSettingTab {
    plugin: PGLitePlugin;

    constructor(app: App, plugin: PGLitePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();
        containerEl.createEl('h2', {text: 'PGlite Settings'});

        // Database settings
        new Setting(containerEl)
            .setName('Database Name')
            .setDesc('The name of the database file to use')
            .addText(text => text
                .setPlaceholder('Enter database name')
                .setValue(this.plugin.settings.databaseName)
                .onChange(async (value) => {
                    this.plugin.settings.databaseName = value;
                    await this.plugin.saveSettings(true);
                }));

        new Setting(containerEl)
            .setName('Relaxed Durability')
            .setDesc('When enabled, query results are returned immediately and database writes happen asynchronously. This improves performance but may lead to data loss if the application crashes.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.relaxedDurability)
                .onChange(async (value) => {
                    this.plugin.settings.relaxedDurability = value;
                    await this.plugin.saveSettings(true);
                }));
                
        // Embeddings settings
        containerEl.createEl('h3', {text: 'Embeddings'});
        
        // Ollama settings
        containerEl.createEl('h4', {text: 'Ollama'});
        
        new Setting(containerEl)
            .setName('Ollama Base URL')
            .setDesc('The base URL for the Ollama API')
            .addText(text => text
                .setPlaceholder('http://localhost:11434/api')
                .setValue(this.plugin.settings.ollama.baseURL)
                .onChange(async (value) => {
                    this.plugin.settings.ollama.baseURL = value;
                    await this.plugin.saveSettings(true);
                }));
        
        // OpenAI settings
        containerEl.createEl('h4', {text: 'OpenAI'});
        
        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Your OpenAI API key for embedding generation')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openai.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openai.apiKey = value;
                    await this.plugin.saveSettings(true);
                }));
                
        new Setting(containerEl)
            .setName('OpenAI Base URL (Optional)')
            .setDesc('Custom base URL for OpenAI API (leave empty for default)')
            .addText(text => text
                .setPlaceholder('https://api.openai.com/v1')
                .setValue(this.plugin.settings.openai.baseURL || '')
                .onChange(async (value) => {
                    this.plugin.settings.openai.baseURL = value || undefined;
                    await this.plugin.saveSettings(true);
                }));
        
        // Model selection
        containerEl.createEl('h4', {text: 'Model Selection'});
        
        new Setting(containerEl)
            .setName('Embedding Model')
            .setDesc('The model to use for embeddings')
            .addDropdown(dropdown => dropdown
                .addOptions(AVAILABLE_MODELS.reduce((options: Record<string, string>, model) => {
                    options[model.name] = model.description;
                    return options;
                }, {}))
                .setValue(this.plugin.settings.selectedModel)
                .onChange(async (newModel) => {
                    // Get the new model info
                    const newModelInfo = getModelInfo(newModel);
                    if (!newModelInfo) return;
                    
                    // Update the model in settings
                    this.plugin.settings.selectedModel = newModel;
                    await this.plugin.saveSettings(true);
                    
                    try {
                        // Get current model dimensions by creating a temporary model
                        const currentModel = getModelInfo(
                            this.plugin.settings.selectedModel
                        )!;
                        const currentDimensions = currentModel.dimensions;
                        
                        // If dimensions are different, ask for confirmation
                        if (newModelInfo.dimensions !== currentDimensions) {
                            const confirmModal = new ModelChangeConfirmationModal(
                                this.plugin.app,
                                newModel,
                                newModelInfo.dimensions,
                                currentDimensions,
                                async (confirmed) => {
                                    if (confirmed) {
                                        // Update the model in settings
                                        this.plugin.settings.selectedModel = newModel;
                                        await this.plugin.saveSettings(true);
                                        
                                        // If provider is ready, recreate the vector table with new dimensions
                                        if (this.plugin.provider && this.plugin.provider.isReady()) {
                                            try {
                                                // Create a new vector store with the new model dimensions
                                                const vectorStore = new PGliteVectorStore(
                                                    this.plugin.provider,
                                                    newModelInfo.dimensions,
                                                    'vector_test'                                                    
                                                );
                                                
                                                // Recreate the vector table with new dimensions
                                                await vectorStore.createTable(true); // Force recreate
                                                
                                                // Save the database
                                                await vectorStore.save();
                                                
                                                new Notice(`Updated embedding model to ${newModel}`);
                                            } catch (error) {
                                                console.error('Error updating vector table:', error);
                                                new Notice(`Error updating vector table: ${error}`);
                                            }
                                        } else {
                                            new Notice(`Updated embedding model to ${newModel}`);
                                        }
                                    }
                                }
                            );
                            confirmModal.open();
                        } else {
                            // Dimensions are the same, just update the model in settings
                            this.plugin.settings.selectedModel = newModel;
                            await this.plugin.saveSettings(true);
                            new Notice(`Updated embedding model to ${newModel}`);
                        }
                    } catch (error) {
                        console.error('Error getting embedding model:', error);
                        new Notice('Error updating model: ' + (error as Error).message);
                    }
                }));
    }
}
