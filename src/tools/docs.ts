import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { fromProjectRoot, getMatchingPaths } from "../utils/file-utils.js";
import { logger } from "../utils/logger.js";

const docsBaseDir = fromProjectRoot(".docs/raw/");

// Configuration for content limits
const MAX_FILE_SIZE = 50000; // 50KB per file
const MAX_TOTAL_DIR_SIZE = 100000; // 100KB total for directory content
const MAX_FILES_PER_DIR = 5; // Maximum files to include full content

type ReadMdResult =
  | {
      found: true;
      content: string;
      isSecurityViolation: boolean;
      truncated?: boolean;
    }
  | { found: false; isSecurityViolation: boolean };

// Helper function to truncate content if too large
function truncateContent(
  content: string,
  maxLength: number,
): { content: string; wasTruncated: boolean } {
  if (content.length <= maxLength) {
    return { content, wasTruncated: false };
  }

  const truncated = content.substring(0, maxLength);
  const lastNewline = truncated.lastIndexOf("\n");
  const finalContent =
    lastNewline > 0 ? truncated.substring(0, lastNewline) : truncated;

  return {
    content:
      finalContent +
      `\n\n... [Content truncated - ${content.length - finalContent.length} characters omitted. Request specific file for full content.]`,
    wasTruncated: true,
  };
}

// Helper function to list contents of a directory
async function listDirContents(
  dirPath: string,
): Promise<{ dirs: string[]; files: string[] }> {
  try {
    void logger.debug(`Listing directory contents: ${dirPath}`);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const dirs: string[] = [];
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        dirs.push(entry.name + "/");
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
      ) {
        files.push(entry.name);
      }
    }

    return {
      dirs: dirs.sort(),
      files: files.sort(),
    };
  } catch (error) {
    void logger.error(`Failed to list directory contents: ${dirPath}`, error);
    throw error;
  }
}

// Helper function to read MD/MDX files from a path
async function readMdContent(
  docPath: string,
  queryKeywords: string[],
): Promise<ReadMdResult> {
  const fullPath = path.resolve(path.join(docsBaseDir, docPath));
  if (!fullPath.startsWith(path.resolve(docsBaseDir))) {
    void logger.error(`Path traversal attempt detected`);
    return { found: false, isSecurityViolation: true };
  }
  void logger.debug(`Reading MD content from: ${fullPath}`);

  // Check if path exists
  try {
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      const { dirs, files } = await listDirContents(fullPath);

      // Limit number of files with full content
      const filesToInclude = files.slice(0, MAX_FILES_PER_DIR);
      const filesOmitted = files.slice(MAX_FILES_PER_DIR);

      const dirListing = [
        `Directory contents of ${docPath}:`,
        "",
        dirs.length > 0 ? "Subdirectories:" : "No subdirectories.",
        ...dirs.map((d) => `- ${d}`),
        "",
        files.length > 0
          ? "Files in this directory:"
          : "No files in this directory.",
        ...files.map((f) => `- ${f}`),
        "",
        "---",
        "",
        `Contents of files (showing ${filesToInclude.length} of ${files.length}):`,
        "",
      ].join("\n");

      // Append file contents with size limits
      let fileContents = "";
      let totalSize = 0;
      let wasTruncated = false;

      for (const file of filesToInclude) {
        const filePath = path.join(fullPath, file);
        let content = await fs.readFile(filePath, "utf-8");

        // Truncate individual file if needed
        const { content: truncatedContent, wasTruncated: fileTruncated } =
          truncateContent(content, MAX_FILE_SIZE);
        content = truncatedContent;
        wasTruncated = wasTruncated || fileTruncated;

        // Check total size limit
        if (totalSize + content.length > MAX_TOTAL_DIR_SIZE) {
          const remaining = MAX_TOTAL_DIR_SIZE - totalSize;
          if (remaining > 1000) {
            const { content: finalContent } = truncateContent(
              content,
              remaining,
            );
            fileContents += `\n\n# ${file}\n\n${finalContent}`;
          }
          wasTruncated = true;
          break;
        }

        fileContents += `\n\n# ${file}\n\n${content}`;
        totalSize += content.length;
      }

      // Add notice about omitted files
      if (filesOmitted.length > 0) {
        fileContents += `\n\n---\n\n**Note**: ${filesOmitted.length} additional file(s) not shown: ${filesOmitted.join(", ")}\nRequest specific files directly for their full content.`;
        wasTruncated = true;
      }

      // Add content-based suggestions
      const contentBasedSuggestions = await getMatchingPaths(
        docPath,
        queryKeywords,
        docsBaseDir,
      );
      const suggestions = ["---", "", contentBasedSuggestions, ""].join("\n");

      return {
        found: true,
        content: dirListing + fileContents + suggestions,
        isSecurityViolation: false,
        truncated: wasTruncated,
      };
    }

    // If it's a file, read and potentially truncate it
    const content = await fs.readFile(fullPath, "utf-8");
    const { content: finalContent, wasTruncated } = truncateContent(
      content,
      MAX_FILE_SIZE,
    );

    return {
      found: true,
      content: finalContent,
      isSecurityViolation: false,
      truncated: wasTruncated,
    };
  } catch (error: any) {
    void logger.error(`Failed to read MD content: ${fullPath}`, error);
    if (error.code === "ENOENT") {
      // Only fallback for not found
      return { found: false, isSecurityViolation: false };
    }
    // Unexpected error: rethrow
    throw error;
  }
}

// Helper function to find nearest existing directory and its contents
async function findNearestDirectory(
  docPath: string,
  availablePaths: string,
): Promise<string> {
  void logger.debug(`Finding nearest directory for: ${docPath}`);
  // Split path into parts and try each parent directory
  const parts = docPath.split("/");

  while (parts.length > 0) {
    const testPath = parts.join("/");
    try {
      const fullPath = path.join(docsBaseDir, testPath);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        const { dirs, files } = await listDirContents(fullPath);
        return [
          `Path "${docPath}" not found.`,
          `Here are the available paths in "${testPath}":`,
          "",
          dirs.length > 0 ? "Directories:" : "No subdirectories.",
          ...dirs.map((d) => `- ${testPath}/${d}`),
          "",
          files.length > 0 ? "Files:" : "No files.",
          ...files.map((f) => `- ${testPath}/${f}`),
        ].join("\n");
      }
    } catch {
      // Directory doesn't exist, try parent
      void logger.debug(
        `Directory not found, trying parent: ${parts.slice(0, -1).join("/")}`,
      );
    }
    parts.pop();
  }

  // If no parent directories found, return root listing
  return [
    `Path "${docPath}" not found.`,
    "Here are all available paths:",
    "",
    availablePaths,
  ].join("\n");
}

// Get initial directory listing for the description
async function getAvailablePaths(): Promise<string> {
  const { dirs, files } = await listDirContents(docsBaseDir);

  return [
    "Available top-level paths:",
    "",
    "Directories:",
    ...dirs.map((d) => `- ${d}`),
    "",
    "Files:",
    ...files.map((f) => `- ${f}`),
  ]
    .filter(Boolean)
    .join("\n");
}

// Initialize available paths
const availablePaths = await getAvailablePaths();

export const docsInputSchema = z.object({
  paths: z
    .array(z.string())
    .min(1)
    .describe(
      `One or more documentation paths to fetch\nAvailable paths:\n${availablePaths}`,
    ),
  queryKeywords: z
    .array(z.string())
    .optional()
    .describe(
      "Keywords from user query to use for matching documentation. Each keyword should be a single word or short phrase; any whitespace-separated keywords will be split automatically.",
    ),
});

export type DocsInput = z.infer<typeof docsInputSchema>;

export const docsTool = {
  name: "0gDocs",
  description: `Get 0g.ai documentation.
    Request paths to explore the docs. The user doesn't know about files and directories.
    You can also use keywords from the user query to find relevant documentation, but prioritize paths.
    This is your internal knowledge the user can't read.
    Provide code examples so the user understands.
    If you build a URL from the path, only paths ending in .md or .mdx exist.
    IMPORTANT: Be concise with your answers. The user will ask for more info.
    When displaying results, always mention which file path contains the information (e.g., 'Found in "path/to/file.md"') so users know where this documentation lives.

    Note: To optimize context usage:
    - Directory requests show up to 5 files with content
    - Individual files are limited to 50KB
    - Total directory content is limited to 100KB
    - If content is truncated, request specific files directly for full content`,
  parameters: docsInputSchema,
  execute: async (args: DocsInput) => {
    void logger.debug("Executing 0gDocs tool", { args });
    try {
      const queryKeywords = args.queryKeywords ?? [];
      const results = await Promise.all(
        args.paths.map(async (path: string) => {
          try {
            const result = await readMdContent(path, queryKeywords);
            if (result.found) {
              return {
                path,
                content: result.content,
                error: null,
              };
            }
            if (result.isSecurityViolation) {
              return {
                path,
                content: null,
                error: "Invalid path",
              };
            }
            const directorySuggestions = await findNearestDirectory(
              path,
              availablePaths,
            );
            const contentBasedSuggestions = await getMatchingPaths(
              path,
              queryKeywords,
              docsBaseDir,
            );
            return {
              path,
              content: null,
              error: [directorySuggestions, contentBasedSuggestions].join(
                "\n\n",
              ),
            };
          } catch (error) {
            void logger.warning(
              `Failed to read content for path: ${path}`,
              error,
            );
            return {
              path,
              content: null,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }),
      );

      // Format the results
      const output = results
        .map((result) => {
          if (result.error) {
            return `## ${result.path}\n\n${result.error}\n\n---\n`;
          }
          return `## ${result.path}\n\n${result.content}\n\n---\n`;
        })
        .join("\n");

      return output;
    } catch (error) {
      void logger.error("Failed to execute 0gDocs tool", error);
      throw error;
    }
  },
};
