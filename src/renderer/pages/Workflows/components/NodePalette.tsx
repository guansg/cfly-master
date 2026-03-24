/**
 * Left node palette (categories, search, click to add)
 */

import { useState, useCallback } from 'react';
import {
  Search, PlayCircle, Database, FileText, Shuffle,
  GitBranch, GitMerge, Repeat, RotateCw, Zap, Merge, Clock, Square,
} from 'lucide-react';
import { useWorkflowEditorStore } from '../store/workflow-store';

interface NodeDefinition {
  type: string;
  flowNodeType: string;
  label: string;
  icon: any;
  category: string;
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  { type: 'manual-trigger', flowNodeType: 'trigger', label: '手动触发', icon: PlayCircle, category: 'trigger' },

  { type: 'data:set-data', flowNodeType: 'data', label: '设置数据', icon: Database, category: 'data' },
  { type: 'data:log', flowNodeType: 'data', label: '日志', icon: FileText, category: 'data' },
  { type: 'data:transform', flowNodeType: 'data', label: '转换', icon: Shuffle, category: 'data' },

  { type: 'logic:condition', flowNodeType: 'logic', label: '条件', icon: GitBranch, category: 'logic' },
  { type: 'logic:switch', flowNodeType: 'logic', label: '分支', icon: GitMerge, category: 'logic' },
  { type: 'logic:loop', flowNodeType: 'logic', label: '循环', icon: Repeat, category: 'logic' },
  { type: 'logic:while', flowNodeType: 'logic', label: '当型循环', icon: RotateCw, category: 'logic' },
  { type: 'logic:parallel', flowNodeType: 'logic', label: '并行循环', icon: Zap, category: 'logic' },
  { type: 'logic:merge', flowNodeType: 'logic', label: '合并', icon: Merge, category: 'logic' },
  { type: 'logic:delay', flowNodeType: 'logic', label: '延迟', icon: Clock, category: 'logic' },
  { type: 'logic:stop', flowNodeType: 'logic', label: '停止', icon: Square, category: 'logic' },
];

const CATEGORY_COLORS: Record<string, string> = {
  trigger: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  data: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  logic: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  trigger: '触发',
  data: '数据处理',
  logic: '逻辑控制',
};

export function NodePalette() {
  const [search, setSearch] = useState('');
  const addNode = useWorkflowEditorStore((s) => s.addNode);
  const nodes = useWorkflowEditorStore((s) => s.nodes);

  const filtered = NODE_DEFINITIONS.filter(
    (n) =>
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.type.toLowerCase().includes(search.toLowerCase()),
  );

  const categories = [...new Set(filtered.map((n) => n.category))];

  const handleAddNode = useCallback(
    (def: NodeDefinition) => {
      const id = `${def.type}_${Date.now()}`;
      const offset = nodes.length * 40;
      addNode({
        id,
        type: def.flowNodeType,
        position: { x: 400 + offset, y: 200 + offset },
        data: { label: def.label, nodeType: def.type, parameters: {} },
      });
    },
    [addNode, nodes.length],
  );

  return (
    <div className="w-56 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          节点面板
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索节点..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 mb-1">
              {CATEGORY_LABELS[cat] ?? cat}
            </div>
            <div className="space-y-1">
              {filtered
                .filter((n) => n.category === cat)
                .map((def) => (
                  <button
                    key={def.type}
                    onClick={() => handleAddNode(def)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${CATEGORY_COLORS[cat] || 'bg-gray-100'}`}>
                      <def.icon size={14} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {def.label}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-4">
            无匹配节点
          </div>
        )}
      </div>
    </div>
  );
}
