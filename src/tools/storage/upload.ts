import { Indexer, ZgFile } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import { z } from "zod";
import { storageConfig } from "../../config/storage.js";
import { logger } from "../../utils/logger.js";

export const storageUploadInputSchema = z.object({
  filePath: z.string().describe("Absolute path to the file to upload"),
  privateKey: z
    .string()
    .optional()
    .describe(
      "Private key for signing transactions (optional if OG_PRIVATE_KEY env var is set)",
    ),
  evmRpc: z
    .string()
    .optional()
    .describe(`EVM RPC endpoint (default: ${storageConfig.evmRpc})`),
  indexerRpc: z
    .string()
    .optional()
    .describe(`Indexer RPC endpoint (default: ${storageConfig.indexerRpc})`),
  withMerkleTree: z
    .boolean()
    .optional()
    .describe("Include Merkle tree information in response (default: false)"),
});

export type StorageUploadInput = z.infer<typeof storageUploadInputSchema>;

export const storageUploadTool = {
  name: "0gStorageUpload",
  description: `Upload a file to 0G Storage network.

    Requirements:
    - File must exist at the specified path
    - Private key required (via parameter or OG_PRIVATE_KEY env var)
    - Account must have testnet tokens for gas fees

    Returns:
    - Root hash (unique identifier for the file)
    - Transaction hash
    - Optional: Merkle tree information

    Example usage:
    Upload a file: filePath="/path/to/file.txt"
    With Merkle tree: filePath="/path/to/file.txt", withMerkleTree=true`,
  parameters: storageUploadInputSchema,
  execute: async (args: StorageUploadInput) => {
    void logger.debug("Executing 0gStorageUpload tool", {
      args: { ...args, privateKey: "***" },
    });

    try {
      // Get private key from args or env
      const privateKey = args.privateKey || storageConfig.privateKey;
      if (!privateKey) {
        throw new Error(
          "Private key required. Provide via parameter or set OG_PRIVATE_KEY environment variable.",
        );
      }

      // Setup provider and signer
      const rpcUrl = args.evmRpc || storageConfig.evmRpc;
      const indexerRpc = args.indexerRpc || storageConfig.indexerRpc;

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(privateKey, provider);

      void logger.info(`Uploading file from: ${args.filePath}`);

      // Create file object
      const file = await ZgFile.fromFilePath(args.filePath);

      // Generate Merkle tree
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr !== null) {
        await file.close();
        throw new Error(`Failed to generate Merkle tree: ${treeErr}`);
      }

      const rootHash = tree?.rootHash();
      void logger.info(`File root hash: ${rootHash}`);

      // Initialize indexer and upload
      const indexer = new Indexer(indexerRpc);
      const [tx, uploadErr] = await indexer.upload(file, rpcUrl, signer);

      // Close file resources
      await file.close();

      if (uploadErr !== null) {
        throw new Error(`Upload failed: ${uploadErr}`);
      }

      void logger.info(`Upload successful! Transaction: ${tx}`);

      const result: any = {
        success: true,
        rootHash,
        txHash: tx,
        message: "File uploaded successfully to 0G Storage",
      };

      if (args.withMerkleTree && tree) {
        result.merkleTree = {
          rootHash: tree.rootHash(),
          // Add other tree info if available
        };
      }

      return result;
    } catch (error) {
      void logger.error("Failed to execute 0gStorageUpload tool", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Upload failed. Check error for details.",
      };
    }
  },
};
