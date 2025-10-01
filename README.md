# 0g MCP Server

Model Context Protocol (MCP) server for accessing [0g.ai](https://0g.ai) documentation and code examples. Built with [Mastra MCP framework](https://mastra.ai) and [Bun](https://bun.com).

## Features

- **0gDocs Tool**: Access 0g.ai documentation by path, with keyword search support
- **0gExamples Tool**: Extract and filter code examples from documentation
- **0G Storage SDK Tools**: Complete integration with 0G Storage network
  - File upload/download
  - Storage node information
  - Key-value store operations
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

Add the server using the Claude CLI:

```bash
claude mcp add 0g-docs bun run /home/unquale/workspace/0g-mcp-server/src/stdio.ts
```

Or manually add to your MCP configuration:

```json
{
  "mcpServers": {
    "0g-docs": {
      "command": "bun",
      "args": ["run", "/home/unquale/workspace/0g-mcp-server/src/stdio.ts"]
    }
  }
}
```

**Note**: Replace `/home/unquale/workspace/0g-mcp-server` with your actual project path.

After adding, restart Claude Code or reconnect to the MCP server using:
```bash
/mcp
```

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

### Documentation Tools

#### 0gDocs

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

#### 0gExamples

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

### Storage Tools

All storage tools require either the `OG_PRIVATE_KEY` environment variable or `privateKey` parameter for operations that write to the blockchain.

#### 0gStorageUpload

Upload a file to 0G Storage network.

**Parameters:**
- `filePath` (string): Absolute path to the file to upload
- `privateKey` (string, optional): Private key for signing transactions
- `evmRpc` (string, optional): EVM RPC endpoint (default: testnet)
- `indexerRpc` (string, optional): Indexer RPC endpoint (default: testnet)
- `withMerkleTree` (boolean, optional): Include Merkle tree information

**Returns:**
- `rootHash`: Unique identifier for the uploaded file
- `txHash`: Transaction hash
- `merkleTree` (optional): Merkle tree information

**Example:**
```typescript
{
  "filePath": "/path/to/file.txt",
  "withMerkleTree": true
}
```

#### 0gStorageDownload

Download a file from 0G Storage network by its root hash.

**Parameters:**
- `rootHash` (string): Root hash of the file to download
- `outputPath` (string): Absolute path where the file should be saved
- `withProof` (boolean, optional): Verify download with Merkle proof (default: true)
- `indexerRpc` (string, optional): Indexer RPC endpoint

**Returns:**
- `filePath`: Path to downloaded file
- `verified`: Whether the file was verified with Merkle proof

**Example:**
```typescript
{
  "rootHash": "0x1234...",
  "outputPath": "/path/to/save/file.txt",
  "withProof": true
}
```

#### 0gStorageNodes

Get information about available 0G Storage nodes.

**Parameters:**
- `count` (number, optional): Number of storage nodes to select (default: 5)
- `indexerRpc` (string, optional): Indexer RPC endpoint

**Returns:**
- `nodes`: List of selected storage nodes with their details
- `count`: Number of nodes returned

**Example:**
```typescript
{
  "count": 10
}
```

#### 0gKvSet

Set key-value pairs in 0G Storage KV store.

**Parameters:**
- `streamId` (string): Stream ID for the KV store
- `data` (array): Array of key-value pairs to set
  - `key` (string): Key to set
  - `value` (string): Value to store
- `privateKey` (string, optional): Private key for signing transactions
- `evmRpc` (string, optional): EVM RPC endpoint
- `indexerRpc` (string, optional): Indexer RPC endpoint
- `flowContract` (string, optional): Flow contract address

**Returns:**
- `txHash`: Transaction hash
- `keysSet`: Number of keys set
- `keys`: Array of keys that were set

**Example:**
```typescript
{
  "streamId": "0x1234...",
  "data": [
    { "key": "name", "value": "Alice" },
    { "key": "age", "value": "30" }
  ]
}
```

#### 0gKvGet

Retrieve a value from 0G Storage KV store by key.

**Parameters:**
- `streamId` (string): Stream ID for the KV store
- `key` (string): Key to retrieve
- `kvUrl` (string, optional): KV client URL

**Returns:**
- `value`: Retrieved value (decoded)
- `rawValue`: Raw value from storage
- `key`: The key that was queried

**Example:**
```typescript
{
  "streamId": "0x1234...",
  "key": "name"
}
```

## Project Structure

```
0g-mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── stdio.ts              # Stdio wrapper for MCP
│   ├── config/               # Configuration
│   │   └── storage.ts        # Storage tools configuration
│   ├── tools/                # MCP tool implementations
│   │   ├── docs.ts           # 0gDocs tool
│   │   ├── examples.ts       # 0gExamples tool
│   │   └── storage/          # Storage SDK tools
│   │       ├── upload.ts     # 0gStorageUpload tool
│   │       ├── download.ts   # 0gStorageDownload tool
│   │       ├── nodes.ts      # 0gStorageNodes tool
│   │       ├── kv-set.ts     # 0gKvSet tool
│   │       └── kv-get.ts     # 0gKvGet tool
│   ├── prepare-docs/         # Documentation processing
│   │   └── prepare.ts        # Doc preparation logic
│   └── utils/
│       ├── logger.ts         # Logging utilities
│       └── file-utils.ts     # File helpers
├── lib/                      # Git submodules
│   ├── 0g-docs/              # 0g documentation (submodule)
│   ├── 0g-storage-node/      # 0g storage node docs (submodule)
│   ├── 0g-storage-client/    # 0g Go storage client (submodule)
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

### Server Configuration

- `REBUILD_DOCS_ON_START` (boolean, default: false) - Rebuild docs on server startup
- `DOCS_PATH` (string, default: `./lib/0g-docs`) - Path to documentation submodule
- `LOG_LEVEL` (string, default: `info`) - Logging level
- `DEBUG` (boolean) - Enable debug logging

### Storage Tools Configuration

The storage tools use a centralized configuration system with the following priority:
1. **Tool parameter** (highest) - Override per individual call
2. **Environment variable** (medium) - Server-wide configuration
3. **Default value** (lowest) - Network-specific fallback

**Available Environment Variables:**

- `OG_PRIVATE_KEY` (string, required for upload/KV write operations)
  - Private key for signing blockchain transactions
  - Required for: `0gStorageUpload`, `0gKvSet`
  - Can be overridden per-tool with `privateKey` parameter
  - **Important**: Keep this secret and never commit to version control

- `OG_NETWORK` (string, default: `testnet`)
  - Network selection: `testnet` or `mainnet`
  - Automatically sets default RPC endpoints for the selected network

- `OG_EVM_RPC` (string, optional)
  - Custom EVM RPC endpoint
  - Overrides network default

- `OG_INDEXER_RPC` (string, optional)
  - Custom Indexer RPC endpoint
  - Overrides network default

- `OG_KV_URL` (string, optional)
  - Custom KV client URL
  - Overrides network default

- `OG_FLOW_CONTRACT` (string, optional)
  - Custom Flow contract address
  - Overrides network default

**Example `.env` file:**
```bash
# Network selection (testnet or mainnet)
OG_NETWORK=testnet

# Private key for storage operations (NEVER commit this!)
OG_PRIVATE_KEY=0x1234567890abcdef...

# Optional: Custom RPC endpoints (overrides network defaults)
# OG_EVM_RPC=https://custom-rpc-url
# OG_INDEXER_RPC=https://custom-indexer-url
# OG_KV_URL=http://custom-kv-url:6789
# OG_FLOW_CONTRACT=0x1234567890abcdef...
```

**Network Defaults:**

*Testnet:*
- EVM RPC: `https://evmrpc-testnet.0g.ai`
- Indexer RPC: `https://indexer-storage-testnet-turbo.0g.ai`
- KV URL: `http://3.101.147.150:6789`
- Flow Contract: `0xb8F03061969da6Ad38f0a4a9f8a86bE71dA3c8E7`

*Mainnet:* (Update when available)
- EVM RPC: `https://evmrpc-mainnet.0g.ai`
- Indexer RPC: `https://indexer-storage-mainnet.0g.ai`
- KV URL: `http://mainnet-kv.0g.ai:6789`
- Flow Contract: TBD

## References

- [0g.ai Documentation](https://docs.0g.ai)
- [0g.ai Docs Repository](https://github.com/0gfoundation/0g-doc)
- [0G TypeScript SDK](https://github.com/0gfoundation/0g-ts-sdk)
- [0G Storage Node](https://github.com/0gfoundation/0g-storage-node)
- [0G Storage Client (Go)](https://github.com/0gfoundation/0g-storage-client)
- [Mastra MCP Framework](https://mastra.ai)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

See LICENSE file for details.
