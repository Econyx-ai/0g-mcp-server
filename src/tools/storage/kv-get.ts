import { KvClient } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { storageConfig } from '../../config/storage.js';

export const kvGetInputSchema = z.object({
  streamId: z.string().describe('Stream ID for the KV store'),
  key: z.string().describe('Key to retrieve'),
  kvUrl: z.string().optional().describe(`KV client URL (default: ${storageConfig.kvUrl})`)
});

export type KvGetInput = z.infer<typeof kvGetInputSchema>;

export const kvGetTool = {
  name: '0gKvGet',
  description: `Retrieve a value from 0G Storage KV store by key.

    Requirements:
    - Valid stream ID
    - Key that exists in the stream

    Returns:
    - Retrieved value
    - Key information
    - Success status

    Example usage:
    Get value: streamId="0x...", key="name"
    Custom KV URL: streamId="0x...", key="config", kvUrl="http://custom-url:6789"`,
  parameters: kvGetInputSchema,
  execute: async (args: KvGetInput) => {
    void logger.debug('Executing 0gKvGet tool', { args });

    try {
      const kvUrl = args.kvUrl || storageConfig.kvUrl;

      void logger.info(`Retrieving value for key "${args.key}" from stream ${args.streamId}`);

      // Initialize KV client
      const kvClient = new KvClient(kvUrl);

      // Convert key to bytes and encode
      const keyBytes = Uint8Array.from(Buffer.from(args.key, 'utf-8'));
      const encodedKey = ethers.encodeBase64(keyBytes);

      // Get value
      const value = await kvClient.getValue(args.streamId, encodedKey);

      if (!value) {
        return {
          success: false,
          streamId: args.streamId,
          key: args.key,
          value: null,
          message: 'Key not found in stream'
        };
      }

      // Decode value from bytes if needed
      let decodedValue = value;
      try {
        // Try to decode if it's a byte array
        if (typeof value === 'object' && value.data) {
          decodedValue = Buffer.from(value.data).toString('utf-8');
        }
      } catch {
        // If decoding fails, use raw value
        decodedValue = value;
      }

      void logger.info(`Successfully retrieved value for key "${args.key}"`);

      return {
        success: true,
        streamId: args.streamId,
        key: args.key,
        value: decodedValue,
        rawValue: value,
        message: 'Value retrieved successfully'
      };

    } catch (error) {
      void logger.error('Failed to execute 0gKvGet tool', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'KV get failed. Check error for details.'
      };
    }
  }
};
