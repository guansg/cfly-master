import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { PlayCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';

function TriggerNodeComponent({ data, selected }: NodeProps) {
  const d = data as any;
  const status: string | undefined = d.executionStatus;

  const borderClass = selected
    ? 'border-emerald-500 shadow-emerald-100 dark:shadow-emerald-900/30'
    : status === 'running'
      ? 'border-blue-400 shadow-blue-100 dark:shadow-blue-900/30 animate-pulse'
      : status === 'success'
        ? 'border-emerald-500'
        : status === 'error'
          ? 'border-red-500'
          : 'border-emerald-300 dark:border-emerald-700';

  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-sm min-w-[160px] transition-all bg-white dark:bg-gray-800 ${borderClass}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
          <PlayCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {d.label || '触发'}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {d.nodeType || 'manual-trigger'}
          </div>
        </div>
        <StatusIcon status={status} />
      </div>
      <Handle
        id="output-0"
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800"
      />
    </div>
  );
}

function StatusIcon({ status }: { status?: string }) {
  if (!status) return null;
  if (status === 'running') return <Loader2 size={14} className="animate-spin text-blue-500 flex-shrink-0" />;
  if (status === 'success') return <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />;
  if (status === 'error') return <XCircle size={14} className="text-red-500 flex-shrink-0" />;
  return null;
}

export const TriggerNode = memo(TriggerNodeComponent);
