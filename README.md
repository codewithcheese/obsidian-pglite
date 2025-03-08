# Obsidian PGlite Plugin

A proof-of-concept Obsidian plugin to add PostgreSQL functionality directly to your notes using PGlite, a WebAssembly-based PostgreSQL implementation. This plugin enables vector search capabilities for your notes using Ollama embedding models.

This plugin is intended for developers to experiment with the integration of PostgreSQL and vector search in Obsidian, not for end-users.

## Features

- **PostgreSQL in Obsidian**: Run a fully-featured PostgreSQL database within Obsidian using WebAssembly
- **Vector Search**: Create, store, and search vector embeddings of your notes
- **Ollama Integration**: Generate embeddings using various Ollama models
- **Multiple Embedding Models**: Choose from several embedding models with different dimensions
- **Optimized Performance**: Option for relaxed durability to improve performance
- **Simple Commands**: Easy-to-use commands for database operations

## Getting Started

1. Install the plugin from the Obsidian Community Plugins
2. Make sure you have [Ollama](https://ollama.ai/) installed and running locally
3. Configure the plugin settings (Ollama URL and model)
4. Start using the commands to create tables and search your notes

## Requirements

- Obsidian v0.15.0 or higher
- [Ollama](https://ollama.ai/) running locally (default: http://localhost:11434/api)
- One of the supported embedding models pulled in Ollama

## Commands

### Database Commands

- **Create test table**: Creates a basic table for storing notes
- **Insert test data**: Inserts sample data into the test table
- **Query test data**: Retrieves and displays all data from the test table
- **Insert current note data**: Saves the current note to the database

### Vector Commands

- **Create vector table**: Creates a table for storing vector embeddings
- **Insert current note as vector**: Generates an embedding for the current note and stores it
- **Search similar to current note**: Finds notes with similar content to the current note
- **Search similar to current note (custom limit)**: Same as above but with a custom result limit

## Settings

- **Database Name**: Name of the database file (default: pglite)
- **Relaxed Durability**: When enabled, improves performance by handling database writes asynchronously
- **Ollama Base URL**: URL for the Ollama API (default: http://localhost:11434/api)
- **Embedding Model**: The model to use for generating embeddings:
  - **nomic-embed-text**: High quality text embeddings (768 dimensions)
  - **all-minilm**: Lightweight text embeddings (384 dimensions)
  - **mxbai-embed-large**: High quality text embeddings (1024 dimensions)

## How It Works

1. **PGlite Integration**: The plugin loads PGlite from a CDN and initializes a PostgreSQL database
2. **Database Persistence**: Database state is saved to a file in the plugin directory
3. **Vector Operations**: The plugin uses the pgvector extension to store and search vector embeddings
4. **Embedding Generation**: Text is converted to vector embeddings using Ollama models
5. **Vector Search**: Similar notes are found using cosine similarity between vectors

## Architecture

The plugin follows a modular architecture:

- **PGliteProvider**: Manages the PGlite database connection and persistence
- **PGliteVectorStore**: Handles vector-specific operations using pgvector
- **EmbeddingModel**: Interface for embedding models
- **OllamaModel**: Implementation of EmbeddingModel using Ollama
- **ModelRegistry**: Registry of available embedding models
- **Commands**: Implementation of all plugin commands
- **UI Components**: Modals for displaying results and confirmations

## Troubleshooting

- Make sure Ollama is running locally
- Check the Ollama Base URL in the plugin settings
- Ensure you have the selected embedding model pulled in Ollama
- If changing embedding models, be aware that this will recreate the vector table

## Credits

This plugin implementation follows the technical approach documented in the [obsidian-smart-composer DEVELOPMENT.md](https://github.com/glowingjade/obsidian-smart-composer/blob/main/DEVELOPMENT.md), which details critical workarounds for making PGlite function in Obsidian's browser-like environment. Specifically, it addresses:

1. Loading PGlite resources manually instead of using `node:fs` which isn't available in Obsidian
2. Setting up proper environment configurations to prevent PGlite from detecting a Node environment
3. Implementing compatibility shims for ESM modules in a CommonJS environment

Thanks to [glowingjade](https://github.com/glowingjade) for the [obsidian-smart-composer DEVELOPMENT.md](https://github.com/glowingjade/obsidian-smart-composer/blob/main/DEVELOPMENT.md) documentation.

## License

This plugin is licensed under the MIT License.