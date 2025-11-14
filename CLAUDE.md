
# 0G MCP Server - Development Guide

This is a Model Context Protocol (MCP) server for 0G.AI documentation and SDK integration. This project uses Bun and TypeScript.

## Technology Stack

- **Runtime**: Bun (not Node.js)
- **Language**: TypeScript with ES modules
- **Framework**: Mastra MCP framework
- **SDKs**: 0G TypeScript SDK, 0G Serving Broker

## Development Commands

Always use Bun for development:

- `bun run start` - Start the MCP server
- `bun run dev` - Start with hot reload and auto-rebuild docs
- `bun run build` - Build for production
- `bun run prepare-docs` - Sync documentation from submodules
- `bun install` - Install dependencies

## Project Structure

```
src/
├── index.ts              # Main MCP server setup
├── stdio.ts              # Stdio transport for MCP clients
├── config/               # Configuration modules
│   ├── storage.ts        # Storage SDK config (RPC endpoints, contracts)
│   └── compute.ts        # Compute SDK config
├── tools/                # MCP tool implementations
│   ├── docs.ts           # Documentation retrieval
│   ├── examples.ts       # Code example extraction
│   ├── storage/          # 0G Storage tools (upload, download, KV)
│   └── compute/          # 0G Compute tools (list services)
└── utils/                # Shared utilities
    ├── logger.ts         # Logging
    └── file-utils.ts     # File operations
```

## Key Conventions

### File Operations
- Currently uses `fs/promises` from Node.js (e.g., `import fs from 'fs/promises'`)
- Bun automatically loads `.env` files (no need for dotenv)

### Module System
- Use ES modules (`import`/`export`)
- Type imports: `import type { Thing } from "..."`
- Set `"type": "module"` in package.json

### TypeScript
- All source files are `.ts` (not `.js`)
- Use Zod for runtime validation
- Enable strict type checking
- Use `Bun.build()` for bundling TypeScript

### MCP Server Development
- Use `@mastra/mcp` framework
- Tools are defined with Zod schemas
- Use structured logging with [src/utils/logger.ts](src/utils/logger.ts)
- Follow async/await patterns

### Environment Variables
The project uses environment variables for configuration:
- `OG_NETWORK` - Network selection (testnet/mainnet)
- `OG_PRIVATE_KEY` - Private key for storage operations
- `OG_EVM_RPC` - Custom EVM RPC endpoint
- `OG_INDEXER_RPC` - Custom indexer endpoint
- `REBUILD_DOCS_ON_START` - Auto-rebuild docs on startup
- `LOG_LEVEL` - Logging level (info, debug, error)

See [README.md](README.md) for full environment variable documentation.

## Adding New MCP Tools

1. Create a new file in `src/tools/` or `src/tools/<category>/`
2. Define the tool using Mastra's MCP API with Zod schemas
3. Register the tool in [src/index.ts](src/index.ts) tools object
4. Test with: `bun run dev`

See existing tools in `src/tools/` for reference implementation patterns.

## Documentation Updates

The project uses git submodules for 0g documentation:

```bash
# Initialize submodules (first time)
git submodule update --init --recursive

# Update to latest documentation
cd lib/0g-docs
git pull origin main
cd ../..

# Rebuild documentation index
bun run prepare-docs
```

## Debugging

- Enable debug logging: `LOG_LEVEL=debug bun run dev`
- Use `console.log()` for debugging (Bun has excellent console support)
- Check MCP connection: Restart your IDE or run `/mcp` command in Claude Code

## References

- [Bun Documentation](https://bun.sh/docs)
- [Mastra MCP Framework](https://mastra.ai)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [0G Documentation](https://docs.0g.ai)
- [0G TypeScript SDK](https://github.com/0gfoundation/0g-ts-sdk)
