/**
 * Editor toolbar
 */

import { ArrowLeft, Save, Play, Square, Loader2, Snowflake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowEditorStore } from '../store/workflow-store';

interface ToolbarProps {
  onSave: () => void;
  onRun: () => void;
  isRunning?: boolean;
  isFrozen?: boolean;
}

export function Toolbar({ onSave, onRun, isRunning, isFrozen }: ToolbarProps) {
  const navigate = useNavigate();
  const { workflowName, setWorkflowName, isDirty, isSaving } = useWorkflowEditorStore();

  return (
    <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-3 gap-3 flex-shrink-0">
      <button
        onClick={() => navigate('/workflows')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>返回列表</span>
      </button>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      <input
        type="text"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        disabled={isFrozen}
        className="text-sm font-medium bg-transparent border-none outline-none text-gray-900 dark:text-white min-w-[120px] max-w-[300px] disabled:opacity-60"
        placeholder="工作流名称"
      />

      {isDirty && !isFrozen && (
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="未保存" />
      )}

      {isFrozen && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
          <Snowflake size={12} />
          <span>已冻结</span>
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={onSave}
        disabled={isSaving || !isDirty || isFrozen}
        title={isFrozen ? '冻结的工作流无法保存修改' : undefined}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {isSaving ? '保存中...' : '保存'}
      </button>

      <button
        onClick={onRun}
        disabled={isRunning || isFrozen}
        title={isFrozen ? '冻结的工作流无法运行' : undefined}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors
          ${isRunning
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : isFrozen
              ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
      >
        {isRunning ? <Square size={14} /> : isFrozen ? <Snowflake size={14} /> : <Play size={14} />}
        {isRunning ? '停止' : '运行'}
      </button>
    </div>
  );
}
