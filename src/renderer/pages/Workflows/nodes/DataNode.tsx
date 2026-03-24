import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database, FileText, Shuffle, Loader2, CheckCircle, XCircle } from 'lucide-react';

const iconMap: Record<string, any> = {
  'data:set-data': Database,
  'data:log': FileText,
  'data:transform': Shuffle,
};

function DataNodeComponent({ data, selected }: NodeProps) {
  const d = data as any;
  const nodeType = d.nodeType || 'data:set-data';
  const Icon = iconMap[nodeType] || Database;
  const status: string | undefined = d.executionStatus;

  const borderClass = selected
    ? 'border-violet-500 shadow-violet-100 dark:shadow-violet-900/30'
    : status === 'running'
      ? 'border-blue-400 shadow-blue-100 dark:shadow-blue-900/30 animate-pulse'
      : status === 'success'
        ? 'border-emerald-500'
        : status === 'error'
          ? 'border-red-500'
          : 'border-violet-300 dark:border-violet-700';

  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-sm min-w-[160px] transition-all bg-white dark:bg-gray-800 ${borderClass}`}>
      <Handle
        id="input-0"
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white dark:!border-gray-800"
      />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {d.label || '数据'}
          </div>
          <div className="text-xs text-gray-400 truncate">{nodeType}</div>
        </div>
        <StatusIcon status={status} executionTime={d.executionTime} />
      </div>
      <Handle
        id="output-0"
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white dark:!border-gray-800"
      />
    </div>
  );
}

function StatusIcon({ status, executionTime }: { status?: string; executionTime?: number }) {
  if (!status) return null;
  if (status === 'running') return <Loader2 size={14} className="animate-spin text-blue-500 flex-shrink-0" />;
  if (status === 'success') return (
    <div className="flex items-center gap-1">
      {executionTime != null && <span className="text-xs text-gray-400">{executionTime}ms</span>}
      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
    </div>
  );
  if (status === 'error') return <XCircle size={14} className="text-red-500 flex-shrink-0" />;
  return null;
}

export const DataNode = memo(DataNodeComponent);
