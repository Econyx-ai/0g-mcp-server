#!/usr/bin/env node
import { runServer } from "./index.js";
import { writeErrorLog } from "./utils/logger.js";

runServer().catch((error) => {
  const errorMessage = "Fatal error running server";
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
