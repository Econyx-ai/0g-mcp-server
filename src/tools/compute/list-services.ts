import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { computeConfig } from '../../config/compute.js';

export const listServicesInputSchema = z.object({
  evmRpc: z.string().optional().describe(`EVM RPC endpoint (default: ${computeConfig.evmRpc})`),
  contractAddress: z.string().optional().describe('Serving contract address (optional, uses default if not provided)')
});

export type ListServicesInput = z.infer<typeof listServicesInputSchema>;

/**
 * Format price from wei to OG tokens (A0GI)
 */
function formatPrice(priceWei: bigint): string {
  if (priceWei === 0n) {
    return '0';
  }
  // Convert from wei to OG (divide by 10^18)
  const ogTokens = ethers.formatEther(priceWei);
  // Show in scientific notation if very small
  if (parseFloat(ogTokens) < 0.000001) {
    return parseFloat(ogTokens).toExponential(2);
  }
  return ogTokens;
}

/**
 * Format timestamp to readable date
 */
function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString();
}

/**
 * Create a formatted table-like output for services
 */
function formatServicesOutput(services: any[]): string {
  if (services.length === 0) {
    return 'No services available';
  }

  let output = '\n';
  output += '═'.repeat(80) + '\n';
  output += '  0G COMPUTE NETWORK - AVAILABLE SERVICES\n';
  output += '═'.repeat(80) + '\n\n';

  services.forEach((service, index) => {
    output += `\n┌─ Service ${index + 1}\n`;
    output += `│\n`;
    output += `├─ Provider Address: ${service.provider}\n`;
    output += `├─ Model: ${service.model || 'N/A'}\n`;
    output += `├─ Service Type: ${service.serviceType || 'N/A'}\n`;
    output += `├─ Endpoint: ${service.url}\n`;
    output += `│\n`;
    output += `├─ Pricing:\n`;
    output += `│  ├─ Input Price:  ${formatPrice(service.inputPrice)} A0GI per token\n`;
    output += `│  └─ Output Price: ${formatPrice(service.outputPrice)} A0GI per token\n`;
    output += `│\n`;
    output += `├─ Verifiability: ${service.verifiability || 'None'}\n`;

    if (service.verifiability) {
      output += `│  └─ Type: ${service.verifiability} (Trusted Execution Environment)\n`;
    }

    output += `│\n`;
    output += `├─ Last Updated: ${formatTimestamp(service.updatedAt)}\n`;

    if (service.additionalInfo) {
      output += `├─ Additional Info: ${service.additionalInfo.substring(0, 50)}${service.additionalInfo.length > 50 ? '...' : ''}\n`;
    }

    output += `└─${index === services.length - 1 ? '' : '─'.repeat(78)}\n`;
  });

  output += '\n' + '═'.repeat(80) + '\n';
  output += `Total Services: ${services.length}\n`;
  output += '═'.repeat(80) + '\n';

  return output;
}

/**
 * Create a compact bullet list output for services
 */
function formatServicesCompact(services: any[]): any[] {
  return services.map((service, index) => ({
    index: index + 1,
    provider: service.provider,
    model: service.model || 'N/A',
    serviceType: service.serviceType || 'N/A',
    endpoint: service.url,
    pricing: {
      input: `${formatPrice(service.inputPrice)} A0GI/token`,
      output: `${formatPrice(service.outputPrice)} A0GI/token`
    },
    verifiability: service.verifiability || 'None',
    lastUpdated: formatTimestamp(service.updatedAt),
    additionalInfo: service.additionalInfo || ''
  }));
}

export const listServicesTool = {
  name: '0gComputeListServices',
  description: `List all available AI services on the 0G Compute Network.

    Returns detailed information about each service including:
    - Provider address (unique identifier)
    - AI model name and type
    - Service endpoint URL
    - Pricing (input/output tokens)
    - Verifiability status (TEE support)
    - Last update timestamp

    This tool helps users discover and select AI services for:
    - LLM inference (chat, completions)
    - Fine-tuning custom models
    - Other AI compute tasks

    Example usage:
    List all services: (no parameters needed)
    Custom RPC: evmRpc="https://custom-rpc-url"`,
  parameters: listServicesInputSchema,
  execute: async (args: ListServicesInput) => {
    void logger.debug('Executing 0gComputeListServices tool', { args });

    try {
      const evmRpc = args.evmRpc || computeConfig.evmRpc;

      void logger.info('Fetching available compute services...');

      // Create a read-only provider (no private key needed for listing)
      const provider = new ethers.JsonRpcProvider(evmRpc);

      // Create a dummy wallet for read-only operations
      // We use a random private key since we're only reading from the contract
      const randomWallet = ethers.Wallet.createRandom();
      const dummyWallet = new ethers.Wallet(randomWallet.privateKey, provider);

      // Initialize broker
      const broker = await createZGComputeNetworkBroker(
        dummyWallet,
        args.contractAddress
      );

      // List services
      const services = await broker.inference.listService();

      if (!services || services.length === 0) {
        return {
          success: true,
          services: [],
          count: 0,
          formatted: '\nNo services currently available on the 0G Compute Network.\n',
          message: 'No services available'
        };
      }

      void logger.info(`Successfully retrieved ${services.length} services`);

      // Format output
      const formattedOutput = formatServicesOutput(services);
      const compactOutput = formatServicesCompact(services);

      return {
        success: true,
        count: services.length,
        services: compactOutput,
        formatted: formattedOutput,
        message: `Successfully retrieved ${services.length} service(s) from 0G Compute Network`
      };

    } catch (error) {
      void logger.error('Failed to execute 0gComputeListServices tool', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to list compute services. Check error for details.',
        hint: 'Ensure the EVM RPC endpoint is accessible and the serving contract is deployed.'
      };
    }
  }
};
