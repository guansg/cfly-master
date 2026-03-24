/**
 * Log output from Log nodes during runs (subscribes to workflow:log)
 */

import { Trash2 } from 'lucide-react';

export interface ExecutionLogLine {
  id: string;
  time: string;
  level: string;
  nodeId: string;
  nodeLabel: string;
  message: string;
  itemIndex: number;
}

interface ExecutionLogPanelProps {
  lines: ExecutionLogLine[];
  onClear: () => void;
}

function levelClass(level: string) {
  switch (level) {
    case 'error':
      return 'text-red-600 dark:text-red-400';
    case 'warn':
      return 'text-amber-600 dark:text-amber-400';
    case 'debug':
      return 'text-gray-500 dark:text-gray-500';
    default:
      return 'text-gray-800 dark:text-gray-200';
  }
}

export function ExecutionLogPanel({ lines, onClear }: ExecutionLogPanelProps) {

  return (
    <div className="flex flex-col border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 flex-shrink-0 max-h-[32vh] min-h-[100px]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          执行日志
        </span>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          title="清空"
        >
          <Trash2 size={12} />
          清空
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {lines.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500">运行工作流后，日志节点输出将显示在此处。</p>
        ) : (
          lines.map((line) => (
            <div key={line.id} className="whitespace-pre-wrap break-words border-b border-gray-50 dark:border-gray-700/50 pb-1 mb-1 last:border-0">
              <span className="text-gray-400 dark:text-gray-500">{line.time}</span>{' '}
              <span className={levelClass(line.level)}>[{line.level}]</span>{' '}
              <span className="text-sky-600 dark:text-sky-400">{line.nodeLabel}</span>
              {line.itemIndex > 0 ? (
                <span className="text-gray-400"> #{line.itemIndex}</span>
              ) : null}
              <span className="text-gray-600 dark:text-gray-300"> {line.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
