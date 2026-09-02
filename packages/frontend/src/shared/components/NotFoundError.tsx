import { Link } from 'react-router-dom';

export interface NotFoundErrorProps {
  resourceType: 'servidor' | 'aplicação' | 'banco de dados' | 'URL' | 'serviço';
  backLink: string;
  backLabel: string;
}

export function NotFoundError({ resourceType, backLink, backLabel }: NotFoundErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded border border-red-900/30 bg-red-950/20 p-8 text-center">
      <div className="text-4xl">⚠️</div>
      <div>
        <h2 className="text-lg font-semibold text-red-400">{resourceType} não encontrado</h2>
        <p className="mt-2 text-sm text-slate-400">
          Este {resourceType} pode ter sido deletado ou o ID está incorreto.
        </p>
      </div>
      <Link
        to={backLink}
        className="mt-4 inline-block rounded bg-slate-700 px-4 py-2 text-sm text-slate-100 hover:bg-slate-600"
      >
        ← {backLabel}
      </Link>
    </div>
  );
}
