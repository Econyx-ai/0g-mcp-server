/**
 * Centralized configuration for 0G Storage tools
 *
 * This module provides a single source of truth for all storage-related
 * configuration including RPC endpoints, contract addresses, and service URLs.
 *
 * Configuration priority:
 * 1. Tool parameter (highest priority - per-call override)
 * 2. Environment variable (server-wide configuration)
 * 3. Default value (lowest priority - fallback)
 *
 * Environment Variables:
 * - OG_PRIVATE_KEY: Private key for signing transactions
 * - OG_EVM_RPC: EVM RPC endpoint
 * - OG_INDEXER_RPC: Indexer RPC endpoint
 * - OG_KV_URL: KV client URL
 * - OG_FLOW_CONTRACT: Flow contract address
 * - OG_NETWORK: Network selection (testnet|mainnet)
 */

// Network-specific configurations
const NETWORKS = {
  testnet: {
    evmRpc: "https://evmrpc-testnet.0g.ai",
    indexerRpc: "https://indexer-storage-testnet-turbo.0g.ai",
    kvUrl: "http://3.101.147.150:6789",
    flowContract: "0xb8F03061969da6Ad38f0a4a9f8a86bE71dA3c8E7",
  },
  mainnet: {
    evmRpc: "https://evmrpc.0g.ai",
    indexerRpc: "https://indexer-storage-mainnet.0g.ai",
    kvUrl: "http://mainnet-kv.0g.ai:6789", // Update with actual mainnet URL
    flowContract: "0x0000000000000000000000000000000000000000", // Update with actual mainnet contract
  },
} as const;

type NetworkName = keyof typeof NETWORKS;

/**
 * Get the current network configuration based on environment variable
 * Defaults to testnet if not specified or invalid
 */
function getCurrentNetwork(): NetworkName {
  const network = process.env.OG_NETWORK?.toLowerCase();
  if (network === "mainnet" || network === "testnet") {
    return network;
  }
  return "testnet";
}

// Get network configuration
const currentNetwork = getCurrentNetwork();
const networkConfig = NETWORKS[currentNetwork];

/**
 * Storage configuration with environment variable fallbacks
 */
export const storageConfig = {
  /**
   * EVM RPC endpoint for blockchain transactions
   * Override with OG_EVM_RPC environment variable
   */
  evmRpc: process.env.OG_EVM_RPC || networkConfig.evmRpc,

  /**
   * Indexer RPC endpoint for storage operations
   * Override with OG_INDEXER_RPC environment variable
   */
  indexerRpc: process.env.OG_INDEXER_RPC || networkConfig.indexerRpc,

  /**
   * KV client URL for key-value operations
   * Override with OG_KV_URL environment variable
   */
  kvUrl: process.env.OG_KV_URL || networkConfig.kvUrl,

  /**
   * Flow contract address for batching operations
   * Override with OG_FLOW_CONTRACT environment variable
   */
  flowContract: process.env.OG_FLOW_CONTRACT || networkConfig.flowContract,

  /**
   * Private key for signing transactions
   * Override with OG_PRIVATE_KEY environment variable
   */
  privateKey: process.env.OG_PRIVATE_KEY,

  /**
   * Current network name
   */
  network: currentNetwork,
} as const;

/**
 * Helper function to get config value with fallback
 * Priority: parameter > environment > default
 */
export function getConfigValue<T>(
  paramValue: T | undefined,
  defaultValue: T,
): T {
  return paramValue ?? defaultValue;
}

/**
 * Export network configurations for reference
 */
export { NETWORKS };
