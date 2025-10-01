# 0g MCP Server

Model Context Protocol (MCP) server for accessing [0g.ai](https://0g.ai) documentation and code examples. Built with [Mastra MCP framework](https://mastra.ai) and [Bun](https://bun.com).

## Features

- **0gDocs Tool**: Access 0g.ai documentation by path, with keyword search support
- **0gExamples Tool**: Extract and filter code examples from documentation
- Automatic documentation syncing via git submodule
- Built-in logging and error handling
- Compatible with Claude Code, Cursor, and other MCP clients

## Installation

```bash
# Install dependencies
bun install

# Initialize and update git submodules (0g-docs)
git submodule update --init --recursive

# Prepare documentation (copies docs to .docs/raw)
bun run prepare-docs
```

## Usage

### Starting the Server

```bash
# Start the server
bun run start

# Start with hot reload (development mode)
bun run dev

# Rebuild docs on server start
REBUILD_DOCS_ON_START=true bun run start
```

### MCP Client Configuration

#### Claude Code

The server can be added to Claude Code using the MCP integration.

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "0g-docs": {
      "command": "bun",
      "args": ["run", "/path/to/0g-mcp-server/src/stdio.ts"]
    }
  }
}
```

#### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "0g-docs": {
      "command": "bun",
      "args": ["run", "/path/to/0g-mcp-server/src/stdio.ts"]
    }
  }
}
```

## MCP Tools

### 0gDocs

Retrieve 0g.ai documentation by path.

**Parameters:**
- `paths` (string[]): One or more documentation paths to fetch
- `queryKeywords` (string[], optional): Keywords for matching relevant documentation

**Example:**
```typescript
{
  "paths": ["developer-hub/getting-started.md"],
  "queryKeywords": ["sdk", "setup"]
}
```

### 0gExamples

Get code examples from 0g.ai documentation.

**Parameters:**
- `category` (string, optional): Filter by category (e.g., "developer-hub", "storage", "da")
- `language` (string, optional): Filter by programming language (e.g., "typescript", "python", "solidity")

**Example:**
```typescript
{
  "category": "developer-hub",
  "language": "typescript"
}
```

## Project Structure

```
0g-mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── stdio.ts              # Stdio wrapper for MCP
│   ├── tools/                # MCP tool implementations
│   │   ├── docs.ts           # 0gDocs tool
│   │   └── examples.ts       # 0gExamples tool
│   ├── prepare-docs/         # Documentation processing
│   │   └── prepare.ts        # Doc preparation logic
│   └── utils/
│       ├── logger.ts         # Logging utilities
│       └── file-utils.ts     # File helpers
├── lib/                      # Git submodules
│   ├── 0g-docs/              # 0g documentation (submodule)
│   └── mastra/               # Mastra reference (submodule)
├── docs/                     # Project documentation
│   └── requirements.md       # Requirements specification
├── .docs/                    # Prepared documentation (generated)
│   └── raw/                  # Copied markdown files
└── package.json
```

## Development

### Updating Documentation

To sync with the latest 0g documentation:

```bash
# Update submodule to latest
cd lib/0g-docs
git pull origin main
cd ../..

# Rebuild documentation index
bun run prepare-docs
```

### Scripts

- `bun run prepare-docs` - Copy documentation from submodule to `.docs/raw`
- `bun run start` - Start the MCP server
- `bun run dev` - Start with hot reload and auto-rebuild docs
- `bun run build` - Build for production

## Environment Variables

- `REBUILD_DOCS_ON_START` (boolean, default: false) - Rebuild docs on server startup
- `DOCS_PATH` (string, default: `./lib/0g-docs`) - Path to documentation submodule
- `LOG_LEVEL` (string, default: `info`) - Logging level
- `DEBUG` (boolean) - Enable debug logging

## References

- [0g.ai Documentation](https://docs.0g.ai)
- [0g.ai Docs Repository](https://github.com/0gfoundation/0g-doc)
- [Mastra MCP Framework](https://mastra.ai)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

See LICENSE file for details.
