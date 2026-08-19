import { useState } from 'react';
import { Terminal, AlertCircle, FileOutput, Bug } from 'lucide-react';
import clsx from 'clsx';

const tabs = [
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'problems', label: 'Problems', icon: AlertCircle },
  { id: 'output', label: 'Output', icon: FileOutput },
  { id: 'debug', label: 'Debug Console', icon: Bug },
] as const;

export function Panel() {
  const [active, setActive] = useState<typeof tabs[number]['id']>('terminal');

  return (
    <div className="h-52 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
      <div className="h-8 flex items-center gap-1 px-2 border-b border-[var(--border)]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 h-7 text-[12px] rounded transition-colors',
              active === id
                ? 'text-[var(--text-primary)] bg-[var(--hover)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-3 font-mono text-[12.5px] overflow-auto leading-relaxed">
        {active === 'terminal' && (
          <>
            <div className="text-emerald-400">➜  online-ide git:(main)</div>
            <div className="text-[var(--text-secondary)] mt-1">
              Integrated terminal ready. Connect to remote shell / Docker next.
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-emerald-400">$</span>
              <span className="w-2 h-4 bg-[var(--accent)] animate-pulse" />
            </div>
          </>
        )}
        {active === 'problems' && (
          <div className="text-[var(--text-secondary)]">No problems detected.</div>
        )}
        {active === 'output' && (
          <div className="text-[var(--text-secondary)]">Output channel ready.</div>
        )}
        {active === 'debug' && (
          <div className="text-[var(--text-secondary)]">Debug console ready.</div>
        )}
      </div>
    </div>
  );
}
