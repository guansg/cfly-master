import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Copy,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Play,
  Pencil,
  Snowflake,
  Workflow,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  definition: string;
  status: 'draft' | 'ready' | 'archived';
  tags: string;
  pinned: number;
  createdAt: number;
  updatedAt: number;
  frozenAt?: number;
}

const EMPTY_DEFINITION = JSON.stringify({
  nodes: [
    {
      id: 'trigger_1',
      type: 'manual-trigger',
      name: '手动触发',
      position: { x: 250, y: 200 },
      parameters: {},
    },
  ],
  connections: {},
});

function statusLabel(status: string): string {
  const m: Record<string, string> = {
    draft: '草稿',
    ready: '就绪',
    archived: '已归档',
  };
  return m[status] ?? status;
}

export function WorkflowList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WorkflowItem | null>(null);

  const loadWorkflows = useCallback(async (): Promise<WorkflowItem[]> => {
    try {
      const result = await window.electron.ipcRenderer.invoke('workflow:list');
      if (result.success) {
        setWorkflows(result.data);
        return result.data;
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
    return [];
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleCreate = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('workflow:create', {
        name: '新建工作流',
        description: '',
        definition: EMPTY_DEFINITION,
      });
      if (result.success) {
        navigate(`/workflows/${result.data.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await window.electron.ipcRenderer.invoke('workflow:delete', deleteTarget.id);
      setDeleteTarget(null);
      loadWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const handleDuplicate = async (wf: WorkflowItem) => {
    try {
      await window.electron.ipcRenderer.invoke('workflow:create', {
        name: `${wf.name}（副本）`,
        description: wf.description,
        definition: wf.definition,
        tags: wf.tags,
      });
      loadWorkflows();
    } catch (error) {
      console.error('Failed to duplicate workflow:', error);
    }
  };

  const handleTogglePin = async (wf: WorkflowItem) => {
    try {
      await window.electron.ipcRenderer.invoke('workflow:update', wf.id, {
        pinned: wf.pinned ? 0 : 1,
      });
      loadWorkflows();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleToggleArchive = async (wf: WorkflowItem) => {
    try {
      await window.electron.ipcRenderer.invoke('workflow:update', wf.id, {
        status: wf.status === 'archived' ? 'draft' : 'archived',
      });
      loadWorkflows();
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  const filteredWorkflows = workflows.filter((wf) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return wf.name.toLowerCase().includes(q) || wf.description.toLowerCase().includes(q);
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    return d.toLocaleDateString('zh-CN');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'archived': return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            工作流
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            新建工作流
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索工作流..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredWorkflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Workflow size={48} className="mb-4 opacity-40" />
            <p className="text-lg font-medium">暂无工作流</p>
            <p className="text-sm mt-1">点击「新建工作流」开始创建你的第一个自动化流程</p>
          </div>
        ) : (
          filteredWorkflows.map((wf) => (
            <div
              key={wf.id}
              className={`group relative flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer
                ${wf.frozenAt
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-sky-300 dark:hover:border-sky-600'
                }`}
              onClick={() => navigate(`/workflows/${wf.id}/edit`)}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                wf.frozenAt ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-sky-100 dark:bg-sky-900/30'
              }`}>
                {wf.frozenAt ? (
                  <Snowflake size={20} className="text-blue-500" />
                ) : (
                  <Workflow size={20} className="text-sky-600 dark:text-sky-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {wf.pinned ? <Pin size={14} className="text-amber-500 flex-shrink-0" /> : null}
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {wf.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(wf.status)}`}>
                    {statusLabel(wf.status)}
                  </span>
                  {wf.frozenAt && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                      已冻结
                    </span>
                  )}
                </div>
                {wf.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {wf.description}
                  </p>
                )}
              </div>

              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatTime(wf.updatedAt)}
              </span>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <MoreHorizontal size={16} className="text-gray-500" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    sideOffset={4}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none"
                      onSelect={() => navigate(`/workflows/${wf.id}/edit`)}
                    >
                      <Pencil size={14} /> 编辑
                    </DropdownMenu.Item>
                    {!wf.frozenAt && (
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none"
                        onSelect={() => {}}
                      >
                        <Play size={14} /> 运行
                      </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none"
                      onSelect={() => handleDuplicate(wf)}
                    >
                      <Copy size={14} /> 复制
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none"
                      onSelect={() => handleTogglePin(wf)}
                    >
                      {wf.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      {wf.pinned ? '取消置顶' : '置顶'}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer outline-none"
                      onSelect={() => handleToggleArchive(wf)}
                    >
                      {wf.status === 'archived' ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                      {wf.status === 'archived' ? '恢复' : '归档'}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer outline-none"
                      onSelect={() => setDeleteTarget(wf)}
                    >
                      <Trash2 size={14} /> 删除
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除工作流"
        message={deleteTarget ? `确定要删除工作流「${deleteTarget.name}」吗？此操作不可撤销。` : ''}
        onConfirm={handleDelete}
        type="danger"
      />
    </div>
  );
}
