import fs from 'fs/promises';
import { MCPServer } from '@mastra/mcp';

import { logger, createLogger } from './utils/logger.js';
import { prepare } from './prepare-docs/prepare.js';
import { docsTool } from './tools/docs.js';
import { examplesTool } from './tools/examples.js';
import { fromProjectRoot } from './utils/file-utils.js';

let server: MCPServer;

if (process.env.REBUILD_DOCS_ON_START === 'true') {
  void logger.info('Rebuilding docs on start');
  try {
    await prepare();
    void logger.info('Docs rebuilt successfully');
  } catch (error) {
    void logger.error('Failed to rebuild docs', error);
  }
}

server = new MCPServer({
  name: '0g Documentation Server',
  version: JSON.parse(await fs.readFile(fromProjectRoot(`package.json`), 'utf8')).version,
  tools: {
    '0gDocs': docsTool,
    '0gExamples': examplesTool,
  },
});

// Update logger with server instance
Object.assign(logger, createLogger(server));

async function runServer() {
  try {
    await server.startStdio();
    void logger.info('Started 0g Docs MCP Server');
  } catch (error) {
    void logger.error('Failed to start server', error);
    process.exit(1);
  }
}

export { runServer, server };
