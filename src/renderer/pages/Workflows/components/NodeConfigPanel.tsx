/**
 * Right-hand node config panel (dynamic form)
 */

import { Settings2, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useWorkflowEditorStore } from '../store/workflow-store';

interface PropertyDef {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'json' | 'expression';
  default?: any;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: string | number }>;
  placeholder?: string;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
}

const NODE_PROPERTIES: Record<string, PropertyDef[]> = {
  'manual-trigger': [],
  'data:set-data': [
    {
      name: 'mode',
      displayName: '模式',
      type: 'options',
      default: 'manual',
      options: [
        { name: '手动', value: 'manual' },
        { name: 'JSON', value: 'json' },
      ],
    },
    {
      name: 'jsonData',
      displayName: 'JSON 数据',
      type: 'json',
      default: '{}',
      description: '要写入的 JSON 数据',
      displayOptions: { show: { mode: ['json'] } },
    },
    {
      name: 'keepOnlySet',
      displayName: '仅保留已设字段',
      type: 'boolean',
      default: false,
      description: '只保留显式设置的字段',
    },
  ],
  'data:log': [
    {
      name: 'message',
      displayName: '消息',
      type: 'string',
      default: '',
      description: '日志内容（支持 {{ 表达式 }}）',
      placeholder: '例如：正在处理第 {{ $itemIndex }} 条',
    },
    {
      name: 'level',
      displayName: '级别',
      type: 'options',
      default: 'info',
      options: [
        { name: '信息', value: 'info' },
        { name: '警告', value: 'warn' },
        { name: '错误', value: 'error' },
        { name: '调试', value: 'debug' },
      ],
    },
  ],
  'data:transform': [
    {
      name: 'fields',
      displayName: '输出字段',
      type: 'json',
      default: '[{"name": "result", "value": "{{ $json.value }}"}]',
      description: '{name, value} 数组；value 支持 {{ }} 表达式。',
    },
    {
      name: 'includeOriginal',
      displayName: '包含原始字段',
      type: 'boolean',
      default: false,
      description: '保留原字段并在其上合并新字段',
    },
  ],
  'logic:condition': [
    {
      name: 'conditions',
      displayName: '条件',
      type: 'json',
      default: '[{"field": "{{ $json.value }}", "operator": "equal", "value": ""}]',
      description: '{field, operator, value} 对象数组',
    },
    {
      name: 'combineOperation',
      displayName: '组合方式',
      type: 'options',
      default: 'all',
      options: [
        { name: '全部满足（AND）', value: 'all' },
        { name: '任一满足（OR）', value: 'any' },
      ],
    },
  ],
  'logic:switch': [
    {
      name: 'field',
      displayName: '分支依据字段',
      type: 'string',
      default: '{{ $json.type }}',
      description: '用于匹配的表达式',
    },
    {
      name: 'cases',
      displayName: '分支',
      type: 'json',
      default: '[{"value": "a"},{"value": "b"},{"value": "c"}]',
      description: '每个分支对应一个输出端口（从 0 起）；最后一端口为默认分支。',
    },
  ],
  'logic:loop': [
    {
      name: 'batchSize',
      displayName: '批次大小',
      type: 'number',
      default: 1,
      description: '每批条数（1 表示逐条）',
    },
  ],
  'logic:while': [
    {
      name: 'condition',
      displayName: '继续条件',
      type: 'string',
      default: '{{ $json.continue === true }}',
      description: '返回布尔值的表达式；为 true 则继续循环',
    },
    {
      name: 'maxIterations',
      displayName: '最大迭代次数',
      type: 'number',
      default: 100,
    },
  ],
  'logic:parallel': [
    {
      name: 'concurrency',
      displayName: '最大并发',
      type: 'number',
      default: 5,
      description: '并行处理的最大条数（1–20）',
    },
    {
      name: 'delayBetweenBatchesMs',
      displayName: '批次间隔（毫秒）',
      type: 'number',
      default: 0,
    },
  ],
  'logic:merge': [
    {
      name: 'mode',
      displayName: '模式',
      type: 'options',
      default: 'append',
      options: [
        { name: '追加（合并全部项）', value: 'append' },
        { name: '拉链（按索引配对）', value: 'zip' },
        { name: '直通（仅第一条输入）', value: 'passthrough' },
      ],
    },
  ],
  'logic:delay': [
    {
      name: 'delayMs',
      displayName: '延迟（毫秒）',
      type: 'number',
      default: 1000,
      description: '等待的毫秒数',
    },
  ],
  'logic:stop': [
    {
      name: 'message',
      displayName: '停止消息',
      type: 'string',
      default: '工作流已停止',
    },
    {
      name: 'isError',
      displayName: '标记为错误',
      type: 'boolean',
      default: false,
    },
  ],
};

function shouldShowProperty(prop: PropertyDef, parameters: Record<string, any>): boolean {
  if (!prop.displayOptions) return true;

  if (prop.displayOptions.show) {
    for (const [key, values] of Object.entries(prop.displayOptions.show)) {
      const current = parameters[key] ?? undefined;
      if (!values.includes(current)) return false;
    }
  }

  if (prop.displayOptions.hide) {
    for (const [key, values] of Object.entries(prop.displayOptions.hide)) {
      const current = parameters[key] ?? undefined;
      if (values.includes(current)) return false;
    }
  }

  return true;
}

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, setSelectedNode, updateNodeData } = useWorkflowEditorStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 p-4">
        <Settings2 size={32} className="mb-2 opacity-40" />
        <p className="text-sm text-center">选择画布中的节点查看配置</p>
      </div>
    );
  }

  const data = selectedNode.data as Record<string, any>;
  const nodeType = data.nodeType || selectedNode.type || '';
  const properties = NODE_PROPERTIES[nodeType] || [];
  const parameters: Record<string, any> = data.parameters || {};

  const setParam = (name: string, value: any) => {
    updateNodeData(selectedNode.id, {
      parameters: { ...parameters, [name]: value },
    });
  };

  return (
    <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          节点配置
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={14} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Node Name */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            名称
          </label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Node Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            类型
          </label>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-md">
            {nodeType}
          </div>
        </div>

        {/* Execution Status */}
        {data.executionStatus && (
          <div className="flex items-center gap-2 text-xs">
            {data.executionStatus === 'running' && (
              <>
                <Loader2 size={12} className="animate-spin text-blue-500" />
                <span className="text-blue-600 dark:text-blue-400">运行中…</span>
              </>
            )}
            {data.executionStatus === 'success' && (
              <>
                <CheckCircle size={12} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  成功
                  {data.executionTime != null && `（${data.executionTime} ms）`}
                  {data.outputItemCount != null && ` · ${data.outputItemCount} 条`}
                </span>
              </>
            )}
            {data.executionStatus === 'error' && (
              <>
                <XCircle size={12} className="text-red-500" />
                <span className="text-red-600 dark:text-red-400 truncate" title={data.executionError}>
                  {data.executionError || '错误'}
                </span>
              </>
            )}
          </div>
        )}

        {/* Dynamic Properties */}
        {properties.length > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              参数
            </div>
            {properties.map((prop) => {
              if (!shouldShowProperty(prop, parameters)) return null;
              return (
                <PropertyField
                  key={prop.name}
                  prop={prop}
                  value={parameters[prop.name]}
                  onChange={(val) => setParam(prop.name, val)}
                />
              );
            })}
          </div>
        )}

        {/* Node ID */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            ID
          </label>
          <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-md font-mono">
            {selectedNode.id}
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyField({
  prop,
  value,
  onChange,
}: {
  prop: PropertyDef;
  value: any;
  onChange: (val: any) => void;
}) {
  const effectiveValue = value ?? prop.default;
  const inputClass = 'w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500';

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {prop.displayName}
        {prop.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {prop.type === 'string' || prop.type === 'expression' ? (
        <input
          type="text"
          value={effectiveValue || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={prop.placeholder}
          className={inputClass}
        />
      ) : prop.type === 'number' ? (
        <input
          type="number"
          value={effectiveValue ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className={inputClass}
        />
      ) : prop.type === 'boolean' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!effectiveValue}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-sky-500 focus:ring-sky-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {prop.description || prop.displayName}
          </span>
        </label>
      ) : prop.type === 'options' ? (
        <select
          value={effectiveValue ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          {prop.options?.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.name}
            </option>
          ))}
        </select>
      ) : prop.type === 'json' ? (
        <textarea
          value={typeof effectiveValue === 'string' ? effectiveValue : JSON.stringify(effectiveValue, null, 2)}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={`${inputClass} font-mono text-xs resize-y`}
          placeholder={prop.placeholder || '{}'}
        />
      ) : (
        <input
          type="text"
          value={effectiveValue || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}

      {prop.description && prop.type !== 'boolean' && (
        <p className="text-xs text-gray-400 mt-0.5">{prop.description}</p>
      )}
    </div>
  );
}
