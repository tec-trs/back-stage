export interface CliCommand {
  name: string;
  description: string;
  run: (positionals: string[]) => void;
}

export function createCommands(): CliCommand[] {
  return [
    {
      name: 'version',
      description: 'Exibe a versao da CLI',
      run: () => {
        console.log('back-stage CLI v0.1.0');
      },
    },
    {
      name: 'help',
      description: 'Lista os comandos disponiveis',
      run: () => {
        console.log('Uso: backstage <comando>');
      },
    },
  ];
}

export function findCommand(commands: CliCommand[], name: string): CliCommand | undefined {
  return commands.find((candidate) => candidate.name === name);
}
