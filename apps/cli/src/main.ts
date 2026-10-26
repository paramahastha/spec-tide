#!/usr/bin/env node
import { createProgram } from './program.js';
createProgram()
  .parseAsync(process.argv)
  .catch(() => {
    process.exitCode = 1;
  });
