import { describe, expect, it, vi } from 'vitest';

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

  it('createCommands retorna ambos os comandos (version e help)', () => {
    const commands = createCommands();
    expect(commands).toHaveLength(2);
    expect(commands.map((c) => c.name)).toContain('version');
    expect(commands.map((c) => c.name)).toContain('help');
  });

  it('comando version exibe a versao corretamente', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
    const commands = createCommands();
    const versionCmd = findCommand(commands, 'version');

    expect(versionCmd).toBeDefined();
    versionCmd!.run([]);
    expect(consoleSpy).toHaveBeenCalledWith('back-stage CLI v0.1.0');

    consoleSpy.mockRestore();
  });

  it('comando help exibe as instrucoes corretas', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
    const commands = createCommands();
    const helpCmd = findCommand(commands, 'help');

    expect(helpCmd).toBeDefined();
    helpCmd!.run([]);
    expect(consoleSpy).toHaveBeenCalledWith('Uso: backstage <comando>');

    consoleSpy.mockRestore();
  });

  it('todos os comandos tem descricoes definidas', () => {
    const commands = createCommands();
    commands.forEach((cmd) => {
      expect(cmd.description).toBeDefined();
      expect(cmd.description.length).toBeGreaterThan(0);
    });
  });

  it('encontra comando version por nome', () => {
    const commands = createCommands();
    const versionCmd = findCommand(commands, 'version');

    expect(versionCmd).toBeDefined();
    expect(versionCmd!.name).toBe('version');
    expect(versionCmd!.description).toBe('Exibe a versao da CLI');
  });
});
