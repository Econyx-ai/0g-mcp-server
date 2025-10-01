# Storage Configuration System

## Overview

The 0G MCP Server uses a centralized configuration system for all storage-related tools. This approach provides flexibility, maintainability, and ease of use.

## Architecture

### Configuration Priority

The system follows a three-tier priority system:

1. **Tool Parameter** (Highest Priority)
   - Override configuration per individual tool call
   - Most flexible, allows per-request customization
   - Example: `{ evmRpc: "https://custom-rpc.example.com" }`

2. **Environment Variable** (Medium Priority)
   - Server-wide configuration
   - Set once, applies to all tool calls
   - Example: `export OG_EVM_RPC=https://custom-rpc.example.com`

3. **Default Value** (Lowest Priority)
   - Network-specific fallbacks (testnet/mainnet)
   - Automatically configured based on `OG_NETWORK`
   - No configuration needed for standard use

### Configuration Module

Location: `src/config/storage.ts`

This module:
- Centralizes all storage configuration
- Provides network-aware defaults
- Supports testnet/mainnet switching
- Eliminates code duplication
- Makes updates easy (single file to modify)

## Environment Variables

### Core Variables

#### `OG_NETWORK`
- **Type**: `string`
- **Default**: `testnet`
- **Options**: `testnet`, `mainnet`
- **Description**: Selects which network to use, automatically configuring all endpoints

**Example:**
```bash
export OG_NETWORK=testnet
```

#### `OG_PRIVATE_KEY`
- **Type**: `string`
- **Required for**: Upload and KV write operations
- **Description**: Private key for signing blockchain transactions
- **Security**: Never commit this to version control!

**Example:**
```bash
export OG_PRIVATE_KEY=0x1234567890abcdef...
```

### Optional Overrides

These variables override network defaults:

#### `OG_EVM_RPC`
- **Type**: `string`
- **Description**: EVM RPC endpoint for blockchain operations
- **Default (testnet)**: `https://evmrpc-testnet.0g.ai`

#### `OG_INDEXER_RPC`
- **Type**: `string`
- **Description**: Indexer RPC endpoint for storage operations
- **Default (testnet)**: `https://indexer-storage-testnet-turbo.0g.ai`

#### `OG_KV_URL`
- **Type**: `string`
- **Description**: KV client URL for key-value operations
- **Default (testnet)**: `http://3.101.147.150:6789`

#### `OG_FLOW_CONTRACT`
- **Type**: `string`
- **Description**: Flow contract address for batching
- **Default (testnet)**: `0xb8F03061969da6Ad38f0a4a9f8a86bE71dA3c8E7`

## Network Defaults

### Testnet Configuration

```typescript
{
  evmRpc: 'https://evmrpc-testnet.0g.ai',
  indexerRpc: 'https://indexer-storage-testnet-turbo.0g.ai',
  kvUrl: 'http://3.101.147.150:6789',
  flowContract: '0xb8F03061969da6Ad38f0a4a9f8a86bE71dA3c8E7',
}
```

### Mainnet Configuration

```typescript
{
  evmRpc: 'https://evmrpc-mainnet.0g.ai',
  indexerRpc: 'https://indexer-storage-mainnet.0g.ai',
  kvUrl: 'http://mainnet-kv.0g.ai:6789',
  flowContract: '0x0000000000000000000000000000000000000000', // TBD
}
```

*Note: Mainnet URLs are placeholders and should be updated when official endpoints are available.*

## Usage Examples

### Basic Usage (Testnet Defaults)

No configuration needed! Just set your private key:

```bash
export OG_PRIVATE_KEY=0x1234...
bun run start
```

### Switch to Mainnet

```bash
export OG_NETWORK=mainnet
export OG_PRIVATE_KEY=0x1234...
bun run start
```

### Custom RPC Endpoints

```bash
export OG_NETWORK=testnet
export OG_PRIVATE_KEY=0x1234...
export OG_EVM_RPC=https://my-custom-rpc.com
export OG_INDEXER_RPC=https://my-custom-indexer.com
bun run start
```

### Per-Tool Override

Even with environment variables set, you can override per tool call:

```typescript
// Call 0gStorageUpload with custom RPC
{
  filePath: "/path/to/file.txt",
  evmRpc: "https://special-rpc-for-this-call.com"
}
```

## Configuration File (.env)

Create a `.env` file in the project root:

```bash
# Network selection
OG_NETWORK=testnet

# Private key (NEVER commit this!)
OG_PRIVATE_KEY=0x1234567890abcdef...

# Optional: Custom endpoints
# OG_EVM_RPC=https://custom-rpc-url
# OG_INDEXER_RPC=https://custom-indexer-url
# OG_KV_URL=http://custom-kv-url:6789
# OG_FLOW_CONTRACT=0x1234567890abcdef...
```

**Important**: Add `.env` to `.gitignore` to prevent committing secrets!

## Benefits of This Approach

### 1. Single Source of Truth
- All configuration in one place (`src/config/storage.ts`)
- Easy to update URLs when networks change
- No duplicate constants across files

### 2. Flexibility
- Use defaults for quick start
- Override with environment variables for deployment
- Override with parameters for special cases

### 3. Network Awareness
- Automatic testnet/mainnet switching
- No manual URL updates needed
- Reduces configuration errors

### 4. Maintainability
- One file to update for network changes
- Clear documentation of all options
- Type-safe configuration

### 5. Security
- Sensitive values (private keys) from environment only
- Never hardcoded in source
- Easy to use with secret management systems

## Best Practices

### For Development
```bash
# Use .env file for local development
echo "OG_NETWORK=testnet" > .env
echo "OG_PRIVATE_KEY=0x..." >> .env
echo ".env" >> .gitignore
```

### For Production
```bash
# Use environment variables in deployment
export OG_NETWORK=mainnet
export OG_PRIVATE_KEY=$(get-from-secret-manager)
export OG_EVM_RPC=$(get-custom-rpc-url)
```

### For Testing
```typescript
// Override in tool parameters
const result = await tool.execute({
  filePath: "/test/file.txt",
  evmRpc: "http://localhost:8545", // Local test node
  privateKey: "0xtest..."
});
```

## Migration from Hardcoded Values

### Before
Each tool file had its own constants:
```typescript
// upload.ts
const DEFAULT_RPC = 'https://evmrpc-testnet.0g.ai';
const DEFAULT_INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

// download.ts
const DEFAULT_INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';

// kv-set.ts
const DEFAULT_RPC = 'https://evmrpc-testnet.0g.ai';
const FLOW_CONTRACT = '0xb8F03061969da6Ad38f0a4a9f8a86bE71dA3c8E7';
```

### After
Single configuration module:
```typescript
// src/config/storage.ts
export const storageConfig = {
  evmRpc: process.env.OG_EVM_RPC || networkConfig.evmRpc,
  indexerRpc: process.env.OG_INDEXER_RPC || networkConfig.indexerRpc,
  // ...
};
```

All tools import and use the same config:
```typescript
import { storageConfig } from '../../config/storage.js';

const rpcUrl = args.evmRpc || storageConfig.evmRpc;
```

## Troubleshooting

### Issue: "Private key required" error
**Solution**: Set `OG_PRIVATE_KEY` environment variable or pass `privateKey` parameter

### Issue: Connection timeout
**Solution**: Check if custom RPC endpoints are accessible, or fall back to defaults

### Issue: Wrong network
**Solution**: Verify `OG_NETWORK` is set correctly (`testnet` or `mainnet`)

### Issue: Configuration not taking effect
**Solution**: Restart the MCP server after changing environment variables
