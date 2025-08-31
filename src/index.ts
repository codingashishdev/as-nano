#!/usr/bin/env node

import { Command } from 'commander';

// Initialize a new command program
const program = new Command();

// Define the CLI tool's name, description, and version
program
  .name('as-nano')
  .description('CLI text-editor like nano')
  .version('1.0.0');

program
  .command('add <numbers...>')
  .description('Add a sequence of numbers')
  .action((numbers: string[]) => {
    const total = numbers.reduce((sum, num) => sum + parseFloat(num), 0);
    console.log(`The sum is: ${total} ➕`);
  });

// This line is crucial for commander to process the command-line arguments
program.parse(process.argv);