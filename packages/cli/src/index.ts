#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { createCommands, findCommand, type CliCommand } from './commands.js';

function printHelp(commands: CliCommand[]): void {
  console.log('Uso: backstage <comando>\n');
  console.log('Comandos disponiveis:');
  for (const command of commands) {
    console.log(`  ${command.name.padEnd(12)} ${command.description}`);
  }
}

function main(): void {
  const { positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: false,
  });

  const commands = createCommands();
  const [commandName, ...rest] = positionals;

  if (!commandName) {
    printHelp(commands);
    return;
  }

  const command = findCommand(commands, commandName);

  if (!command) {
    console.error(`Comando desconhecido: ${commandName}\n`);
    printHelp(commands);
    process.exitCode = 1;
    return;
  }

  command.run(rest);
}

main();
