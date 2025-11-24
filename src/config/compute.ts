/**
 * Centralized configuration for 0G Compute tools
 *
 * This module provides a single source of truth for all compute-related
 * configuration including RPC endpoints and contract addresses.
 *
 * Configuration priority:
 * 1. Tool parameter (highest priority - per-call override)
 * 2. Environment variable (server-wide configuration)
 * 3. Default value (lowest priority - fallback)
 *
 * Environment Variables:
 * - OG_PRIVATE_KEY: Private key for signing transactions
 * - OG_EVM_RPC: EVM RPC endpoint
 * - OG_SERVING_CONTRACT: Serving contract address
 * - OG_NETWORK: Network selection (testnet|mainnet)
 */

// Network-specific configurations
const NETWORKS = {
  testnet: {
    evmRpc: "https://evmrpc-testnet.0g.ai",
    servingContract: undefined, // Uses SDK default
  },
  mainnet: {
    evmRpc: "https://evmrpc.0g.ai",
    servingContract: undefined, // Uses SDK default
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
 * Compute configuration with environment variable fallbacks
 */
export const computeConfig = {
  /**
   * EVM RPC endpoint for blockchain transactions
   * Override with OG_EVM_RPC environment variable
   */
  evmRpc: process.env.OG_EVM_RPC || networkConfig.evmRpc,

  /**
   * Serving contract address
   * Override with OG_SERVING_CONTRACT environment variable
   */
  servingContract:
    process.env.OG_SERVING_CONTRACT || networkConfig.servingContract,

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
