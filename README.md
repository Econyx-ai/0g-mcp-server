# 0g MCP Server

Model Context Protocol (MCP) server for accessing [0g.ai](https://0g.ai) documentation and code examples. Built with [Mastra MCP framework](https://mastra.ai) and [Bun](https://bun.com).

## Features

- **0gDocs Tool**: Access 0g.ai documentation by path, with keyword search support
- **0gExamples Tool**: Extract and filter code examples from documentation
- **0G Storage SDK Tools**: Complete integration with 0G Storage network
  - File upload/download
  - Storage node information
  - Key-value store operations
- **0G Compute Network Tools**: Live integration with 0G Compute Network
  - List available AI services (inference & fine-tuning)
  - Service discovery with detailed pricing
  - Provider verification status (TEE support)
  - Real-time service availability
- **0G Compute Network Documentation**: Access compute layer documentation
  - Inference SDK guides and complete examples
  - Fine-tuning provider setup
  - CLI usage examples
  - Broker architecture and design (provider & user brokers)
  - TypeScript SDK interface documentation
  - **Smart Contract Documentation**: Deep dive into on-chain mechanics
    - Settlement and ZK-proof verification
    - Account and service management
    - Nonce-based replay protection
    - Refund mechanisms and lock times
- **0G Agent NFT (iNFT) Documentation**: ERC-7857 standard implementation
  - Complete EIP-7857 specification for AI Agent NFTs
  - Private metadata management (models, memory, character definitions)
  - Verifiable data transfer with TEE/ZKP proofs
  - Full Solidity contract implementations (AgentNFT, verifiers, interfaces)
  - Transfer, clone, and authorization mechanisms
  - Sealed key encryption for secure data access
  - Reference implementation with proxy patterns
- **Knowledge Base with Mermaid Diagrams**: Custom architecture documentation
  - System architecture diagrams
  - Sequence diagrams for complete flows
  - State transition diagrams
  - Component interaction diagrams
  - LLM-readable Mermaid format for better understanding
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
claude mcp add 0g-docs bun run /path/to/0g-mcp-server/src/stdio.ts
```

Or manually add to your MCP configuration:

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

**Note**: Replace `/path/to/0g-mcp-server` with your actual project path.

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

### Compute Tools

#### 0gComputeListServices

List all available AI services on the 0G Compute Network.

**Parameters:**
- `evmRpc` (string, optional): EVM RPC endpoint (default: testnet)
- `contractAddress` (string, optional): Serving contract address (uses default if not provided)

**Returns:**
- `success`: Boolean indicating success
- `count`: Number of services available
- `services`: Array of service objects with:
  - `provider`: Provider wallet address
  - `model`: AI model name (e.g., "phala/gpt-oss-120b")
  - `serviceType`: Type of service (e.g., "chatbot")
  - `endpoint`: Service URL
  - `pricing`: Object with input/output prices
  - `verifiability`: Verification type (e.g., "TeeML" for TEE support)
  - `lastUpdated`: ISO timestamp
- `formatted`: Human-readable table format
- `raw`: Raw service data from contract

**Example:**
```typescript
{
  // List all services with default settings
}
```

**Example Output:**
```
════════════════════════════════════════════════════════════════════════════════
  0G COMPUTE NETWORK - AVAILABLE SERVICES
════════════════════════════════════════════════════════════════════════════════

┌─ Service 1
│
├─ Provider Address: 0xf07240Efa67755B5311bc75784a061eDB47165Dd
├─ Model: phala/gpt-oss-120b
├─ Service Type: chatbot
├─ Endpoint: http://50.145.48.92:30081
│
├─ Pricing:
│  ├─ Input Price:  1.00e-7 A0GI per token
│  └─ Output Price: 4.00e-7 A0GI per token
│
├─ Verifiability: TeeML
│  └─ Type: TeeML (Trusted Execution Environment)
│
├─ Last Updated: 2025-09-27T09:34:27.000Z
└─

Total Services: 4
════════════════════════════════════════════════════════════════════════════════
```

## Project Structure

```
0g-mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── stdio.ts              # Stdio wrapper for MCP
│   ├── config/               # Configuration
│   │   ├── storage.ts        # Storage tools configuration
│   │   └── compute.ts        # Compute tools configuration
│   ├── tools/                # MCP tool implementations
│   │   ├── docs.ts           # 0gDocs tool
│   │   ├── examples.ts       # 0gExamples tool
│   │   ├── storage/          # Storage SDK tools
│   │   │   ├── upload.ts     # 0gStorageUpload tool
│   │   │   ├── download.ts   # 0gStorageDownload tool
│   │   │   ├── nodes.ts      # 0gStorageNodes tool
│   │   │   ├── kv-set.ts     # 0gKvSet tool
│   │   │   └── kv-get.ts     # 0gKvGet tool
│   │   └── compute/          # Compute Network tools
│   │       └── list-services.ts  # 0gComputeListServices tool
│   ├── prepare-docs/         # Documentation processing
│   │   └── prepare.ts        # Doc preparation logic
│   └── utils/
│       ├── logger.ts         # Logging utilities
│       └── file-utils.ts     # File helpers
├── lib/                      # Git submodules
│   ├── 0g-docs/              # 0g documentation (submodule)
│   ├── 0g-storage-node/      # 0g storage node docs (submodule)
│   ├── 0g-storage-client/    # 0g Go storage client (submodule)
│   ├── 0g-serving-broker/    # 0g compute network provider broker (submodule)
│   ├── 0g-serving-user-broker/ # 0g compute network user SDK (submodule)
│   ├── 0g-serving-contract/  # 0g compute network smart contracts (submodule)
│   ├── 0g-agent-nft/         # 0g Agent NFT (iNFT) ERC-7857 implementation (submodule)
│   └── mastra/               # Mastra reference (submodule)
├── docs/                     # Project documentation
│   ├── 0g-knowledge-base/    # Custom knowledge base with Mermaid diagrams
│   │   ├── compute/          # Compute layer architecture docs
│   │   │   └── 0g-serving-broker.md  # Broker system diagrams
│   │   └── 0g-agent/         # Agent NFT documentation
│   │       └── erc-7857.md   # EIP-7857 specification
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

### Adding Custom Documentation

To add your own architecture diagrams, guides, or documentation:

1. Create markdown files in `docs/0g-knowledge-base/`:
   ```bash
   # Example structure
   docs/0g-knowledge-base/
   ├── compute/
   │   └── your-diagram.md
   ├── storage/
   │   └── your-guide.md
   └── guides/
       └── best-practices.md
   ```

2. Include Mermaid diagrams in your markdown files:
   ````markdown
   ## System Architecture

   ```mermaid
   graph TB
       User[User] --> Broker[Broker]
       Broker --> Contract[Smart Contract]
   ```
   ````

3. Run prepare-docs to make them accessible:
   ```bash
   bun run prepare-docs
   ```

4. Access via MCP tools:
   ```typescript
   // Via 0gDocs tool
   paths: ["knowledge-base/compute/your-diagram.md"]
   ```

**Benefits:**
- Mermaid diagrams are LLM-readable (unlike PNG images)
- Version controlled alongside code
- Accessible to AI agents via MCP for better guidance

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

### Compute Tools Configuration

The compute tools use the same configuration system as storage tools:

**Available Environment Variables:**

- `OG_NETWORK` (string, default: `testnet`)
  - Network selection: `testnet` or `mainnet`
  - Shared with storage tools

- `OG_EVM_RPC` (string, optional)
  - Custom EVM RPC endpoint
  - Shared with storage tools

- `OG_SERVING_CONTRACT` (string, optional)
  - Custom Serving contract address
  - Overrides SDK default

**Example `.env` file:**
```bash
# Network selection (affects both storage and compute)
OG_NETWORK=testnet

# Shared EVM RPC endpoint
OG_EVM_RPC=https://evmrpc-testnet.0g.ai

# Optional: Custom serving contract
# OG_SERVING_CONTRACT=0x1234567890abcdef...
```

**Note:** Compute tools require **no private key** for read-only operations like listing services. They create a temporary wallet internally for contract reads.

## References

- [0g.ai Documentation](https://docs.0g.ai)
- [0g.ai Docs Repository](https://github.com/0gfoundation/0g-doc)
- [0G TypeScript SDK](https://github.com/0gfoundation/0g-ts-sdk)
- [0G Storage Node](https://github.com/0gfoundation/0g-storage-node)
- [0G Storage Client (Go)](https://github.com/0gfoundation/0g-storage-client)
- [0G Serving Provider Broker](https://github.com/0gfoundation/0g-serving-broker)
- [0G Serving User Broker (SDK)](https://github.com/0gfoundation/0g-serving-user-broker)
- [0G Serving Smart Contracts](https://github.com/0gfoundation/0g-serving-contract)
- [0G Agent NFT (iNFT) - ERC-7857](https://github.com/0gfoundation/0g-agent-nft)
- [Mastra MCP Framework](https://mastra.ai)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

See LICENSE file for details.
