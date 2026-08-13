import { describe, expect, it } from 'vitest';

import { createCommands, findCommand } from './commands.js';

describe('CLI commands', () => {
  it('encontra um comando existente pelo nome', () => {
    const commands = createCommands();
    expect(findCommand(commands, 'version')).toBeDefined();
  });

  it('retorna undefined para um comando inexistente', () => {
    const commands = createCommands();
    expect(findCommand(commands, 'inexistente')).toBeUndefined();
  });
});
