#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version and description
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Import commands
import { authCommand } from './commands/auth.js';
import { watchCommand } from './commands/watch.js';
import { searchCommand } from './commands/search.js';

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

// Global options
program
  .option('--backend-url <url>', 'URL of the mgrep backend API', process.env.BACKEND_URL || 'http://localhost:8000')
  .option('--api-key <key>', 'API key for authentication', process.env.MGREP_API_KEY);

// Add commands
program.addCommand(authCommand());
program.addCommand(watchCommand());
program.addCommand(searchCommand());

program.parse(process.argv);
