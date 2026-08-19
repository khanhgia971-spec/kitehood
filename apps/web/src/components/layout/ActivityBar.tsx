import { spawnLiquidRipple } from '../../lib/liquidRipple';
import {
  Files, Search, GitBranch, Play, Puzzle, Settings,
  LayoutDashboard, BookOpen, Sparkles, GraduationCap,
} from 'lucide-react';

const items = [
  { id: 'explorer', icon: Files, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'learn', icon: GraduationCap, label: 'Học tập' },
  { id: 'ai', icon: Sparkles, label: 'AI Agent' },
  { id: 'docs', icon: BookOpen, label: 'Language Docs' },
  { id: 'scm', icon: GitBranch, label: 'Snippets' },
  { id: 'run', icon: Play, label: 'Run and Debug' },
  { id: 'extensions', icon: Puzzle, label: 'Đố vui code' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

interface Props {
  active: string;
  onChange: (id: (typeof items)[number]['id']) => void;
}

export function ActivityBar({ active, onChange }: Props) {
  return (
    <div className="activity-bar w-12 flex flex-col items-center py-2.5 select-none shrink-0 overflow-y-auto">
      <div className="flex flex-col gap-1 flex-1 w-full px-1">
        {items.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              title={label}
              onClick={(e) => { spawnLiquidRipple(e); onChange(id); }}
              className={`activity-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.6} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
