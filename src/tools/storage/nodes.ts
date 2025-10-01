import { Indexer } from '@0glabs/0g-ts-sdk';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { storageConfig } from '../../config/storage.js';

export const storageNodesInputSchema = z.object({
  count: z.number().optional().describe('Number of storage nodes to select (default: 5)'),
  indexerRpc: z.string().optional().describe(`Indexer RPC endpoint (default: ${storageConfig.indexerRpc})`)
});

export type StorageNodesInput = z.infer<typeof storageNodesInputSchema>;

export const storageNodesTool = {
  name: '0gStorageNodes',
  description: `Get information about available 0G Storage nodes.

    Returns:
    - List of selected storage nodes with their details
    - Node URLs and status

    Use this to:
    - Check network health
    - Find available nodes for storage operations
    - Get node information before upload/download

    Example usage:
    Get 5 nodes: count=5
    Get 10 nodes: count=10`,
  parameters: storageNodesInputSchema,
  execute: async (args: StorageNodesInput) => {
    void logger.debug('Executing 0gStorageNodes tool', { args });

    try {
      const indexerRpc = args.indexerRpc || storageConfig.indexerRpc;
      const count = args.count || 5;

      void logger.info(`Selecting ${count} storage nodes...`);

      // Initialize indexer
      const indexer = new Indexer(indexerRpc);

      // Select nodes
      const [nodes, err] = await indexer.selectNodes(count);

      if (err !== null) {
        throw new Error(`Failed to select nodes: ${err}`);
      }

      if (!nodes || nodes.length === 0) {
        throw new Error('No storage nodes available');
      }

      void logger.info(`Successfully selected ${nodes.length} nodes`);

      return {
        success: true,
        count: nodes.length,
        nodes: nodes.map((node: any, index: number) => ({
          index: index + 1,
          url: node.url || node.toString(),
          // Add any other node properties that are available
          ...node
        })),
        message: `Successfully retrieved ${nodes.length} storage nodes`
      };

    } catch (error) {
      void logger.error('Failed to execute 0gStorageNodes tool', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve storage nodes. Check error for details.'
      };
    }
  }
};
