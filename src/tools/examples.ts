import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { fromProjectRoot } from "../utils/file-utils.js";
import { logger } from "../utils/logger.js";

const docsBaseDir = fromProjectRoot(".docs/raw/");

// Helper function to extract code blocks from markdown files
async function extractCodeExamples(
  dirPath: string,
): Promise<Array<{ file: string; language: string; code: string }>> {
  const examples: Array<{ file: string; language: string; code: string }> = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subExamples = await extractCodeExamples(fullPath);
        examples.push(...subExamples);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
      ) {
        const content = await fs.readFile(fullPath, "utf-8");
        const relativePath = path.relative(docsBaseDir, fullPath);

        // Extract code blocks using regex
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match: RegExpExecArray | null = codeBlockRegex.exec(content);

        while (match !== null) {
          const language = match[1] || "text";
          const code = match[2];

          if (code.trim().length > 0) {
            examples.push({
              file: relativePath,
              language,
              code: code.trim(),
            });
          }
          match = codeBlockRegex.exec(content);
        }
      }
    }
  } catch (error) {
    void logger.error(
      `Failed to extract code examples from: ${dirPath}`,
      error,
    );
  }

  return examples;
}

// Helper function to list files with code examples
async function listExampleFiles(): Promise<string[]> {
  void logger.debug("Listing files with code examples");
  try {
    const examples = await extractCodeExamples(docsBaseDir);
    const uniqueFiles = [...new Set(examples.map((ex) => ex.file))];
    return uniqueFiles.sort();
  } catch {
    return [];
  }
}

export const examplesInputSchema = z.object({
  category: z
    .string()
    .optional()
    .describe(
      'Category to filter examples by (e.g., "developer-hub", "sdk", "storage"). If not provided, shows overview of all available examples.',
    ),
  language: z
    .string()
    .optional()
    .describe(
      'Programming language to filter by (e.g., "typescript", "python", "solidity", "go")',
    ),
});

export type ExamplesInput = z.infer<typeof examplesInputSchema>;

export const examplesTool = {
  name: "0gExamples",
  description: `Get code examples from 0g.ai documentation.
    Can filter by category (like "developer-hub", "storage", "da") or programming language.
    Returns code snippets extracted from documentation files.
    Use this to find implementation examples, SDK usage, smart contract code, etc.`,
  parameters: examplesInputSchema,
  execute: async (args: ExamplesInput) => {
    void logger.debug("Executing 0gExamples tool", { args });
    try {
      const allExamples = await extractCodeExamples(docsBaseDir);

      let filteredExamples = allExamples;

      // Filter by category if provided
      if (args.category) {
        const category = args.category.toLowerCase();
        filteredExamples = filteredExamples.filter((ex) =>
          ex.file.toLowerCase().includes(category),
        );
      }

      // Filter by language if provided
      if (args.language) {
        const language = args.language.toLowerCase();
        filteredExamples = filteredExamples.filter(
          (ex) => ex.language.toLowerCase() === language,
        );
      }

      if (filteredExamples.length === 0) {
        const files = await listExampleFiles();
        return [
          "No examples found matching your criteria.",
          "",
          "Available files with code examples:",
          ...files.map((f) => `- ${f}`),
        ].join("\n");
      }

      // Group by file
      const byFile = filteredExamples.reduce(
        (acc, ex) => {
          if (!acc[ex.file]) acc[ex.file] = [];
          acc[ex.file].push(ex);
          return acc;
        },
        {} as Record<string, typeof filteredExamples>,
      );

      // Format output
      const output: string[] = [
        `Found ${filteredExamples.length} code examples${args.category ? ` in category "${args.category}"` : ""}${args.language ? ` for language "${args.language}"` : ""}:`,
        "",
      ];

      for (const [file, examples] of Object.entries(byFile)) {
        output.push(`## ${file}`);
        output.push("");

        examples.forEach((ex, idx) => {
          output.push(`### Example ${idx + 1} (${ex.language})`);
          output.push(`\`\`\`${ex.language}`);
          output.push(ex.code);
          output.push("```");
          output.push("");
        });

        output.push("---");
        output.push("");
      }

      return output.join("\n");
    } catch (error) {
      void logger.error("Failed to execute 0gExamples tool", error);
      throw error;
    }
  },
};
