import { Batcher, Indexer } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { storageConfig } from '../../config/storage.js';

export const kvSetInputSchema = z.object({
  streamId: z.string().describe('Stream ID for the KV store'),
  data: z.array(
    z.object({
      key: z.string().describe('Key to set'),
      value: z.string().describe('Value to store')
    })
  ).describe('Array of key-value pairs to set'),
  privateKey: z.string().optional().describe('Private key for signing transactions (optional if OG_PRIVATE_KEY env var is set)'),
  evmRpc: z.string().optional().describe(`EVM RPC endpoint (default: ${storageConfig.evmRpc})`),
  indexerRpc: z.string().optional().describe(`Indexer RPC endpoint (default: ${storageConfig.indexerRpc})`),
  flowContract: z.string().optional().describe(`Flow contract address (default: ${storageConfig.flowContract})`)
});

export type KvSetInput = z.infer<typeof kvSetInputSchema>;

export const kvSetTool = {
  name: '0gKvSet',
  description: `Set key-value pairs in 0G Storage KV store.

    Requirements:
    - Valid stream ID
    - Private key (via parameter or OG_PRIVATE_KEY env var)
    - Account must have testnet tokens for gas fees

    Returns:
    - Transaction hash
    - Number of keys set
    - Success status

    Example usage:
    Set single KV: streamId="0x...", data=[{key: "name", value: "Alice"}]
    Set multiple: streamId="0x...", data=[{key: "k1", value: "v1"}, {key: "k2", value: "v2"}]`,
  parameters: kvSetInputSchema,
  execute: async (args: KvSetInput) => {
    void logger.debug('Executing 0gKvSet tool', {
      args: { ...args, privateKey: '***' }
    });

    try {
      // Get private key from args or env
      const privateKey = args.privateKey || storageConfig.privateKey;
      if (!privateKey) {
        throw new Error('Private key required. Provide via parameter or set OG_PRIVATE_KEY environment variable.');
      }

      // Setup provider and signer
      const rpcUrl = args.evmRpc || storageConfig.evmRpc;
      const indexerRpc = args.indexerRpc || storageConfig.indexerRpc;
      const flowContract = args.flowContract || storageConfig.flowContract;

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(privateKey, provider);

      void logger.info(`Setting ${args.data.length} key-value pairs in stream ${args.streamId}`);

      // Initialize indexer and select nodes
      const indexer = new Indexer(indexerRpc);
      const [nodes, nodesErr] = await indexer.selectNodes(1);

      if (nodesErr !== null || !nodes || nodes.length === 0) {
        throw new Error(`Failed to select nodes: ${nodesErr || 'No nodes available'}`);
      }

      // Create batcher
      const batcher = new Batcher(1, nodes, flowContract, rpcUrl);

      // Set key-value pairs
      for (const { key, value } of args.data) {
        const keyBytes = Uint8Array.from(Buffer.from(key, 'utf-8'));
        const valueBytes = Uint8Array.from(Buffer.from(value, 'utf-8'));
        batcher.streamDataBuilder.set(args.streamId, keyBytes, valueBytes);
      }

      // Execute batch
      const [tx, batchErr] = await batcher.exec();

      if (batchErr !== null) {
        throw new Error(`Batch execution failed: ${batchErr}`);
      }

      void logger.info(`KV set successful! Transaction: ${tx}`);

      return {
        success: true,
        txHash: tx,
        streamId: args.streamId,
        keysSet: args.data.length,
        keys: args.data.map(item => item.key),
        message: `Successfully set ${args.data.length} key-value pair(s)`
      };

    } catch (error) {
      void logger.error('Failed to execute 0gKvSet tool', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'KV set failed. Check error for details.'
      };
    }
  }
};
