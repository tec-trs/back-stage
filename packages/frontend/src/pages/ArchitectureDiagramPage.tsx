import { useState } from 'react';

import { ArchitectureDiagramEditor, LiveArchitectureGraph } from '../features/architecture-diagram';

type Tab = 'live' | 'manual';

const TAB_CLASS = (active: boolean) =>
  `rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? 'border-line bg-canvas text-slate-100'
      : 'border-transparent text-slate-500 hover:text-slate-300'
  }`;

export function ArchitectureDiagramPage() {
  const [tab, setTab] = useState<Tab>('live');

  return (
    <div className="-mx-6 -mt-6 flex h-[calc(100vh-61px)] flex-col bg-canvas">
      <div className="flex gap-1 border-b border-line bg-surface px-4 pt-2">
        <button type="button" onClick={() => setTab('live')} className={TAB_CLASS(tab === 'live')}>
          Visão ao vivo
        </button>
        <button type="button" onClick={() => setTab('manual')} className={TAB_CLASS(tab === 'manual')}>
          Diagramas manuais
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'live' ? <LiveArchitectureGraph /> : <ArchitectureDiagramEditor />}
      </div>
    </div>
  );
}
