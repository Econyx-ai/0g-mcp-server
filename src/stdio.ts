#!/usr/bin/env node
import { writeErrorLog } from './utils/logger.js';
import { runServer } from './index.js';

runServer().catch(error => {
  const errorMessage = 'Fatal error running server';
  console.error(errorMessage, error);
  writeErrorLog(errorMessage, {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error,
  });
  process.exit(1);
});
