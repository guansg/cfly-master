import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  GitBranch, GitMerge, Repeat, RotateCw, Zap, Merge, Clock, Square,
  Loader2, CheckCircle, XCircle,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  'logic:condition': GitBranch,
  'logic:switch': GitMerge,
  'logic:loop': Repeat,
  'logic:while': RotateCw,
  'logic:parallel': Zap,
  'logic:merge': Merge,
  'logic:delay': Clock,
  'logic:stop': Square,
};

const labelMap: Record<string, string> = {
  'logic:condition': '条件',
  'logic:switch': '分支',
  'logic:loop': '循环',
  'logic:while': '当型循环',
  'logic:parallel': '并行循环',
  'logic:merge': '合并',
  'logic:delay': '延迟',
  'logic:stop': '停止',
};

const outputCountMap: Record<string, number> = {
  'logic:condition': 2,
  'logic:switch': 4,
  'logic:loop': 2,
  'logic:while': 2,
  'logic:parallel': 1,
  'logic:merge': 1,
  'logic:delay': 1,
  'logic:stop': 0,
};

function LogicNodeComponent({ data, selected }: NodeProps) {
  const d = data as any;
  const nodeType = d.nodeType || 'logic:condition';
  const Icon = iconMap[nodeType] || GitBranch;
  const status: string | undefined = d.executionStatus;
  const outputCount = outputCountMap[nodeType] ?? 1;

  const borderClass = selected
    ? 'border-amber-500 shadow-amber-100 dark:shadow-amber-900/30'
    : status === 'running'
      ? 'border-blue-400 shadow-blue-100 dark:shadow-blue-900/30 animate-pulse'
      : status === 'success'
        ? 'border-emerald-500'
        : status === 'error'
          ? 'border-red-500'
          : 'border-amber-300 dark:border-amber-700';

  const outputLabels =
    nodeType === 'logic:condition' ? ['真', '假'] :
    nodeType === 'logic:switch' ? ['a', 'b', 'c', '默认'] :
    nodeType === 'logic:loop' ? ['批次', '剩余'] :
    nodeType === 'logic:while' ? ['继续', '结束'] :
    [];

  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-sm min-w-[160px] transition-all bg-white dark:bg-gray-800 ${borderClass} relative`}>
      {nodeType === 'logic:merge' ? (
        <>
          <Handle
            id="input-0"
            type="target"
            position={Position.Left}
            style={{ top: '33%' }}
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-gray-800"
          />
          <Handle
            id="input-1"
            type="target"
            position={Position.Left}
            style={{ top: '67%' }}
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-gray-800"
          />
        </>
      ) : (
        <Handle
          id="input-0"
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-gray-800"
        />
      )}

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {d.label || labelMap[nodeType] || nodeType}
          </div>
          <div className="text-xs text-gray-400 truncate">{nodeType}</div>
        </div>
        <StatusIcon status={status} />
      </div>

      {outputCount > 0 && Array.from({ length: outputCount }).map((_, idx) => (
        <Handle
          key={idx}
          type="source"
          position={Position.Right}
          id={`output-${idx}`}
          style={{ top: outputCount === 1 ? '50%' : `${((idx + 1) / (outputCount + 1)) * 100}%` }}
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-gray-800"
        >
          {outputLabels[idx] && (
            <span className="absolute right-4 text-[9px] text-gray-400 whitespace-nowrap">
              {outputLabels[idx]}
            </span>
          )}
        </Handle>
      ))}
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

export const LogicNode = memo(LogicNodeComponent);
