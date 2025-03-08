import { App, PluginSettingTab, Setting } from 'obsidian';
import { PGLitePluginSettings } from './PGLitePluginSettings';
import { ModelRegistry } from '../models/ModelRegistry';
import { ModelChangeConfirmationModal } from '../ui/ModelChangeConfirmationModal';
import PGLitePlugin from '../../main';

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
        containerEl.createEl('h3', {text: 'Embeddings Settings'});
        
        new Setting(containerEl)
            .setName('Ollama Base URL')
            .setDesc('The base URL for the Ollama API')
            .addText(text => text
                .setPlaceholder('http://localhost:11434/api')
                .setValue(this.plugin.settings.ollamaBaseUrl)
                .onChange(async (value) => {
                    this.plugin.settings.ollamaBaseUrl = value;
                    await this.plugin.saveSettings(true);
                }));
                
        // Get all available models from the registry
        const models = ModelRegistry.getAllModels();
        
        new Setting(containerEl)
            .setName('Embedding Model')
            .setDesc('The Ollama model to use for embeddings')
            .addDropdown(dropdown => dropdown
                .addOptions(models.reduce((options, model) => {
                    options[model.name] = model.description;
                    return options;
                }, {} as Record<string, string>))
                .setValue(this.plugin.settings.ollamaModel)
                .onChange(async (newModel) => {
                    // Get the new model info
                    const newModelInfo = ModelRegistry.getModel(newModel);
                    if (!newModelInfo) return;
                    
                    // Check if embedding model exists
                    if (!this.plugin.embeddingModel) {
                        this.plugin.settings.ollamaModel = newModel;
                        await this.plugin.saveSettings(true);
                        return;
                    }
                    
                    // Get current model dimensions
                    const currentDimensions = this.plugin.embeddingModel.dimensions;
                    
                    // If dimensions are different, ask for confirmation
                    if (newModelInfo.dimensions !== currentDimensions) {
                        const confirmModal = new ModelChangeConfirmationModal(
                            this.plugin.app,
                            newModel,
                            newModelInfo.dimensions,
                            currentDimensions,
                            async (confirmed) => {
                                if (confirmed) {
                                    // Use updateEmbeddingModel to handle everything
                                    await this.plugin.updateEmbeddingModel(newModel);
                                }
                            }
                        );
                        confirmModal.open();
                    } else {
                        // Dimensions are the same, just update the model
                        // Use updateEmbeddingModel to handle everything
                        await this.plugin.updateEmbeddingModel(newModel);
                    }
                }));
    }
}
