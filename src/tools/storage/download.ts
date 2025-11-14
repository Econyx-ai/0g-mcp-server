import { Indexer } from "@0glabs/0g-ts-sdk";
import { z } from "zod";
import { storageConfig } from "../../config/storage.js";
import { logger } from "../../utils/logger.js";

export const storageDownloadInputSchema = z.object({
  rootHash: z.string().describe("Root hash of the file to download"),
  outputPath: z
    .string()
    .describe("Absolute path where the file should be saved"),
  withProof: z
    .boolean()
    .optional()
    .describe("Verify download with Merkle proof (default: true)"),
  indexerRpc: z
    .string()
    .optional()
    .describe(`Indexer RPC endpoint (default: ${storageConfig.indexerRpc})`),
});

export type StorageDownloadInput = z.infer<typeof storageDownloadInputSchema>;

export const storageDownloadTool = {
  name: "0gStorageDownload",
  description: `Download a file from 0G Storage network by its root hash.

    Requirements:
    - Valid root hash (from previous upload)
    - Write permissions to output path

    Returns:
    - Success status
    - Downloaded file path
    - Verification status (if withProof=true)

    Example usage:
    Download: rootHash="0x...", outputPath="/path/to/save/file.txt"
    With verification: rootHash="0x...", outputPath="/path/file.txt", withProof=true`,
  parameters: storageDownloadInputSchema,
  execute: async (args: StorageDownloadInput) => {
    void logger.debug("Executing 0gStorageDownload tool", { args });

    try {
      const indexerRpc = args.indexerRpc || storageConfig.indexerRpc;
      const withProof = args.withProof ?? true;

      void logger.info(`Downloading file with root hash: ${args.rootHash}`);

      // Initialize indexer
      const indexer = new Indexer(indexerRpc);

      // Download file
      const err = await indexer.download(
        args.rootHash,
        args.outputPath,
        withProof,
      );

      if (err !== null) {
        throw new Error(`Download failed: ${err}`);
      }

      void logger.info(
        `Download successful! File saved to: ${args.outputPath}`,
      );

      return {
        success: true,
        rootHash: args.rootHash,
        filePath: args.outputPath,
        verified: withProof,
        message: `File downloaded successfully${withProof ? " and verified" : ""}`,
      };
    } catch (error) {
      void logger.error("Failed to execute 0gStorageDownload tool", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        message: "Download failed. Check error for details.",
      };
    }
  },
};
