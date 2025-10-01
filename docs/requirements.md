# 0g.ai MCP Server - Requirements Document

## Overview

Build a Model Context Protocol (MCP) server that provides AI assistants with direct access to 0g.ai documentation and code examples. The server will use the Mastra MCP framework and maintain 0g documentation as a git submodule for easy updates.

## Reference Implementation

**Mastra MCP Docs Server**: https://github.com/mastra-ai/mastra/tree/main/packages/mcp-docs-server

This implementation serves as the architectural blueprint for the 0g.ai MCP server.

## Core Requirements

### 1. Documentation Source Management

- **Git Submodule Integration**
  - Add 0g-docs repository as a git submodule at `./lib/0g-docs/`
  - Enable easy updates via `git submodule update --remote`
  - Keep documentation synchronized with upstream 0g.ai docs

### 2. MCP Server Framework

- **Technology Stack**
  - Use `@mastra/mcp` package for MCP server implementation
  - Use Bun runtime (not Node.js) per project guidelines
  - TypeScript for type safety

- **Server Initialization**
  - Create `MCPServer` instance with:
    - Name: "0g Documentation Server"
    - Version: Read from package.json
    - Registered tools for documentation access
  - Start server with `server.startStdio()` for stdio transport

### 3. MCP Tools

Expose the following tools via the MCP protocol:

#### 3.1 `0gDocs` Tool
- **Purpose**: Retrieve specific documentation pages
- **Parameters**:
  - `path` (string): Path to documentation file/section
- **Returns**: Formatted documentation content
- **Features**:
  - Support for markdown/MDX files
  - List available documentation paths
  - Handle nested documentation structure

#### 3.2 `0gExamples` Tool
- **Purpose**: Access code examples and implementations
- **Parameters**:
  - `example` (string, optional): Specific example name
  - `list` (boolean, optional): List all available examples
- **Returns**: Code examples with explanations
- **Features**:
  - Format code blocks properly
  - Include example metadata
  - Support filtering by category/language

#### 3.3 `0gSearch` Tool (Optional Enhancement)
- **Purpose**: Search across documentation content
- **Parameters**:
  - `query` (string): Search query
  - `filter` (string, optional): Filter by category
- **Returns**: Relevant documentation sections
- **Features**:
  - Full-text search capability
  - Ranked results
  - Context snippets

### 4. Documentation Processing

- **Indexing System**
  - Parse markdown/MDX files from `0g-docs/` submodule
  - Extract metadata (titles, paths, categories, frontmatter)
  - Build searchable index structure
  - Cache for fast retrieval

- **Startup Behavior**
  - Optional doc rebuilding controlled by `REBUILD_DOCS_ON_START` env var
  - Implement `prepare()` function to handle indexing
  - Log indexing progress and results

### 5. Project Structure

```
0g-mcp-server/
├── src/
│   ├── index.ts              # Main entry point & server initialization
│   ├── tools/                # MCP tool implementations
│   │   ├── docs.ts           # 0gDocs tool
│   │   ├── examples.ts       # 0gExamples tool
│   │   └── search.ts         # 0gSearch tool (optional)
│   ├── prepare-docs/         # Documentation processing
│   │   ├── prepare.ts        # Indexing and preparation logic
│   │   └── parser.ts         # Markdown/MDX parsing
│   └── utils/
│       ├── logger.ts         # Logging utilities
│       └── file-utils.ts     # File reading helpers
├── docs/                     # Project documentation
├── 0g-docs/                  # Git submodule (0g documentation repo)
├── .gitmodules               # Submodule configuration
├── package.json
├── tsconfig.json
├── bun.lock
└── README.md
```

### 6. Configuration

#### Environment Variables
- `REBUILD_DOCS_ON_START` (boolean, default: false)
  - Whether to rebuild documentation index on server startup
- `DOCS_PATH` (string, default: `./lib/0g-docs`)
  - Path to documentation submodule
- `LOG_LEVEL` (string, default: `info`)
  - Logging verbosity: `debug`, `info`, `warn`, `error`

#### MCP Client Configuration
Support configuration in multiple AI environments:
- **Claude Code**: Via CLI integration
- **Cursor**: Via `.cursor/mcp.json`
- **Windsurf**: Via `~/.codeium/windsurf/mcp_config.json`
- **Other**: Via standard MCP stdio transport

### 7. Dependencies

#### Required
- `@mastra/mcp` - MCP server framework
- `gray-matter` - Parse frontmatter in markdown files
- `@types/bun` - Bun TypeScript types

#### Optional
- Markdown parser (if content transformation needed)
- Search library (for enhanced search functionality)

### 8. Development Workflow

- Use Bun for all commands:
  - `bun install` - Install dependencies
  - `bun run dev` - Development mode with hot reload
  - `bun test` - Run tests
  - `bun src/index.ts` - Start server

### 9. Error Handling

- Graceful handling of missing documentation files
- Clear error messages for invalid paths/queries
- Logging of all errors with context
- Fallback responses when content unavailable

### 10. Logging

- Implement custom logger utility
- Support different log levels
- Log key events:
  - Server startup/shutdown
  - Documentation indexing progress
  - Tool invocations
  - Errors and warnings

## Non-Functional Requirements

### Performance
- Fast documentation retrieval (< 100ms for cached content)
- Efficient indexing on startup
- Minimal memory footprint

### Maintainability
- Modular architecture with clear separation of concerns
- Well-documented code
- Type-safe implementation
- Easy to add new tools

### Reliability
- Handle malformed documentation gracefully
- Recover from submodule update failures
- Validate tool parameters

## Success Criteria

1. ✅ Server starts successfully with `bun src/index.ts`
2. ✅ All tools (`0gDocs`, `0gExamples`) are accessible via MCP
3. ✅ Documentation is retrieved accurately from submodule
4. ✅ Submodule can be updated without breaking server
5. ✅ Server integrates with Claude Code and other MCP clients
6. ✅ Clear logging throughout operation
7. ✅ Code follows Bun best practices (per CLAUDE.md)

## Future Enhancements

- Blog posts tool (similar to Mastra's `mastraBlog`)
- Changelog tool for 0g releases
- Interactive tutorials or guided learning paths
- Caching layer for frequently accessed content
- Full-text search with ranking
- Support for multiple documentation versions

## References

- Mastra MCP Docs Server: https://github.com/mastra-ai/mastra/tree/main/packages/mcp-docs-server
- Model Context Protocol: https://modelcontextprotocol.io/
- 0g.ai Documentation: https://docs.0g.ai
- 0g.ai Docs Github Repository: https://github.com/0gfoundation/0g-doc
